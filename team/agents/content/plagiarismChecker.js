const { claudeCallFast: claudeCall } = require("../shared/claude");
const { log } = require("../shared/logger");

const SYSTEM_PROMPT = `You are the Originality & Plagiarism Checker for ISO Certification Consultant. You operate with 30 years of editorial and academic integrity experience. You operate at an IQ of 148 (top 0.1% of cognitive ability) — bringing exceptional analytical depth, first-principles reasoning, and pattern recognition that far exceeds industry norms. Your outputs reflect genius-level precision, insight, and strategic thinking. Your job is to ensure every article published is genuinely unique, original, and free from:

1. PLAGIARISM — Content copied or closely paraphrased from existing web sources
2. AI CLICHÉS — Generic phrases that make content sound machine-generated
3. TEMPLATE LANGUAGE — Formulaic structures that could appear on any website
4. DUPLICATE INTERNAL CONTENT — Sections that repeat content from other ISO Certification Consultant articles
5. SELF-PLAGIARISM — Phrases or sentence structures that closely match other ISO Certification Consultant articles:
   - Cost range sentences reused across articles
   - Identical CTA closings
   - Same opening paragraph structure
   - Verbatim process descriptions
   - Flag any sentence that appears >80% similar to a sentence in another published article

ORIGINALITY SCORING (0–100):
- 95–100: Highly original — unique voice, specific examples, fresh perspective
- 85–94: Good — mostly original with minor generic sections
- 70–84: Needs improvement — several generic passages or AI-sounding phrases
- Below 70: FAIL — too much template language, unoriginal structure, or plagiarism risk

WHAT TO FLAG:
1. Sentences that are common across ISO consulting websites (e.g. "ISO 9001 is the world's most recognized quality management standard")
2. AI filler phrases: "delve into", "it is worth noting", "in today's fast-paced", "navigate the complexities", "leverage", "comprehensive", "robust", "landscape", "crucial", "seamless"
3. Template structures: "In this article, we will explore...", "Let's take a closer look at..."
4. Overly generic benefit lists that could apply to any consulting firm
5. Paragraphs with no specific data, examples, or unique perspective

WHAT MAKES CONTENT ORIGINAL:
1. Specific Canadian/North American manufacturing examples
2. Named standards clauses with practical interpretation
3. Real-world scenarios and case-like descriptions (anonymized)
4. Author's perspective or opinion on implementation approaches
5. Industry-specific data points or statistics
6. Practical tips that reflect hands-on experience

Return JSON:
{
  "score": 88,
  "pass": true,
  "flaggedSentences": [
    { "text": "the exact sentence", "reason": "why it's flagged", "suggestion": "rewrite suggestion" }
  ],
  "selfPlagiarismFlags": [
    { "text": "the sentence", "similarTo": "article title where similar text exists", "similarity": 0.92 }
  ],
  "aiClicheCount": 3,
  "genericParagraphCount": 1,
  "overallAssessment": "Brief 2-sentence assessment of originality",
  "rewriteInstructions": "null if pass, otherwise specific rewrite guidance"
}`;

async function checkOriginality(article, existingArticles) {
  log("plagiarismChecker", "checking", `"${article.title}"`);

  // Build self-plagiarism context from existing articles if provided
  let selfPlagiarismContext = "";
  if (existingArticles && existingArticles.length > 0) {
    // Extract key sentences from existing articles for comparison
    const samples = [];
    for (const existing of existingArticles.slice(0, 15)) {
      const text = typeof existing.body === "string" ? existing.body : "";
      if (!text) continue;

      // Extract first sentence, last 2 sentences, and any cost sentences
      const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.length > 30);
      const opening = sentences[0] || "";
      const closing = sentences.slice(-2).join(" ");
      const costSentences = sentences.filter((s) => /\$[\d,]+/.test(s)).slice(0, 2);

      samples.push({
        title: existing.title,
        opening: opening.slice(0, 150),
        closing: closing.slice(0, 200),
        costs: costSentences.map((s) => s.slice(0, 150)),
      });
    }

    if (samples.length > 0) {
      selfPlagiarismContext = `\n\nEXISTING ISO CERTIFICATION CONSULTANT ARTICLES TO CHECK AGAINST (flag any sentence >80% similar):
${samples
  .map(
    (s) =>
      `--- ${s.title} ---
Opening: "${s.opening}"
Closing: "${s.closing}"
${s.costs.length > 0 ? `Costs: ${s.costs.map((c) => `"${c}"`).join("; ")}` : ""}`
  )
  .join("\n")}`;
    }
  }

  const raw = await claudeCall(
    SYSTEM_PROMPT,
    `Analyze this article for originality and plagiarism risk:

TITLE: ${article.title}
PRIMARY KEYWORD: ${article.primaryKeyword}
WORD COUNT: ${article.wordCount}

ARTICLE BODY:
${article.body}
${selfPlagiarismContext}

Score this article 0–100 for originality. Pass threshold is 85. Check for self-plagiarism against the existing articles above. Return ONLY valid JSON.`,
    2048
  );

  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in plagiarism check response");

  const result = JSON.parse(cleaned.slice(start, end + 1));

  // Ensure selfPlagiarismFlags exists
  if (!result.selfPlagiarismFlags) result.selfPlagiarismFlags = [];

  log(
    "plagiarismChecker",
    "scored",
    `${result.score}/100 — ${result.pass ? "PASS" : "FAIL"} — ${result.aiClicheCount || 0} AI clichés, ${result.flaggedSentences?.length || 0} flagged, ${result.selfPlagiarismFlags.length} self-plagiarism`
  );

  if (!result.pass && result.flaggedSentences?.length > 0) {
    log(
      "plagiarismChecker",
      "flagged",
      result.flaggedSentences.slice(0, 3).map((f) => `"${f.text.slice(0, 60)}..." → ${f.reason}`).join("; ")
    );
  }

  if (result.selfPlagiarismFlags.length > 0) {
    log(
      "plagiarismChecker",
      "self-plagiarism",
      result.selfPlagiarismFlags.slice(0, 3).map((f) => `"${f.text.slice(0, 60)}..." ~ ${f.similarTo}`).join("; ")
    );
  }

  return result;
}

module.exports = { checkOriginality };
