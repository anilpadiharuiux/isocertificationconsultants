const fs = require("fs");
const path = require("path");
const https = require("https");
const { claudeCallFast } = require("../shared/claude");
const { log } = require("../shared/logger");
const { SITE_URL, MEMORY_DIR, REPORTS_DIR } = require("../shared/config");

const REQUIREMENTS_PATH = path.join(MEMORY_DIR, "page-requirements.json");

function httpGet(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 15000 }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    });
    req.on("error", (err) => resolve({ status: 0, body: "", error: err.message }));
    req.on("timeout", () => { req.destroy(); resolve({ status: 0, body: "", error: "timeout" }); });
  });
}

function loadRequirements() {
  try {
    return JSON.parse(fs.readFileSync(REQUIREMENTS_PATH, "utf-8"));
  } catch {
    return null;
  }
}

async function auditPage(pageUrl) {
  log("pageAuditor", "audit", pageUrl);
  const res = await httpGet(pageUrl);

  if (res.status !== 200) {
    return {
      url: pageUrl,
      pass: false,
      severity: "critical",
      checks: [{ name: "http-status", pass: false, severity: "critical", detail: `HTTP ${res.status}` }],
      certificate: null,
    };
  }

  const html = res.body;
  const checks = [];

  // 1. Check for content markers
  const markers = ["Segment:", "Context:", "Section:", "TODO:", "PLACEHOLDER", "Context and Intent"];
  const foundMarkers = markers.filter((m) => html.includes(m));
  checks.push({
    name: "no-content-markers",
    pass: foundMarkers.length === 0,
    severity: foundMarkers.length > 0 ? "critical" : "low",
    detail: foundMarkers.length === 0 ? "clean" : `found: ${foundMarkers.join(", ")}`,
  });

  // 2. Check heading hierarchy
  const h1Count = (html.match(/<h1[^>]*>/gi) || []).length;
  checks.push({
    name: "h1-unique",
    pass: h1Count === 1,
    severity: h1Count !== 1 ? "high" : "low",
    detail: `${h1Count} H1 tag(s)`,
  });

  // 3. Check meta tags
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const titleLen = titleMatch ? titleMatch[1].length : 0;
  checks.push({
    name: "meta-title",
    pass: titleLen >= 30 && titleLen <= 70,
    severity: "medium",
    detail: `${titleLen} chars`,
  });

  const metaDesc = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
  const descLen = metaDesc ? metaDesc[1].length : 0;
  checks.push({
    name: "meta-description",
    pass: descLen >= 120 && descLen <= 170,
    severity: "medium",
    detail: `${descLen} chars`,
  });

  // 4. Check for placeholder text
  const placeholders = ["+1 (555)", "555-123", "john@example.com", "Lorem ipsum", "Acme Ltd", "John Smith"];
  const foundPlaceholders = placeholders.filter((p) => html.includes(p));
  checks.push({
    name: "no-placeholders",
    pass: foundPlaceholders.length === 0,
    severity: foundPlaceholders.length > 0 ? "critical" : "low",
    detail: foundPlaceholders.length === 0 ? "clean" : `found: ${foundPlaceholders.join(", ")}`,
  });

  // 5. Check internal links
  const internalLinks = (html.match(/href="(\/[^"]*|https?:\/\/isocertificationconsultant\.ca[^"]*)"/gi) || []).length;
  checks.push({
    name: "internal-links",
    pass: internalLinks >= 3,
    severity: internalLinks < 3 ? "high" : "low",
    detail: `${internalLinks} internal links`,
  });

  // 5b. Check external links (must have unique, authoritative external links)
  const externalLinks = (html.match(/href="https?:\/\/(?!isocertificationconsultant\.ca)[^"]+"/gi) || []).length;
  const isContentPage = pageUrl.includes("/blog/") || pageUrl.includes("/services/") || pageUrl.includes("/industries/");
  checks.push({
    name: "external-links",
    pass: isContentPage ? externalLinks >= 3 : externalLinks >= 0,
    severity: isContentPage && externalLinks < 3 ? "high" : "low",
    detail: `${externalLinks} external links${isContentPage ? " (content page needs ≥3)" : ""}`,
  });

  // 5c. Check content depth (service/industry pages need ≥1500 words visible text)
  const textContent = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const wordCount = textContent.split(/\s+/).length;
  const needsDepth = pageUrl.includes("/services/iso-") || pageUrl.includes("/industries/");
  const minWords = needsDepth ? 1500 : 500;
  checks.push({
    name: "content-depth",
    pass: wordCount >= minWords,
    severity: wordCount < minWords ? "high" : "low",
    detail: `${wordCount} words${needsDepth ? " (landing page needs ≥1500)" : ""}`,
  });

  // 6. Check images
  const images = (html.match(/<img[^>]+>/gi) || []).length;
  const imgsNoAlt = (html.match(/<img(?![^>]*alt=)[^>]*>/gi) || []).length;
  checks.push({
    name: "images-present",
    pass: images > 0,
    severity: images === 0 ? "high" : "low",
    detail: `${images} images, ${imgsNoAlt} missing alt`,
  });

  // 7. Check Open Graph tags
  const ogTitle = html.includes('property="og:title"');
  const ogDesc = html.includes('property="og:description"');
  const ogImage = html.includes('property="og:image"');
  checks.push({
    name: "og-tags",
    pass: ogTitle && ogDesc && ogImage,
    severity: "medium",
    detail: `og:title=${ogTitle}, og:description=${ogDesc}, og:image=${ogImage}`,
  });

  // 8. Check JSON-LD
  const hasJsonLd = html.includes('"@context"') && html.includes("schema.org");
  checks.push({
    name: "json-ld",
    pass: hasJsonLd,
    severity: "medium",
    detail: hasJsonLd ? "present" : "missing",
  });

  // 9. Check CTA section presence (not just a footer link — needs a real CTA block)
  const hasCtaSection = /Book Free Consultation|Book.*Consultation.*<\/a>|Book.*Consultation.*<\/button>/i.test(html);
  const hasContactLink = html.includes('href="/contact"');
  const hasCTA = hasCtaSection && hasContactLink;
  checks.push({
    name: "cta-present",
    pass: hasCTA,
    severity: hasCTA ? "low" : "high",
    detail: hasCTA ? "CTA section with contact link found" : `CTA section: ${hasCtaSection}, /contact link: ${hasContactLink}`,
  });

  // 10. Check for error text
  const hasError = html.includes("Application error") || html.includes("Internal Server Error") || html.includes("404");
  checks.push({
    name: "no-errors",
    pass: !hasError,
    severity: hasError ? "critical" : "low",
    detail: hasError ? "error text found" : "clean",
  });

  // Calculate overall result
  const criticalFails = checks.filter((c) => !c.pass && c.severity === "critical").length;
  const highFails = checks.filter((c) => !c.pass && c.severity === "high").length;
  const passed = checks.filter((c) => c.pass).length;
  const score = Math.round((passed / checks.length) * 100);
  const overallPass = criticalFails === 0 && highFails <= 1 && score >= 70;

  // Generate audit certificate
  const certificate = {
    url: pageUrl,
    auditedAt: new Date().toISOString(),
    score,
    pass: overallPass,
    criticalFails,
    highFails,
    totalChecks: checks.length,
    passedChecks: passed,
  };

  // Save certificate
  const slug = pageUrl.replace(SITE_URL, "").replace(/\//g, "-").replace(/^-/, "") || "home";
  const certPath = path.join(REPORTS_DIR, "audits", `page-audit-${slug}-${new Date().toISOString().slice(0, 10)}.json`);
  try {
    fs.mkdirSync(path.dirname(certPath), { recursive: true });
    fs.writeFileSync(certPath, JSON.stringify({ certificate, checks }, null, 2));
  } catch { /* ok if dir fails */ }

  log("pageAuditor", "result", `${pageUrl}: ${score}/100 — ${overallPass ? "PASS" : "FAIL"}`);

  return { url: pageUrl, pass: overallPass, score, checks, certificate };
}

async function auditDeployment(affectedPages = []) {
  log("pageAuditor", "deployment-audit", `auditing ${affectedPages.length || "all"} pages`);

  const pagesToAudit = affectedPages.length > 0
    ? affectedPages
    : ["/", "/about", "/services", "/process", "/blog", "/contact"];

  const results = [];
  for (const page of pagesToAudit) {
    const url = page.startsWith("http") ? page : `${SITE_URL}${page}`;
    const result = await auditPage(url);
    results.push(result);
  }

  const criticalFails = results.filter((r) => !r.pass);
  const avgScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);

  log("pageAuditor", "deployment-audit", `${results.length} pages audited — avg ${avgScore}/100, ${criticalFails.length} failures`);

  return {
    pages: results,
    averageScore: avgScore,
    pass: criticalFails.length === 0,
    criticalFails: criticalFails.map((r) => r.url),
  };
}

module.exports = { auditPage, auditDeployment };
