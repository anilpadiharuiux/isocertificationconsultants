const fs = require("fs");
const path = require("path");
const https = require("https");
const { log } = require("../shared/logger");
const { updateHeartbeat } = require("../shared/heartbeat");
const { MEMORY_DIR, SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_TOKEN } = require("../shared/config");
const { generateFeaturedImage } = require("../../utils/gemini");

const { filterPexelsPhotos, registerImage, pickRandom } = require("../shared/imageRegistry");
const MAX_INLINE_IMAGES = 4;
const IMAGE_MARKER_REGEX = /^\[IMAGE:\s*(.+?)\]$/;
const LOG_PATH = path.join(MEMORY_DIR, "inline-image-log.json");

// ── Scene prompts for inline images ──────────────────────

function buildInlinePrompt(query, articleTitle) {
  const lower = (query + " " + articleTitle).toLowerCase();

  // HARD RULE: All scenes must be manufacturing/industrial — NO office, boardroom, or desk photos
  if (/document|paperwork|manual|binder|review/.test(lower)) {
    return "A photorealistic photograph of a quality control supervisor reviewing a checklist next to a production line in a modern North American manufacturing facility. Clean factory floor with machinery visible. Shallow depth of field. Natural lighting. No text, no labels, no overlays, no watermarks, no words of any kind in the image.";
  }
  if (/meeting|team|consult|proposal|budget/.test(lower)) {
    return "A photorealistic photograph of two engineers in hard hats and safety vests discussing operations on a modern North American manufacturing floor, with production equipment and organized workstations behind them. Shallow depth of field. Natural lighting. No text, no labels, no overlays, no watermarks, no words of any kind in the image.";
  }
  if (/factory|manufactur|assembly|production|plant/.test(lower)) {
    return "A photorealistic photograph of a modern North American manufacturing facility with organized workstations, machinery, and workers in safety equipment. Clean industrial environment. Natural lighting. Shallow depth of field. No text, no labels, no overlays, no watermarks, no words of any kind in the image.";
  }
  if (/medical|cleanroom|device|health|pharma/.test(lower)) {
    return "A photorealistic photograph of a modern medical device manufacturing cleanroom with technicians in white coats examining precision equipment. Sterile, bright environment. Shallow depth of field. No text, no labels, no overlays, no watermarks, no words of any kind in the image.";
  }
  if (/auto|vehicle|car|tier/.test(lower)) {
    return "A photorealistic photograph of a modern North American automotive parts production line with robotic arms and quality inspection stations. High-tech factory floor. Shallow depth of field. No text, no labels, no overlays, no watermarks, no words of any kind in the image.";
  }
  if (/audit|inspect|checklist|compliance/.test(lower)) {
    return "A photorealistic photograph of a quality auditor with a clipboard inspecting equipment in a clean manufacturing facility. Professional setting, focused expression. Shallow depth of field. No text, no labels, no overlays, no watermarks, no words of any kind in the image.";
  }
  if (/train|workshop|certif|learn/.test(lower)) {
    return "A photorealistic photograph of an instructor demonstrating proper machine operation to a small group of workers wearing safety gear on a manufacturing floor. Bright industrial lighting, engaged learners. Shallow depth of field. No text, no labels, no overlays, no watermarks, no words of any kind in the image.";
  }
  if (/safety|ppe|hard hat|workplace/.test(lower)) {
    return "A photorealistic photograph of industrial workers wearing proper PPE — hard hats, safety vests, glasses — walking through a well-organized manufacturing facility. Clean, safe environment. Shallow depth of field. No text, no labels, no overlays, no watermarks, no words of any kind in the image.";
  }
  if (/environment|sustain|green|solar|waste/.test(lower)) {
    return "A photorealistic photograph of a modern industrial facility with green landscaping and energy-efficient features, surrounded by blue sky. Sustainable industrial park setting. Shallow depth of field. No text, no labels, no overlays, no watermarks, no words of any kind in the image.";
  }
  if (/export|global|international|trade/.test(lower)) {
    return "A photorealistic photograph of a busy shipping dock with containers and logistics operations at a North American port facility. Clear sky, organized operations. Shallow depth of field. No text, no labels, no overlays, no watermarks, no words of any kind in the image.";
  }
  if (/cost|price|budget|invest|roi/.test(lower)) {
    return "A photorealistic photograph of a manufacturing plant manager reviewing production metrics on a tablet while standing next to a CNC machine on a clean factory floor. Bright industrial lighting. Shallow depth of field. No text, no labels, no overlays, no watermarks, no words of any kind in the image.";
  }
  if (/small business|entrepreneur|owner|startup/.test(lower)) {
    return "A photorealistic photograph of a small business owner confidently standing in their modern manufacturing workshop, arms crossed, with organized machinery and workstations behind them. Bright industrial lighting. Shallow depth of field. No text, no labels, no overlays, no watermarks, no words of any kind in the image.";
  }

  // Default: manufacturing/industrial scene
  return "A photorealistic photograph of a modern North American manufacturing facility interior with organized production lines, stainless steel equipment, and workers in safety gear. Clean industrial environment with bright overhead lighting. Shallow depth of field. No text, no labels, no overlays, no watermarks, no words of any kind in the image.";
}

