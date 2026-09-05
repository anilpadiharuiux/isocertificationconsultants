const https = require("https");
const fs = require("fs");
const { sanityMutate, sanityQuery } = require("../shared/sanity");
const { log } = require("../shared/logger");
const { SITE_URL, SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_TOKEN } = require("../shared/config");

function markdownToPortableText(markdown) {
  const blocks = [];
  const lines = markdown.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Skip [IMAGE: ...] markers (handled by inlineImageAgent before this stage)
    if (/^\[IMAGE:[^\]]+\]$/.test(line.trim())) {
      i++;
      continue;
    }

    // Handle [SANITY_IMAGE: assetId | alt text] — inline image blocks
    const imageMatch = line.trim().match(/^\[SANITY_IMAGE:\s*([^\s|]+)\s*\|\s*(.+)\]$/);
    if (imageMatch) {
      const altText = imageMatch[2].trim();
      blocks.push({
        _type: "image",
        _key: randomKey(),
        asset: { _type: "reference", _ref: imageMatch[1] },
        alt: altText,
        caption: altText,
      });
      i++;
      continue;
    }

    // H2 heading
    if (line.startsWith("## ")) {
      const { children, markDefs } = parseInlineContent(line.slice(3).trim());
      blocks.push({ _type: "block", _key: randomKey(), style: "h2", children, markDefs });
      i++;
      continue;
    }

    // H3 heading
    if (line.startsWith("### ")) {
      const { children, markDefs } = parseInlineContent(line.slice(4).trim());
      blocks.push({ _type: "block", _key: randomKey(), style: "h3", children, markDefs });
      i++;
      continue;
    }

    // Bullet list items
    if (line.match(/^[-*] /)) {
      const { children, markDefs } = parseInlineContent(line.replace(/^[-*] /, "").trim());
      blocks.push({ _type: "block", _key: randomKey(), style: "normal", listItem: "bullet", level: 1, children, markDefs });
      i++;
      continue;
    }

    // Numbered list items
    if (line.match(/^\d+\. /)) {
      const { children, markDefs } = parseInlineContent(line.replace(/^\d+\. /, "").trim());
      blocks.push({ _type: "block", _key: randomKey(), style: "normal", listItem: "number", level: 1, children, markDefs });
      i++;
      continue;
    }

    // Table — collect consecutive lines starting with |
    if (line.trimStart().startsWith("|")) {
      const tableLines = [line];
      i++;
      while (i < lines.length && lines[i].trimStart().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      // Parse rows, skip separator row (|---|---|)
      const rows = tableLines
        .filter((l) => !l.match(/^\|[\s\-:|]+\|$/))
        .map((l) => ({
          _key: randomKey(),
          cells: l.split("|").slice(1, -1).map((c) => c.trim()),
        }));
      blocks.push({ _type: "table", _key: randomKey(), rows });
      continue;
    }

    // Regular paragraph — collect consecutive non-empty lines
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

// Single function that returns BOTH children and markDefs with shared link keys
function parseInlineContent(text) {
  // Strip markdown attribute syntax like {:target="_blank"} before parsing
  text = text.replace(/\{:target=["']_blank["']\}/g, "");

  const children = [];
  const markDefs = [];
  const regex = /(\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      children.push({ _type: "span", _key: randomKey(), text: text.slice(lastIndex, match.index), marks: [] });
    }

    if (match[2]) {
      // Bold text
      children.push({ _type: "span", _key: randomKey(), text: match[2], marks: ["strong"] });
    } else if (match[3] && match[4]) {
      // Link — same key in both span.marks and markDefs
      const linkKey = randomKey();
      children.push({ _type: "span", _key: randomKey(), text: match[3], marks: [linkKey] });
      markDefs.push({ _type: "link", _key: linkKey, href: match[4] });
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    children.push({ _type: "span", _key: randomKey(), text: text.slice(lastIndex), marks: [] });
  }

  if (children.length === 0) {
    children.push({ _type: "span", _key: randomKey(), text, marks: [] });
  }

  return { children, markDefs };
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96);
}

function randomKey() {
  return Math.random().toString(36).slice(2, 14);
}

function httpsPost(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = https.request(
      {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: "POST",
        headers: { ...headers, "Content-Length": data.length },
        timeout: 60000,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
          catch { resolve({ status: res.statusCode, body }); }
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
    req.write(data);
    req.end();
  });
}

async function uploadInfographicToSanity(filePath) {
  const SANITY_ASSETS_URL = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/assets/images/${SANITY_DATASET}`;
  const imageBuffer = fs.readFileSync(filePath);
  const filename = filePath.split("/").pop();

  const res = await httpsPost(
    `${SANITY_ASSETS_URL}?filename=${encodeURIComponent(filename)}`,
    imageBuffer,
    {
      Authorization: `Bearer ${SANITY_API_TOKEN}`,
      "Content-Type": "image/png",
    }
  );

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`Sanity infographic upload failed: ${res.status}`);
  }

  return res.body.document;
}

/**
 * Generate a table of contents block from chapter titles in the article body.
 * Returns Portable Text blocks for the TOC.
 */
function generateTocBlocks(markdown) {
  const tocItems = [];
  for (const line of markdown.split("\n")) {
    const h2Match = line.match(/^## (.+)/);
    if (h2Match) {
      const title = h2Match[1].trim();
      const anchor = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      tocItems.push({ title, anchor });
    }
  }
  if (tocItems.length < 3) return []; // Not enough chapters for a TOC

  const blocks = [];
  // TOC heading
  blocks.push({
    _type: "block",
    _key: randomKey(),
    style: "h2",
    children: [{ _type: "span", _key: randomKey(), text: "Table of Contents", marks: [] }],
    markDefs: [],
  });

  // TOC items as a numbered list with anchor links
  for (let i = 0; i < tocItems.length; i++) {
    const item = tocItems[i];
    const linkKey = randomKey();
    blocks.push({
      _type: "block",
      _key: randomKey(),
      style: "normal",
      listItem: "number",
      level: 1,
      children: [{ _type: "span", _key: randomKey(), text: item.title, marks: [linkKey] }],
      markDefs: [{ _type: "link", _key: linkKey, href: `#${item.anchor}` }],
    });
  }

  return blocks;
}

