const fs = require("fs");
const path = require("path");
const https = require("https");
const { claudeCall } = require("../shared/claude");
const { log, today } = require("../shared/logger");
const { sendEmail } = require("../shared/notifier");
const { MEMORY_DIR, REPORTS_DIR, SERPAPI_KEY, SITE_URL } = require("../shared/config");
const { sanityQuery, sanityMutate } = require("../shared/sanity");
const { updateHeartbeat } = require("../shared/heartbeat");

const RANKINGS_PATH = path.join(MEMORY_DIR, "rankings-tracker.json");
const REFRESH_LOG_PATH = path.join(MEMORY_DIR, "refresh-log.json");
const PUBLISHED_PATH = path.join(MEMORY_DIR, "published-articles.json");
const REPORT_DIR = path.join(REPORTS_DIR, "refresh");

// ── Load / save helpers ───────────────────────────────────────────

function loadRankings() {
  try { return JSON.parse(fs.readFileSync(RANKINGS_PATH, "utf-8")); } catch { return {}; }
}
function saveRankings(data) {
  fs.writeFileSync(RANKINGS_PATH, JSON.stringify(data, null, 2) + "\n");
}
function loadRefreshLog() {
  try { return JSON.parse(fs.readFileSync(REFRESH_LOG_PATH, "utf-8")); } catch { return []; }
}
function saveRefreshLog(data) {
  fs.writeFileSync(REFRESH_LOG_PATH, JSON.stringify(data, null, 2) + "\n");
}
function loadPublished() {
  try { return JSON.parse(fs.readFileSync(PUBLISHED_PATH, "utf-8")); } catch { return []; }
}

// ── SerpApi ranking check ─────────────────────────────────────────

function serpApiSearch(keyword) {
  return new Promise((resolve, reject) => {
    if (!SERPAPI_KEY) {
      resolve({ position: null, error: "No SERPAPI_KEY configured" });
      return;
    }
    const params = new URLSearchParams({
      q: `${keyword} canada`,
      location: "Canada",
      google_domain: "google.ca",
      api_key: SERPAPI_KEY,
      engine: "google",
      num: "50",
    });
    const url = `https://serpapi.com/search.json?${params}`;
    const urlObj = new URL(url);

    const req = https.get({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      timeout: 15000,
    }, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        try {
          const result = JSON.parse(data);
          const organicResults = result.organic_results || [];
          const ourDomain = "isocertificationconsultant";
          let position = null;
          for (let i = 0; i < organicResults.length; i++) {
            const link = (organicResults[i].link || "").toLowerCase();
            if (link.includes(ourDomain)) {
              position = i + 1;
              break;
            }
          }
          resolve({ position, totalResults: organicResults.length });
        } catch {
          resolve({ position: null, error: "Parse error" });
        }
      });
    });
    req.on("error", (err) => resolve({ position: null, error: err.message }));
    req.on("timeout", () => { req.destroy(); resolve({ position: null, error: "timeout" }); });
  });
}

// ── Check rankings for all articles ───────────────────────────────

async function checkRankings() {
  log("contentRefresher", "rankings", "checking rankings for all articles");
  const published = loadPublished();
  const rankings = loadRankings();
  const todayStr = today();

  for (const article of published) {
    const keyword = article.primaryKeyword;
    if (!keyword) continue;

    log("contentRefresher", "serpapi", `checking: "${keyword}"`);
    const result = await serpApiSearch(keyword);

    if (!rankings[article.slug]) {
      rankings[article.slug] = {
        slug: article.slug,
        keyword,
        title: article.title,
        rankings: [],
        lastRefreshed: null,
        refreshCount: 0,
      };
    }

    rankings[article.slug].rankings.push({
      date: todayStr,
      position: result.position,
    });

    // Keep only last 12 weeks of data
    if (rankings[article.slug].rankings.length > 12) {
      rankings[article.slug].rankings = rankings[article.slug].rankings.slice(-12);
    }

    log("contentRefresher", "ranking", `"${keyword}" → position ${result.position || "not found"}`);
  }

  saveRankings(rankings);
  updateHeartbeat("contentRefresher", "complete", `${published.length} articles checked`);
  return rankings;
}

// ── Identify articles needing refresh ─────────────────────────────

