const { log } = require("../shared/logger");
const { sanityQuery } = require("../shared/sanity");

const COST_RE = /\$[\d,]+[–\-—]+\$[\d,]+/g;
const PROCESS_RE = /gap assessment.*?training.*?documentation.*?implementation/i;
const READY_CTA_RE = /ready to (?:start|begin|take|get)/i;
const BOOK_CTA_RE = /book (?:a |your )?(?:free )?(?:consultation|assessment|gap)/i;

/**
 * Extract plain text from Sanity portable text body.
 */
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

/**
 * Get n-grams (n consecutive words) from text.
 */
function getNgrams(text, n) {
  const words = text.toLowerCase().split(/\s+/);
  const ngrams = new Set();
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.add(words.slice(i, i + n).join(" "));
  }
  return ngrams;
}

/**
 * Compute Jaccard similarity between two sets of n-grams.
 */
function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Audit all published articles for cross-article similarity.
 * Returns a detailed report with similarity scores, duplicate phrases,
 * and rewrite priority list.
 */
async function auditAllArticles() {
  log("contentSimilarityAudit", "start", "fetching all articles from Sanity");

  const posts = await sanityQuery(
    '*[_type == "blogPost"]{ title, slug, body, publishedAt } | order(publishedAt desc)'
  );

  if (!posts || posts.length === 0) {
    return { articles: [], pairs: [], costFigures: {}, summary: "No articles found." };
  }

  // Parse all articles
  const articles = posts
    .map((p) => {
      const text = bodyToText(p.body);
      const words = text.split(/\s+/).length;
      if (words < 200) return null; // skip stubs

      const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.length > 20);
      const opening = sentences[0] || "";
      const closing = sentences.slice(-3).join(" ");
      const costs = text.match(COST_RE) || [];
      const hasProcessDesc = PROCESS_RE.test(text);
      const hasReadyCTA = READY_CTA_RE.test(closing);
      const hasBookCTA = BOOK_CTA_RE.test(closing);

      return {
        title: p.title,
        slug: p.slug?.current || "",
        publishedAt: p.publishedAt || "",
        wordCount: words,
        text,
        opening: opening.slice(0, 150),
        closing: closing.slice(0, 250),
        costs,
        hasProcessDesc,
        hasReadyCTA,
        hasBookCTA,
        ngrams8: getNgrams(text, 8),
      };
    })
    .filter(Boolean);

  log("contentSimilarityAudit", "parsed", `${articles.length} articles with >200 words`);

  // Compute pairwise similarity
  const pairs = [];
  for (let i = 0; i < articles.length; i++) {
    for (let j = i + 1; j < articles.length; j++) {
      const sim = jaccardSimilarity(articles[i].ngrams8, articles[j].ngrams8);
      if (sim > 0.05) {
        // Find shared n-grams
        const shared = [];
        for (const ng of articles[i].ngrams8) {
          if (articles[j].ngrams8.has(ng)) shared.push(ng);
        }

        pairs.push({
          articleA: articles[i].title,
          slugA: articles[i].slug,
          articleB: articles[j].title,
          slugB: articles[j].slug,
          similarity: Math.round(sim * 100) / 100,
          sharedPhrases: shared.slice(0, 10),
        });
      }
    }
  }

  pairs.sort((a, b) => b.similarity - a.similarity);

  // Aggregate cost figures across all articles
  const costFigures = {};
  for (const a of articles) {
    for (const c of a.costs) {
      if (!costFigures[c]) costFigures[c] = [];
      costFigures[c].push(a.slug);
    }
  }

  // Count pattern usage
  const processDescCount = articles.filter((a) => a.hasProcessDesc).length;
  const readyCTACount = articles.filter((a) => a.hasReadyCTA).length;
  const bookCTACount = articles.filter((a) => a.hasBookCTA).length;

  // Compute per-article similarity score (average of top 3 pairwise similarities)
  const articleScores = articles.map((a) => {
    const relevantPairs = pairs.filter(
      (p) => p.slugA === a.slug || p.slugB === a.slug
    );
    const topSims = relevantPairs
      .map((p) => p.similarity)
      .sort((x, y) => y - x)
      .slice(0, 3);
    const avgSim = topSims.length > 0
      ? topSims.reduce((s, v) => s + v, 0) / topSims.length
      : 0;

    return {
      title: a.title,
      slug: a.slug,
      wordCount: a.wordCount,
      similarityScore: Math.round(avgSim * 100) / 100,
      opening: a.opening,
      closing: a.closing.slice(0, 150),
      costCount: a.costs.length,
      hasProcessDesc: a.hasProcessDesc,
      hasReadyCTA: a.hasReadyCTA,
      hasBookCTA: a.hasBookCTA,
    };
  });

  articleScores.sort((a, b) => b.similarityScore - a.similarityScore);

  const report = {
    totalArticles: articles.length,
    pairsAboveThreshold: pairs.length,
    patterns: {
      processDescription: `${processDescCount}/${articles.length} articles`,
      readyToCTA: `${readyCTACount}/${articles.length} articles`,
      bookConsultationCTA: `${bookCTACount}/${articles.length} articles`,
    },
    costFigures: Object.entries(costFigures)
      .filter(([, slugs]) => slugs.length >= 2)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([figure, slugs]) => ({ figure, count: slugs.length, articles: slugs.slice(0, 5) })),
    articles: articleScores,
    topSimilarPairs: pairs.slice(0, 20),
    summary: `${articles.length} articles analyzed. ${pairs.length} pairs with >5% 8-gram overlap. ${processDescCount} use verbatim process description. ${readyCTACount} use "Ready to..." CTA. Top duplicate cost: ${Object.entries(costFigures).sort((a, b) => b[1].length - a[1].length)[0]?.[0] || "none"} (${Object.entries(costFigures).sort((a, b) => b[1].length - a[1].length)[0]?.[1]?.length || 0} articles).`,
  };

  log("contentSimilarityAudit", "complete", report.summary);
  return report;
}

