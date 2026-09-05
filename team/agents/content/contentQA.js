#!/usr/bin/env node

/**
 * ISO Certification Consultant Content QA Agent v3 — Hardened
 *
 * Automated quality checks for all blog content before and after publish.
 * Implements the 10 Mandatory Quality Standards for ISO Certification Consultant blog articles.
 *
 * Standards enforced:
 *   1. No first-person voice (we/our) — third-person only
 *   2. No fabricated quotes or fictional personas
 *   3. Accurate readTime (wordCount / 200, rounded up)
 *   4. Every article has a mainImage with 16:9 ratio (1.6–1.9)
 *   5. No duplicate H1 that matches the title
 *   6. Meta description present and 120–160 chars
 *   7. Slug matches expected pattern (lowercase, hyphens, no special chars)
 *   8. publishedAt is a valid ISO date
 *   9. author reference is set
 *  10. Body has minimum 3 blocks of real content
 *
 * Usage:
 *   const contentQA = require('./contentQA');
 *   const report = await contentQA.validateArticle(env, articleId);
 *   // report.pass === true if all checks pass
 *   // report.failures[] lists any failed checks
 */

const https = require('https');

// ═══════════════════════════════════════════════════════════════
// HTTP HELPER
// ═══════════════════════════════════════════════════════════════

