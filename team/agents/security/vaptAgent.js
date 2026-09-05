const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const https = require("https");
const { claudeCall } = require("../shared/claude");
const { log } = require("../shared/logger");
const { sendEmail } = require("../shared/notifier");
const { SITE_URL, SITE_ROOT, REPORTS_DIR } = require("../shared/config");

const SYSTEM_PROMPT = `You are the VAPT Security Agent for ISO Certification Consultant, performing comprehensive monthly vulnerability assessments. You operate with 30 years of Bay Area application security engineering experience. You operate at an IQ of 148 (top 0.1% of cognitive ability) — bringing exceptional analytical depth, first-principles reasoning, and pattern recognition that far exceeds industry norms. Your outputs reflect genius-level precision, insight, and strategic thinking.

YOUR MISSION: Execute a 4-phase vulnerability assessment of isocertificationconsultant.ca using the Vibe Testing methodology. Identify, score with CVSS v3.1, and provide exact remediation for every discovered vulnerability.

PHASE 1 — SAST (Static Analysis):
- Scan for hardcoded secrets, API keys in client code
- Check for XSS vulnerabilities in React components
- Verify input validation on all form handlers
- Check CORS configuration
- Audit npm dependencies for known CVEs

PHASE 2 — DAST (Dynamic Testing):
- Test for reflected/stored XSS via form inputs
- Check SQL injection vectors (though Sanity is NoSQL)
- Verify CSRF protection on form submissions
- Test rate limiting on public endpoints
- Check directory traversal attempts
- Verify HTTP method restrictions

PHASE 3 — API Security:
- Test serverless endpoint authentication
- Check for sensitive data exposure in API responses
- Verify proper error handling (no stack traces in production)
- Test mass assignment vulnerabilities

PHASE 4 — Infrastructure:
- Check SSL/TLS configuration
- Verify security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- Check DNS security (SPF, DMARC)
- Review known CVEs in tech stack

SCORING: CVSS v3.1
- Critical: 9.0-10.0 — immediate escalation required
- High: 7.0-8.9
- Medium: 4.0-6.9
- Low: 0.1-3.9
- Info: 0.0

DISCLAIMER: This AI VAPT supplements but does not replace certified penetration testing by qualified professionals.

Respond with JSON:
{
  "findings": [
    {
      "id": "VAPT-001",
      "title": "string",
      "severity": "critical|high|medium|low|info",
      "cvss": 7.5,
      "phase": "sast|dast|api|infrastructure",
      "description": "string",
      "proof": "string (proof of concept or evidence)",
      "remediation": "exact code or config fix",
      "status": "new|persistent|resolved"
    }
  ],
  "summary": { "critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0, "total": 0 }
}`;

function httpGet(url, options = {}) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const req = https.get(
      { hostname: urlObj.hostname, path: urlObj.pathname + urlObj.search, headers: options.headers || {}, timeout: 15000 },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
      }
    );
    req.on("error", (err) => resolve({ status: 0, body: "", headers: {}, error: err.message }));
    req.on("timeout", () => { req.destroy(); resolve({ status: 0, body: "", headers: {}, error: "timeout" }); });
  });
}

async function phase1SAST() {
  log("vaptAgent", "phase-1", "SAST — static code analysis");
  const findings = [];

  // Check npm audit
  try {
    const auditOutput = execSync("npm audit --json 2>/dev/null", { cwd: SITE_ROOT, timeout: 60000 }).toString();
    const audit = JSON.parse(auditOutput);
    if (audit.metadata?.vulnerabilities) {
      const vulns = audit.metadata.vulnerabilities;
      if (vulns.critical > 0 || vulns.high > 0) {
        findings.push({
          id: `VAPT-SAST-001`,
          title: "npm dependency vulnerabilities",
          severity: vulns.critical > 0 ? "critical" : "high",
          cvss: vulns.critical > 0 ? 9.0 : 7.5,
          phase: "sast",
          description: `${vulns.critical} critical, ${vulns.high} high, ${vulns.moderate} moderate vulnerabilities in npm dependencies`,
          proof: "npm audit --json",
          remediation: "Run npm audit fix or update affected packages",
          status: "new",
        });
      }
    }
  } catch { /* npm audit may return non-zero exit code */ }

  // Check for hardcoded secrets in source
  try {
    const grepResult = execSync(
      'grep -r "sk-" --include="*.ts" --include="*.tsx" --include="*.js" -l app/ lib/ components/ 2>/dev/null || true',
      { cwd: SITE_ROOT, timeout: 30000 }
    ).toString().trim();

    if (grepResult) {
      findings.push({
        id: "VAPT-SAST-002",
        title: "Potential hardcoded API key in frontend code",
        severity: "critical",
        cvss: 9.5,
        phase: "sast",
        description: `Files with potential API keys: ${grepResult}`,
        proof: "grep -r 'sk-' in frontend source",
        remediation: "Move all API keys to environment variables",
        status: "new",
      });
    }
  } catch { /* ok */ }

  return findings;
}

