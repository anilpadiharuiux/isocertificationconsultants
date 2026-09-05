const fs = require("fs");
const path = require("path");
const { log } = require("../shared/logger");
const { MEMORY_DIR } = require("../shared/config");
const { fetchAllSanity } = require("../shared/sanity");

const LINK_BANK_PATH = path.join(__dirname, "../../data/external-link-bank.json");
const LINK_MAP_PATH = path.join(MEMORY_DIR, "link-map.json");
const PUBLISHED_PATH = path.join(MEMORY_DIR, "published-articles.json");

/**
 * Detects which industry an article keyword belongs to.
 * Returns an array of relevant industry keys from the link bank.
 */
function detectIndustries(keyword) {
  const kw = keyword.toLowerCase();
  const industries = [];

  if (kw.includes("automotive") || kw.includes("iatf") || kw.includes("16949")) industries.push("automotive");
  if (kw.includes("aerospace") || kw.includes("as9100") || kw.includes("as 9100")) industries.push("aerospace");
  if (kw.includes("food") || kw.includes("22000") || kw.includes("haccp")) industries.push("food_beverage");
  if (kw.includes("medical") || kw.includes("13485") || kw.includes("device")) industries.push("healthcare_medical");
  if (kw.includes("construction") || kw.includes("contractor")) industries.push("construction");
  if (kw.includes("oil") || kw.includes("gas") || kw.includes("energy") || kw.includes("pipeline")) industries.push("oil_gas_energy");
  if (kw.includes("mining") || kw.includes("mineral")) industries.push("mining");
  if (kw.includes("14001") || kw.includes("environmental")) industries.push("environmental");
  if (kw.includes("27001") || kw.includes("information security") || kw.includes("cyber")) industries.push("information_security");
  if (kw.includes("9001") || kw.includes("quality") || kw.includes("audit") || kw.includes("certification")) industries.push("general_quality");

  // Always include manufacturing as base
  if (!industries.includes("manufacturing")) industries.push("manufacturing");
  // Always include general quality
  if (!industries.includes("general_quality")) industries.push("general_quality");

  return industries;
}

/**
 * Loads all external URLs already used across published articles.
 * Returns a Set of URLs that should NOT be reused.
 */
function loadUsedExternalUrls() {
  const used = new Set();

  // From link-map.json
  try {
    const linkMap = JSON.parse(fs.readFileSync(LINK_MAP_PATH, "utf-8"));
    for (const page of Object.values(linkMap.pages || {})) {
      for (const link of page.linksOut || []) {
        if (link.type === "external" && link.url) {
          used.add(link.url.replace(/\/$/, "")); // normalize trailing slash
        }
      }
    }
  } catch { /* ok if missing */ }

  return used;
}

/**
 * Loads existing blog post slugs from Sanity for internal linking.
 * Returns array of { title, url } objects.
 */
async function loadExistingBlogPosts() {
  try {
    const posts = await fetchAllSanity("blogPost");
    return posts
      .filter((p) => p.slug?.current && p.title)
      .map((p) => ({ title: p.title, url: `/blog/${p.slug.current}` }))
      .slice(0, 30);
  } catch {
    // Fallback: read from published-articles.json
    try {
      const published = JSON.parse(fs.readFileSync(PUBLISHED_PATH, "utf-8"));
      return published
        .filter((p) => p.slug && p.title)
        .map((p) => ({ title: p.title, url: `/blog/${p.slug}` }))
        .slice(-30);
    } catch {
      return [];
    }
  }
}

/**
 * Selects external links for the writer from the link bank.
 * Returns 6-8 links relevant to the article's industry that haven't been used before.
 */
function selectExternalLinks(keyword, usedUrls) {
  let linkBank;
  try {
    linkBank = JSON.parse(fs.readFileSync(LINK_BANK_PATH, "utf-8"));
  } catch {
    log("contextLoader", "warn", "external-link-bank.json not found");
    return [];
  }

  const industries = detectIndustries(keyword);
  const available = [];

  for (const industry of industries) {
    const links = linkBank.industries[industry] || [];
    for (const link of links) {
      const normalized = link.url.replace(/\/$/, "");
      if (!usedUrls.has(normalized)) {
        available.push({ ...link, industry });
      }
    }
  }

  // Prioritize industry-specific over general
  available.sort((a, b) => {
    const aGeneral = a.industry === "general_quality" || a.industry === "manufacturing" ? 1 : 0;
    const bGeneral = b.industry === "general_quality" || b.industry === "manufacturing" ? 1 : 0;
    return aGeneral - bGeneral;
  });

  // Return 8 links (writer picks 4, has extras as backup)
  return available.slice(0, 8);
}

/**
 * Main function: assembles all context needed by the article writer.
 * Call this BEFORE the writer runs, pass the result into writeArticle().
 */
