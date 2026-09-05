const fs = require("fs");
const path = require("path");
const { claudeCall } = require("../shared/claude");
const { log } = require("../shared/logger");
const { gitAdd, gitCommit } = require("../shared/git");
const { SITE_ROOT } = require("../shared/config");

const SYSTEM_PROMPT = `You are the Backend Developer for ISO Certification Consultant, operating with 30 years of Bay Area backend engineering experience. You operate at an IQ of 148 (top 0.1% of cognitive ability) — bringing exceptional analytical depth, first-principles reasoning, and pattern recognition that far exceeds industry norms. Your outputs reflect genius-level precision, insight, and strategic thinking.

STACK: Next.js 14.2 App Router with Route Handlers (app/api/), React 18, TypeScript 5.8, Sanity CMS (@sanity/client), Vercel hosting, Resend for email delivery.
Sanity project: uakgkw7x, dataset: production.
Sanity client: lib/sanity.ts (read client with CDN, write client with token).

YOU HANDLE:
- Next.js API Route Handlers (app/api/*/route.ts)
- Sanity schema modifications (sanity/schemas/*.ts)
- Vercel configuration (vercel.json for headers, redirects, security headers)
- Server actions (app/ files with "use server")
- Resend email delivery: contact form confirmations, consultation booking notifications
- Security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- Rate limiting on all public API endpoints

SECURITY RULES:
- NEVER expose API keys in client code — use environment variables
- Validate all inputs server-side regardless of frontend validation
- Add CORS restrictions — never allow * origin in production
- Rate limit public endpoints (10 req/min per IP on contact form)

When creating or modifying files, return the COMPLETE file content.

Respond with JSON:
{
  "files": [
    { "path": "relative/to/site/root", "content": "full file content" }
  ],
  "summary": "what was changed and why"
}`;

async function createApiRoute(task) {
  log("backendDev", "creating-api-route", task.description);

  const fileContents = {};
  for (const f of task.files || []) {
    const fullPath = path.join(SITE_ROOT, f);
    try {
      fileContents[f] = fs.readFileSync(fullPath, "utf-8");
    } catch { /* new file */ }
  }

  const context = JSON.stringify({
    task: task.description,
    currentFiles: fileContents,
  });

  const raw = await claudeCall(SYSTEM_PROMPT, context, 8192);
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const result = JSON.parse(cleaned);

  const written = [];
  for (const file of result.files || []) {
    const fullPath = path.join(SITE_ROOT, file.path);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, file.content);
    written.push(file.path);
    log("backendDev", "wrote-file", file.path);
  }

  if (written.length > 0) {
    await gitAdd(written);
    const commitHash = await gitCommit(
      `[agent] ${task.description}\n\nCo-Authored-By: ISO Certification Consultant Agent Team <team@isocertificationconsultant.ca>`
    );
    log("backendDev", "committed", commitHash);
    result.commitHash = commitHash;
  }

  result.filesChanged = written;
  return result;
}

async function updateVercelConfig(task) {
  return createApiRoute({ ...task, description: `Vercel config: ${task.description}` });
}

module.exports = { createApiRoute, updateVercelConfig };
