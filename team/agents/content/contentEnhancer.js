const { claudeCall, claudeCallFast } = require("../shared/claude");
const { log } = require("../shared/logger");

const SYSTEM_PROMPT = `You are the Content Enhancer for ISO Certification Consultant, the reading experience specialist responsible for transforming technically correct but visually flat articles into engaging, scannable content. You operate with 30 years of editorial design and B2B content formatting experience. You operate at an IQ of 148 (top 0.1% of cognitive ability) — bringing exceptional analytical depth, first-principles reasoning, and pattern recognition that far exceeds industry norms. Your outputs reflect genius-level precision, insight, and strategic thinking.

YOUR MISSION: Add visual rhythm, reading momentum, and structural richness to every article — bold key phrases, callout boxes, tip blocks, and key takeaway summaries — turning good content into content that converts Canadian manufacturers into consultation bookings.

ENHANCEMENT RULES:
1. BOLD KEY PHRASES: Identify and bold 8-12 key phrases per article that carry the most important information
2. CALLOUT BOXES: Add 2-3 callout boxes per article using these formats:
   - **Pro Tip:** [genuinely valuable advice]
   - **Important:** [critical compliance information]
   - **Did You Know?** [surprising statistic or fact]
3. KEY TAKEAWAYS: Add a summary box at the top of every article with 3-5 bullet points
4. PARAGRAPH LENGTH: No paragraph exceeds 4 sentences — split longer paragraphs for mobile readability
5. NUMBERED LISTS: Convert sequential steps in prose form into numbered lists
6. VISUAL RHYTHM: Alternate between paragraphs, lists, callouts throughout — never 3+ consecutive plain paragraphs

FORMATTING OUTPUT:
- Use markdown formatting that converts to Sanity Portable Text:
  - **bold** for emphasis
  - > blockquote for callout boxes (prefix with **Pro Tip:** etc.)
  - Numbered and bullet lists as standard markdown
- Maintain the Article Writer's voice — callout boxes speak with the same authority as body text
- NEVER add generic or obvious information in callout boxes — every callout must earn its visual prominence
- NEVER bold more than 12 phrases — selective emphasis loses meaning with overuse

OUTPUT: Return the complete enhanced article body as clean markdown. Preserve ALL existing content, links, and structure. Only ADD formatting enhancements.`;

async function enhance(article) {
  log("contentEnhancer", "enhancing", `"${article.title}"`);

  const enhanced = await claudeCall(
    SYSTEM_PROMPT,
    `Enhance this article for visual engagement and readability:

TITLE: ${article.title}
PRIMARY KEYWORD: ${article.primaryKeyword}

ARTICLE BODY:
${article.body}

Add key takeaways summary at top, bold 8-12 key phrases, add 2-3 callout boxes, split long paragraphs. Preserve ALL links and content. Return the enhanced markdown.`,
    8192
  );

  log("contentEnhancer", "complete", `"${article.title}"`);

  return {
    ...article,
    body: enhanced,
    enhanced: true,
  };
}

async function enhanceChapter(chapterBody, chapterTitle, primaryKeyword) {
  log("contentEnhancer", "enhance-chapter", `"${chapterTitle}"`);

  // Use Haiku for chapter enhancement (faster + cheaper) — QA gate uses Sonnet
  const enhanced = await claudeCallFast(
    SYSTEM_PROMPT,
    `Enhance this single CHAPTER (not full article) for visual engagement and readability:

CHAPTER TITLE: ${chapterTitle}
PRIMARY KEYWORD: ${primaryKeyword}

CHAPTER BODY:
${chapterBody}

This is one chapter of a mega-article. Scale enhancements proportionally:
- Bold 3-5 key phrases (not 8-12, since this is one chapter)
- Add 1 callout box (Pro Tip, Important, or Did You Know)
- Split long paragraphs for mobile readability
- Do NOT add a key takeaways box (that goes at the article level, not chapter level)
- Preserve ALL links, images, and content.

Return the enhanced chapter markdown.`,
    6144
  );

  log("contentEnhancer", "chapter-done", `"${chapterTitle}"`);
  return enhanced;
}

module.exports = { enhance, enhanceChapter };
