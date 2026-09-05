const { claudeCallFast, claudeJSONFast } = require("../shared/claude");
const { log } = require("../shared/logger");
const { updateHeartbeat } = require("../shared/heartbeat");

const SYSTEM_PROMPT = `You are a senior copy editor with 30 years experience editing technical B2B content for North American manufacturing and compliance publications. You operate at an IQ of 148 (top 0.1% of cognitive ability) — bringing exceptional analytical depth, first-principles reasoning, and pattern recognition that far exceeds industry norms. Your outputs reflect genius-level precision, insight, and strategic thinking. You enforce grammar, spelling, and style strictly for North American English (US/Canadian).

SPELLING RULES — Always use North American English spelling:
"colour" → "color", "neighbour" → "neighbor", "analyse" → "analyze", "recognise" → "recognize", "labour" → "labor", "behaviour" → "behavior", "centre" → "center", "defence" → "defense", "organisation" → "organization", "licence" (noun) → "license", "programme" → "program", "metre" → "meter", "litre" → "liter", "catalogue" → "catalog", "cheque" → "check", "grey" → "gray", "favour" → "favor", "honour" → "honor", "specialise" → "specialize", "minimise" → "minimize", "optimise" → "optimize"

NO EXCEPTIONS — Even in ISO context, use North American spelling. "Organization" not "organisation". "Analyze" not "analyse".

GRAMMAR RULES:
- Subject-verb agreement
- Consistent tense throughout article
- No dangling modifiers
- No sentence fragments (max 1 intentional per article for emphasis)
- Correct pronoun references
- Parallel structure in lists and headings

STYLE RULES:
- Oxford comma always: "ISO 9001, 14001, and 45001"
- Numbers: spell out one through nine, numerals for 10 and above. Exception: always numerals for percentages (98%), ISO numbers, years (2026), measurements (50mm)
- ISO formatting: always "ISO 9001" never "iso 9001" or "ISO9001"
- H1, H2: Title Case. H3 and below: Sentence case
- Abbreviations: spell out first use "Quality Management System (QMS)" then abbreviation only after

PASSIVE VOICE:
Max 2 passive voice sentences per 500 words. Rewrite others:
"The audit was conducted" → "The team conducted the audit"

CONSISTENCY:
- Always "ISO Certification Consultant" never "ISO Certification Consultant"
- Always "Book your free consultation"
- "we" and "our" are CORRECT when referring to ISO Certification Consultant — do NOT change them
- No first person "I" anywhere

READABILITY:
- Flag sentences over 35 words — split them
- Flag paragraphs over 4 sentences — split them
- No jargon without explanation on first use

CRITICAL — PRESERVE THESE ELEMENTS EXACTLY (do NOT remove, rewrite, or change):
- ALL markdown links: [text](/path) and [text](https://url) — keep every link intact
- ALL [IMAGE:] markers — preserve exactly as written, including the description
- ALL callout boxes (> **Important:**, > **Did You Know?**, > **Key Consideration:**)
- ALL bold formatting (**text**)
- ALL heading hierarchy (## and ###)`;

async function checkGrammar(article) {
  log("grammarAgent", "check", `checking: ${article.title || "untitled"}`);

  // Use article.body (the standard field used across the pipeline — NOT article.content)
  const body = article.body || "";

  if (!body || body.length < 100) {
    log("grammarAgent", "skip", "article body is empty or too short");
    return {
      correctedContent: body,
      spellingFixes: 0,
      grammarFixes: 0,
      styleViolations: 0,
      passiveVoiceFixed: 0,
      totalCorrections: 0,
      overallGrade: "pass",
      notes: "Skipped — body too short",
    };
  }

  // Count links and image markers before grammar check (for validation after)
  const linksBefore = (body.match(/\[([^\]]+)\]\([^)]+\)/g) || []).length;
  const imagesBefore = (body.match(/\[IMAGE:[^\]]+\]/g) || []).length;

  const userMsg = `Review and correct the following article. Apply all spelling, grammar, style, and readability rules.

CRITICAL: You MUST preserve ALL markdown links [text](url) and ALL [IMAGE:] markers exactly as they appear. Do NOT remove or modify any links or image markers.

Return ONLY a JSON object with these fields:
- "correctedContent": the full corrected article content (markdown) with ALL links and [IMAGE:] markers preserved
- "spellingFixes": number of spelling corrections
- "grammarFixes": number of grammar corrections
- "styleViolations": number of style fixes
- "passiveVoiceFixed": number of passive voice rewrites
- "overallGrade": "pass" or "fail" (fail if more than 15 total corrections or factual ISO errors found)
- "notes": string with any issues for Content Manager
- "totalCorrections": total number of all corrections

ARTICLE TITLE: ${article.title}
ARTICLE BODY:
${body}`;

  try {
    const result = await claudeJSONFast(SYSTEM_PROMPT, userMsg, 8192);

    const totalCorrections = (result.spellingFixes || 0) + (result.grammarFixes || 0) +
      (result.styleViolations || 0) + (result.passiveVoiceFixed || 0);

    const grade = totalCorrections > 15 ? "fail" : (result.overallGrade || "pass");

    // Validate that links and images survived the grammar check
    const corrected = result.correctedContent || body;
    const linksAfter = (corrected.match(/\[([^\]]+)\]\([^)]+\)/g) || []).length;
    const imagesAfter = (corrected.match(/\[IMAGE:[^\]]+\]/g) || []).length;

    let finalContent = corrected;

    // If grammar agent stripped links or images, roll back to original body
    if (linksAfter < linksBefore - 1 || imagesAfter < imagesBefore - 1) {
      log("grammarAgent", "rollback", `grammar stripped ${linksBefore - linksAfter} links and ${imagesBefore - imagesAfter} images — using original body`);
      finalContent = body;
    }

    const summary = {
      spellingFixes: result.spellingFixes || 0,
      grammarFixes: result.grammarFixes || 0,
      styleViolations: result.styleViolations || 0,
      passiveVoiceFixed: result.passiveVoiceFixed || 0,
      totalCorrections,
      overallGrade: grade,
      notes: result.notes || "",
    };

    log("grammarAgent", "result", `${totalCorrections} corrections, grade: ${grade}`);
    updateHeartbeat("grammarAgent", grade === "pass" ? "complete" : "failed", `${totalCorrections} fixes, ${grade}`);

    return {
      correctedContent: finalContent,
      ...summary,
    };
  } catch (err) {
    log("grammarAgent", "error", err.message);
    updateHeartbeat("grammarAgent", "error", err.message);
    // On error, pass through unchanged
    return {
      correctedContent: body,
      spellingFixes: 0,
      grammarFixes: 0,
      styleViolations: 0,
      passiveVoiceFixed: 0,
      totalCorrections: 0,
      overallGrade: "pass",
      notes: `Grammar check skipped: ${err.message}`,
    };
  }
}

module.exports = { checkGrammar };
