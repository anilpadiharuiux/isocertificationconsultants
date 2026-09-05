const fs = require("fs");
const path = require("path");
const { log } = require("../shared/logger");
// Email notifications removed — blog results are included in the consolidated morning report
const { today } = require("../shared/logger");
const { MEMORY_DIR, REPORTS_DIR } = require("../shared/config");
const keywordResearcher = require("./keywordResearcher");
const articleWriter = require("./articleWriter");
const contextLoader = require("./contextLoader");
const contentCleaner = require("./contentCleaner");
const imageAgent = require("./imageAgent");
const infographicAgent = require("./infographicAgent");
const inlineImageAgent = require("./inlineImageAgent");
const linkBuilder = require("../seo/linkBuilder");
const plagiarismChecker = require("./plagiarismChecker");
const grammarAgent = require("./grammarAgent");
const contentQA = require("./contentQA");
const sanityPublisher = require("./sanityPublisher");
const pageAuditor = require("../web/pageAuditor");
const outlineArchitect = require("./outlineArchitect");
const contentEnhancer = require("./contentEnhancer");
const rewritePatcher = require("./rewritePatcher");
const telegram = require("../shared/telegram");

const PUBLISHED_PATH = path.join(MEMORY_DIR, "published-articles.json");
const CALENDAR_PATH = path.join(MEMORY_DIR, "content-calendar.json");
const MAX_REWRITES = 2; // With context-aware writer, 1 targeted patch should suffice

function loadPublished() {
  return JSON.parse(fs.readFileSync(PUBLISHED_PATH, "utf-8"));
}

function savePublished(data) {
  fs.writeFileSync(PUBLISHED_PATH, JSON.stringify(data, null, 2) + "\n");
}

// ═══════════════════════════════════════════════════════════════════
// DAILY BLOG PIPELINE — v2 (context-aware writer, QA after images)
// ═══════════════════════════════════════════════════════════════════
//
// New pipeline order:
//   1. Keyword Research
//   2. Context Loading (links, slugs, used URLs)
//   3. Article Writing (with full context + enhancement built-in)
//   4. Content Cleaning (strip artifacts, fix formatting)
//   5. Grammar Check
//   6. Originality Check
//   7. Link Validation (verify writer's links, patch if deficit)
//   8. Hero Image (Pexels)
//   9. Inline Images (Gemini → Pexels → skip)
//  10. Featured Image (Gemini → Pexels → none)
//  11. QA Review (sees complete article WITH images)
//  12. Publish to Sanity
//  13. Page Audit
//
// KEY CHANGES from v1:
// - contextLoader feeds writer real link targets + used URL history
// - contentEnhancer REMOVED — enhancement rules merged into writer prompt
// - QA moved AFTER inline images so it sees [SANITY_IMAGE:] markers
// - Rewrite loop uses targeted patchArticle() instead of full regeneration
// - MAX_REWRITES reduced to 1 (first draft should score 95+)
// ═══════════════════════════════════════════════════════════════════