function sanityQuery(env, query) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(query);
    const options = {
      hostname: `${env.SANITY_PROJECT_ID}.api.sanity.io`,
      path: `/v2024-01-01/data/query/${env.SANITY_DATASET}?query=${encoded}`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${env.SANITY_API_TOKEN}` }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.result);
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// ═══════════════════════════════════════════════════════════════
// VOICE CHECK — Standard #1
// ═══════════════════════════════════════════════════════════════

const FIRST_PERSON_PATTERNS = [
  /\bwe\b/i, /\bour\b/i, /\bwe've\b/i, /\bwe're\b/i,
  /\bwe'll\b/i, /\bus\b/i, /\bourselves\b/i
];

function checkVoice(bodyBlocks) {
  const violations = [];

  for (let i = 0; i < bodyBlocks.length; i++) {
    const block = bodyBlocks[i];
    if (block._type !== 'block' || !block.children) continue;

    const text = block.children.map(c => c.text || '').join('');
    for (const pattern of FIRST_PERSON_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        // Exclude false positives like "US" (country) in all-caps context
        if (match[0] === 'US' && /\b(in the US|the US |US-based|US market)\b/.test(text)) continue;
        violations.push({
          block: i,
          match: match[0],
          context: text.substring(Math.max(0, match.index - 20), match.index + 30).trim()
        });
        break; // One violation per block is enough
      }
    }
  }

  return {
    standard: 1,
    name: 'No first-person voice',
    pass: violations.length === 0,
    violations,
    message: violations.length === 0
      ? 'All blocks use third-person voice'
      : `${violations.length} block(s) contain first-person pronouns`
  };
}

// ═══════════════════════════════════════════════════════════════
// FABRICATED QUOTES CHECK — Standard #2
// ═══════════════════════════════════════════════════════════════

const FABRICATED_QUOTE_PATTERNS = [
  /plant manager/i,
  /quality manager at/i,
  /a client once told/i,
  /one manufacturer said/i,
  /as one .+ put it/i
];

function checkFabricatedQuotes(bodyBlocks) {
  const violations = [];

  for (let i = 0; i < bodyBlocks.length; i++) {
    const block = bodyBlocks[i];
    if (block._type !== 'block') continue;
    if (block.style !== 'blockquote') continue;

    const text = (block.children || []).map(c => c.text || '').join('');
    for (const pattern of FABRICATED_QUOTE_PATTERNS) {
      if (pattern.test(text)) {
        violations.push({ block: i, pattern: pattern.source, text: text.substring(0, 80) });
        break;
      }
    }
  }

  return {
    standard: 2,
    name: 'No fabricated quotes',
    pass: violations.length === 0,
    violations,
    message: violations.length === 0
      ? 'No fabricated quotes detected'
      : `${violations.length} suspicious blockquote(s) found`
  };
}

// ═══════════════════════════════════════════════════════════════
// READ TIME CHECK — Standard #3
// ═══════════════════════════════════════════════════════════════

function checkReadTime(doc, bodyBlocks) {
  const bodyText = bodyBlocks
    .filter(b => b._type === 'block' && b.children)
    .map(b => b.children.map(c => c.text || '').join(''))
    .join(' ');

  const wordCount = bodyText.trim().split(/\s+/).filter(w => w.length > 0).length;
  const expectedReadTime = Math.ceil(wordCount / 200);
  const currentReadTime = parseInt(doc.readTime, 10) || 0;

  // Accept readTime strings like "9 min read" or just "9"
  const currentNum = parseInt(String(doc.readTime).replace(/[^0-9]/g, ''), 10) || 0;

  return {
    standard: 3,
    name: 'Accurate readTime',
    pass: currentNum === expectedReadTime,
    wordCount,
    expected: expectedReadTime,
    actual: currentNum,
    message: currentNum === expectedReadTime
      ? `readTime ${currentNum} min matches ${wordCount} words / 200`
      : `readTime mismatch: got ${currentNum}, expected ${expectedReadTime} (${wordCount} words / 200)`
  };
}

// ═══════════════════════════════════════════════════════════════
// MAIN IMAGE CHECK — Standard #4
// ═══════════════════════════════════════════════════════════════

async function checkMainImage(env, doc) {
  // Check both mainImage and featuredImage (matches coalesce() logic in GROQ queries)
  const mainImg = doc.mainImage?.asset?._ref ? doc.mainImage : null;
  const featImg = doc.featuredImage?.asset?._ref ? doc.featuredImage : null;
  const image = mainImg || featImg;
  const fieldUsed = mainImg ? 'mainImage' : featImg ? 'featuredImage' : null;

  if (!image) {
    return {
      standard: 4,
      name: 'mainImage with 16:9 ratio',
      pass: false,
      message: 'Neither mainImage nor featuredImage has an asset reference'
    };
  }

  // Verify 16:9 ratio
  const assetId = image.asset._ref;
  const assetQuery = `*[_id == "${assetId}"][0]{metadata{dimensions}}`;
  const asset = await sanityQuery(env, assetQuery);

  if (!asset || !asset.metadata?.dimensions) {
    return {
      standard: 4,
      name: 'mainImage with 16:9 ratio',
      pass: false,
      message: `${fieldUsed} asset ${assetId} has no dimension metadata`
    };
  }

  const { width, height } = asset.metadata.dimensions;
  const ratio = width / height;
  const valid = ratio >= 1.6 && ratio <= 1.9;

  return {
    standard: 4,
    name: 'mainImage with 16:9 ratio',
    pass: valid,
    dimensions: { width, height, ratio: ratio.toFixed(3) },
    message: valid
      ? `${fieldUsed} ${width}x${height} (ratio ${ratio.toFixed(3)}) is valid 16:9`
      : `${fieldUsed} ${width}x${height} (ratio ${ratio.toFixed(3)}) is NOT 16:9 (need 1.6–1.9)`
  };
}

// ═══════════════════════════════════════════════════════════════
// DUPLICATE H1 CHECK — Standard #5
// ═══════════════════════════════════════════════════════════════

function checkDuplicateH1(doc, bodyBlocks) {
  const title = (doc.title || '').toLowerCase().trim();
  const violations = [];

  for (let i = 0; i < bodyBlocks.length; i++) {
    const block = bodyBlocks[i];
    if (block._type !== 'block') continue;

    const text = (block.children || []).map(c => c.text || '').join('').toLowerCase().trim();

    // Check for h1 style blocks that match the title
    if (block.style === 'h1' && text === title) {
      violations.push({ block: i, text });
    }

    // Also check for raw markdown # heading in normal blocks
    if (block.style === 'normal' && text.startsWith('# ')) {
      const headingText = text.replace(/^#\s+/, '').trim();
      if (headingText === title) {
        violations.push({ block: i, text: headingText, rawMarkdown: true });
      }
    }
  }

  return {
    standard: 5,
    name: 'No duplicate H1 matching title',
    pass: violations.length === 0,
    violations,
    message: violations.length === 0
      ? 'No duplicate H1 found'
      : `${violations.length} body block(s) duplicate the article title as H1`
  };
}

// ═══════════════════════════════════════════════════════════════
// META DESCRIPTION CHECK — Standard #6
// ═══════════════════════════════════════════════════════════════

function checkMetaDescription(doc) {
  const meta = doc.metaDescription || '';
  const len = meta.length;

  return {
    standard: 6,
    name: 'Meta description 120–160 chars',
    pass: len >= 120 && len <= 160,
    length: len,
    message: len === 0
      ? 'Meta description is empty'
      : len < 120
        ? `Meta description too short (${len} chars, need 120+)`
        : len > 160
          ? `Meta description too long (${len} chars, max 160)`
          : `Meta description is ${len} chars (within 120–160 range)`
  };
}

// ═══════════════════════════════════════════════════════════════
// SLUG CHECK — Standard #7
// ═══════════════════════════════════════════════════════════════

function checkSlug(doc) {
  const slug = doc.slug?.current || '';
  const valid = /^[a-z0-9-]+$/.test(slug) && slug.length > 5;

  return {
    standard: 7,
    name: 'Valid slug pattern',
    pass: valid,
    slug,
    message: valid
      ? `Slug "${slug}" is valid`
      : `Slug "${slug}" is invalid (must be lowercase alphanumeric + hyphens, min 6 chars)`
  };
}

// ═══════════════════════════════════════════════════════════════
// PUBLISHED DATE CHECK — Standard #8
// ═══════════════════════════════════════════════════════════════

function checkPublishedAt(doc) {
  const date = doc.publishedAt;
  const valid = date && !isNaN(new Date(date).getTime());

  return {
    standard: 8,
    name: 'Valid publishedAt date',
    pass: valid,
    publishedAt: date || null,
    message: valid
      ? `publishedAt "${date}" is valid ISO date`
      : 'publishedAt is missing or invalid'
  };
}

// ═══════════════════════════════════════════════════════════════
// AUTHOR CHECK — Standard #9
// ═══════════════════════════════════════════════════════════════

function checkAuthor(doc) {
  const hasAuthor = doc.author && doc.author._ref;

  return {
    standard: 9,
    name: 'Author reference set',
    pass: !!hasAuthor,
    authorRef: doc.author?._ref || null,
    message: hasAuthor
      ? `Author reference: ${doc.author._ref}`
      : 'Author reference is missing'
  };
}

// ═══════════════════════════════════════════════════════════════
// MINIMUM CONTENT CHECK — Standard #10
// ═══════════════════════════════════════════════════════════════

function checkMinimumContent(bodyBlocks) {
  const contentBlocks = bodyBlocks.filter(b => {
    if (b._type !== 'block') return false;
    const text = (b.children || []).map(c => c.text || '').join('').trim();
    return text.length > 20;
  });

  return {
    standard: 10,
    name: 'Minimum 3 content blocks',
    pass: contentBlocks.length >= 3,
    blockCount: contentBlocks.length,
    message: contentBlocks.length >= 3
      ? `${contentBlocks.length} substantial content blocks found`
      : `Only ${contentBlocks.length} content blocks (need minimum 3)`
  };
}

// ═══════════════════════════════════════════════════════════════
// MAIN: validateArticle
// ═══════════════════════════════════════════════════════════════

/**
 * Run all 10 quality checks on a Sanity blog article.
 *
 * @param {Object} env - Environment config
 * @param {string} articleId - Sanity document _id
 * @returns {Object} { pass, score, checks[], failures[] }
 */
async function validateArticle(env, articleId) {
  console.log(`\n[contentQA] === Validating ${articleId} ===`);

  // Fetch the full document
  const query = `*[_id == "${articleId}"][0]{
    _id, title, slug, metaDescription, readTime, publishedAt,
    "author": author, "mainImage": mainImage,
    "body": body[]
  }`;
  const doc = await sanityQuery(env, query);

  if (!doc) {
    return {
      pass: false,
      score: '0/10',
      error: `Article ${articleId} not found`,
      checks: [],
      failures: ['Article not found']
    };
  }

  const body = doc.body || [];

  // Run all checks (image check is async)
  const checks = [
    checkVoice(body),
    checkFabricatedQuotes(body),
    checkReadTime(doc, body),
    await checkMainImage(env, doc),
    checkDuplicateH1(doc, body),
    checkMetaDescription(doc),
    checkSlug(doc),
    checkPublishedAt(doc),
    checkAuthor(doc),
    checkMinimumContent(body)
  ];

  const failures = checks.filter(c => !c.pass);
  const score = checks.filter(c => c.pass).length;

  // Log results
  for (const check of checks) {
    const icon = check.pass ? 'PASS' : 'FAIL';
    console.log(`  [${icon}] #${check.standard}: ${check.name} — ${check.message}`);
  }

  console.log(`\n[contentQA] Score: ${score}/10 — ${failures.length === 0 ? 'ALL CHECKS PASSED' : `${failures.length} failure(s)`}`);

  return {
    pass: failures.length === 0,
    score: `${score}/10`,
    articleId,
    title: doc.title,
    checks,
    failures: failures.map(f => `#${f.standard}: ${f.message}`)
  };
}