async function loadContext(keywordBrief) {
  log("contextLoader", "loading", `context for "${keywordBrief.primaryKeyword}"`);

  const [existingPosts, usedUrls] = await Promise.all([
    loadExistingBlogPosts(),
    Promise.resolve(loadUsedExternalUrls()),
  ]);

  const externalLinks = selectExternalLinks(keywordBrief.primaryKeyword, usedUrls);

  // Service pages — static, always available
  const servicePages = [
    { title: "All ISO Services", url: "/services" },
    { title: "ISO 9001 Quality Management", url: "/services/iso-9001" },
    { title: "ISO 14001 Environmental", url: "/services/iso-14001" },
    { title: "ISO 45001 Health & Safety", url: "/services/iso-45001" },
    { title: "ISO 13485 Medical Devices", url: "/services/iso-13485" },
    { title: "ISO 27001 Information Security", url: "/services/iso-27001" },
    { title: "ISO 22000 Food Safety", url: "/services/iso-22000" },
    { title: "IATF 16949 Automotive Quality", url: "/services/iatf-16949" },
    { title: "AS9100 Aerospace Quality", url: "/services/as9100" },
    { title: "ISO 22301 Business Continuity", url: "/services/iso-22301" },
    { title: "ISO 17025 Laboratory", url: "/services/iso-17025" },
    { title: "Our 4-Step Process", url: "/process" },
    { title: "About ISO Certification Consultant", url: "/about" },
    { title: "Book Consultation", url: "/contact" },
  ];

  // Pick the most relevant service pages (top 6)
  const kw = keywordBrief.primaryKeyword.toLowerCase();
  const relevantServices = servicePages.filter((s) => {
    const u = s.url.toLowerCase();
    if (kw.includes("9001") && u.includes("9001")) return true;
    if (kw.includes("14001") && u.includes("14001")) return true;
    if (kw.includes("45001") && u.includes("45001")) return true;
    if (kw.includes("13485") && u.includes("13485")) return true;
    if (kw.includes("27001") && u.includes("27001")) return true;
    if (kw.includes("22000") && u.includes("22000")) return true;
    if (kw.includes("iatf") && u.includes("iatf")) return true;
    if (kw.includes("as9100") && u.includes("as9100")) return true;
    if (u === "/services" || u === "/contact" || u === "/process") return true;
    return false;
  }).slice(0, 6);

  // Pick the most relevant blog posts (top 5)
  const relevantPosts = existingPosts
    .filter((p) => {
      // Rough relevance scoring
      const title = p.title.toLowerCase();
      const keywords = keywordBrief.primaryKeyword.toLowerCase().split(" ");
      return keywords.some((k) => k.length > 3 && title.includes(k));
    })
    .slice(0, 5);

  const context = {
    internalLinks: {
      servicePages: relevantServices,
      blogPosts: relevantPosts,
    },
    externalLinks,
    usedExternalUrlCount: usedUrls.size,
    detectedIndustries: detectIndustries(keywordBrief.primaryKeyword),
  };

  log("contextLoader", "ready", `${relevantServices.length} services, ${relevantPosts.length} blog posts, ${externalLinks.length} external links available`);

  return context;
}

/**
 * Builds a diversity brief from recent published articles.
 * Extracts opening patterns, CTA closings, cost figures, and process descriptions
 * so the article writer knows what to AVOID.
 */
async function loadDiversityBrief() {
  log("contextLoader", "diversity", "building diversity brief from recent articles");

  let posts;
  try {
    // Fetch recent 20 blog posts with body text from Sanity
    const { sanityQuery } = require("../shared/sanity");
    posts = await sanityQuery(
      '*[_type == "blogPost"] | order(publishedAt desc)[0...20]{ title, slug, body }'
    );
  } catch {
    // Fallback: no brief available
    log("contextLoader", "diversity", "could not fetch articles — skipping diversity brief");
    return "";
  }

  if (!posts || posts.length === 0) return "";

  // Helper: extract plain text from Sanity portable text body
  function bodyToText(body) {
    if (!Array.isArray(body)) return "";
    let text = "";
    for (const block of body) {
      if (Array.isArray(block.children)) {
        for (const child of block.children) {
          if (child.text) text += child.text + " ";
        }
      }
    }
    return text.trim();
  }

  const recentOpenings = [];
  const recentCTAs = [];
  const costFigures = {};
  let processDescCount = 0;

  const COST_RE = /\$[\d,]+[–\-—]+\$[\d,]+/g;
  const PROCESS_RE = /gap assessment.*?training.*?documentation.*?implementation/i;

  for (const post of posts) {
    const text = bodyToText(post.body);
    if (!text) continue;

    const slug = post.slug?.current || "unknown";
    const sentences = text.split(/(?<=[.!?])\s+/);

    // First sentence = opening pattern
    if (sentences[0]) {
      recentOpenings.push({ text: sentences[0].slice(0, 120), slug });
    }

    // Last 3 sentences = CTA pattern
    const lastSentences = sentences.slice(-3).join(" ").slice(0, 200);
    if (lastSentences) {
      recentCTAs.push({ text: lastSentences, slug });
    }

    // Cost figures
    const costs = text.match(COST_RE) || [];
    for (const c of costs) {
      costFigures[c] = (costFigures[c] || 0) + 1;
    }

    // Process description
    if (PROCESS_RE.test(text)) processDescCount++;
  }

  // Build the brief string
  const lines = [
    "═══════════════════════════════════════════════════════════",
    "DIVERSITY BRIEF — Patterns to AVOID in this article:",
    "═══════════════════════════════════════════════════════════",
    "",
    "RECENT OPENINGS USED:",
  ];

  for (const o of recentOpenings.slice(0, 8)) {
    lines.push(`- "${o.text}..." (${o.slug})`);
  }

  lines.push("", "RECENT CTAs USED:");
  for (const c of recentCTAs.slice(0, 8)) {
    lines.push(`- "${c.text}..." (${c.slug})`);
  }

  lines.push("", "COST FIGURES ALREADY USED:");
  const sortedCosts = Object.entries(costFigures).sort((a, b) => b[1] - a[1]);
  for (const [figure, count] of sortedCosts.slice(0, 10)) {
    lines.push(`- "${figure}" in ${count} article${count > 1 ? "s" : ""}`);
  }

  lines.push(
    "",
    `PROCESS DESCRIPTION COUNT: Used verbatim in ${processDescCount} articles — describe differently this time.`,
    ""
  );

  log("contextLoader", "diversity", `brief built: ${recentOpenings.length} openings, ${recentCTAs.length} CTAs, ${sortedCosts.length} cost figures`);

  return lines.join("\n");
}

module.exports = { loadContext, loadDiversityBrief, detectIndustries };
