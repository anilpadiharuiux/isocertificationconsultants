const fs = require("fs");
const path = require("path");
const { log } = require("../shared/logger");
const { updateHeartbeat } = require("../shared/heartbeat");
const { MEMORY_DIR } = require("../shared/config");
const { generateFeaturedImage, IMAGES_DIR } = require("../../utils/gemini");

const { filterPexelsPhotos, registerImage, pickRandom } = require("../shared/imageRegistry");
const LOG_PATH = path.join(MEMORY_DIR, "image-log.json");

// ── Scene detection from article title ───────────────────

const SCENES = [
  {
    id: "quality",
    keywords: ["iso 9001", "quality management", "qms", "quality system", "quality control"],
    prompt: "A photorealistic, cinematic photograph of a modern North American manufacturing floor with quality inspectors reviewing products under bright LED lighting. Clean factory environment with stainless steel equipment. Professional corporate photography style. Shallow depth of field. Natural lighting. High resolution. No text, no labels, no overlays, no watermarks, no words of any kind in the image.",
  },
  {
    id: "environmental",
    keywords: ["iso 14001", "environmental", "ems", "sustainability", "green"],
    prompt: "A photorealistic, cinematic photograph of a modern sustainable industrial facility surrounded by green landscaping, solar panels on the roof, with a clear blue sky. North American industrial park setting. Professional corporate photography style. Shallow depth of field. Natural lighting. High resolution. No text, no labels, no overlays, no watermarks, no words of any kind in the image.",
  },
  {
    id: "safety",
    keywords: ["iso 45001", "safety", "occupational health", "workplace safety", "ohs"],
    prompt: "A photorealistic, cinematic photograph of North American industrial workers wearing proper safety equipment — hard hats, safety glasses, high-visibility vests — in a well-organized manufacturing environment. Professional corporate photography style. Shallow depth of field. Natural lighting. High resolution. No text, no labels, no overlays, no watermarks, no words of any kind in the image.",
  },
  {
    id: "medical",
    keywords: ["iso 13485", "medical device", "medical", "healthcare", "pharmaceutical"],
    prompt: "A photorealistic, cinematic photograph of a cleanroom medical device manufacturing facility with technicians in white lab coats and hairnets working with precision instruments. Sterile, modern environment. Professional corporate photography style. Shallow depth of field. Natural lighting. High resolution. No text, no labels, no overlays, no watermarks, no words of any kind in the image.",
  },
  {
    id: "automotive",
    keywords: ["iatf 16949", "automotive", "tier 1", "tier 2", "auto parts"],
    prompt: "A photorealistic, cinematic photograph of a modern North American automotive assembly line with robotic arms and precision machinery producing vehicle components. Clean, high-tech factory floor. Professional corporate photography style. Shallow depth of field. Natural lighting. High resolution. No text, no labels, no overlays, no watermarks, no words of any kind in the image.",
  },
  {
    id: "audit",
    keywords: ["audit", "certification audit", "surveillance audit", "registrar", "accreditation"],
    prompt: "A photorealistic, cinematic photograph of a quality auditor with a clipboard and safety vest inspecting precision equipment on a clean, well-lit North American manufacturing floor. Stainless steel machinery and organized workstations visible in the background. Professional corporate photography style. Shallow depth of field. Natural lighting. High resolution. No text, no labels, no overlays, no watermarks, no words of any kind in the image.",
  },
  {
    id: "consultant",
    keywords: ["consultant", "consulting", "implementation", "advisor", "expert"],
    prompt: "A photorealistic, cinematic photograph of two professionals in hard hats and safety vests walking through a modern North American manufacturing facility, reviewing a process on the production floor. Clean industrial environment with machinery and organized workstations. Professional corporate photography style. Shallow depth of field. Natural lighting. High resolution. No text, no labels, no overlays, no watermarks, no words of any kind in the image.",
  },
  {
    id: "manufacturing",
    keywords: ["manufacturing", "production", "factory", "industrial", "lean", "six sigma"],
    prompt: "A photorealistic, cinematic photograph of a modern North American manufacturing facility interior with CNC machines, organized workstations, and bright overhead lighting. Clean and efficient production environment. Professional corporate photography style. Shallow depth of field. Natural lighting. High resolution. No text, no labels, no overlays, no watermarks, no words of any kind in the image.",
  },
];

const DEFAULT_PROMPT = "A photorealistic, cinematic photograph of a modern North American manufacturing facility with quality control inspectors examining products on a production line. Clean industrial environment with stainless steel equipment and bright overhead lighting. Professional corporate photography style. Shallow depth of field. Natural lighting. High resolution. No text, no labels, no overlays, no watermarks, no words of any kind in the image.";

function detectScene(title) {
  const lower = title.toLowerCase();
  for (const scene of SCENES) {
    if (scene.keywords.some((kw) => lower.includes(kw))) {
      return scene;
    }
  }
  return { id: "default", prompt: DEFAULT_PROMPT };
}