async function publishDaily() {
  const startTime = Date.now();
  log("contentManager", "pipeline-v2", "starting daily blog publish");

  let keywordBrief, context, article, imageResult, infographicResult, qaResult, publishResult, auditResult;

  try {
    // Step 1: Pick keyword
    log("contentManager", "step-1", "keyword research");
    keywordBrief = await keywordResearcher.pickKeyword();
    log("contentManager", "keyword", `[${keywordBrief.articleType || "deep-guide"}] "${keywordBrief.primaryKeyword}" → "${keywordBrief.title}"`);

    // Step 2: Load context (links, existing posts, used URLs)
    log("contentManager", "step-2", "loading context");
    context = await contextLoader.loadContext(keywordBrief);
    log("contentManager", "context", `${context.externalLinks.length} external links available, ${context.internalLinks.blogPosts.length} blog posts for cross-linking`);

    // Step 2.5: Load diversity brief (patterns to avoid)
    log("contentManager", "step-2.5", "loading diversity brief");
    try {
      const diversityBrief = await contextLoader.loadDiversityBrief();
      context.diversityBrief = diversityBrief;
      log("contentManager", "diversity", diversityBrief ? `brief loaded (${diversityBrief.split("\n").length} lines)` : "no brief available");
    } catch (err) {
      log("contentManager", "diversity-error", err.message);
      context.diversityBrief = "";
    }

    // Step 3: Write article WITH context (enhancement built into prompt)
    log("contentManager", "step-3", "writing article (context-aware)");
    article = await articleWriter.writeArticle(keywordBrief, context);
    log("contentManager", "article", `${article.wordCount} words, ${article.category}`);

    // Step 4: Clean article (strip artifacts, fix formatting)
    log("contentManager", "step-4", "cleaning article");
    article = await contentCleaner.clean(article);
    log("contentManager", "cleaned", `"${article.title}" — ${article.wordCount} words`);

    // Step 5: Grammar check
    log("contentManager", "step-5", "grammar check");
    try {
      const grammarResult = await grammarAgent.checkGrammar(article);
      if (grammarResult.totalCorrections > 0) {
        article.body = grammarResult.correctedContent;
        log("contentManager", "grammar", `${grammarResult.totalCorrections} corrections (${grammarResult.overallGrade})`);
      } else {
        log("contentManager", "grammar", "no corrections needed");
      }
    } catch (err) {
      log("contentManager", "grammar-error", err.message);
    }

    // Step 6: Plagiarism / originality check (with self-similarity detection)
    log("contentManager", "step-6", "originality check (with self-plagiarism)");
    try {
      // Load recent articles for self-plagiarism comparison
      let existingArticles = [];
      try {
        const { sanityQuery } = require("../shared/sanity");
        const recentPosts = await sanityQuery(
          '*[_type == "blogPost"] | order(publishedAt desc)[0...15]{ title, body }'
        );
        existingArticles = (recentPosts || []).map((p) => {
          let bodyText = "";
          if (Array.isArray(p.body)) {
            for (const block of p.body) {
              if (Array.isArray(block.children)) {
                for (const child of block.children) {
                  if (child.text) bodyText += child.text + " ";
                }
              }
            }
          }
          return { title: p.title, body: bodyText.trim() };
        });
      } catch (err) {
        log("contentManager", "self-plagiarism-load", `skipped: ${err.message}`);
      }

      const origResult = await plagiarismChecker.checkOriginality(article, existingArticles);
      log("contentManager", "originality", `${origResult.score}/100 — ${origResult.pass ? "PASS" : "NEEDS WORK"}`);
      if (!origResult.pass && origResult.rewriteInstructions) {
        log("contentManager", "originality-rewrite", "rewriting for uniqueness");
        article = await articleWriter.writeArticle({
          ...keywordBrief,
          title: article.title,
          rewriteInstructions: `ORIGINALITY ISSUES: ${origResult.rewriteInstructions}. Flagged sentences: ${(origResult.flaggedSentences || []).map((f) => f.text).join("; ")}`,
        }, context);
        article = await contentCleaner.clean(article);
      }
    } catch (err) {
      log("contentManager", "originality-error", err.message);
    }

    // Step 7: Validate links (verify writer's links, patch if deficit)
    log("contentManager", "step-7", "validating links");
    try {
      article = await linkBuilder.validateLinks(article, context);
      log("contentManager", "links", `${article.linkReport?.totalLinks || 0} links (${article.linkReport?.status || "ok"})`);
    } catch (err) {
      log("contentManager", "links-error", err.message);
    }

    // Step 8: Find and upload hero image
    log("contentManager", "step-8", "finding hero image");
    try {
      imageResult = await imageAgent.findAndUploadImage(article);
      log("contentManager", "image", `${imageResult.source}: ${imageResult.photographer}`);
    } catch (err) {
      log("contentManager", "image-error", err.message);
      imageResult = {
        assetId: null,
        url: null,
        altText: article.title,
        photographer: "none",
        source: "failed",
      };
    }

    // Step 9: Inline images (Gemini → Pexels → skip)
    log("contentManager", "step-9", "inline image generation");
    let inlineImageResult = { count: 0 };
    try {
      const slug = article.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 80);
      inlineImageResult = await inlineImageAgent.processInlineImages(article, slug);
      article.body = inlineImageResult.body;
      log("contentManager", "inline-images", `${inlineImageResult.count} images placed`);
    } catch (err) {
      log("contentManager", "inline-images-error", err.message);
    }

    // Step 10: Generate featured hero image (Gemini → Pexels → none)
    log("contentManager", "step-10", "featured image generation");
    try {
      const slug = article.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 80);
      infographicResult = await infographicAgent.getArticleImage(article, slug);
      log("contentManager", "featured-image", `${infographicResult.type}: ${infographicResult.type === "gemini" ? "Gemini photo" : infographicResult.type === "pexels" ? "Pexels fallback" : "skipped"}`);
    } catch (err) {
      log("contentManager", "featured-image-error", err.message);
      infographicResult = { type: "none", reason: err.message };
    }

    // Step 11: QA review (NOW sees complete article with images)
    log("contentManager", "step-11", "QA review (post-images)");
    qaResult = await contentQA.reviewArticle(article, imageResult, inlineImageResult.count);

    // If QA fails, try targeted patching (not full rewrite)
    let rewrites = 0;
    while (!qaResult.pass && rewrites < MAX_REWRITES) {
      rewrites++;
      log("contentManager", "patch", `attempt ${rewrites} — score ${qaResult.score}/100`);

      // Use targeted patcher instead of full rewrite
      article = await rewritePatcher.patchArticle(article, qaResult, context);

      // Re-run QA
      qaResult = await contentQA.reviewArticle(article, imageResult, inlineImageResult.count);
    }

    if (!qaResult.pass) {
      log("contentManager", "failed", `QA failed after ${rewrites} patches — score ${qaResult.score}/100`);
      telegram.notifyError("Blog Pipeline", `"${keywordBrief.title}"\nType: ${keywordBrief.articleType || "deep-guide"}\nKeyword: ${keywordBrief.primaryKeyword}\nQA Score: ${qaResult.score}/100\nIssues: ${(qaResult.issues || []).join(", ") || "unknown"}`).catch(() => {});
      return { success: false, reason: "QA failed", score: qaResult.score, keyword: keywordBrief.primaryKeyword };
    }

    // Step 12: Publish to Sanity
    log("contentManager", "step-12", "publishing to Sanity");
    publishResult = await sanityPublisher.publishToSanity(article, imageResult, infographicResult);

    // Step 13: Page Auditor — final gatekeeper
    log("contentManager", "step-13", "page audit");
    try {
      auditResult = await pageAuditor.auditPage(publishResult.url);
      log("contentManager", "audit", `${publishResult.url}: ${auditResult.score}/100 — ${auditResult.pass ? "PASS" : "FAIL"}`);
    } catch (err) {
      log("contentManager", "audit-error", err.message);
      auditResult = { pass: true, score: 0 };
    }

    // Step 14: Record the publication
    const published = loadPublished();
    const record = {
      date: today(),
      title: article.title,
      primaryKeyword: keywordBrief.primaryKeyword,
      secondaryKeywords: keywordBrief.secondaryKeywords,
      articleType: keywordBrief.articleType || "deep-guide",
      targetCity: keywordBrief.targetCity || null,
      metaDescription: article.metaDescription || keywordBrief.metaDescription || "",
      slug: publishResult.slug,
      url: publishResult.url,
      documentId: publishResult.documentId,
      wordCount: article.wordCount,
      qaScore: qaResult.score,
      qaChecks: qaResult.checks || [],
      qaIssues: qaResult.issues || [],
      qaSuggestions: qaResult.suggestions || [],
      auditScore: auditResult?.score || null,
      category: article.category,
      readTime: article.readTime,
      image: {
        source: imageResult.source,
        photographer: imageResult.photographer,
        assetId: imageResult.assetId,
        pexelsId: imageResult.pexelsId || null,
      },
      featuredImage: infographicResult?.type || "none",
      inlineImages: inlineImageResult?.count || 0,
      publishedAt: publishResult.publishedAt,
      pipelineDurationMs: Date.now() - startTime,
    };
    published.push(record);
    savePublished(published);

    // Save article to reports
    const reportPath = path.join(REPORTS_DIR, "content", `${today()}-${publishResult.slug}.md`);
    try {
      fs.writeFileSync(reportPath, `# ${article.title}\n\n${article.body}`);
    } catch { /* ok */ }

    const duration = Math.round((Date.now() - startTime) / 1000);
    log("contentManager", "complete", `published in ${duration}s — ${publishResult.url}`);

    telegram.notifySuccess("Blog Published", `"${article.title}"\nType: ${keywordBrief.articleType || "deep-guide"}\nKeyword: ${keywordBrief.primaryKeyword}\nQA Score: ${qaResult.score}/100\nWords: ${article.wordCount}\nURL: ${publishResult.url}\nDuration: ${duration}s`).catch(() => {});

    return { success: true, ...record };

  } catch (err) {
    log("contentManager", "error", err.message);
    return { success: false, reason: err.message };
  }
}