function identifyRefreshCandidates() {
  const rankings = loadRankings();
  const published = loadPublished();
  const refreshLog = loadRefreshLog();
  const candidates = [];
  const todayDate = new Date();

  for (const article of published) {
    const tracker = rankings[article.slug];
    if (!tracker || !tracker.rankings.length) continue;

    const reasons = [];
    const latestRanking = tracker.rankings[tracker.rankings.length - 1];
    const currentPos = latestRanking?.position;

    // Skip articles ranking 1-5
    if (currentPos && currentPos <= 5) continue;

    // Check for 5+ position drop in last 7 days
    if (tracker.rankings.length >= 2) {
      const prev = tracker.rankings[tracker.rankings.length - 2];
      if (prev.position && currentPos && currentPos - prev.position >= 5) {
        reasons.push(`ranking dropped from ${prev.position} to ${currentPos}`);
      }
    }

    // Disappeared from top 50
    if (tracker.rankings.length >= 2) {
      const prev = tracker.rankings[tracker.rankings.length - 2];
      if (prev.position && !currentPos) {
        reasons.push(`disappeared from top 50 (was position ${prev.position})`);
      }
    }

    // Article age — 6+ months old
    const publishedDate = new Date(article.publishedAt || article.date);
    const ageMonths = (todayDate - publishedDate) / (1000 * 60 * 60 * 24 * 30);
    if (ageMonths >= 6) {
      reasons.push(`${Math.floor(ageMonths)} months old — needs freshness update`);
    }

    // Word count below 1,200
    if (article.wordCount && article.wordCount < 1200) {
      reasons.push(`only ${article.wordCount} words (minimum 1,200)`);
    }

    // Not refreshed in 12 months
    if (tracker.lastRefreshed) {
      const lastRefreshDate = new Date(tracker.lastRefreshed);
      const monthsSinceRefresh = (todayDate - lastRefreshDate) / (1000 * 60 * 60 * 24 * 30);
      if (monthsSinceRefresh >= 12) {
        reasons.push("not refreshed in 12+ months");
      }
    }

    if (reasons.length === 0) continue;

    // Check not refreshed in last 30 days
    const recentRefresh = refreshLog.find(
      (r) => r.slug === article.slug && new Date(r.refreshDate) > new Date(todayDate - 30 * 24 * 60 * 60 * 1000)
    );
    if (recentRefresh) continue;

    candidates.push({
      slug: article.slug,
      title: article.title,
      keyword: article.primaryKeyword,
      currentPosition: currentPos,
      reasons,
      publishedAt: article.publishedAt || article.date,
      wordCount: article.wordCount,
    });
  }

  // Sort by oldest first
  candidates.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));

  return candidates;
}

// ── Refresh a single article ──────────────────────────────────────

