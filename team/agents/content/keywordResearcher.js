const fs = require("fs");
const path = require("path");
const { claudeCallFast: claudeCall } = require("../shared/claude");
const { log } = require("../shared/logger");
const { MEMORY_DIR } = require("../shared/config");
const { fetchAllSanity } = require("../shared/sanity");

const QUEUE_PATH = path.join(MEMORY_DIR, "keyword-queue.json");
const PUBLISHED_PATH = path.join(MEMORY_DIR, "published-articles.json");

const CURRENT_YEAR = new Date().getFullYear();

const ARTICLE_TYPES = [
  "deep-guide",      // Comprehensive how-to
  "case-study",      // Fictional manufacturer journey with real numbers
  "comparison",      // Standard vs standard or approach vs approach
  "checklist",       // Numbered actionable items
  "industry-spotlight", // Deep dive into one industry's ISO challenges
  "myth-buster",     // Debunk 5-7 common misconceptions
  "trend-opinion",   // Emerging trends, future-looking
  "how-to",          // Tactical step-by-step (7 steps or fewer)
];

const ONTARIO_CITIES = [
  "Toronto", "Mississauga", "Hamilton", "Brampton", "Kitchener",
  "Windsor", "London", "Ottawa", "Oakville", "Burlington",
  "Guelph", "Cambridge", "Barrie", "Oshawa", "Markham",
];

const SYSTEM_PROMPT = `You are an expert SEO keyword researcher specializing in ISO consulting for Ontario manufacturers. You operate at an IQ of 148 (top 0.1% of cognitive ability) — bringing exceptional analytical depth, first-principles reasoning, and pattern recognition that far exceeds industry norms. Your outputs reflect genius-level precision, insight, and strategic thinking. Your job is to pick the best keyword AND article type for today's blog post.

CRITICAL: The current year is ${CURRENT_YEAR}. Year references should use ${CURRENT_YEAR} where natural — but do NOT force "${CURRENT_YEAR}" into every title.

═══ ARTICLE TYPES — You must pick one ═══

1. deep-guide — Comprehensive how-to covering a topic in depth (5-6 sections)
2. case-study — Story of a fictional Ontario manufacturer's ISO journey (narrative arc with real numbers)
3. comparison — Standard vs standard, or approach vs approach (side-by-side with decision framework)
4. checklist — 7-12 numbered actionable items with explanations
5. industry-spotlight — Deep dive into one industry's specific ISO challenges and requirements
6. myth-buster — Debunk 5-7 common misconceptions about an ISO topic
7. trend-opinion — Emerging trends, expert perspective on what's changing in quality management
8. how-to — Tactical step-by-step guide (5-7 clear steps)

═══ TITLE RULES — CRITICAL ═══

BANNED title patterns (DO NOT USE):
- "[Topic]: Complete Guide for ${CURRENT_YEAR}" — BANNED
- "[Topic]: Complete [Adjective] Guide" — BANNED
- Any title with the word "Complete" if it appeared in last 7 titles
- Titles must NOT all end with "for ${CURRENT_YEAR}" — vary placement or omit year

Title MUST match the article type:
- case-study: Narrative titles like "From Zero to Certified: A Toronto CNC Shop's 14-Week ISO Journey"
- myth-buster: "5 ISO 9001 Myths That Cost Manufacturers Money"
- checklist: "10-Point Internal Audit Readiness Checklist for Manufacturers"
- how-to: "How to Run Your First ISO Internal Audit in 7 Steps"
- comparison: "ISO 9001 vs IATF 16949: Which Does Your Auto Parts Plant Need?"
- industry-spotlight: "Why Ontario Aerospace Suppliers Are Racing to Get AS9100 Certified"
- trend-opinion: "How AI Is Changing Quality Management in Ontario Manufacturing"
- deep-guide: "The Quality Manager's Playbook for ISO 14001 Implementation"

═══ GEOGRAPHIC FOCUS — Ontario (Month 1) ═══

For city-specific content, use Ontario cities: ${ONTARIO_CITIES.join(", ")}.
Not every article needs a city — process-focused topics can be geographically neutral.
When using a city, rotate — no city used more than once in last 10 articles.

═══ TARGET MARKET ═══

Ontario manufacturers, automotive suppliers, medical device companies, food manufacturers, aerospace companies, construction firms.

You must NEVER pick a keyword that has already been published.

Return JSON:
{
  "primaryKeyword": "the exact keyword from the queue",
  "secondaryKeywords": ["3-5 related keywords to weave in naturally"],
  "articleType": "one of: deep-guide|case-study|comparison|checklist|industry-spotlight|myth-buster|trend-opinion|how-to",
  "searchIntent": "informational|commercial|transactional",
  "recommendedWordCount": 1500,
  "title": "creative, varied title matching the article type — NOT 'Complete Guide for ${CURRENT_YEAR}'",
  "metaDescription": "120-155 char meta description with primary keyword",
  "h2Structure": ["H2 headings matching the article type structure"],
  "faqQuestions": ["5 People Also Ask style questions"],
  "targetCity": "Ontario city or null if geographically neutral",
  "reasoning": "1-2 sentences on why this keyword AND article type were chosen today"
}`;