/**
 * Flag articles that exceed the similarity threshold for content refresh.
 * Returns structured instructions for the contentRefresher.
 */
function flagForRefresh(auditReport, threshold = 0.08) {
  const flagged = [];

  for (const article of auditReport.articles) {
    if (article.similarityScore < threshold) continue;

    const issues = [];

    if (article.hasProcessDesc) {
      issues.push("Contains verbatim 6-stage process description — rewrite with unique framing");
    }
    if (article.hasReadyCTA) {
      issues.push('Uses "Ready to..." CTA template — replace with unique closing');
    }
    if (article.hasBookCTA) {
      issues.push('Uses "Book consultation" CTA — try diagnostic question, ROI framing, or next-step checklist');
    }

    // Find which cost figures are overused in this article
    for (const cf of auditReport.costFigures) {
      if (cf.articles.includes(article.slug) && cf.count >= 3) {
        issues.push(`Cost figure "${cf.figure}" used in ${cf.count} articles — reframe with unique context`);
      }
    }

    // Find the most similar pair for context
    const similarPair = auditReport.topSimilarPairs.find(
      (p) => p.slugA === article.slug || p.slugB === article.slug
    );
    if (similarPair) {
      const otherTitle = similarPair.slugA === article.slug ? similarPair.articleB : similarPair.articleA;
      issues.push(`Most similar to "${otherTitle}" (${Math.round(similarPair.similarity * 100)}% overlap) — shared phrases: ${similarPair.sharedPhrases.slice(0, 3).join("; ")}`);
    }

    if (issues.length > 0) {
      flagged.push({
        slug: article.slug,
        title: article.title,
        similarityScore: article.similarityScore,
        wordCount: article.wordCount,
        refreshInstructions: issues.join("\n"),
        priority: article.similarityScore > 0.15 ? "HIGH" : "MEDIUM",
      });
    }
  }

  flagged.sort((a, b) => b.similarityScore - a.similarityScore);

  log(
    "contentSimilarityAudit",
    "flagged",
    `${flagged.length} articles above ${threshold} threshold — ${flagged.filter((f) => f.priority === "HIGH").length} HIGH, ${flagged.filter((f) => f.priority === "MEDIUM").length} MEDIUM`
  );

  return flagged;
}

module.exports = { auditAllArticles, flagForRefresh };