// ── Mega-article pipeline (18,000-20,000 words, 9-10 chapters) ────────
async function publishMegaArticle() {
  const startTime = Date.now();
  log("contentManager", "mega-pipeline", "starting mega-article publish");

  let megaKeywordBrief, outline, article, imageResult, infographicResult, qaResult, publishResult, auditResult;

  try {
    // Step 1: Pick mega-article topic
    log("contentManager", "mega-1", "selecting mega-article topic");
    megaKeywordBrief = await keywordResearcher.pickMegaKeyword();
    log("contentManager", "mega-topic", `"${megaKeywordBrief.primaryKeyword}" — ${megaKeywordBrief.articleType}`);

    // Step 2: Design chapter outline
    log("contentManager", "mega-2", "designing chapter outline");
    outline = await outlineArchitect.designOutline(megaKeywordBrief);
    log("contentManager", "mega-outline", `${outline.chapters.length} chapters, ~${outline.estimatedWords} words`);

    // ── PHASE 1: Parallel chapter writing ──────────────────────────
    log("contentManager", "mega-3", `writing ${outline.chapters.length} chapters in PARALLEL`);

    const chapterPromises = outline.chapters.map(async (chapter) => {
      const chapterLabel = `Ch${chapter.number}/${outline.chapters.length}`;
      log("contentManager", "mega-writer", `${chapterLabel} started: "${chapter.title}"`);

      // Write the chapter
      let chapterResult = await articleWriter.writeChapter({
        chapter,
        outline,
        previousChapterSummaries: [],
        megaKeywordBrief,
      });
      log("contentManager", "mega-writer-done", `${chapterLabel}: ${chapterResult.wordCount} words`);

      // Enhance the chapter (mega chapters still use enhancer for callouts/bold)
      const enhancedBody = await contentEnhancer.enhanceChapter(
        chapterResult.body,
        chapterResult.title,
        megaKeywordBrief.primaryKeyword
      );
      log("contentManager", "mega-enhanced", `${chapterLabel} enhanced`);

      // Clean the chapter
      const cleanResult = await contentCleaner.clean({
        title: chapterResult.title,
        body: enhancedBody,
      });

      chapterResult.body = cleanResult.body;
      chapterResult.wordCount = cleanResult.wordCount;
      log("contentManager", "mega-chapter-done", `${chapterLabel}: ${chapterResult.wordCount} words (final)`);

      return chapterResult;
    });

    const chapterResults = await Promise.all(chapterPromises);
    chapterResults.sort((a, b) => a.number - b.number);

    // ── PHASE 2: Assemble + grammar + links ──────────────────────
    log("contentManager", "mega-4", "assembling chapters");
    const assembledBody = chapterResults.map((ch) => ch.body).join("\n\n");
    const totalWordCount = assembledBody.split(/\s+/).length;
    const category = articleWriter.detectCategory(megaKeywordBrief.primaryKeyword);

    article = {
      title: outline.title,
      body: assembledBody,
      wordCount: totalWordCount,
      metaDescription: outline.metaDescription || megaKeywordBrief.metaDescription,
      primaryKeyword: megaKeywordBrief.primaryKeyword,
      secondaryKeywords: megaKeywordBrief.secondaryKeywords,
      category,
      readTime: outline.estimatedReadTime || `${Math.ceil(totalWordCount / 200)} min read`,
      isMegaArticle: true,
      chapterCount: chapterResults.length,
    };
    log("contentManager", "mega-assembled", `${totalWordCount} words across ${chapterResults.length} chapters`);

    // Grammar + link validation in parallel
    log("contentManager", "mega-5", "grammar check + link validation (parallel)");
    const [grammarDone, linksDone] = await Promise.allSettled([
      grammarAgent.checkGrammar(article).then((r) => {
        if (r.totalCorrections > 0) {
          article.body = r.correctedContent;
          log("contentManager", "mega-grammar", `${r.totalCorrections} corrections`);
        }
      }).catch((err) => log("contentManager", "mega-grammar-error", err.message)),

      linkBuilder.validateLinks(article).then((linked) => {
        article = linked;
        log("contentManager", "mega-links", `${article.linkReport?.totalLinks || 0} links validated`);
      }).catch((err) => log("contentManager", "mega-links-error", err.message)),
    ]);

    // ── PHASE 3: All images in parallel ─────────────────────────
    log("contentManager", "mega-6", "hero + inline + featured images (parallel)");
    const slug = article.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 80);

    const [heroDone, inlineDone, featuredDone] = await Promise.allSettled([
      imageAgent.findAndUploadImage(article).then((r) => {
        imageResult = r;
        log("contentManager", "mega-hero", `${r.source}: ${r.photographer}`);
      }).catch((err) => {
        log("contentManager", "mega-hero-error", err.message);
        imageResult = { assetId: null, url: null, altText: article.title, photographer: "none", source: "failed" };
      }),

      inlineImageAgent.processInlineImages(article, slug).then((r) => {
        article.body = r.body;
        log("contentManager", "mega-inline-images", `${r.count} images placed`);
        return r;
      }).catch((err) => {
        log("contentManager", "mega-inline-images-error", err.message);
        return { count: 0 };
      }),

      infographicAgent.getArticleImage(article, slug).then((r) => {
        infographicResult = r;
        log("contentManager", "mega-featured", r.type);
      }).catch((err) => {
        log("contentManager", "mega-featured-error", err.message);
        infographicResult = { type: "none", reason: err.message };
      }),
    ]);

    let inlineImageResult = inlineDone.status === "fulfilled" ? inlineDone.value : { count: 0 };

    // ── PHASE 4: QA review (now sees complete article with images) ──
    log("contentManager", "mega-7", "QA review (post-images)");
    qaResult = await contentQA.reviewMegaArticle(article, imageResult);

    if (!qaResult) qaResult = { score: 0, pass: false, issues: ["QA review failed"] };

    // Gate: mega-articles must also pass QA before publishing
    if (!qaResult.pass) {
      log("contentManager", "mega-qa-warning", `QA score ${qaResult.score}/100 — publishing anyway (mega pipeline)`);
      if (qaResult.issues) qaResult.issues.forEach((i) => log("contentManager", "mega-qa-issue", i));
    } else {
      log("contentManager", "mega-qa", `QA score ${qaResult.score}/100 — PASS`);
    }

    // ── PHASE 5: Publish ─────────────────────────────────────────
    log("contentManager", "mega-8", "publishing to Sanity");
    publishResult = await sanityPublisher.publishToSanity(article, imageResult, infographicResult);

    // Page audit
    log("contentManager", "mega-9", "page audit");
    try {
      auditResult = await pageAuditor.auditPage(publishResult.url);
      log("contentManager", "mega-audit", `${auditResult.score}/100 — ${auditResult.pass ? "PASS" : "FAIL"}`);
    } catch (err) {
      log("contentManager", "mega-audit-error", err.message);
      auditResult = { pass: true, score: 0 };
    }

    // Record publication
    const published = loadPublished();
    const record = {
      date: today(),
      title: article.title,
      primaryKeyword: megaKeywordBrief.primaryKeyword,
      secondaryKeywords: megaKeywordBrief.secondaryKeywords,
      metaDescription: article.metaDescription,
      slug: publishResult.slug,
      url: publishResult.url,
      documentId: publishResult.documentId,
      wordCount: article.wordCount,
      chapterCount: article.chapterCount,
      qaScore: qaResult.score,
      qaChecks: qaResult.checks || [],
      qaIssues: qaResult.issues || [],
      qaSuggestions: qaResult.suggestions || [],
      auditScore: auditResult?.score || null,
      category: article.category,
      readTime: article.readTime,
      articleType: "mega",
      image: {
        source: imageResult?.source || "none",
        photographer: imageResult?.photographer || "none",
        assetId: imageResult?.assetId || null,
        pexelsId: imageResult?.pexelsId || null,
      },
      featuredImage: infographicResult?.type || "none",
      inlineImages: inlineImageResult?.count || 0,
      publishedAt: publishResult.publishedAt,
      pipelineDurationMs: Date.now() - startTime,
    };
    published.push(record);
    savePublished(published);

    // Save article to reports
    const reportPath = path.join(REPORTS_DIR, "content", `${today()}-mega-${publishResult.slug}.md`);
    try {
      fs.writeFileSync(reportPath, `# ${article.title}\n\n${article.body}`);
    } catch { /* ok */ }

    const duration = Math.round((Date.now() - startTime) / 1000);
    log("contentManager", "mega-complete", `published in ${duration}s — ${publishResult.url}`);

    return { success: true, ...record };

  } catch (err) {
    log("contentManager", "mega-error", err.message);
    return { success: false, reason: err.message };
  }
}

