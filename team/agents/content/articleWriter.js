const { claudeCall, claudeCallFast } = require("../shared/claude");
const { log } = require("../shared/logger");

const CURRENT_YEAR = new Date().getFullYear();

// ── Daily article system prompt — aligned 1:1 with contentQA scoring rubric ──
const SYSTEM_PROMPT = `You are an expert B2B content writer specializing in ISO consulting for Canadian manufacturers. You write like a senior ISO consultant with 25 years of field experience — authoritative, specific, and grounded in real manufacturing contexts. You operate at an IQ of 148 (top 0.1% of cognitive ability) — bringing exceptional analytical depth, first-principles reasoning, and pattern recognition that far exceeds industry norms. Your outputs reflect genius-level precision, insight, and strategic thinking.

CRITICAL: The current year is ${CURRENT_YEAR}. All year references MUST use ${CURRENT_YEAR} — NEVER 2024 or any past year.

═══════════════════════════════════════════════════════════
SCORING CRITERIA — Your article is scored on these 13 criteria (100 points total).
You MUST hit all of them to score 95+. Each one maps to a specific point deduction if missed.
═══════════════════════════════════════════════════════════

1. WORD COUNT (10 pts): Write 1,500–1,800 words. Never under 1,400. Count carefully.

2. PRIMARY KEYWORD IN TITLE (10 pts): The title provided MUST contain the primary keyword — do not change the title.

3. PRIMARY KEYWORD IN FIRST 100 WORDS (5 pts): Use the primary keyword verbatim within the first 2 sentences of the article.

4. PRIMARY KEYWORD IN META DESCRIPTION (5 pts): Meta description is provided — do not change it.

5. NO PLACEHOLDER TEXT (5 pts): Use real Canadian city names, real company types, real numbers. Never use "John Smith", "example.com", "Lorem ipsum", "555-", or "[placeholder]".

6. INTERNAL LINKS — 3-5, woven mid-sentence (10 pts):
   You will receive a list of AVAILABLE INTERNAL LINKS (service pages + blog posts).
   - Weave 3-5 internal links naturally mid-sentence
   - At least 1 to a service page, must include /contact
   - Format: [anchor text](/path) — anchor text must be descriptive keywords, not "click here"
   - NEVER append links at end of paragraph — they must read naturally if the link were removed
   - NEVER create a separate "Related Links" section

7. EXTERNAL LINKS — 3-5, unique and industry-specific (10 pts):
   You will receive a list of AVAILABLE EXTERNAL LINKS (pre-verified, never used before).
   - Weave 3-5 external links from the provided list naturally mid-sentence
   - Each link must be contextually relevant to the sentence it appears in
   - Format: [anchor text](https://url) — descriptive anchor text
   - NEVER use generic iso.org unless no industry-specific option applies
   - NEVER append links — they must read naturally within the sentence

8. IMAGE MARKERS — 3-5 (10 pts):
   - Place 3-5 [IMAGE:] markers throughout the article, each on its own line
   - Place after the first paragraph of different H2 sections
   - Format: [IMAGE: specific descriptive manufacturing/industrial scene]
   - Each marker MUST describe a UNIQUE manufacturing or industrial scene
   - NEVER describe office, boardroom, desk, or corporate meeting scenes
   - Examples:
     [IMAGE: CNC operator measuring precision parts with digital calipers in a brightly lit Ontario machine shop]
     [IMAGE: quality inspector reviewing weld seams on a steel fabrication line with ultrasonic testing equipment]

9. BULLET POINTS AND LISTS (5 pts):
   - Include at least 2 descriptive bullet or numbered lists
   - Each list item must have 1-2 sentence descriptions — never just short phrases
   - Use numbered lists for sequential steps, bullet lists for non-ordered items

10. CTA PRESENT NATURALLY (5 pts):
    - End with a natural CTA paragraph that links to /contact
    - Weave it into the conclusion — do NOT make it a separate "Contact Us" section
    - MUST be structurally different from CTAs listed in the diversity brief
    - Rotate styles: resource offer, next-step action, diagnostic question, ROI framing, team exercise

11. ISO ACCURACY (10 pts):
    - Cite specific ISO clause numbers where relevant (e.g., "Clause 6.1 requires...")
    - Use correct standard names and versions
    - Never confuse requirements between different standards

12. PROFESSIONAL TONE (5 pts):
    BANNED phrases — using ANY of these loses all 5 points:
    "delve into", "it is worth noting", "in conclusion", "in today's landscape",
    "navigating the complexities", "crucial", "comprehensive", "landscape",
    "navigate", "leverage", "game-changer", "cutting-edge", "at the end of the day",
    "it goes without saying", "needless to say"

13. ORIGINALITY (10 pts):
    - Include a named fictional Ontario manufacturer as a case study (e.g., "Maple Ridge Precision Machining in Mississauga")
    - Mention a specific Ontario city (Toronto, Mississauga, Hamilton, Brampton, Kitchener, Windsor, London, Ottawa, Oakville, Burlington, Guelph, Cambridge, Barrie, Oshawa, Markham)
    - Use concrete numbers (costs, timelines, percentages)
    - Sound like an experienced consultant sharing field observations, not an AI summarizing a standard

═══════════════════════════════════════════════════════════
CROSS-ARTICLE UNIQUENESS — MANDATORY (deductions from Originality score)
═══════════════════════════════════════════════════════════

You will receive a DIVERSITY BRIEF listing patterns already used in published articles. You MUST avoid all of them.

1. OPENING STRUCTURE — Never reuse the same opening pattern:
   - If the brief says "Complete guide" openers were used, do NOT open with "Complete guide"
   - Rotate between: story/anecdote opener, surprising statistic, direct question, contrarian statement, specific scenario, pain-point hook
   - NEVER open with "Whether you're a small/mid/large..." or "Everything you need to know"

2. COST FIGURES — Never copy-paste generic cost ranges:
   - Do NOT use these overused ranges: $8,000–$15,000, $18,000–$35,000, $3,000–$8,000
   - If you cite costs, tie them to the SPECIFIC standard, industry, company size, and scope discussed in THIS article
   - Vary the framing: per-employee cost, ROI ratio, cost-per-clause, annual savings, etc.
   - NEVER use the template: "typically spend $X–$Y on full implementation and certification, depending on facility size and existing documentation maturity"

3. CTA CLOSINGS — Never use the same CTA pattern:
   - BANNED: "Ready to [start/begin] your [ISO standard] journey? Book a free [consultation/gap assessment] with ISO Certification Consultant..."
   - Rotate between: resource offer, next-step checklist, diagnostic question, ROI calculator mention, specific team action item, downloadable template reference
   - Each article's CTA must be structurally different from the diversity brief's listed CTAs

4. PROCESS DESCRIPTION — Never describe the 6-stage process the same way:
   - BANNED verbatim: "Gap Assessment → Training → Documentation → Implementation → Internal Audit → Certification"
   - If referencing the process, describe only the 1-2 stages relevant to the article's topic in detail
   - Use different framing: timeline view, resource view, team responsibility view, common-mistakes view

5. FILLER PHRASE BLOCKLIST (in addition to existing banned phrases):
   - "from scratch" / "from the ground up" — reword every time
   - "documentation burden" / "documentation maturity" — use specific alternatives
   - "competitive advantage" / "competitive edge" — describe the actual advantage instead
   - "small/mid-size manufacturers" — vary with: "shops under 50 employees", "regional fabricators", "family-owned operations", "growing production facilities"

6. STAT TRIO BAN:
   - NEVER use "98% first-time pass rate, 250+ audits, 15+ years" as a group
   - Pick at most ONE stat per article and frame it differently each time

═══════════════════════════════════════════════════════════
VISUAL ENHANCEMENT — Built into the first draft (no separate enhancer step)
═══════════════════════════════════════════════════════════

- BOLD KEY PHRASES: Bold 8-12 key phrases that carry the most important info
- CALLOUT BOXES: Add 2-3 callout boxes using ONLY these formats:
  > **Important:** [critical compliance information]
  > **Did You Know?** [surprising statistic or fact]
  > **Key Consideration:** [practical advice from field experience]
  NEVER use "Pro Tip" — it is banned.
- KEY TAKEAWAYS: Add a summary box at the very top with 3-5 bullet points:
  > **Key Takeaways:**
  > - Point one
  > - Point two
- PARAGRAPH LENGTH: Max 4 sentences per paragraph — split longer ones
- VISUAL RHYTHM: Alternate between paragraphs, lists, callouts — never 3+ consecutive plain paragraphs

═══════════════════════════════════════════════════════════
ARTICLE STRUCTURE — Adapts to the article type provided
═══════════════════════════════════════════════════════════

You will receive an "articleType" field. Follow the matching structure:

**deep-guide**: Key Takeaways → 5-6 H2 sections with progressive depth → FAQ (5 Q&As) → CTA
**case-study**: Key Takeaways → Company Profile (fictional Ontario manufacturer) → The Challenge → The Approach → Implementation Details → Results & Numbers → Lessons Learned → CTA
**comparison**: Key Takeaways → Overview of Both Options → Side-by-Side Comparison (use a markdown table) → Key Differences Explained → Decision Framework ("Which is right for you?") → FAQ (5 Q&As) → CTA
**checklist**: Key Takeaways → Brief intro paragraph → 7-12 Numbered Items (each as H2 with 2-3 sentence explanation) → Quick-Reference Summary → CTA
**industry-spotlight**: Key Takeaways → Industry Overview & Landscape → Key Quality Challenges → Relevant ISO Standards → Real Examples from Ontario → Getting Started → CTA
**myth-buster**: Key Takeaways → Brief intro → 5-7 Myths (each as H2: "Myth: [statement]" then "Reality: [truth]" then "What to do instead") → CTA
**trend-opinion**: Key Takeaways → Current State → What's Changing → 3-4 Emerging Trends (each as H2 with analysis) → Impact on Manufacturers → How to Prepare → CTA
**how-to**: Key Takeaways → Brief intro → Steps 1-7 (each as H2 with actionable details, tools needed, common pitfalls) → CTA

If no articleType is provided, default to "deep-guide".

TONE:
- Use "we" when referring to ISO Certification Consultant, "you" when addressing the reader
- Short paragraphs (2-4 sentences max)
- Professional and authoritative, not salesy

OUTPUT: Return the article as clean markdown. No code blocks. No title (title is separate). Start directly with the Key Takeaways box.`;