// ── Decide if article needs image ────────────────────────

const SKIP_PATTERNS = [
  /news|update|announcement/i,
  /opinion|thought leadership/i,
  /faq/i,
];

function shouldGenerate(article) {
  if (article.wordCount && article.wordCount < 800) return false;
  const title = (article.title || "").toLowerCase();
  if (SKIP_PATTERNS.some((p) => p.test(title))) return false;
  return true;
}

// ── Pexels duplicate prevention ──────────────────────────

function getRecentPexelsUrls(limit = 20) {
  try {
    const entries = JSON.parse(fs.readFileSync(LOG_PATH, "utf-8"));
    return entries
      .filter((e) => e.type === "pexels" && e.url)
      .slice(-limit)
      .map((e) => e.url);
  } catch {
    return [];
  }
}

function getRecentPexelsPhotographers(limit = 20) {
  try {
    const published = JSON.parse(
      fs.readFileSync(path.join(MEMORY_DIR, "published-articles.json"), "utf-8")
    );
    return published
      .slice(-limit)
      .filter((a) => a.image?.source === "pexels")
      .map((a) => a.image.photographer);
  } catch {
    return [];
  }
}

// ── Pexels keyword extraction with variations ────────────

const STOP_WORDS = new Set([
  "iso", "how", "to", "a", "the", "for", "and", "or", "in", "of",
  "with", "what", "why", "guide", "complete", "your", "steps",
  "9001", "14001", "45001", "13485", "2026", "2025", "canada",
  "canadian", "certification", "certified", "find", "top", "rated",
  "best", "experts",
]);

function extractKeywords(title) {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  return words.slice(0, 3).join(" ");
}

function getSearchVariations(title, scene) {
  const base = extractKeywords(title);
  const variations = [];

  // Variation 1: article keywords + manufacturing context
  if (base) variations.push(`${base} manufacturing industrial`);

  // Variation 2: scene-based query — HARD RULE: manufacturing/industrial ONLY, no office photos
  const sceneQueries = {
    quality: "North American quality inspection manufacturing",
    environmental: "North American environmental sustainability industrial facility",
    safety: "North American workplace safety manufacturing factory",
    medical: "North American medical device cleanroom manufacturing",
    automotive: "North American automotive factory assembly production",
    audit: "North American quality inspector factory floor equipment",
    consultant: "North American manufacturing plant industrial walkthrough",
    manufacturing: "North American modern manufacturing factory production",
    default: "North American manufacturing quality inspection industrial",
  };
  variations.push(sceneQueries[scene.id] || sceneQueries.default);

  // Variation 3: broader fallback — still manufacturing-focused
  if (base) variations.push(`${base} factory industrial`);
  else variations.push("North American industrial manufacturing facility");

  return variations;
}

// ── Logging ──────────────────────────────────────────────

function logImage(slug, type, reason, extras = {}) {
  let entries = [];
  try {
    entries = JSON.parse(fs.readFileSync(LOG_PATH, "utf-8"));
  } catch { /* ok */ }
  entries.push({
    date: new Date().toISOString().slice(0, 10),
    slug,
    type,
    reason,
    ...extras,
  });
  fs.writeFileSync(LOG_PATH, JSON.stringify(entries, null, 2) + "\n");
}

function getLog(limit = 10) {
  try {
    const entries = JSON.parse(fs.readFileSync(LOG_PATH, "utf-8"));
    return entries.slice(-limit);
  } catch {
    return [];
  }
}

function getStats() {
  try {
    const entries = JSON.parse(fs.readFileSync(LOG_PATH, "utf-8"));
    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthly = entries.filter((e) => e.date.startsWith(thisMonth));
    return {
      total: monthly.length,
      gemini: monthly.filter((e) => e.type === "gemini").length,
      pexels: monthly.filter((e) => e.type === "pexels").length,
      none: monthly.filter((e) => e.type === "none" || e.type === "skipped").length,
    };
  } catch {
    return { total: 0, gemini: 0, pexels: 0, none: 0 };
  }
}

// ── Main: 3-level fallback chain ─────────────────────────