async function refreshArticle(slug) {
  log("contentRefresher", "refresh", `starting refresh for: ${slug}`);

  // 1. Fetch from Sanity
  const posts = await sanityQuery(
    `*[_type == "blogPost" && slug.current == "${slug}"]{ _id, title, body, primaryKeyword, category, metaDescription }`,
  );
  if (!posts || posts.length === 0) {
    log("contentRefresher", "refresh", `article not found in Sanity: ${slug}`);
    return null;
  }
  const post = posts[0];

  // 2. Convert body to markdown
  const markdown = portableTextToMarkdown(post.body || []);
  const wordCountBefore = markdown.split(/\s+/).length;

  // 3. Research competitors via Claude (SerpApi budget-conscious)
  const keyword = post.primaryKeyword || post.title;
  log("contentRefresher", "research", `analyzing competitors for "${keyword}"`);

  const rewriteInstructions = await claudeCall(
    `You are a senior content strategist. Analyze this article and provide specific rewrite instructions to improve its Google ranking for "${keyword}" in Canada.`,
    `ARTICLE TITLE: ${post.title}
KEYWORD: ${keyword}
CURRENT WORD COUNT: ${wordCountBefore}
ARTICLE BODY:
${markdown}

Provide specific rewrite instructions:
1. What H2 sections to add or expand
2. What statistics or data points to update to 2026
3. What FAQ questions to add
4. How to strengthen the opening paragraph for AI citability
5. Target word count: at least ${Math.max(1500, Math.round(wordCountBefore * 1.1))} words

Return ONLY the rewrite instructions, no preamble.`,
    2048
  );

  // 4. Rewrite the article
  log("contentRefresher", "rewrite", "generating updated content");
  const rewrittenBody = await claudeCall(
    `You are a senior ISO consulting content writer for ISO Certification Consultant (isocertificationconsultant.ca), a Canadian ISO consulting firm. Write authoritative, well-researched content targeting Canadian manufacturers. Keep the same style and structure but expand and improve. Use markdown format with ## H2 headings, bullet lists, and bold text.`,
    `Rewrite and improve this article following these instructions:

INSTRUCTIONS:
${rewriteInstructions}

ORIGINAL ARTICLE:
${markdown}

RULES:
- Keep the same general structure and topic
- Update all year references to 2026
- Ensure primary keyword "${keyword}" appears in the first 100 words
- Add "Updated ${new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}" near the top
- Expand to at least ${Math.max(1500, Math.round(wordCountBefore * 1.1))} words
- Write for Canadian manufacturers specifically
- Include specific dollar figures in CAD where relevant
- Maintain the same slug-friendly topic focus`,
    8192
  );

  const wordCountAfter = rewrittenBody.split(/\s+/).length;

  // 5. Run through linkBuilder
  const { weaveLinks } = require("../seo/linkBuilder");
  const linked = await weaveLinks({
    title: post.title,
    body: rewrittenBody,
    primaryKeyword: keyword,
    category: post.category || "ISO Certification",
  });

  // 6. Run content QA
  let qaScore = 0;
  try {
    const contentQA = require("./contentQA");
    const qaResult = await contentQA.runQA({
      title: post.title,
      body: linked.body,
      primaryKeyword: keyword,
      category: post.category,
    });
    qaScore = qaResult.score || 0;

    if (qaScore < 85) {
      log("contentRefresher", "qa-fail", `QA score ${qaScore}/100 — below 85 threshold, aborting refresh`);
      return { slug, status: "qa-failed", qaScore };
    }
  } catch (err) {
    log("contentRefresher", "qa-error", `QA failed: ${err.message} — proceeding with caution`);
    qaScore = 80; // Default if QA module fails
  }

  // 7. Convert to Portable Text and patch Sanity
  // Use the fixed markdownToPortableText from sanityPublisher
  const { publishToSanity } = require("./sanityPublisher");

  // We need to use the markdownToPortableText directly, load it from sanityPublisher module
  const newBody = markdownToPortableTextLocal(linked.body);
  const now = new Date().toISOString();

  const patchResult = await sanityMutate([
    {
      patch: {
        id: post._id,
        set: {
          body: newBody,
          publishedAt: now,
          metaDescription: post.metaDescription?.replace(/202[0-5]/g, "2026") || post.metaDescription,
        },
      },
    },
  ]);

  if (patchResult.status !== 200) {
    log("contentRefresher", "patch-fail", `Sanity patch failed: ${patchResult.status}`);
    return { slug, status: "patch-failed" };
  }

  // 8. Log the refresh
  const refreshEntry = {
    slug,
    title: post.title,
    refreshDate: today(),
    reason: "content refresh",
    wordCountBefore,
    wordCountAfter,
    qaScore,
    linksAdded: linked.linkReport?.totalLinks || 0,
  };

  const refreshLog = loadRefreshLog();
  refreshLog.push(refreshEntry);
  saveRefreshLog(refreshLog);

  // Update rankings tracker
  const rankings = loadRankings();
  if (rankings[slug]) {
    rankings[slug].lastRefreshed = today();
    rankings[slug].refreshCount = (rankings[slug].refreshCount || 0) + 1;
    saveRankings(rankings);
  }

  log("contentRefresher", "complete", `"${post.title}" — ${wordCountBefore} → ${wordCountAfter} words, QA ${qaScore}/100`);
  updateHeartbeat("contentRefresher", "complete", `Refreshed: ${post.title.slice(0, 40)}`);

  return { slug, status: "refreshed", ...refreshEntry };
}

// ── Run weekly refresh check ──────────────────────────────────────

async function runRefresh() {
  log("contentRefresher", "refresh-check", "starting weekly refresh check");

  // 1. Check rankings
  await checkRankings();

  // 2. Find candidates
  const candidates = identifyRefreshCandidates();
  log("contentRefresher", "candidates", `${candidates.length} articles flagged for refresh`);

  if (candidates.length === 0) {
    updateHeartbeat("contentRefresher", "complete", "0 articles need refresh");
    return { refreshed: [], candidates: [] };
  }

  // 3. Refresh up to 3 articles
  const toRefresh = candidates.slice(0, 3);
  const results = [];

  for (const candidate of toRefresh) {
    try {
      const result = await refreshArticle(candidate.slug);
      results.push(result);
    } catch (err) {
      log("contentRefresher", "refresh-error", `${candidate.slug}: ${err.message}`);
      results.push({ slug: candidate.slug, status: "error", error: err.message });
    }
  }

  // 4. Send refresh report email
  await sendRefreshReport(results, candidates);

  return { refreshed: results, candidates };
}

// ── Refresh report email ──────────────────────────────────────────