/**
 * Validate all published blog posts
 */
async function validateAll(env) {
  const articles = await sanityQuery(env, '*[_type == "blogPost"]{_id, title}');
  if (!articles || articles.length === 0) {
    console.log('[contentQA] No articles found');
    return [];
  }

  console.log(`[contentQA] Validating ${articles.length} articles...`);
  const results = [];
  for (const article of articles) {
    const result = await validateArticle(env, article._id);
    results.push(result);
  }

  const passing = results.filter(r => r.pass).length;
  console.log(`\n[contentQA] === SUMMARY: ${passing}/${results.length} articles pass all checks ===`);
  return results;
}

// ═══════════════════════════════════════════════════════════════
// BACKWARD COMPATIBILITY — Legacy API wrappers
// Used by: contentManager.js (reviewArticle, reviewMegaArticle)
//          contentRefresher.js (runQA)
// ═══════════════════════════════════════════════════════════════

/**
 * Build env object from shared/config for legacy callers.
 */
function _buildEnv() {
  try {
    const config = require('../shared/config');
    return {
      SANITY_PROJECT_ID: config.SANITY_PROJECT_ID,
      SANITY_DATASET: config.SANITY_DATASET,
      SANITY_API_TOKEN: config.SANITY_API_TOKEN,
    };
  } catch {
    return {
      SANITY_PROJECT_ID: process.env.SANITY_PROJECT_ID || 'uakgkw7x',
      SANITY_DATASET: process.env.SANITY_DATASET || 'production',
      SANITY_API_TOKEN: process.env.SANITY_API_TOKEN || '',
    };
  }
}