/**
 * Split markdown body into chapters by H2 headings.
 * Returns: { intro: string, chapters: [{ title, description, body }] }
 */
function splitByH2(markdown) {
  const lines = markdown.split("\n");
  const chapters = [];
  let introLines = [];
  let currentChapter = null;

  for (const line of lines) {
    const h2Match = line.match(/^## (.+)/);
    if (h2Match) {
      if (currentChapter) {
        currentChapter.body = currentChapter.lines.join("\n").trim();
        delete currentChapter.lines;
        chapters.push(currentChapter);
      }
      currentChapter = { title: h2Match[1].trim(), description: "", lines: [] };
    } else if (currentChapter) {
      currentChapter.lines.push(line);
      if (!currentChapter.description && line.trim() && !line.startsWith("#") && !line.match(/^[-*] /) && !line.match(/^\d+\. /) && !line.trimStart().startsWith("|") && !line.trim().startsWith("[")) {
        currentChapter.description = line.trim().slice(0, 160);
      }
    } else {
      introLines.push(line);
    }
  }
  if (currentChapter) {
    currentChapter.body = currentChapter.lines.join("\n").trim();
    delete currentChapter.lines;
    chapters.push(currentChapter);
  }

  return { intro: introLines.join("\n").trim(), chapters };
}

/**
 * Publish a regular (non-mega) article as a single Sanity document.
 */
async function publishToSanity(article, imageResult, infographicResult) {
  // Route mega-articles to multi-document publisher
  if (article.isMegaArticle) {
    return publishMegaSeries(article, imageResult, infographicResult);
  }

  log("sanityPublisher", "publish", `"${article.title}"`);

  const slug = slugify(article.title);
  const now = new Date().toISOString();

  // ── Duplicate slug guard ──
  const existing = await sanityQuery(
    `*[_type == "blogPost" && slug.current == "${slug}"]{ _id, title, publishedAt }`
  );
  if (existing && existing.length > 0) {
    log("sanityPublisher", "DUPLICATE-BLOCKED", `slug "${slug}" already exists (doc ${existing[0]._id}, published ${existing[0].publishedAt}) — aborting publish`);
    throw new Error(`Duplicate slug blocked: "${slug}" already exists in Sanity (${existing[0]._id}). Article not published.`);
  }

  const bodyBlocks = markdownToPortableText(article.body);

  const doc = {
    _type: "blogPost",
    title: article.title,
    slug: { _type: "slug", current: slug },
    metaTitle: article.title,
    metaDescription: article.metaDescription,
    excerpt: article.metaDescription,
    body: bodyBlocks,
    category: article.category,
    readTime: article.readTime,
    author: "the Owner Singh",
    publishedAt: now,
  };

  if (imageResult?.assetId) {
    const imageObj = {
      _type: "image",
      asset: { _type: "reference", _ref: imageResult.assetId },
      alt: imageResult.altText,
    };
    doc.featuredImage = imageObj;
    doc.mainImage = imageObj;
  }

  if (infographicResult?.type === "gemini" && infographicResult.data?.path) {
    try {
      log("sanityPublisher", "infographic", "uploading Gemini image to Sanity");
      const asset = await uploadInfographicToSanity(infographicResult.data.path);
      doc.infographic = {
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
        alt: `${article.title} — Featured Image`,
      };
      log("sanityPublisher", "infographic", `uploaded: ${asset._id}`);
    } catch (err) {
      log("sanityPublisher", "infographic-error", err.message);
    }
  }

  const result = await sanityMutate([{ create: doc }]);

  if (result.status !== 200) {
    throw new Error(`Sanity publish failed: ${result.status} — ${JSON.stringify(result.body)}`);
  }

  const docId = result.body?.results?.[0]?.id;
  log("sanityPublisher", "created", `document ${docId}`);
  log("sanityPublisher", "deploy", "Sanity content published — Vercel auto-deploys on next git push");

  const liveUrl = `${SITE_URL}/blog/${slug}`;
  log("sanityPublisher", "published", liveUrl);

  return { documentId: docId, slug, url: liveUrl, publishedAt: now };
}

/**
 * Publish a mega-article as a multi-document series:
 *   1 introduction doc (chapterNumber: 0, isIntroduction: true)
 * + N chapter docs (chapterNumber: 1..N) sharing the same seriesSlug.
 *
 * This gives full chapter navigation (SeriesTOC + ChapterNavigation)
 * and avoids body truncation from oversized single documents.
 */
async function publishMegaSeries(article, imageResult, infographicResult) {
  log("sanityPublisher", "mega-series", `splitting "${article.title}" into multi-document series`);

  const seriesSlug = slugify(article.title);
  const now = new Date().toISOString();

  // ── Duplicate slug guard ──
  const existing = await sanityQuery(
    `*[_type == "blogPost" && slug.current == "${seriesSlug}"]{ _id, title, publishedAt }`
  );
  if (existing && existing.length > 0) {
    log("sanityPublisher", "DUPLICATE-BLOCKED", `slug "${seriesSlug}" already exists — aborting publish`);
    throw new Error(`Duplicate slug blocked: "${seriesSlug}" already exists in Sanity (${existing[0]._id}).`);
  }

  // Split the assembled markdown body into intro + chapters by H2
  const { intro, chapters } = splitByH2(article.body);
  log("sanityPublisher", "mega-split", `intro + ${chapters.length} chapters extracted`);

  if (chapters.length === 0) {
    log("sanityPublisher", "mega-fallback", "no H2 chapters found — publishing as single document");
    article.isMegaArticle = false;
    return publishToSanity(article, imageResult, infographicResult);
  }

  // Upload infographic asset once (shared across docs)
  let infographicAssetId = null;
  if (infographicResult?.type === "gemini" && infographicResult.data?.path) {
    try {
      log("sanityPublisher", "infographic", "uploading Gemini image to Sanity");
      const asset = await uploadInfographicToSanity(infographicResult.data.path);
      infographicAssetId = asset._id;
      log("sanityPublisher", "infographic", `uploaded: ${infographicAssetId}`);
    } catch (err) {
      log("sanityPublisher", "infographic-error", err.message);
    }
  }

  // ── Build introduction document ──
  const introBody = intro || `This comprehensive guide covers ${article.title} in ${chapters.length} detailed chapters.`;
  const introBlocks = markdownToPortableText(introBody);
  const introReadMinutes = Math.ceil(introBody.split(/\s+/).length / 200);

  const introDOC = {
    _type: "blogPost",
    title: article.title,
    slug: { _type: "slug", current: seriesSlug },
    metaTitle: article.title,
    metaDescription: article.metaDescription,
    excerpt: article.metaDescription,
    body: introBlocks,
    category: article.category,
    readTime: `${introReadMinutes} min read`,
    author: "the Owner Singh",
    publishedAt: now,
    seriesSlug: seriesSlug,
    seriesTitle: article.title,
    seriesDescription: article.metaDescription,
    chapterNumber: 0,
    isIntroduction: true,
  };

  if (imageResult?.assetId) {
    const introImageObj = {
      _type: "image",
      asset: { _type: "reference", _ref: imageResult.assetId },
      alt: imageResult.altText,
    };
    introDOC.featuredImage = introImageObj;
    introDOC.mainImage = introImageObj;
    introDOC.seriesCoverImage = {
      _type: "image",
      asset: { _type: "reference", _ref: imageResult.assetId },
      alt: `${article.title} — Featured Guide`,
    };
  }
  if (infographicAssetId) {
    introDOC.infographic = {
      _type: "image",
      asset: { _type: "reference", _ref: infographicAssetId },
      alt: `${article.title} — Featured Image`,
    };
  }

  // ── Create intro document ──
  log("sanityPublisher", "mega-intro", `creating intro document: "${article.title}"`);
  const introResult = await sanityMutate([{ create: introDOC }]);
  if (introResult.status !== 200) {
    throw new Error(`Sanity intro publish failed: ${introResult.status} — ${JSON.stringify(introResult.body)}`);
  }
  const introDocId = introResult.body?.results?.[0]?.id;
  log("sanityPublisher", "mega-intro-created", `doc ${introDocId}`);

  // ── Create chapter documents ──
  const chapterDocIds = [];
  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    const chapterNum = i + 1;
    const chapterSlug = `${seriesSlug}-chapter-${chapterNum}`;

    const chapterBody = markdownToPortableText(ch.body);
    const chapterWordCount = ch.body.split(/\s+/).length;
    const chapterReadMin = Math.ceil(chapterWordCount / 200);

    const chapterDoc = {
      _type: "blogPost",
      title: `Chapter ${chapterNum}: ${ch.title}`,
      slug: { _type: "slug", current: chapterSlug },
      metaTitle: `${ch.title} | ${article.title}`,
      metaDescription: ch.description || `Chapter ${chapterNum} of ${article.title}`,
      excerpt: ch.description || `Chapter ${chapterNum} of ${article.title}`,
      body: chapterBody,
      category: article.category,
      readTime: `${chapterReadMin} min read`,
      author: "the Owner Singh",
      publishedAt: now,
      seriesSlug: seriesSlug,
      seriesTitle: article.title,
      chapterNumber: chapterNum,
      chapterDescription: ch.description || ch.title,
      isIntroduction: false,
    };

    if (imageResult?.assetId) {
      const chapterImageObj = {
        _type: "image",
        asset: { _type: "reference", _ref: imageResult.assetId },
        alt: `${ch.title} — ${article.title}`,
      };
      chapterDoc.featuredImage = chapterImageObj;
      chapterDoc.mainImage = chapterImageObj;
    }

    log("sanityPublisher", "mega-chapter", `creating chapter ${chapterNum}/${chapters.length}: "${ch.title}" (${chapterWordCount} words)`);
    const chResult = await sanityMutate([{ create: chapterDoc }]);
    if (chResult.status !== 200) {
      log("sanityPublisher", "mega-chapter-error", `chapter ${chapterNum} failed: ${chResult.status}`);
      continue;
    }
    const chDocId = chResult.body?.results?.[0]?.id;
    chapterDocIds.push(chDocId);
    log("sanityPublisher", "mega-chapter-created", `chapter ${chapterNum} → doc ${chDocId}`);
  }

  log("sanityPublisher", "mega-series-done", `created 1 intro + ${chapterDocIds.length} chapters for "${article.title}"`);
  log("sanityPublisher", "deploy", "Sanity content published — Vercel auto-deploys on next git push");

  const liveUrl = `${SITE_URL}/blog/${seriesSlug}`;
  log("sanityPublisher", "published", liveUrl);

  return {
    documentId: introDocId,
    chapterDocIds,
    slug: seriesSlug,
    url: liveUrl,
    publishedAt: now,
    chapterCount: chapterDocIds.length,
  };
}

async function verifyLive(url, maxAttempts = 4) {
  log("sanityPublisher", "verify", `checking ${url}`);

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 15000)); // Wait 15s between checks

    try {
      const result = await new Promise((resolve, reject) => {
        const req = https.get(url, { timeout: 10000 }, (res) => {
          resolve(res.statusCode);
        });
        req.on("error", () => resolve(0));
        req.on("timeout", () => { req.destroy(); resolve(0); });
      });

      if (result === 200) {
        log("sanityPublisher", "verified", `live at ${url}`);
        return true;
      }
      log("sanityPublisher", "verify", `attempt ${i + 1}: HTTP ${result}`);
    } catch {
      log("sanityPublisher", "verify", `attempt ${i + 1}: failed`);
    }
  }

  log("sanityPublisher", "verify", "could not confirm — may need Vercel rebuild");
  return false;
}

module.exports = { publishToSanity, publishMegaSeries, verifyLive, slugify, markdownToPortableText, splitByH2 };
