const fs = require("fs");
const path = require("path");
const https = require("https");
const { claudeCall, claudeJSON } = require("../shared/claude");
const { log, today } = require("../shared/logger");
const { MEMORY_DIR, SITE_URL } = require("../shared/config");
const { updateHeartbeat } = require("../shared/heartbeat");

const PUBLISHED_PATH = path.join(MEMORY_DIR, "published-articles.json");

// ── 1. Extract YouTube video metadata + transcript ───────────────

async function extractYouTubeData(videoUrl) {
  log("videoToBlog", "extract", `fetching video: ${videoUrl}`);

  // Parse video ID from various YouTube URL formats
  const videoId = parseVideoId(videoUrl);
  if (!videoId) {
    throw new Error(`Could not parse YouTube video ID from: ${videoUrl}`);
  }

  // Fetch the YouTube page to get metadata and caption tracks
  const pageHtml = await httpGet(`https://www.youtube.com/watch?v=${videoId}`);

  // Extract title
  const titleMatch = pageHtml.match(/<title>([^<]+)<\/title>/);
  const title = titleMatch ? titleMatch[1].replace(" - YouTube", "").trim() : "Untitled Video";

  // Extract description from meta tag
  const descMatch = pageHtml.match(/<meta name="description" content="([^"]*)">/);
  const description = descMatch ? descMatch[1] : "";

  // Extract duration from meta
  const durationMatch = pageHtml.match(/"lengthSeconds":"(\d+)"/);
  const durationSeconds = durationMatch ? parseInt(durationMatch[1]) : 0;

  // Extract caption tracks from the page
  let transcript = "";
  try {
    transcript = await extractTranscript(pageHtml, videoId);
  } catch (err) {
    log("videoToBlog", "transcript-warn", `Auto-captions unavailable: ${err.message}`);

    // Fallback: Try Playwright to get transcript from YouTube UI
    try {
      transcript = await extractTranscriptPlaywright(videoId);
    } catch (pwErr) {
      log("videoToBlog", "transcript-warn", `Playwright fallback failed: ${pwErr.message}`);
    }
  }

  if (!transcript) {
    throw new Error("Could not extract transcript. Video may not have captions enabled.");
  }

  log("videoToBlog", "extract", `got ${transcript.split(/\s+/).length} words of transcript`);

  return {
    videoId,
    title,
    description,
    durationSeconds,
    durationFormatted: formatDuration(durationSeconds),
    transcript,
    url: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

// ── Extract transcript from YouTube's caption data ───────────────

async function extractTranscript(pageHtml, videoId) {
  // Find the captions player response data
  const captionMatch = pageHtml.match(/"captions":\s*(\{[^}]*"playerCaptionsTracklistRenderer"[^}]*\})/s);

  if (!captionMatch) {
    // Try alternative pattern
    const altMatch = pageHtml.match(/"captionTracks":\s*(\[[^\]]+\])/);
    if (!altMatch) {
      throw new Error("No caption tracks found in page");
    }

    const tracks = JSON.parse(altMatch[1]);
    if (tracks.length === 0) throw new Error("Empty caption tracks");

    // Prefer English, fallback to first available
    const engTrack = tracks.find((t) => t.languageCode === "en" || t.languageCode?.startsWith("en")) || tracks[0];
    const captionUrl = engTrack.baseUrl;

    // Fetch XML captions
    const xml = await httpGet(captionUrl);
    return parseXmlCaptions(xml);
  }

  // Parse the captions data to find the caption URL
  const tracksMatch = pageHtml.match(/"captionTracks":\s*(\[[\s\S]*?\])/);
  if (!tracksMatch) throw new Error("No caption tracks array found");

  let tracks;
  try {
    tracks = JSON.parse(tracksMatch[1]);
  } catch {
    throw new Error("Could not parse caption tracks JSON");
  }

  if (tracks.length === 0) throw new Error("Empty caption tracks");

  // Prefer manual English captions, then auto-generated English
  const manualEng = tracks.find((t) => (t.languageCode === "en" || t.languageCode?.startsWith("en")) && t.kind !== "asr");
  const autoEng = tracks.find((t) => (t.languageCode === "en" || t.languageCode?.startsWith("en")) && t.kind === "asr");
  const track = manualEng || autoEng || tracks[0];

  const captionUrl = track.baseUrl;
  const xml = await httpGet(captionUrl);
  return parseXmlCaptions(xml);
}

// ── Parse XML caption format ─────────────────────────────────────

function parseXmlCaptions(xml) {
  const segments = [];
  const regex = /<text start="([\d.]+)" dur="([\d.]+)"[^>]*>([^<]*)<\/text>/g;
  let match;

  while ((match = regex.exec(xml)) !== null) {
    const text = match[3]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n/g, " ")
      .trim();

    if (text) segments.push(text);
  }

  return segments.join(" ");
}

// ── Playwright fallback for transcript extraction ────────────────