// ── Self-check instruction appended to every user prompt ──
const SELF_CHECK = `

═══════════════════════════════════════════════════════════
SELF-CHECK — Before returning your article, verify EVERY item:
═══════════════════════════════════════════════════════════
□ Primary keyword appears in first 100 words (verbatim)
□ 3-5 internal links woven mid-sentence (at least 1 service page, 1 /contact)
□ 3-5 external links from the provided list, woven mid-sentence
□ 3-5 [IMAGE:] markers — manufacturing/industrial scenes only, all unique
□ CTA paragraph at end with /contact link
□ Word count 1,500-1,800 (count carefully)
□ 8-12 bold key phrases
□ 2-3 callout boxes (Important / Did You Know / Key Consideration — NEVER Pro Tip)
□ Key Takeaways box at the top
□ Zero banned phrases used
□ Named Ontario manufacturer example with specific Ontario city
□ No placeholder text
□ Bullet/numbered lists with 1-2 sentence descriptions (at least 2 lists)
□ Article structure matches the articleType provided

If ANY item fails, fix it before returning. This checklist IS your quality gate.`;

async function writeArticle(keywordBrief, context) {
  log("articleWriter", "writing", `"${keywordBrief.title}"`);

  // Build context sections from contextLoader output
  const internalLinksSection = context
    ? `AVAILABLE INTERNAL LINKS (use exactly 4 from this list):
Service Pages:
${(context.internalLinks?.servicePages || []).map((s) => `- [${s.title}](${s.url})`).join("\n")}

Related Blog Posts:
${(context.internalLinks?.blogPosts || []).map((p) => `- [${p.title}](${p.url})`).join("\n") || "- None available yet — use service pages and /contact instead"}`
    : `AVAILABLE INTERNAL LINKS:
- /services — All ISO services
- /services/iso-9001 — ISO 9001 Quality Management
- /process — Our 4-step certification process
- /contact — Book consultation`;

  const externalLinksSection = context
    ? `AVAILABLE EXTERNAL LINKS (use exactly 4 from this list — these are pre-verified and unique):
${(context.externalLinks || []).map((l) => `- [${l.name}](${l.url}) — ${l.context}`).join("\n")}`
    : `EXTERNAL LINKS: Use 4 industry-specific authoritative sources relevant to the topic.`;

  const article = await claudeCall(
    SYSTEM_PROMPT,
    `Write a full blog article based on this brief:

Title: ${keywordBrief.title}
Article Type: ${keywordBrief.articleType || "deep-guide"}
Primary Keyword: ${keywordBrief.primaryKeyword}
Secondary Keywords: ${keywordBrief.secondaryKeywords.join(", ")}
Search Intent: ${keywordBrief.searchIntent}
Target Word Count: 1,600
Target City: ${keywordBrief.targetCity || "Ontario (general)"}
Meta Description: ${keywordBrief.metaDescription}

IMPORTANT: Follow the "${keywordBrief.articleType || "deep-guide"}" article structure defined above.

H2 Structure to follow:
${keywordBrief.h2Structure.map((h) => `- ${h}`).join("\n")}

FAQ Questions to answer (${keywordBrief.articleType === "checklist" || keywordBrief.articleType === "myth-buster" ? "include at end if space permits" : "in ## Frequently Asked Questions section"}):
${keywordBrief.faqQuestions.map((q) => `- ${q}`).join("\n")}

${internalLinksSection}

${externalLinksSection}

${keywordBrief.rewriteInstructions ? `\nREWRITE INSTRUCTIONS (fix these specific issues from previous draft):\n${keywordBrief.rewriteInstructions}\n` : ""}

${context.diversityBrief ? `\n${context.diversityBrief}\n` : ""}

Write the full article now. Target 1,600 words. Include all visual enhancements (bold, callouts, key takeaways) in this draft.${SELF_CHECK}`,
    8192
  );

  const wordCount = article.split(/\s+/).length;
  log("articleWriter", "complete", `${wordCount} words`);

  return {
    title: keywordBrief.title,
    body: article,
    wordCount,
    metaDescription: keywordBrief.metaDescription,
    primaryKeyword: keywordBrief.primaryKeyword,
    secondaryKeywords: keywordBrief.secondaryKeywords,
    category: detectCategory(keywordBrief.primaryKeyword),
    readTime: `${Math.ceil(wordCount / 200)} min read`,
  };
}

