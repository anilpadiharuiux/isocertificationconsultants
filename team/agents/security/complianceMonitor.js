const { claudeJSONFast } = require("../shared/claude");
const { log } = require("../shared/logger");
const { updateHeartbeat } = require("../shared/heartbeat");
const { saveReport } = require("../shared/reporter");
const { SITE_URL } = require("../shared/config");
const https = require("https");

const SYSTEM_PROMPT = `You are a Compliance Monitor Agent for ISO Certification Consultant — a Canadian ISO certification consulting firm based in London, Ontario. You operate at an IQ of 148 (top 0.1% of cognitive ability) — bringing exceptional analytical depth, first-principles reasoning, and pattern recognition that far exceeds industry norms. Your outputs reflect genius-level precision, insight, and strategic thinking.

YOUR MISSION: Audit published web content for ISO standards compliance accuracy, brand consistency, and regulatory claims. Flag any content that could expose the company to legal or reputational risk.

COMPLIANCE RULES:

1. ISO STANDARD REFERENCES:
- ISO 9001:2015 is the current Quality Management standard
- ISO 14001:2015 is the current Environmental Management standard
- ISO 45001:2018 is the current Occupational Health & Safety standard (replaced OHSAS 18001)
- ISO 13485:2016 is the current Medical Devices QMS standard
- AS9100D is the current Aerospace QMS standard
- IATF 16949:2016 is the current Automotive QMS standard
- Flag any references to outdated standards (e.g., ISO 9001:2008, OHSAS 18001 presented as current)

2. LEGAL CLAIMS:
- ISO Certification Consultant is a CONSULTING firm — it does NOT certify, accredit, or issue certificates
- Must never claim "we certify" or "we accredit" — only "we help prepare for certification"
- Certification is performed by accredited third-party Certification Bodies (CBs)
- Accreditation is performed by bodies like SCC (Standards Council of Canada), ANAB, UKAS
- Flag any claims that blur this distinction

3. BRAND CONSISTENCY:
- Always "ISO Certification Consultant" (one word, capital P, Q, M, S) — never "ISO Certification Consultant"
- Always "Book your free consultation" as CTA
- Third person only: "ISO Certification Consultant helps..." never "We help..."
- No first person "I" anywhere
- "Where Quality Meets Excellence" is the tagline

4. STATISTICS & CLAIMS:
- "250+ successful audits" — flag if different number used
- Flag any specific percentage claims without evidence (e.g., "100% success rate")
- Flag guaranteed outcomes ("guaranteed certification")

5. REGULATORY ACCURACY:
- SCC is Canada's accreditation body, not Standards Council of Ontario
- ANAB is the US accreditation body
- Flag incorrect regulatory body references
- Health Canada regulates medical devices in Canada, not FDA (FDA is US only)

6. CANADIAN ENGLISH CONTEXT:
- "organisation" is acceptable in ISO context
- Province names must be correct (Ontario, not Ontairo)
- Canadian regulatory references must be current

Respond with JSON:
{
  "issues": [{ "severity": "critical|high|medium|low|info", "page": "url", "issue": "description", "quote": "offending text", "recommendation": "fix" }],
  "pagesAudited": number,
  "criticalCount": number,
  "highCount": number,
  "mediumCount": number,
  "lowCount": number,
  "infoCount": number,
  "overallRisk": "low|medium|high|critical",
  "summary": "brief summary"
}`;

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 15000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchPage(res.headers.location).then(resolve).catch(reject);
      }
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
  });
}

function extractTextContent(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

const KEY_PAGES = [
  "/",
  "/services/iso-9001",
  "/services/iso-14001",
  "/services/iso-45001",
  "/services/iso-13485",
  "/process",
  "/industries/manufacturing",
  "/industries/healthcare-medical-devices",
  "/industries/aerospace-defence",
  "/industries/automotive",
  "/contact",
];

async function runAudit() {
  log("complianceMonitor", "audit", "starting compliance audit");
  updateHeartbeat("complianceMonitor", "running", "auditing");

  const pageContents = [];

  for (const pagePath of KEY_PAGES) {
    const url = `${SITE_URL}${pagePath}`;
    try {
      const html = await fetchPage(url);
      const text = extractTextContent(html);
      // Limit to first 3000 chars to stay within token budget
      pageContents.push({ url: pagePath, content: text.slice(0, 3000) });
    } catch (err) {
      log("complianceMonitor", "fetch-error", `${pagePath}: ${err.message}`);
    }
  }

  if (pageContents.length === 0) {
    log("complianceMonitor", "error", "no pages fetched");
    updateHeartbeat("complianceMonitor", "error", "no pages fetched");
    return { issues: [], pagesAudited: 0, overallRisk: "unknown", summary: "No pages could be fetched" };
  }

  const userMsg = `Audit the following ${pageContents.length} pages for ISO compliance, legal claims accuracy, and brand consistency. Check every page against all compliance rules.

${pageContents.map((p) => `--- PAGE: ${p.url} ---\n${p.content}`).join("\n\n")}`;

  try {
    const result = await claudeJSONFast(SYSTEM_PROMPT, userMsg, 4096);

    const summary = {
      issues: result.issues || [],
      pagesAudited: result.pagesAudited || pageContents.length,
      criticalCount: result.criticalCount || 0,
      highCount: result.highCount || 0,
      mediumCount: result.mediumCount || 0,
      lowCount: result.lowCount || 0,
      infoCount: result.infoCount || 0,
      overallRisk: result.overallRisk || "low",
      summary: result.summary || "Audit complete",
    };

    // Save report
    const { today } = require("../shared/logger");
    saveReport("audits", `${today()}-compliance.json`, summary);

    const issueCount = summary.issues.length;
    const status = summary.criticalCount > 0 ? "failed" : "complete";
    log("complianceMonitor", "result", `${issueCount} issues, risk: ${summary.overallRisk}`);
    updateHeartbeat("complianceMonitor", status, `${issueCount} issues, ${summary.overallRisk} risk`);

    return summary;
  } catch (err) {
    log("complianceMonitor", "error", err.message);
    updateHeartbeat("complianceMonitor", "error", err.message);
    return { issues: [], pagesAudited: 0, overallRisk: "unknown", summary: `Audit failed: ${err.message}` };
  }
}

module.exports = { runAudit };