// ── Upload to Sanity ─────────────────────────────────────

function uploadToSanity(imageBuffer, filename) {
  return new Promise((resolve, reject) => {
    const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/assets/images/${SANITY_DATASET}?filename=${encodeURIComponent(filename)}`;
    const urlObj = new URL(url);
    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: "POST",
      headers: {
        Authorization: `Bearer ${SANITY_API_TOKEN}`,
        "Content-Type": "image/png",
        "Content-Length": imageBuffer.length,
      },
      timeout: 60000,
    }, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode === 200 || res.statusCode === 201) {
            resolve(parsed.document);
          } else {
            reject(new Error(`Sanity upload ${res.statusCode}: ${body.slice(0, 200)}`));
          }
        } catch {
          reject(new Error(`Sanity response parse error: ${body.slice(0, 200)}`));
        }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Upload timeout")); });
    req.write(imageBuffer);
    req.end();
  });
}

// ── Extract [IMAGE:] markers from article body ───────────

function extractMarkers(body) {
  const lines = body.split("\n");
  const markers = [];

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].trim().match(IMAGE_MARKER_REGEX);
    if (match) {
      // Find the H2 heading above this marker for context
      let context = "";
      for (let j = i - 1; j >= 0; j--) {
        if (lines[j].startsWith("## ")) {
          context = lines[j].replace(/^##\s+/, "").trim();
          break;
        }
      }
      markers.push({
        lineIndex: i,
        query: match[1].trim(),
        context,
        originalLine: lines[i],
      });
    }
  }

  return markers;
}

// ── Logging ──────────────────────────────────────────────

function logInlineImages(slug, images) {
  let entries = [];
  try { entries = JSON.parse(fs.readFileSync(LOG_PATH, "utf-8")); } catch { /* ok */ }
  entries.push({
    date: new Date().toISOString().slice(0, 10),
    slug,
    count: images.length,
    images: images.map((img) => ({ scene: img.query.slice(0, 50), source: img.source, sizeKB: img.sizeKB || 0 })),
  });
  fs.writeFileSync(LOG_PATH, JSON.stringify(entries, null, 2) + "\n");
}

// ── Main: Process article body and replace markers ───────

async function processInlineImages(article, slug) {
  log("inlineImageAgent", "start", `processing "${article.title}"`);

  const markers = extractMarkers(article.body);
  if (markers.length === 0) {
    log("inlineImageAgent", "skip", "no [IMAGE:] markers found");
    updateHeartbeat("inlineImageAgent", "skipped", "no markers");
    return { body: article.body, count: 0, images: [] };
  }

  // Limit to MAX_INLINE_IMAGES
  const toProcess = markers.slice(0, MAX_INLINE_IMAGES);
  log("inlineImageAgent", "found", `${markers.length} markers, processing ${toProcess.length}`);

  const lines = article.body.split("\n");
  const results = [];

  for (let idx = 0; idx < toProcess.length; idx++) {
    const marker = toProcess[idx];
    const imageNum = idx + 1;
    const filename = `${slug}-inline-${imageNum}.png`;

    log("inlineImageAgent", `image-${imageNum}`, `generating: "${marker.query.slice(0, 60)}"`);

    // Level 1: Gemini
    try {
      const prompt = buildInlinePrompt(marker.query, article.title);
      const result = await generateFeaturedImage(prompt, filename);

      if (result.success) {
        // Upload to Sanity
        const imageBuffer = fs.readFileSync(result.path);
        const asset = await uploadToSanity(imageBuffer, filename);
        const altText = marker.context || marker.query;

        lines[marker.lineIndex] = `[SANITY_IMAGE: ${asset._id} | ${altText}]`;
        registerImage({ assetId: asset._id, slug, type: "inline", source: "gemini" });
        results.push({ source: "gemini", query: marker.query, assetId: asset._id, sizeKB: result.sizeKB });
        log("inlineImageAgent", `image-${imageNum}`, `Gemini OK (${result.sizeKB}KB) — ${asset._id}`);
        continue;
      }

      if (result.isQuotaError) {
        log("inlineImageAgent", `image-${imageNum}`, "Gemini quota — trying Pexels");
      } else {
        log("inlineImageAgent", `image-${imageNum}`, `Gemini error: ${result.error} — trying Pexels`);
      }
    } catch (err) {
      log("inlineImageAgent", `image-${imageNum}`, `Gemini exception: ${err.message}`);
    }

    // Level 2: Pexels fallback (with global duplicate prevention)
    try {
      const { searchPexels } = require("./imageAgent");
      const pexelsQuery = marker.query.split(" ").slice(0, 4).join(" ") + " professional";
      const photos = await searchPexels(pexelsQuery);

      if (photos && photos.length > 0) {
        // Filter out any photo already used anywhere on the site
        const unique = filterPexelsPhotos(photos);
        if (unique.length === 0) {
          log("inlineImageAgent", `image-${imageNum}`, "all Pexels photos already used — skipping");
          throw new Error("all photos exhausted");
        }
        const pick = pickRandom(unique);
        const photoUrl = pick.src.landscape || pick.src.large;

        // Download and upload to Sanity
        const imgRes = await new Promise((resolve, reject) => {
          https.get(photoUrl, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
              https.get(res.headers.location, (res2) => {
                const chunks = []; res2.on("data", (c) => chunks.push(c));
                res2.on("end", () => resolve(Buffer.concat(chunks)));
              }).on("error", reject);
            } else {
              const chunks = []; res.on("data", (c) => chunks.push(c));
              res.on("end", () => resolve(Buffer.concat(chunks)));
            }
          }).on("error", reject);
        });

        const asset = await uploadToSanity(imgRes, `${slug}-inline-${imageNum}.jpg`);
        const altText = marker.context || marker.query;

        lines[marker.lineIndex] = `[SANITY_IMAGE: ${asset._id} | ${altText}]`;
        registerImage({ assetId: asset._id, url: photoUrl, photographer: pick.photographer, photoId: pick.id, slug, type: "inline", source: "pexels" });
        results.push({ source: "pexels", query: marker.query, assetId: asset._id, sizeKB: Math.round(imgRes.length / 1024) });
        log("inlineImageAgent", `image-${imageNum}`, `Pexels OK — ${pick.photographer}`);
        continue;
      }
    } catch (err) {
      log("inlineImageAgent", `image-${imageNum}`, `Pexels failed: ${err.message}`);
    }

    // Level 3: Remove marker (no image)
    lines[marker.lineIndex] = "";
    results.push({ source: "none", query: marker.query });
    log("inlineImageAgent", `image-${imageNum}`, "both failed — removing marker");
  }

  // Remove any remaining unprocessed [IMAGE:] markers beyond MAX_INLINE_IMAGES
  for (let i = MAX_INLINE_IMAGES; i < markers.length; i++) {
    lines[markers[i].lineIndex] = "";
  }

  const successCount = results.filter((r) => r.source !== "none").length;
  log("inlineImageAgent", "complete", `${successCount}/${toProcess.length} images placed`);
  logInlineImages(slug, results);
  updateHeartbeat("inlineImageAgent", "complete", `${successCount} images for ${slug}`);

  return {
    body: lines.join("\n"),
    count: successCount,
    images: results,
  };
}

// ── Test function ────────────────────────────────────────

async function testInlineImages() {
  const testBody = `Opening paragraph about ISO certification for small businesses in Canada.

## Why Small Businesses Need ISO Certification

ISO 9001 is the gold standard for quality management. Small businesses benefit from structured processes.

[IMAGE: small business owner reviewing quality management documents Canada office]

## The Certification Process

The certification process involves several key steps that every business must follow.

[IMAGE: quality audit inspection manufacturing facility Canada]

## Cost and Timeline

Understanding the investment required helps businesses plan effectively.

[IMAGE: business professional analyzing financial charts budget office]

## Getting Started

Contact a certified ISO consultant to begin your journey.

[IMAGE: business meeting consultant reviewing proposal modern office]`;

  const testArticle = {
    title: "ISO Certification for Small Business Canada",
    body: testBody,
  };

  log("inlineImageAgent", "test", "running inline image test");
  const result = await processInlineImages(testArticle, "test-inline");
  return result;
}

module.exports = { processInlineImages, testInlineImages, extractMarkers };