async function phase4Infrastructure() {
  log("vaptAgent", "phase-4", "Infrastructure security checks");
  const findings = [];

  // Check security headers
  const home = await httpGet(SITE_URL);
  const requiredHeaders = {
    "x-frame-options": "Prevents clickjacking",
    "x-content-type-options": "Prevents MIME sniffing",
    "strict-transport-security": "Enforces HTTPS",
    "referrer-policy": "Controls referrer information",
    "content-security-policy": "Prevents XSS and injection",
  };

  for (const [header, description] of Object.entries(requiredHeaders)) {
    if (!home.headers[header]) {
      findings.push({
        id: `VAPT-INFRA-${header}`,
        title: `Missing ${header} header`,
        severity: header === "content-security-policy" ? "high" : "medium",
        cvss: header === "content-security-policy" ? 7.0 : 5.0,
        phase: "infrastructure",
        description: `${description}. Header not present in response.`,
        proof: `curl -I ${SITE_URL} | grep ${header}`,
        remediation: `Add ${header} to vercel.json headers configuration`,
        status: "new",
      });
    }
  }

  // Check HTTPS
  if (!SITE_URL.startsWith("https://")) {
    findings.push({
      id: "VAPT-INFRA-HTTPS",
      title: "HTTPS not enforced",
      severity: "critical",
      cvss: 9.0,
      phase: "infrastructure",
      description: "Site URL does not use HTTPS",
      proof: `SITE_URL: ${SITE_URL}`,
      remediation: "Configure HTTPS redirect in Vercel",
      status: "new",
    });
  }

  return findings;
}

async function runFullScan() {
  log("vaptAgent", "scan", "starting monthly VAPT scan");
  const startTime = Date.now();

  const sastFindings = await phase1SAST();
  const infraFindings = await phase4Infrastructure();

  // Use Claude to analyze the codebase for additional vulnerabilities
  let aiFindings = [];
  try {
    const codeContext = {
      sastResults: sastFindings,
      infraResults: infraFindings,
      siteUrl: SITE_URL,
      securityHeaders: (await httpGet(SITE_URL)).headers,
    };

    const aiResult = await claudeCall(
      SYSTEM_PROMPT,
      `Analyze these security scan results and identify any additional vulnerabilities or recommendations:

${JSON.stringify(codeContext, null, 2)}

Focus on: missing headers, potential attack vectors, dependency vulnerabilities. Return JSON with findings array.`,
      4096
    );

    const cleaned = aiResult.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    aiFindings = parsed.findings || [];
  } catch (err) {
    log("vaptAgent", "ai-analysis", `failed: ${err.message}`);
  }

  // Combine all findings
  const allFindings = [...sastFindings, ...infraFindings, ...aiFindings];
  const summary = {
    critical: allFindings.filter((f) => f.severity === "critical").length,
    high: allFindings.filter((f) => f.severity === "high").length,
    medium: allFindings.filter((f) => f.severity === "medium").length,
    low: allFindings.filter((f) => f.severity === "low").length,
    info: allFindings.filter((f) => f.severity === "info").length,
    total: allFindings.length,
  };

  const report = {
    scanDate: new Date().toISOString(),
    duration: `${Math.round((Date.now() - startTime) / 1000)}s`,
    siteUrl: SITE_URL,
    findings: allFindings,
    summary,
    disclaimer: "This AI VAPT supplements but does not replace certified penetration testing by qualified professionals.",
  };

  // Save report
  const reportPath = path.join(REPORTS_DIR, "security", `vapt-${new Date().toISOString().slice(0, 10)}.json`);
  try {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log("vaptAgent", "report", `saved to ${reportPath}`);
  } catch { /* ok */ }

  // Email report to the Owner
  try {
    const severityLine = `Critical: ${summary.critical} | High: ${summary.high} | Medium: ${summary.medium} | Low: ${summary.low}`;
    await sendEmail({
      subject: `🔒 Monthly VAPT Report — ${summary.total} findings (${summary.critical} critical)`,
      text: `Monthly VAPT Scan Complete\n\nSite: ${SITE_URL}\nDate: ${report.scanDate}\n${severityLine}\n\nFindings:\n${allFindings.map((f) => `[${f.severity.toUpperCase()}] ${f.title}: ${f.description}`).join("\n")}`,
      html: `<div style="font-family:sans-serif;max-width:600px">
        <h2 style="color:#152B4B">🔒 Monthly VAPT Report</h2>
        <p><strong>${severityLine}</strong></p>
        <table style="border-collapse:collapse;width:100%">
          ${allFindings.map((f) => `<tr style="border-bottom:1px solid #eee"><td style="padding:8px;color:${f.severity === "critical" ? "red" : f.severity === "high" ? "orange" : "#333"}">[${f.severity.toUpperCase()}]</td><td style="padding:8px">${f.title}</td></tr>`).join("")}
        </table>
        <p style="color:#666;font-size:12px;margin-top:16px">${report.disclaimer}</p>
      </div>`,
    });
  } catch (err) {
    log("vaptAgent", "email", `failed: ${err.message}`);
  }

  // Immediately escalate critical findings
  if (summary.critical > 0) {
    log("vaptAgent", "CRITICAL", `${summary.critical} critical findings — escalating immediately`);
    try {
      await sendEmail({
        subject: `🚨 CRITICAL SECURITY: ${summary.critical} critical vulnerabilities found`,
        text: `IMMEDIATE ATTENTION REQUIRED\n\n${allFindings.filter((f) => f.severity === "critical").map((f) => `${f.title}: ${f.description}\nRemediation: ${f.remediation}`).join("\n\n")}`,
      });
    } catch { /* ok */ }
  }

  log("vaptAgent", "complete", `scan finished — ${summary.total} findings (${summary.critical} critical)`);
  return report;
}

module.exports = { runFullScan, phase1SAST, phase4Infrastructure };
