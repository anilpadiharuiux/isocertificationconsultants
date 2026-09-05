const { claudeCallFast: claudeCall } = require("../shared/claude");
const { log } = require("../shared/logger");

/**
 * Targeted rewrite patcher — fixes specific QA failures without regenerating the entire article.
 * Each patch function handles one category of failure and modifies only the relevant sections.
 */

const BANNED_PHRASES = [
  "delve into", "it is worth noting", "in conclusion", "in today's landscape",
  "navigating the complexities", "crucial", "comprehensive", "landscape",
  "navigate", "leverage", "game-changer", "cutting-edge", "at the end of the day",
  "it goes without saying", "needless to say",
];

/**
 * Analyzes QA issues and applies targeted patches.
 * Returns the patched article (mutates body only — never rewrites from scratch).
 */
async function patchArticle(article, qaResult, context) {
  log("rewritePatcher", "analyzing", `${qaResult.issues?.length || 0} issues to patch`);

  const issues = qaResult.issues || [];
  const checks = qaResult.checks || [];
  let body = article.body;
  let patchCount = 0;

  // ── Patch 1: Banned phrases (tone) ──
  const toneCheck = checks.find((c) => c.name === "professional-tone" || c.name === "tone");
  if (toneCheck && !toneCheck.pass) {
    body = patchBannedPhrases(body);
    patchCount++;
    log("rewritePatcher", "patched", "banned phrases removed");
  }

  // ── Patch 2: Missing/weak links ──
  const linkIssues = issues.filter((i) =>
    i.toLowerCase().includes("link") || i.toLowerCase().includes("external") || i.toLowerCase().includes("internal")
  );
  if (linkIssues.length > 0 && context) {
    body = await patchLinks(body, article, context);
    patchCount++;
    log("rewritePatcher", "patched", "links improved");
  }

  // ── Patch 3: Missing FAQ or weak FAQ answers ──
  const faqCheck = checks.find((c) => c.name === "faq" || c.name === "faq-section");
  if (faqCheck && !faqCheck.pass) {
    body = await patchFAQ(body, article);
    patchCount++;
    log("rewritePatcher", "patched", "FAQ section improved");
  }

  // ── Patch 4: Word count too low ──
  const wcCheck = checks.find((c) => c.name === "word-count");
  if (wcCheck && !wcCheck.pass) {
    body = await patchWordCount(body, article);
    patchCount++;
    log("rewritePatcher", "patched", "word count expanded");
  }

  // ── Patch 5: Missing image markers ──
  const imageCheck = checks.find((c) => c.name === "inline-images" || c.name === "images");
  if (imageCheck && !imageCheck.pass) {
    body = patchImageMarkers(body);
    patchCount++;
    log("rewritePatcher", "patched", "image markers added");
  }

  // ── Patch 6: Missing keyword in first 100 words ──
  const kwFirst100 = checks.find((c) => c.name === "keyword-in-first-100" || c.name === "keyword-first-100");
  if (kwFirst100 && !kwFirst100.pass) {
    body = patchKeywordPlacement(body, article.primaryKeyword);
    patchCount++;
    log("rewritePatcher", "patched", "keyword placed in opening");
  }

  if (patchCount === 0) {
    log("rewritePatcher", "skip", "no patchable issues found — full rewrite may be needed");
  } else {
    log("rewritePatcher", "complete", `${patchCount} patches applied`);
  }

  const wordCount = body.split(/\s+/).length;

  return {
    ...article,
    body,
    wordCount,
    patched: true,
    patchCount,
  };
}

// ── Individual patch functions ──

function patchBannedPhrases(body) {
  let patched = body;
  const replacements = {
    "delve into": "examine",
    "it is worth noting": "notably",
    "in conclusion": "to summarize",
    "in today's landscape": "currently",
    "navigating the complexities": "managing the requirements",
    "crucial": "critical",
    "comprehensive": "thorough",
    "landscape": "environment",
    "navigate": "manage",
    "leverage": "use",
    "game-changer": "significant advantage",
    "cutting-edge": "advanced",
    "at the end of the day": "ultimately",
    "it goes without saying": "",
    "needless to say": "",
  };

  for (const [banned, replacement] of Object.entries(replacements)) {
    const regex = new RegExp(banned, "gi");
    patched = patched.replace(regex, replacement);
  }

  // Clean up double spaces from empty replacements
  patched = patched.replace(/ {2,}/g, " ");
  return patched;
}

