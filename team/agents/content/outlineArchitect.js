const { claudeCall } = require("../shared/claude");
const { log } = require("../shared/logger");

const CURRENT_YEAR = new Date().getFullYear();

const SYSTEM_PROMPT = `You are the Outline Architect for ISO Certification Consultant — a senior ISO consultant with 25 years of experience in Canadian manufacturing who also happens to be an expert content strategist. You operate at an IQ of 148 (top 0.1% of cognitive ability) — bringing exceptional analytical depth, first-principles reasoning, and pattern recognition that far exceeds industry norms. Your outputs reflect genius-level precision, insight, and strategic thinking. Your job is to design the chapter blueprint for an 18,000-20,000 word mega-article.

CRITICAL: The current year is ${CURRENT_YEAR}. All references must use ${CURRENT_YEAR}.

You design chapter outlines that:
1. Answer EVERY question a Canadian quality manager, plant director, or business owner would have on this topic
2. Progress logically — each chapter builds on the previous one
3. Map specific keywords to specific chapters so every chapter earns its own search rankings
4. Include practical, actionable content — not generic ISO definitions
5. Avoid repetition across chapters — each chapter covers a DISTINCT aspect

CHAPTER STRUCTURE RULES (HARD LIMITS — NO EXCEPTIONS):
- EXACTLY 9-10 chapters per article (each chapter becomes an H2 section)
- NEVER more than 10 chapters. NEVER fewer than 9 chapters.
- Each chapter targets 2,000-2,200 words (MINIMUM 1,800 words per chapter)
- Each chapter has 3-5 sub-sections (H3 headings)
- Sub-sections are NOT separate chapters — they are H3 headings WITHIN a chapter
- First chapter is always an executive overview / "Why This Matters"
- Last chapter is always "Next Steps" or "Getting Started"
- Middle chapters cover the substantive technical content
- One chapter must be a comparison or decision framework
- One chapter must address costs, timelines, or ROI
- Include a dedicated FAQ chapter with 8-10 questions
- Total article target: 18,000-20,000 words across all chapters

KEYWORD MAPPING:
- The primary keyword appears in Chapters 1, 3, and the FAQ
- Each secondary keyword is assigned to 1-2 specific chapters
- Each chapter has its own "chapter keyword" for long-tail targeting

Return JSON:
{
  "title": "SEO-optimized mega-article title with primary keyword and ${CURRENT_YEAR}",
  "metaDescription": "155-char meta description with primary keyword",
  "estimatedWords": 19000,
  "estimatedReadTime": "90 min read",
  "chapters": [
    {
      "number": 1,
      "title": "Chapter H2 heading (keyword-rich)",
      "targetWords": 2000,
      "chapterKeyword": "long-tail keyword for this chapter",
      "subsections": [
        { "title": "H3 heading", "keyPoints": ["point 1", "point 2"] }
      ],
      "keywordsToWeave": ["keyword1", "keyword2"],
      "contentNotes": "Specific guidance for the writer — what to cover, what tone, what examples"
    }
  ],
  "internalLinkTargets": ["/services/iso-9001", "/process", "/contact"],
  "externalLinkTargets": ["specific-industry-org.com — context for why"],
  "faqQuestions": ["8-10 People Also Ask style questions with brief answer outlines"],
  "imageScenes": ["6-8 specific image descriptions for inline images"]
}`;