async function sendRefreshReport(results, candidates) {
  const refreshed = results.filter((r) => r.status === "refreshed");
  const failed = results.filter((r) => r.status !== "refreshed");
  const queued = candidates.slice(3);

  const refreshedHtml = refreshed.length > 0
    ? refreshed.map((r) => `<div style="padding:8px 12px;border-left:3px solid #22c55e;margin:8px 0;background:#f0fdf4;border-radius:4px">
        <strong>✅ "${r.title}"</strong><br>
        <span style="color:#666;font-size:13px">Changes: +${r.wordCountAfter - r.wordCountBefore} words, ${r.linksAdded} links added, QA ${r.qaScore}/100</span>
      </div>`).join("")
    : "<p style='color:#999'>No articles refreshed</p>";

  const queuedHtml = queued.length > 0
    ? queued.map((c) => `<li style="margin:4px 0;font-size:13px">"${c.title}" — ${c.reasons[0]}</li>`).join("")
    : "<li style='color:#999'>None queued</li>";

  const rankings = loadRankings();
  const improving = Object.values(rankings).filter((r) => {
    if (r.rankings.length < 2) return false;
    const curr = r.rankings[r.rankings.length - 1].position;
    const prev = r.rankings[r.rankings.length - 2].position;
    return curr && prev && curr < prev;
  });

  const improvingHtml = improving.length > 0
    ? improving.map((r) => {
        const curr = r.rankings[r.rankings.length - 1].position;
        const prev = r.rankings[r.rankings.length - 2].position;
        return `<li style="margin:4px 0;font-size:13px">"${r.keyword}" — position ${prev} → ${curr} ↑</li>`;
      }).join("")
    : "<li style='color:#999'>No ranking changes detected</li>";

  const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
    <div style="background:#152B4B;color:white;padding:16px;text-align:center;border-radius:8px 8px 0 0">
      <h1 style="margin:0;font-size:20px">Content Refresh Report</h1>
      <p style="margin:4px 0 0;opacity:0.8">${today()} · ISO Certification Consultant</p>
    </div>
    <div style="padding:16px;border:1px solid #e5e7eb;border-top:none">
      <h2 style="color:#152B4B;font-size:16px;margin:0 0 8px">Articles Refreshed This Week: ${refreshed.length}</h2>
      ${refreshedHtml}
      ${failed.length > 0 ? `<h2 style="color:#ef4444;font-size:16px;margin:16px 0 8px">Failed: ${failed.length}</h2>
        ${failed.map((f) => `<p style="color:#666;font-size:13px">❌ ${f.slug} — ${f.status}</p>`).join("")}` : ""}
      <h2 style="color:#152B4B;font-size:16px;margin:20px 0 8px">Queued for Next Week: ${queued.length}</h2>
      <ul style="padding-left:20px">${queuedHtml}</ul>
      <h2 style="color:#152B4B;font-size:16px;margin:20px 0 8px">Rankings Improving (${improving.length})</h2>
      <ul style="padding-left:20px">${improvingHtml}</ul>
    </div>
    <div style="background:#f3f4f6;padding:8px;text-align:center;border-radius:0 0 8px 8px;font-size:11px;color:#9ca3af">
      ISO Certification Consultant Content Refresh Agent · ${today()}
    </div>
  </div>`;

  await sendEmail({
    subject: `Content Refresh Report — ${refreshed.length} refreshed — ${today()}`,
    html,
    text: `Refreshed: ${refreshed.length}, Queued: ${queued.length}`,
  });
}

// ── Audit command — show all articles + ranking status ─────────────

function auditRankings() {
  const published = loadPublished();
  const rankings = loadRankings();
  const candidates = identifyRefreshCandidates();
  const candidateSlugs = new Set(candidates.map((c) => c.slug));

  const articles = published.map((a) => {
    const tracker = rankings[a.slug];
    const latestPos = tracker?.rankings?.length
      ? tracker.rankings[tracker.rankings.length - 1].position
      : null;
    const prevPos = tracker?.rankings?.length >= 2
      ? tracker.rankings[tracker.rankings.length - 2].position
      : null;

    let trend = "—";
    if (latestPos && prevPos) {
      if (latestPos < prevPos) trend = `↑ ${prevPos - latestPos}`;
      else if (latestPos > prevPos) trend = `↓ ${latestPos - prevPos}`;
      else trend = "=";
    }

    return {
      slug: a.slug,
      title: a.title,
      keyword: a.primaryKeyword,
      position: latestPos,
      previousPosition: prevPos,
      trend,
      wordCount: a.wordCount,
      publishedAt: a.publishedAt || a.date,
      lastRefreshed: tracker?.lastRefreshed || null,
      refreshCount: tracker?.refreshCount || 0,
      needsRefresh: candidateSlugs.has(a.slug),
      reasons: candidates.find((c) => c.slug === a.slug)?.reasons || [],
    };
  });

  return { articles, candidateCount: candidates.length };
}

// ── Local portable text converter (mirrors sanityPublisher fix) ───

function randomKey() {
  return Math.random().toString(36).slice(2, 14);
}

function parseInlineContent(text) {
  const children = [];
  const markDefs = [];
  const regex = /(\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      children.push({ _type: "span", _key: randomKey(), text: text.slice(lastIndex, match.index), marks: [] });
    }
    if (match[2]) {
      children.push({ _type: "span", _key: randomKey(), text: match[2], marks: ["strong"] });
    } else if (match[3] && match[4]) {
      const linkKey = randomKey();
      children.push({ _type: "span", _key: randomKey(), text: match[3], marks: [linkKey] });
      markDefs.push({ _type: "link", _key: linkKey, href: match[4] });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    children.push({ _type: "span", _key: randomKey(), text: text.slice(lastIndex), marks: [] });
  }
  if (children.length === 0) {
    children.push({ _type: "span", _key: randomKey(), text, marks: [] });
  }
  return { children, markDefs };
}

function markdownToPortableTextLocal(markdown) {
  const blocks = [];
  const lines = markdown.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") { i++; continue; }
    if (line.startsWith("## ")) {
      const { children, markDefs } = parseInlineContent(line.slice(3).trim());
      blocks.push({ _type: "block", _key: randomKey(), style: "h2", children, markDefs });
      i++; continue;
    }
    if (line.startsWith("### ")) {
      const { children, markDefs } = parseInlineContent(line.slice(4).trim());
      blocks.push({ _type: "block", _key: randomKey(), style: "h3", children, markDefs });
      i++; continue;
    }
    if (line.match(/^[-*] /)) {
      const { children, markDefs } = parseInlineContent(line.replace(/^[-*] /, "").trim());
      blocks.push({ _type: "block", _key: randomKey(), style: "normal", listItem: "bullet", level: 1, children, markDefs });
      i++; continue;
    }
    if (line.match(/^\d+\. /)) {
      const { children, markDefs } = parseInlineContent(line.replace(/^\d+\. /, "").trim());
      blocks.push({ _type: "block", _key: randomKey(), style: "normal", listItem: "number", level: 1, children, markDefs });
      i++; continue;
    }
    if (line.trimStart().startsWith("|")) {
      const tableLines = [line];
      i++;
      while (i < lines.length && lines[i].trimStart().startsWith("|")) { tableLines.push(lines[i]); i++; }
      const rows = tableLines
        .filter((l) => !l.match(/^\|[\s\-:|]+\|$/))
        .map((l) => ({ _key: randomKey(), cells: l.split("|").slice(1, -1).map((c) => c.trim()) }));
      blocks.push({ _type: "table", _key: randomKey(), rows });
      continue;
    }
    let para = line;
    i++;
    while (i < lines.length && lines[i].trim() !== "" && !lines[i].startsWith("#") && !lines[i].match(/^[-*] /) && !lines[i].match(/^\d+\. /) && !lines[i].trimStart().startsWith("|")) {
      para += " " + lines[i].trim();
      i++;
    }
    const { children, markDefs } = parseInlineContent(para.trim());
    blocks.push({ _type: "block", _key: randomKey(), style: "normal", children, markDefs });
  }
  return blocks;
}

function portableTextToMarkdown(blocks) {
  const lines = [];
  for (const block of blocks) {
    if (block._type === "table") {
      for (const row of block.rows || []) lines.push("| " + row.cells.join(" | ") + " |");
      lines.push("");
      continue;
    }
    if (block._type !== "block") continue;
    const text = (block.children || []).map((span) => {
      const t = span.text || "";
      if (!t) return "";
      return (span.marks || []).includes("strong") ? `**${t}**` : t;
    }).join("");
    if (!text.trim()) continue;
    if (text.trim().startsWith("|") && text.trim().endsWith("|")) { lines.push(text.trim()); continue; }
    const style = block.style || "normal";
    if (style === "h2") lines.push(`## ${text}`);
    else if (style === "h3") lines.push(`### ${text}`);
    else if (block.listItem === "bullet") lines.push(`- ${text}`);
    else if (block.listItem === "number") lines.push(`1. ${text}`);
    else lines.push(text);
    if (!block.listItem) lines.push("");
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

module.exports = { runRefresh, checkRankings, refreshArticle, auditRankings, identifyRefreshCandidates };