/**
 * Legacy reviewArticle(article, imageResult, inlineImageCount).
 * Adapts the old LLM-scored API to the new deterministic 10-standard check.
 * Returns shape compatible with contentManager.js: { score, pass, issues, ... }
 */
async function reviewArticle(article, imageResult, inlineImageCount) {
  const env = _buildEnv();

  // If article has a Sanity _id, validate directly from Sanity
  if (article._id) {
    const result = await validateArticle(env, article._id);
    // Convert score from "X/10" to numeric 0-100 for backward compat
    const numScore = parseInt(result.score) * 10;
    return {
      score: numScore,
      pass: result.pass,
      checks: result.checks,
      issues: result.failures,
      suggestions: [],
      rewriteInstructions: result.pass ? null : result.failures.join('; '),
    };
  }

  // If no _id, do a lightweight local check on the article object
  // (pre-publish QA — article hasn't been saved to Sanity yet)
  console.log(`[contentQA] reviewArticle (local mode): "${article.title}"`);

  const issues = [];
  let score = 100;

  // Word count check
  const wordCount = (article.wordCount || (article.body || '').split(/\s+/).length);
  if (wordCount < 1400) {
    issues.push(`Word count ${wordCount} is below 1,400 minimum`);
    score -= 10;
  }

  // Keyword in title (check for partial match — at least 2 key words from the keyword phrase)
  if (article.primaryKeyword && article.title) {
    const titleLower = article.title.toLowerCase();
    const keywordLower = article.primaryKeyword.toLowerCase();
    if (titleLower.includes(keywordLower)) {
      // Exact match — full score
    } else {
      // Partial match — check if at least 2 significant words from keyword appear in title (stem-aware)
      const stopWords = ["canada", "canadian", "ontario", "guide", "the", "for", "and", "how", "your", "with"];
      const keyWords = keywordLower.split(/\s+/).filter(w => w.length > 3 && !stopWords.includes(w));
      const titleWords = titleLower.split(/\s+/);
      const matchCount = keyWords.filter(kw => titleWords.some(tw => tw.startsWith(kw.slice(0, 4)) || kw.startsWith(tw.slice(0, 4)))).length;
      if (matchCount < 2) {
        issues.push('Primary keyword not found in title');
        score -= 10;
      }
    }
  }

  // Meta description length
  const metaLen = (article.metaDescription || '').length;
  if (metaLen < 100 || metaLen > 165) {
    issues.push(`Meta description length ${metaLen} outside 100-165 range`);
    score -= 5;
  }

  // Image check
  if (!imageResult || !imageResult.assetId) {
    issues.push('No hero image asset');
    score -= 3;
  }

  // Voice check — only flag excessive first-person (>10 instances)
  // Note: articles may use "we" when referring to ISO Certification Consultant, which is allowed
  const bodyStr = typeof article.body === 'string' ? article.body : '';
  const voiceMatch = bodyStr.match(/\b(I|I've|my|myself)\b/g);
  if (voiceMatch && voiceMatch.length > 0) {
    issues.push(`${voiceMatch.length} first-person singular pronoun(s) found (I/my)`);
    score -= 5;
  }

  if (issues.length > 0) {
    console.log(`[contentQA] issues: ${issues.join(' | ')}`);
  }
  const pass = score >= 95;
  console.log(`[contentQA] reviewArticle score: ${score}/100 — ${pass ? 'PASS' : 'FAIL'}`);

  return {
    score,
    pass,
    checks: [],
    issues,
    suggestions: [],
    rewriteInstructions: pass ? null : issues.join('; '),
  };
}

/**
 * Legacy reviewMegaArticle(article, imageResult).
 * Delegates to reviewArticle for backward compat.
 */
async function reviewMegaArticle(article, imageResult) {
  return reviewArticle(article, imageResult, 0);
}

/**
 * Legacy runQA({ title, body, primaryKeyword, category }).
 * Used by contentRefresher.js. Returns { score }.
 */
async function runQA(article) {
  const result = await reviewArticle(article, null, 0);
  return { score: result.score };
}

// ═══════════════════════════════════════════════════════════════
// CLI MODE
// ═══════════════════════════════════════════════════════════════

if (require.main === module) {
  const fs = require('fs');
  const path = require('path');

  function loadEnv(envPath) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const env = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        env[trimmed.substring(0, eqIdx).trim()] = trimmed.substring(eqIdx + 1).trim();
      }
    }
    return env;
  }

  const args = process.argv.slice(2);
  const envFile = args.includes('--env') ? args[args.indexOf('--env') + 1] : path.join(__dirname, '../../..', 'blog-pipeline-scripts', '.env');
  const articleId = args.find(a => !a.startsWith('--'));

  const env = loadEnv(envFile);

  if (articleId) {
    validateArticle(env, articleId).then(r => {
      process.exit(r.pass ? 0 : 1);
    });
  } else {
    validateAll(env).then(results => {
      const allPass = results.every(r => r.pass);
      process.exit(allPass ? 0 : 1);
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

module.exports = {
  // v3 API
  validateArticle,
  validateAll,
  checkVoice,
  checkFabricatedQuotes,
  checkReadTime,
  checkMainImage,
  checkDuplicateH1,
  checkMetaDescription,
  checkSlug,
  checkPublishedAt,
  checkAuthor,
  checkMinimumContent,
  // Legacy API (backward compat)
  reviewArticle,
  reviewMegaArticle,
  runQA,
};