async function designOutline(megaKeywordBrief) {
  log("outlineArchitect", "designing", `outline for "${megaKeywordBrief.primaryKeyword}"`);

  const raw = await claudeCall(
    SYSTEM_PROMPT,
    `Design a comprehensive chapter outline for a mega-article (18,000-20,000 words) on this topic. HARD LIMIT: exactly 9-10 chapters. Each chapter must target 2,000-2,200 words with 3-5 H3 subsections WITHIN it.

Primary Keyword: ${megaKeywordBrief.primaryKeyword}
Secondary Keywords: ${megaKeywordBrief.secondaryKeywords.join(", ")}
Search Intent: ${megaKeywordBrief.searchIntent}
Target Audience: ${megaKeywordBrief.targetAudience || "Canadian manufacturers, quality managers, plant directors"}
Article Type: ${megaKeywordBrief.articleType || "how-to"}

Topic Context: ${megaKeywordBrief.topicContext || "ISO certification and quality management for Canadian manufacturing companies"}

Previously Published Articles (avoid overlap):
${(megaKeywordBrief.publishedTitles || []).map((t) => `- ${t}`).join("\n") || "None yet"}

Internal pages available to link to:
- /services — All ISO services
- /services/iso-9001 — ISO 9001 Quality Management
- /services/iso-14001 — ISO 14001 Environmental
- /services/iso-45001 — ISO 45001 Health & Safety
- /services/iso-13485 — ISO 13485 Medical Devices
- /services/iso-27001 — ISO 27001 Information Security
- /services/iso-22000 — ISO 22000 Food Safety
- /services/iatf-16949 — IATF 16949 Automotive
- /services/as9100 — AS9100 Aerospace
- /process — Our 4-step certification process
- /about — About ISO Certification Consultant
- /contact — Book consultation
- /blog — Blog & insights
- /industries/manufacturing — Manufacturing industry page
- /industries/automotive — Automotive industry page
- /industries/aerospace-defence — Aerospace industry page
- /industries/food-beverage — Food & beverage industry page
- /industries/healthcare-medical-devices — Medical devices industry page

Design the complete chapter outline. Keep keyPoints arrays to 2-3 items max per subsection. Keep contentNotes to 1-2 sentences. Return ONLY valid JSON — no commentary before or after.`,
    16384
  );

  // Robust JSON extraction — handles LLM formatting issues
  let cleaned = raw;

  // Strip markdown code fences
  cleaned = cleaned.replace(/```json\s*/g, "").replace(/```\s*/g, "");

  // Find the outermost JSON object
  const start = cleaned.indexOf("{");
  if (start === -1) throw new Error("No JSON object found in outline response");

  // Use bracket counting to find the matching closing brace
  let depth = 0;
  let inString = false;
  let escaped = false;
  let jsonEnd = -1;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{" || ch === "[") depth++;
    if (ch === "}" || ch === "]") depth--;
    if (depth === 0) { jsonEnd = i; break; }
  }

  if (jsonEnd === -1) {
    // Response was truncated — find last complete structure
    log("outlineArchitect", "json-repair", "response appears truncated, attempting to close JSON");
    cleaned = cleaned.slice(start);
    // Close any open arrays and objects
    while (depth > 0) { cleaned += depth % 2 === 0 ? "}" : "]"; depth--; }
  } else {
    cleaned = cleaned.slice(start, jsonEnd + 1);
  }

  // Fix trailing commas
  cleaned = cleaned.replace(/,\s*([\]}])/g, "$1");

  let outline;
  try {
    outline = JSON.parse(cleaned);
  } catch (e) {
    log("outlineArchitect", "json-repair", `parse failed: ${e.message}`);
    // Write raw response for debugging
    const fs = require("fs");
    const path = require("path");
    try { fs.writeFileSync(path.join(__dirname, "../../reports/content/outline-debug.txt"), raw); } catch {}
    throw e;
  }

  // HARD LIMIT: reject outlines with more than 10 or fewer than 9 chapters
  if (outline.chapters.length > 10) {
    log("outlineArchitect", "chapter-limit", `REJECTED: ${outline.chapters.length} chapters exceeds max 10 — truncating to 10`);
    outline.chapters = outline.chapters.slice(0, 10);
  }
  if (outline.chapters.length < 9) {
    log("outlineArchitect", "chapter-limit", `WARNING: only ${outline.chapters.length} chapters (minimum 9)`);
  }

  // Enforce minimum 1,800 words per chapter target
  for (const ch of outline.chapters) {
    if (ch.targetWords < 1800) {
      ch.targetWords = 2000;
    }
  }

  const totalTargetWords = outline.chapters.reduce((sum, ch) => sum + ch.targetWords, 0);
  log("outlineArchitect", "complete", `${outline.chapters.length} chapters, ~${totalTargetWords} target words`);

  return outline;
}

module.exports = { designOutline };