const MEGA_SYSTEM_PROMPT = `You are an expert SEO strategist specializing in Canadian ISO consulting for manufacturing. Your job is to select the best topic for a comprehensive mega-article (18,000-20,000 words, 9-10 chapters).

CRITICAL: The current year is ${CURRENT_YEAR}. All references must use ${CURRENT_YEAR}.

MEGA-ARTICLE TOPIC SELECTION CRITERIA:
1. Problem-solving topics that quality managers and plant directors search for at 11pm
2. Implementation guides that walk through a real process step-by-step
3. Comparison/decision topics where buyers need help choosing between standards
4. Industry-specific deep-dives that address sector-specific regulatory requirements
5. Topics with enough depth for exactly 9-10 chapters (each 2,000-2,200 words)

AVOID these topic types for mega-articles:
- City-specific consultant searches (too thin for 18,000 words)
- Simple cost/pricing topics (good for regular articles, not mega)
- Single-clause explanations (too narrow)

Target market: Canadian manufacturers, automotive suppliers, medical device companies, food manufacturers, aerospace companies, construction firms.

You must NEVER pick a topic that overlaps significantly with already-published articles.

Return JSON:
{
  "primaryKeyword": "the core keyword for this mega-article",
  "secondaryKeywords": ["8-12 related keywords to distribute across chapters"],
  "searchIntent": "informational|commercial",
  "articleType": "implementation-guide|comparison|industry-deep-dive|problem-solving|complete-guide",
  "targetAudience": "specific audience segment for this article",
  "topicContext": "2-3 sentences explaining the angle and why this topic needs 18,000-20,000 words across 9-10 chapters",
  "title": "SEO-optimized mega-article title with primary keyword and ${CURRENT_YEAR}",
  "metaDescription": "155-char meta description with primary keyword",
  "reasoning": "2-3 sentences on why this is the best mega-article topic right now"
}`;

function loadQueue() {
  return JSON.parse(fs.readFileSync(QUEUE_PATH, "utf-8"));
}

function loadPublished() {
  return JSON.parse(fs.readFileSync(PUBLISHED_PATH, "utf-8"));
}

// Fetch all existing blog slugs from Sanity to prevent duplicate topics
async function getLiveSlugs() {
  try {
    const posts = await fetchAllSanity("blogPost");
    return new Set(posts.map((p) => p.slug?.current).filter(Boolean));
  } catch {
    return new Set();
  }
}

async function pickKeyword() {
  log("keywordResearcher", "pick", "selecting today's keyword");

  const { queue } = loadQueue();
  const published = loadPublished();
  const publishedKeywords = new Set(published.map((a) => a.primaryKeyword));
  const publishedSlugs = new Set(published.map((a) => a.slug).filter(Boolean));

  // Also check Sanity for slugs that exist but aren't in local published-articles.json
  const liveSlugs = await getLiveSlugs();
  if (liveSlugs.size > 0) {
    log("keywordResearcher", "sanity-check", `${liveSlugs.size} live slugs fetched from Sanity`);
  }

  const available = queue.filter((k) => !publishedKeywords.has(k));

  if (available.length === 0) {
    throw new Error("Keyword queue exhausted — all keywords have been published");
  }

  // Analyze recent topics to enforce standard diversity
  const recentKeywords = published.slice(-7).map((a) => a.primaryKeyword);
  const recentStandards = recentKeywords.map((k) => {
    if (/9001/.test(k)) return "ISO 9001";
    if (/14001/.test(k)) return "ISO 14001";
    if (/45001/.test(k)) return "ISO 45001";
    if (/13485/.test(k)) return "ISO 13485";
    if (/27001/.test(k)) return "ISO 27001";
    if (/22000/.test(k)) return "ISO 22000";
    if (/16949|iatf/.test(k)) return "IATF 16949";
    if (/as9100|as 9100/.test(k)) return "AS9100";
    if (/22301/.test(k)) return "ISO 22301";
    if (/17025/.test(k)) return "ISO 17025";
    if (/audit/.test(k)) return "Auditing";
    if (/consultant/.test(k)) return "Consulting";
    return "General";
  });
  const recentTopicCounts = {};
  for (const s of recentStandards) recentTopicCounts[s] = (recentTopicCounts[s] || 0) + 1;
  const overrepresented = Object.entries(recentTopicCounts).filter(([, c]) => c >= 2).map(([s]) => s);

  // Article type diversity — no more than 2 of same type in last 7
  const recentTypes = published.slice(-7).map((a) => a.articleType).filter(Boolean);
  const typeCounts = {};
  for (const t of recentTypes) typeCounts[t] = (typeCounts[t] || 0) + 1;
  const overusedTypes = Object.entries(typeCounts).filter(([, c]) => c >= 2).map(([t]) => t);

  // Title diversity — check if "Complete" was used recently
  const recentTitles = published.slice(-7).map((a) => a.title);
  const completeUsedRecently = recentTitles.some((t) => /complete/i.test(t));

  // City diversity — no city repeated in last 10
  const recentCities = published.slice(-10).map((a) => a.targetCity).filter(Boolean);

  const raw = await claudeCall(
    SYSTEM_PROMPT,
    `Available keywords (${available.length} remaining):\n${available.map((k, i) => `${i + 1}. ${k}`).join("\n")}\n\nAlready published (${published.length} articles, last 7 shown):\n${published.slice(-7).map((a) => `- [${a.articleType || "deep-guide"}] ${a.primaryKeyword}: "${a.title}"`).join("\n") || "None yet"}\n\n═══ DIVERSITY RULES (HARD) ═══\n\nSTANDARD ROTATION: These standards appeared 2+ times in last 7 — DO NOT pick: ${overrepresented.join(", ") || "none"}\n\nARTICLE TYPE ROTATION: These types appeared 2+ times in last 7 — DO NOT pick: ${overusedTypes.join(", ") || "none"}. Available types: ${ARTICLE_TYPES.join(", ")}\n\nTITLE RULE: ${completeUsedRecently ? 'The word "Complete" was used in a recent title — DO NOT use "Complete" in your title.' : '"Complete" not used recently, but still avoid the "[Topic]: Complete Guide for [Year]" pattern.'}\n\nCITY ROTATION: These cities were used in last 10 articles — DO NOT reuse: ${recentCities.join(", ") || "none"}. Ontario cities to choose from: ${ONTARIO_CITIES.join(", ")}. Or use null for geographically neutral topics.\n\nReturn ONLY valid JSON.`,
    2048
  );

  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const result = JSON.parse(cleaned.slice(start, end + 1));

  // Guard: check if the generated title would produce a slug that already exists in Sanity
  const candidateSlug = result.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 96);
  if (liveSlugs.has(candidateSlug) || publishedSlugs.has(candidateSlug)) {
    log("keywordResearcher", "DUPE-BLOCKED", `title "${result.title}" would produce slug "${candidateSlug}" which already exists — this keyword will be skipped by publisher`);
  }

  log("keywordResearcher", "picked", `"${result.primaryKeyword}" — ${result.reasoning}`);
  return result;
}