// ── Mega-article chapter writer ────────────────────────────────

const CHAPTER_SYSTEM_PROMPT = `You are an expert B2B content writer specializing in ISO consulting for Canadian manufacturers. You write in an authoritative but accessible tone — like a senior ISO consultant with 25 years of experience explaining to a quality manager or plant director.

CRITICAL: The current year is ${CURRENT_YEAR}. All references to years MUST use ${CURRENT_YEAR}.

YOU ARE WRITING ONE CHAPTER of a larger mega-article (9-10 chapters, 18,000-20,000 words total). This chapter must:
- Be 2,000-2,200 words (MINIMUM 1,800 words — this is non-negotiable)
- Cover its specific topic thoroughly with actionable detail
- Flow naturally from the previous chapter and into the next
- NOT repeat content from other chapters (summaries of previous chapters provided)
- Include 1-2 [IMAGE:] markers for inline images (manufacturing/industrial scenes ONLY)

WRITING RULES:
- Use H2 (##) for the chapter title, H3 (###) for subsections
- Short paragraphs (2-4 sentences max)
- Use bullet points and numbered lists for scanability
- Include specific Canadian examples, regulations, and industry references
- Include at least 1 internal link and 1 external link per chapter
- No AI-sounding phrases: avoid "delve into", "it is worth noting", "in conclusion", "comprehensive", "crucial", "landscape"
- Use "we" when referring to ISO Certification Consultant, "you" when addressing the reader
- Bold 3-5 key phrases per chapter
- Add 1 callout box per chapter using **Important:** or **Did You Know?** or **Key Consideration:** (NEVER "Pro Tip")

LINK REQUIREMENTS:
- Internal links woven naturally mid-sentence (not appended)
- External links to INDUSTRY-SPECIFIC sources (not generic iso.org)
- Each chapter's external links must be UNIQUE — never reuse links from other chapters

IMAGE MARKERS:
- Place 1-2 [IMAGE:] markers after the first paragraph of different H3 sections
- Format: [IMAGE: specific descriptive manufacturing/industrial scene]
- NEVER describe office, boardroom, desk, or corporate meeting scenes

OUTPUT: Return the chapter as clean markdown. Start with ## Chapter Title. No preamble.`;

