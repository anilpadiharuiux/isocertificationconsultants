const { execSync } = require("child_process");
const https = require("https");
const { log } = require("../shared/logger");
const { SITE_ROOT, SITE_URL, PAGES } = require("../shared/config");

function httpGet(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 15000 }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ status: res.statusCode, body: data, size: data.length }));
    });
    req.on("error", (err) => resolve({ status: 0, body: "", error: err.message }));
    req.on("timeout", () => { req.destroy(); resolve({ status: 0, body: "", error: "timeout" }); });
  });
}

async function check() {
  log("qaEngineer", "build-check", "running next build");
  try {
    execSync("npx next build", { cwd: SITE_ROOT, stdio: "pipe", timeout: 120000 });
    log("qaEngineer", "build-check", "PASS");
    return { pass: true, output: "Build succeeded" };
  } catch (err) {
    const stderr = err.stderr?.toString() || err.message;
    log("qaEngineer", "build-check", `FAIL: ${stderr.slice(0, 200)}`);
    return { pass: false, output: stderr.slice(0, 500) };
  }
}

async function auditPage(url) {
  const checks = [];

  // HTTP status
  const res = await httpGet(url);
  checks.push({
    name: "http-status",
    pass: res.status === 200,
    detail: `${res.status}${res.error ? ` (${res.error})` : ""}`,
  });

  if (res.status !== 200) return { url, checks };

  const html = res.body;

  // Page size
  const sizeKB = Math.round(res.size / 1024);
  checks.push({
    name: "page-size",
    pass: sizeKB < 500,
    detail: `${sizeKB} KB`,
  });

  // Has title tag
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  checks.push({
    name: "title-tag",
    pass: !!titleMatch,
    detail: titleMatch ? titleMatch[1].slice(0, 60) : "missing",
  });

  // Has H1
  const h1Match = html.match(/<h1[^>]*>([^<]*)<\/h1>/i);
  checks.push({
    name: "h1-heading",
    pass: !!h1Match,
    detail: h1Match ? h1Match[1].slice(0, 60) : "missing",
  });

  // No placeholder text
  const hasPlaceholder =
    html.includes("(555)") ||
    html.includes("555-123") ||
    html.includes("Lorem ipsum") ||
    html.includes("example.com");
  checks.push({
    name: "no-placeholders",
    pass: !hasPlaceholder,
    detail: hasPlaceholder ? "placeholder text found" : "clean",
  });

  // No console errors (check for error boundary text)
  const hasError = html.includes("Application error") || html.includes("Internal Server Error");
  checks.push({
    name: "no-errors",
    pass: !hasError,
    detail: hasError ? "error text found in HTML" : "clean",
  });

  // Has meta description
  const metaDesc = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
  checks.push({
    name: "meta-description",
    pass: !!metaDesc,
    detail: metaDesc ? `${metaDesc[1].length} chars` : "missing",
  });

  return { url, checks };
}

async function fullAudit() {
  log("qaEngineer", "full-audit", "starting");
  const results = [];

  for (const page of PAGES) {
    const url = `${SITE_URL}${page}`;
    const result = await auditPage(url);
    results.push(result);
    const passed = result.checks.filter((c) => c.pass).length;
    log("qaEngineer", "page-audit", `${page}: ${passed}/${result.checks.length} passed`);
  }

  // Check sitemap
  const sitemapRes = await httpGet(`${SITE_URL}/sitemap.xml`);
  results.push({
    url: `${SITE_URL}/sitemap.xml`,
    checks: [
      { name: "sitemap-accessible", pass: sitemapRes.status === 200, detail: `HTTP ${sitemapRes.status}` },
      {
        name: "sitemap-has-urls",
        pass: (sitemapRes.body.match(/<url>/g) || []).length > 5,
        detail: `${(sitemapRes.body.match(/<url>/g) || []).length} URLs`,
      },
    ],
  });

  // Check robots.txt
  const robotsRes = await httpGet(`${SITE_URL}/robots.txt`);
  results.push({
    url: `${SITE_URL}/robots.txt`,
    checks: [
      { name: "robots-accessible", pass: robotsRes.status === 200, detail: `HTTP ${robotsRes.status}` },
      { name: "robots-has-sitemap", pass: robotsRes.body.includes("Sitemap:"), detail: robotsRes.body.includes("Sitemap:") ? "has Sitemap directive" : "missing Sitemap directive" },
    ],
  });

  const allChecks = results.flatMap((r) => r.checks);
  const passed = allChecks.filter((c) => c.pass).length;
  log("qaEngineer", "full-audit", `completed: ${passed}/${allChecks.length} passed`);

  return { pages: results, totalPassed: passed, totalChecks: allChecks.length };
}

async function quickCheck() {
  const checks = [];

  for (const page of PAGES) {
    const url = `${SITE_URL}${page}`;
    const res = await httpGet(url);
    checks.push({
      name: `page ${page}`,
      status: res.status === 200 ? "ok" : "fail",
      detail: `HTTP ${res.status}${res.error ? ` — ${res.error}` : ""} (${Math.round(res.size / 1024)} KB)`,
    });
  }

  // Sitemap
  const sitemap = await httpGet(`${SITE_URL}/sitemap.xml`);
  const urlCount = (sitemap.body.match(/<url>/g) || []).length;
  checks.push({
    name: "sitemap.xml",
    status: sitemap.status === 200 && urlCount > 5 ? "ok" : "fail",
    detail: `HTTP ${sitemap.status} — ${urlCount} URLs`,
  });

  return checks;
}

module.exports = { check, auditPage, fullAudit, quickCheck };