async function patchLinks(body, article, context) {
  // Count existing links
  const internalLinks = (body.match(/\[([^\]]+)\]\(\/[^)]+\)/g) || []).length;
  const externalMatches = body.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g) || [];
  const externalLinks = externalMatches.length;

  // Check for reused external URLs and swap them with unused alternatives
  const availableExternals = (context.externalLinks || []).map((l) => l.url.replace(/\/$/, ""));
  const usedInBody = externalMatches.map((m) => {
    const match = m.match(/\]\((https?:\/\/[^)]+)\)/);
    return match ? match[1].replace(/\/$/, "") : null;
  }).filter(Boolean);

  // Find URLs in body that are NOT in the available (pre-filtered) list — these are reused
  let patchedBody = body;
  for (const url of usedInBody) {
    const isAvailable = availableExternals.some((a) => url.includes(a) || a.includes(url));
    if (!isAvailable && context.externalLinks?.length > 0) {
      // Find a replacement from available links not already in body
      const replacement = context.externalLinks.find((l) => {
        const normalized = l.url.replace(/\/$/, "");
        return !usedInBody.includes(normalized) && !patchedBody.includes(normalized);
      });
      if (replacement) {
        // Swap the URL in the markdown link, keeping anchor text
        const urlRegex = new RegExp(`\\]\\(${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, "g");
        patchedBody = patchedBody.replace(urlRegex, `](${replacement.url})`);
        log("rewritePatcher", "link-swap", `${url} → ${replacement.url}`);
      }
    }
  }

  if (internalLinks >= 3 && externalLinks >= 3 && patchedBody !== body) {
    return patchedBody; // Swapped reused URLs, counts are fine
  }

  if (internalLinks >= 4 && externalLinks >= 4) return patchedBody;

  const result = await claudeCall(
    `You are a link insertion specialist. Your ONLY job is to add missing links to an existing article without changing any other content. Preserve ALL [IMAGE:], [SANITY_IMAGE:], bold, callouts, and headings.`,
    `This article needs more links. Current count: ${internalLinks} internal, ${externalLinks} external. Target: 4 each.

AVAILABLE INTERNAL LINKS:
${(context.internalLinks?.servicePages || []).map((s) => `- [${s.title}](${s.url})`).join("\n")}
${(context.internalLinks?.blogPosts || []).map((p) => `- [${p.title}](${p.url})`).join("\n")}

AVAILABLE EXTERNAL LINKS (these are pre-verified and unique — use ONLY from this list):
${(context.externalLinks || []).map((l) => `- [${l.name}](${l.url}) — ${l.context}`).join("\n")}

ARTICLE:
${body}

Add the missing links by weaving them naturally mid-sentence. Do NOT change any other content. Do NOT add link sections. Return the full article with links added.`,
    8192
  );

  return result;
}

async function patchFAQ(body, article) {
  // Check if FAQ section exists
  if (!body.includes("## Frequently Asked Questions") && !body.includes("## FAQ")) {
    // Append FAQ section before conclusion
    const faqSection = await claudeCall(
      `You write FAQ sections for ISO consulting articles targeting Canadian manufacturers. Each answer is 3-5 sentences with specific Canadian regulatory context.`,
      `Write a "## Frequently Asked Questions" section with exactly 5 Q&A pairs for an article about "${article.title}" (keyword: ${article.primaryKeyword}).

Each answer must be 3-5 sentences with specific Canadian regulatory context. Use ### for each question. Format:

### Question text?

Answer text (3-5 sentences).

Return ONLY the FAQ section markdown, nothing else.`,
      2048
    );

    // Insert before the last H2 or at the end
    const lastH2 = body.lastIndexOf("\n## ");
    if (lastH2 > body.length * 0.7) {
      return body.slice(0, lastH2) + "\n\n" + faqSection + "\n" + body.slice(lastH2);
    }
    return body + "\n\n" + faqSection;
  }

  return body;
}

async function patchWordCount(body, article) {
  const currentWords = body.split(/\s+/).length;
  if (currentWords >= 1400) return body;

  const deficit = 1500 - currentWords;

  const expansion = await claudeCall(
    `You expand thin sections in ISO consulting articles. Write like a senior consultant with field experience. Never use banned phrases: delve, crucial, comprehensive, landscape, navigate, leverage.`,
    `This article "${article.title}" is ${currentWords} words — needs ~${deficit} more words to reach 1,500.

Identify the thinnest H2 section and expand it with more practical detail, a specific example, or additional actionable advice. Keep the same tone and style.

ARTICLE:
${body}

Return the FULL article with the thin section expanded. Do NOT change other sections.`,
    8192
  );

  return expansion;
}

function patchImageMarkers(body) {
  const existingMarkers = (body.match(/\[IMAGE:[^\]]+\]/g) || []).length;
  if (existingMarkers >= 4) return body;

  // Find H2 sections that don't have an image marker after their first paragraph
  const lines = body.split("\n");
  let result = [];
  let markersAdded = existingMarkers;
  let inH2 = false;
  let paragraphAfterH2 = 0;

  for (let i = 0; i < lines.length; i++) {
    result.push(lines[i]);

    if (lines[i].startsWith("## ")) {
      inH2 = true;
      paragraphAfterH2 = 0;
      continue;
    }

    if (inH2 && lines[i].trim() && !lines[i].startsWith("#") && !lines[i].startsWith("[IMAGE") && !lines[i].startsWith(">")) {
      paragraphAfterH2++;
      if (paragraphAfterH2 === 1 && markersAdded < 4) {
        // Check if next line is already an image marker
        const nextLine = lines[i + 1] || "";
        if (!nextLine.startsWith("[IMAGE")) {
          const sectionTitle = lines.slice(0, i).reverse().find((l) => l.startsWith("## "))?.replace("## ", "") || "quality management process";
          result.push(`\n[IMAGE: manufacturing facility scene related to ${sectionTitle.toLowerCase()}]`);
          markersAdded++;
        }
        inH2 = false;
      }
    }
  }

  return result.join("\n");
}

function patchKeywordPlacement(body, keyword) {
  const firstParagraph = body.split("\n\n")[0];
  if (firstParagraph.toLowerCase().includes(keyword.toLowerCase())) return body;

  // Prepend keyword naturally to opening
  const parts = body.split("\n\n");
  if (parts.length > 1) {
    // Find the first real paragraph (skip key takeaways box)
    for (let i = 0; i < parts.length; i++) {
      if (!parts[i].startsWith(">") && !parts[i].startsWith("#") && parts[i].trim().length > 50) {
        if (!parts[i].toLowerCase().includes(keyword.toLowerCase())) {
          parts[i] = `Understanding **${keyword}** is essential for Canadian manufacturers seeking competitive advantage. ` + parts[i];
        }
        break;
      }
    }
  }

  return parts.join("\n\n");
}

module.exports = { patchArticle };