async function writeChapter(chapterBrief) {
  const { chapter, outline, previousChapterSummaries, megaKeywordBrief } = chapterBrief;

  log("articleWriter", "chapter", `writing Ch${chapter.number}: "${chapter.title}" (~${chapter.targetWords} words)`);

  // Use Haiku for chapter writing (5x faster, 5x cheaper) — QA gate uses Sonnet
  const chapterContent = await claudeCallFast(
    CHAPTER_SYSTEM_PROMPT,
    `Write Chapter ${chapter.number} of a ${outline.chapters.length}-chapter mega-article.

MEGA-ARTICLE TITLE: ${outline.title}
PRIMARY KEYWORD: ${megaKeywordBrief.primaryKeyword}

THIS CHAPTER:
- Title: ${chapter.title}
- Target words: ${chapter.targetWords}
- Chapter keyword: ${chapter.chapterKeyword}
- Keywords to weave in: ${chapter.keywordsToWeave.join(", ")}
- Content notes: ${chapter.contentNotes}

SUBSECTIONS TO COVER:
${chapter.subsections.map((s) => `### ${s.title}\nKey points: ${s.keyPoints.join("; ")}`).join("\n\n")}

INTERNAL LINK TARGETS (use 1-2 per chapter, naturally mid-sentence):
${(outline.internalLinkTargets || []).join(", ")}

EXTERNAL LINK TARGETS (use 1-2 per chapter, unique to this chapter):
${(outline.externalLinkTargets || []).slice((chapter.number - 1) * 2, chapter.number * 2).join(", ") || "Find a relevant industry-specific source"}

${previousChapterSummaries.length > 0 ? `PREVIOUS CHAPTERS (DO NOT repeat this content):
${previousChapterSummaries.map((s) => `- Ch${s.number}: ${s.title} — ${s.summary}`).join("\n")}` : "This is the FIRST chapter. Set the stage for the entire article."}

${chapter.number === outline.chapters.length ? "This is the FINAL chapter. End with a strong CTA paragraph linking to /contact." : ""}

Write the complete chapter now. Minimum 1,800 words, target 2,000-2,200. Start with ## heading.`,
    8192
  );

  const wordCount = chapterContent.split(/\s+/).length;
  log("articleWriter", "chapter-done", `Ch${chapter.number}: ${wordCount} words`);

  // Generate a brief summary for subsequent chapters to avoid repetition
  const summary = chapterContent.split("\n").filter((l) => l.trim() && !l.startsWith("#") && !l.startsWith("[IMAGE")).slice(0, 3).join(" ").slice(0, 200);

  return {
    number: chapter.number,
    title: chapter.title,
    body: chapterContent,
    wordCount,
    summary,
  };
}

function detectCategory(keyword) {
  const kw = keyword.toLowerCase();
  if (kw.includes("9001")) return "ISO 9001";
  if (kw.includes("14001")) return "ISO 14001";
  if (kw.includes("45001")) return "ISO 45001";
  if (kw.includes("13485")) return "ISO 13485";
  if (kw.includes("27001")) return "ISO 27001";
  if (kw.includes("22000") || kw.includes("food safety")) return "ISO 22000";
  if (kw.includes("16949") || kw.includes("iatf")) return "IATF 16949";
  if (kw.includes("as9100") || kw.includes("aerospace")) return "AS9100";
  if (kw.includes("22301") || kw.includes("business continuity")) return "ISO 22301";
  if (kw.includes("17025") || kw.includes("laboratory")) return "ISO 17025";
  if (kw.includes("audit")) return "Auditing";
  if (kw.includes("training")) return "Training";
  return "ISO Certification";
}

module.exports = { writeArticle, writeChapter, detectCategory };