async function getArticleImage(article, slug) {
  log("infographicAgent", "start", `evaluating "${article.title}"`);

  if (!shouldGenerate(article)) {
    log("infographicAgent", "skip", `not needed for "${article.title}"`);
    logImage(slug, "skipped", "skipped_not_needed");
    updateHeartbeat("infographicAgent", "skipped", `skipped — ${slug}`);
    return { type: "skipped", data: null };
  }

  const scene = detectScene(article.title);
  log("infographicAgent", "scene", `detected: ${scene.id}`);

  // ── LEVEL 1: Gemini Photorealistic Image ──
  // Add article-specific variation to the prompt so same-category articles produce unique images
  const variationSuffix = ` The scene specifically relates to: ${article.title}. Unique composition — different camera angle, lighting, and subject arrangement from any prior image.`;
  const variedPrompt = scene.prompt.replace(
    /No text, no labels/,
    `The setting should visually suggest "${article.primaryKeyword}". No text, no labels`
  ) + variationSuffix;

  try {
    log("infographicAgent", "gemini", `generating ${scene.id} photo (varied for "${article.primaryKeyword}")`);
    const result = await generateFeaturedImage(variedPrompt, `${slug}-featured.png`);

    if (result.success) {
      log("infographicAgent", "success", `Gemini photo generated for ${slug} (${result.sizeKB}KB)`);
      logImage(slug, "gemini", "success", { scene: scene.id, sizeKB: result.sizeKB });
      updateHeartbeat("infographicAgent", "success", `${scene.id} photo for ${slug}`);
      return { type: "gemini", data: result };
    }

    if (result.isQuotaError) {
      log("infographicAgent", "quota", `Gemini quota hit — falling back to Pexels`);
      logImage(slug, "pexels", "gemini_quota", { scene: scene.id });
    } else {
      log("infographicAgent", "error", `Gemini error: ${result.error} — falling back to Pexels`);
      logImage(slug, "pexels", "gemini_error", { scene: scene.id });
    }
  } catch (err) {
    log("infographicAgent", "error", `Gemini exception: ${err.message}`);
    logImage(slug, "pexels", "gemini_exception", { scene: scene.id });
  }

  // ── LEVEL 2: Pexels Photo Fallback (with global duplicate prevention) ──
  try {
    const { searchPexels } = require("./imageAgent");
    const variations = getSearchVariations(article.title, scene);

    for (const query of variations) {
      log("infographicAgent", "pexels", `searching: "${query}"`);
      const photos = await searchPexels(query);

      if (photos && photos.length > 0) {
        // Filter out any photo whose ID, URL, or photographer was ever used before
        const unique = filterPexelsPhotos(photos);

        if (unique.length === 0) {
          log("infographicAgent", "pexels", `all ${photos.length} photos already used for query "${query}" — trying next variation`);
          continue; // Do NOT fall back to a known duplicate — try next query
        }

        const pick = pickRandom(unique);
        const url = pick.src.landscape || pick.src.large;
        log("infographicAgent", "pexels", `photo found: ${pick.photographer} (${unique.length} unique of ${photos.length})`);

        // Register in global registry with Pexels photo ID
        registerImage({ url, photographer: pick.photographer, photoId: pick.id, slug, type: "featured", source: "pexels" });
        logImage(slug, "pexels", "success", { scene: scene.id, url, photographer: pick.photographer, pexelsId: pick.id });
        updateHeartbeat("infographicAgent", "pexels", `pexels for ${slug}`);
        return {
          type: "pexels",
          data: {
            url,
            photographer: pick.photographer,
            photographerUrl: pick.photographer_url,
            pexelsId: pick.id,
          },
        };
      }
    }

    log("infographicAgent", "pexels", "no results from any variation");
  } catch (err) {
    log("infographicAgent", "error", `Pexels failed: ${err.message}`);
  }

  // ── LEVEL 3: No Image — Publish Clean ──
  log("infographicAgent", "none", `no image available — ${slug} will publish without`);
  logImage(slug, "none", "both_failed", { scene: scene.id });
  updateHeartbeat("infographicAgent", "no_image", `no image for ${slug}`);
  return { type: "none", data: null };
}

// ── Test function for pm.js ──────────────────────────────

async function testGenerate() {
  const testArticle = {
    title: "ISO 9001 Certification Process: A Step-by-Step Guide",
    primaryKeyword: "iso 9001 certification process",
    category: "ISO 9001",
    wordCount: 1500,
    body: "ISO 9001 certification involves a structured process.",
  };

  log("infographicAgent", "test", "running image generation test");

  // Test scene detection for all types
  const testTitles = [
    "ISO 9001 Quality Management System Guide",
    "ISO 14001 Environmental Management for Manufacturers",
    "ISO 45001 Workplace Safety Certification",
    "ISO 13485 Medical Device Quality",
    "IATF 16949 Automotive Supplier Certification",
    "Internal Audit Preparation Checklist",
    "Hiring an ISO Consultant in Ontario",
    "Lean Manufacturing Best Practices",
    "Generic Business Title Without Keywords",
  ];

  console.log("\n  Scene Detection Results:");
  for (const title of testTitles) {
    const scene = detectScene(title);
    console.log(`    ${scene.id.padEnd(15)} ← ${title}`);
  }

  // Generate actual image
  console.log("\n  Generating test image...");
  const result = await getArticleImage(testArticle, "test");
  return result;
}

module.exports = { getArticleImage, testGenerate, getLog, getStats, extractKeywords, detectScene };