async function pickMegaKeyword() {
  log("keywordResearcher", "pick-mega", "selecting topic for mega-article");

  const { queue } = loadQueue();
  const published = loadPublished();
  const publishedKeywords = new Set(published.map((a) => a.primaryKeyword));
  const publishedTitles = published.map((a) => a.title);

  const available = queue.filter((k) => !publishedKeywords.has(k));

  // Also include mega-specific keywords not in the regular queue
  const megaTopics = [
    "how to implement iso 9001 manufacturing canada",
    "iso audit preparation guide manufacturers",
    "iso 9001 vs iatf 16949 vs as9100 comparison",
    "building quality management system that works",
    "scar corrective action 8d methodology suppliers",
    "iso certification food beverage manufacturers canada",
    "internal audit program iso manufacturers",
    "iso 14001 vs iso 45001 canadian manufacturers",
    "iso 27001 information security manufacturing canada",
    "iatf 16949 automotive quality certification canada",
    "as9100 aerospace quality certification canada",
    "iso 22000 food safety management canada",
    "iso documentation system manufacturing guide",
    "iso risk based thinking implementation manufacturing",
    "supplier quality management iso canada",
    "iso continuous improvement kaizen manufacturing",
  ];

  const allTopics = [...new Set([...available, ...megaTopics])].filter(
    (t) => !publishedKeywords.has(t)
  );

  if (allTopics.length === 0) {
    throw new Error("No mega-article topics available");
  }

  const raw = await claudeCall(
    MEGA_SYSTEM_PROMPT,
    `Available topics (${allTopics.length}):\n${allTopics.map((k, i) => `${i + 1}. ${k}`).join("\n")}\n\nAlready published (${published.length} articles):\n${publishedTitles.map((t) => `- ${t}`).join("\n") || "None yet"}\n\nPick the best topic for an 18,000-20,000 word mega-article with exactly 9-10 chapters (2,000-2,200 words each). Consider what would provide the most SEO value and topical authority. Return ONLY valid JSON.`,
    2048
  );

  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const result = JSON.parse(cleaned.slice(start, end + 1));

  // Attach published titles for outline architect to avoid overlap
  result.publishedTitles = publishedTitles;

  log("keywordResearcher", "picked-mega", `"${result.primaryKeyword}" — ${result.reasoning}`);
  return result;
}

function addKeyword(keyword) {
  const data = loadQueue();
  if (data.queue.includes(keyword)) {
    return { added: false, reason: "already in queue" };
  }
  data.queue.push(keyword);
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(data, null, 2) + "\n");
  log("keywordResearcher", "add-keyword", keyword);
  return { added: true, keyword };
}

function getQueueStatus() {
  const { queue } = loadQueue();
  const published = loadPublished();
  const publishedKeywords = new Set(published.map((a) => a.primaryKeyword));
  const remaining = queue.filter((k) => !publishedKeywords.has(k));
  return { total: queue.length, published: published.length, remaining: remaining.length };
}

module.exports = { pickKeyword, pickMegaKeyword, addKeyword, getQueueStatus };