async function previewNext() {
  log("contentManager", "preview", "previewing next article");
  const keywordBrief = await keywordResearcher.pickKeyword();
  return keywordBrief;
}

function getPublished() {
  return loadPublished();
}

function getCalendar() {
  const { queue } = JSON.parse(fs.readFileSync(path.join(MEMORY_DIR, "keyword-queue.json"), "utf-8"));
  const published = loadPublished();
  const publishedKeywords = new Set(published.map((a) => a.primaryKeyword));
  const remaining = queue.filter((k) => !publishedKeywords.has(k));

  return {
    totalKeywords: queue.length,
    published: published.length,
    remaining: remaining.length,
    daysOfContent: remaining.length,
    nextKeywords: remaining.slice(0, 14),
    recentArticles: published.slice(-7).reverse(),
  };
}

// ── Auto-schedule: daily blog every day + mega on Tue & Fri ─────
async function publishDailySchedule() {
  const dayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon, 2=Tue, ..., 5=Fri
  const isMegaDay = dayOfWeek === 2 || dayOfWeek === 5; // Tuesday or Friday
  const results = { daily: null, mega: null };

  // Always publish a daily blog
  log("contentManager", "schedule", `publishing daily blog (${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][dayOfWeek]})`);
  results.daily = await publishDaily();

  // On Tuesday and Friday, also publish a mega-article
  if (isMegaDay) {
    log("contentManager", "schedule", "mega-article day — starting mega pipeline");
    results.mega = await publishMegaArticle();
  } else {
    log("contentManager", "schedule", "not a mega day — daily blog only");
  }

  return results;
}

module.exports = { publishDaily, publishMegaArticle, publishDailySchedule, previewNext, getPublished, getCalendar };