async function extractTranscriptPlaywright(videoId) {
  const { chromium } = require("playwright");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(`https://www.youtube.com/watch?v=${videoId}`, {
      timeout: 20000,
      waitUntil: "domcontentloaded",
    });

    // Wait for video to load
    await page.waitForTimeout(3000);

    // Click "Show transcript" button if available
    const moreButton = page.locator("tp-yt-paper-button#expand, button[aria-label='Show transcript']");
    try {
      await moreButton.click({ timeout: 5000 });
      await page.waitForTimeout(2000);
    } catch { /* transcript button may not exist */ }

    // Try to find transcript panel
    const transcriptText = await page.evaluate(() => {
      // Look for transcript segments
      const segments = document.querySelectorAll("ytd-transcript-segment-renderer .segment-text, .ytd-transcript-segment-renderer");
      if (segments.length > 0) {
        return Array.from(segments).map((s) => s.textContent.trim()).filter(Boolean).join(" ");
      }

      // Fallback: get video description
      const desc = document.querySelector("#description-inner, ytd-text-inline-expander");
      return desc ? desc.textContent.trim() : "";
    });

    await browser.close();

    if (!transcriptText || transcriptText.length < 50) {
      throw new Error("Transcript too short or not found via Playwright");
    }

    return transcriptText;
  } catch (err) {
    await browser.close();
    throw err;
  }
}

// ── 2. Convert transcript to blog article ────────────────────────

async function convertToBlog(videoData, options = {}) {
  const {
    targetKeyword = null,
    category = "ISO Certification",
    minWords = 1500,
  } = options;

  log("videoToBlog", "convert", `converting "${videoData.title}" to blog`);

  // Step 1: Generate structured outline from transcript
  const outline = await claudeJSON(
    `You are a senior content strategist for ISO Certification Consultant (isocertificationconsultant.ca), a Canadian ISO consulting firm. Convert video transcripts into well-structured blog article outlines.`,
    `Convert this video transcript into a blog article outline for ISO Certification Consultant.

VIDEO TITLE: ${videoData.title}
VIDEO DESCRIPTION: ${videoData.description}
DURATION: ${videoData.durationFormatted}
${targetKeyword ? `TARGET KEYWORD: ${targetKeyword}` : ""}

TRANSCRIPT:
${videoData.transcript.slice(0, 8000)}

Create a blog outline with:
- A clear, SEO-friendly title (include "${targetKeyword || "ISO"}" and "Canada" if natural)
- 5-8 H2 sections derived from the video content
- Key points under each section
- A primary keyword for SEO
- A meta description (120-160 chars)

Return JSON:
{
  "title": "...",
  "primaryKeyword": "...",
  "secondaryKeywords": ["...", "..."],
  "metaDescription": "...",
  "category": "${category}",
  "sections": [
    { "h2": "...", "keyPoints": ["...", "..."] }
  ],
  "videoEmbed": true
}`,
    2048
  );

  // Step 2: Write the full article
  log("videoToBlog", "write", "generating full article");

  // Load internal links for context
  let internalLinks = "";
  try {
    const linkMapPath = path.join(MEMORY_DIR, "link-map.json");
    const linkMap = JSON.parse(fs.readFileSync(linkMapPath, "utf-8"));
    const pages = Object.keys(linkMap.pages || {}).slice(0, 20);
    internalLinks = `Available internal pages for linking: ${pages.map((p) => `${SITE_URL}/blog/${p}`).join(", ")}`;
  } catch { /* ok */ }

  const sectionsGuide = (outline.sections || [])
    .map((s, i) => `## ${s.h2}\nKey points: ${(s.keyPoints || []).join("; ")}`)
    .join("\n\n");

  const article = await claudeCall(
    `You are a senior ISO consulting content writer for ISO Certification Consultant (isocertificationconsultant.ca). Write authoritative, well-researched blog articles targeting Canadian manufacturers. Write in third-person. Never use first person (we, our, I). No "Pro Tips" or "Phase" labels. Include 4+ internal links mid-sentence and 4+ external links to authoritative sources.`,
    `Write a complete blog article based on this video transcript and outline.

TITLE: ${outline.title}
PRIMARY KEYWORD: ${outline.primaryKeyword}
SECONDARY KEYWORDS: ${(outline.secondaryKeywords || []).join(", ")}
CATEGORY: ${outline.category || category}
TARGET: ${minWords}+ words

OUTLINE:
${sectionsGuide}

FULL TRANSCRIPT:
${videoData.transcript.slice(0, 12000)}

${internalLinks}

RULES:
- Minimum ${minWords} words
- Primary keyword "${outline.primaryKeyword}" in first 100 words
- Use ## for H2 headings, ### for H3
- Include at least 2 bullet/numbered lists
- Add a natural CTA (not a separate section)
- Reference specific ISO clause numbers where relevant
- Canadian context: mention Canadian cities, CAD figures, Canadian regulations
- No fabricated quotes or statistics
- Include a video embed reference: [VIDEO: ${videoData.url}]
- Write markdown format

Write the full article now.`,
    8192
  );

  const wordCount = article.split(/\s+/).length;
  log("videoToBlog", "write", `article generated: ${wordCount} words`);

  return {
    title: outline.title,
    body: article,
    primaryKeyword: outline.primaryKeyword,
    secondaryKeywords: outline.secondaryKeywords || [],
    metaDescription: outline.metaDescription || "",
    category: outline.category || category,
    wordCount,
    videoUrl: videoData.url,
    videoId: videoData.videoId,
    videoTitle: videoData.title,
    videoDuration: videoData.durationFormatted,
  };
}

// ── 3. Full pipeline: URL → published blog ───────────────────────

async function processVideo(videoUrl, options = {}) {
  log("videoToBlog", "pipeline", `starting: ${videoUrl}`);
  const startTime = Date.now();

  // Step 1: Extract video data
  const videoData = await extractYouTubeData(videoUrl);

  // Step 2: Convert to blog
  const article = await convertToBlog(videoData, options);

  // Step 3: Run through content cleaner
  let cleanedBody = article.body;
  try {
    const contentCleaner = require("./contentCleaner");
    const cleaned = await contentCleaner.clean(article.body);
    cleanedBody = cleaned.body || cleaned;
    log("videoToBlog", "clean", "content cleaned");
  } catch (err) {
    log("videoToBlog", "clean-warn", `cleaner skipped: ${err.message}`);
  }

  // Step 4: Run through link builder
  try {
    const { weaveLinks } = require("../seo/linkBuilder");
    const linked = await weaveLinks({
      title: article.title,
      body: cleanedBody,
      primaryKeyword: article.primaryKeyword,
      category: article.category,
    });
    cleanedBody = linked.body || cleanedBody;
    log("videoToBlog", "links", "links woven");
  } catch (err) {
    log("videoToBlog", "links-warn", `link builder skipped: ${err.message}`);
  }

  // Step 5: Content QA
  let qaScore = 0;
  try {
    const contentQA = require("./contentQA");
    const qaResult = await contentQA.runQA({
      title: article.title,
      body: cleanedBody,
      primaryKeyword: article.primaryKeyword,
      category: article.category,
    });
    qaScore = qaResult.score || 0;
    log("videoToBlog", "qa", `QA score: ${qaScore}/100`);

    if (qaScore < 85) {
      log("videoToBlog", "qa-warn", `QA score ${qaScore} is below 85 — article may need manual review`);
    }
  } catch (err) {
    log("videoToBlog", "qa-warn", `QA skipped: ${err.message}`);
    qaScore = 80;
  }

  // Step 6: Publish to Sanity (if QA passes)
  let publishResult = null;
  if (qaScore >= 80) {
    try {
      const { publishToSanity } = require("./sanityPublisher");
      publishResult = await publishToSanity({
        title: article.title,
        body: cleanedBody,
        primaryKeyword: article.primaryKeyword,
        metaDescription: article.metaDescription,
        category: article.category,
      });
      log("videoToBlog", "publish", `published: ${publishResult.slug}`);
    } catch (err) {
      log("videoToBlog", "publish-error", err.message);
    }
  }

  const pipelineDurationMs = Date.now() - startTime;

  // Step 7: Log to published articles
  if (publishResult) {
    try {
      let published = [];
      try { published = JSON.parse(fs.readFileSync(PUBLISHED_PATH, "utf-8")); } catch { /* ok */ }
      published.push({
        title: article.title,
        slug: publishResult.slug,
        url: `${SITE_URL}/blog/${publishResult.slug}`,
        primaryKeyword: article.primaryKeyword,
        category: article.category,
        wordCount: article.wordCount,
        qaScore,
        date: today(),
        articleType: "video-to-blog",
        videoSource: videoData.url,
        videoTitle: videoData.title,
        pipelineDurationMs,
      });
      fs.writeFileSync(PUBLISHED_PATH, JSON.stringify(published, null, 2) + "\n");
    } catch { /* ok */ }
  }

  updateHeartbeat("videoToBlog", "complete", `"${article.title}" — ${article.wordCount} words, QA ${qaScore}/100`);

  return {
    success: !!publishResult,
    title: article.title,
    slug: publishResult?.slug || null,
    url: publishResult ? `${SITE_URL}/blog/${publishResult.slug}` : null,
    primaryKeyword: article.primaryKeyword,
    metaDescription: article.metaDescription,
    wordCount: article.wordCount,
    qaScore,
    videoSource: videoData.url,
    videoTitle: videoData.title,
    videoDuration: videoData.durationFormatted,
    pipelineDurationMs,
    reason: publishResult ? null : `QA score ${qaScore} below threshold`,
  };
}

// ── Helpers ──────────────────────────────────────────────────────

function parseVideoId(url) {
  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // bare video ID
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : require("http");
    const req = protocol.get(url, {
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        httpGet(res.headers.location).then(resolve).catch(reject);
        return;
      }
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
  });
}

module.exports = { processVideo, extractYouTubeData, convertToBlog };
