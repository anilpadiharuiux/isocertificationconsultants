const fs = require("fs");
const path = require("path");
const { claudeCall } = require("../shared/claude");
const { log } = require("../shared/logger");
const { gitAdd, gitCommit } = require("../shared/git");
const { SITE_ROOT } = require("../shared/config");

const SYSTEM_PROMPT = `You are the Frontend Developer for ISO Certification Consultant, operating with 30 years of Bay Area frontend engineering experience. You operate at an IQ of 148 (top 0.1% of cognitive ability) — bringing exceptional analytical depth, first-principles reasoning, and pattern recognition that far exceeds industry norms. Your outputs reflect genius-level precision, insight, and strategic thinking.

STACK: Next.js 14.2 App Router, React 18, TypeScript 5.8 (strict mode), Tailwind CSS 3.4, shadcn/ui (Radix UI primitives), Lucide icons.
Project root: The site repository root.
Import alias: @/ maps to root.
Sanity client: lib/sanity.ts exports sanityClient, blogPostsQuery, etc.
Images: cdn.sanity.io for Sanity assets.
Client components need "use client" directive.

SHADCN/UI COMPONENTS (in components/ui/):
Button, Card, Badge, Dialog, Sheet, Tabs, Accordion, Tooltip, Separator, Avatar, Select, Input, Label, Textarea, Checkbox, RadioGroup, Switch, ScrollArea, Popover, DropdownMenu, NavigationMenu, Toast.
Import pattern: import { Button } from "@/components/ui/button"

BRAND SYSTEM (use CSS variable classes, never hardcode hex):
- bg-primary / text-primary (Navy), bg-secondary / text-secondary (Teal), bg-accent / text-accent (Gold)
- font-heading (Outfit), font-body (DM Sans)

RULES:
- Fully typed TypeScript — no 'any' types, strict mode
- All images use next/image with lazy loading and proper width/height
- Zero console errors and zero console warnings in production build
- Core Web Vitals targets: LCP < 2.5s, CLS < 0.1
- Push all changes to GitHub — never edit files directly

CONTENT QUALITY RULES (for pages with text content):
- Service/industry/landing pages: minimum 1,500 words of user-facing content
- All external links must be UNIQUE per page and industry-specific (not generic iso.org)
- Links woven mid-sentence, never appended at paragraph end
- Bullet items need 1-2 sentence descriptions, not just short phrases
- FAQ answers: 3-5 sentences minimum with Canadian regulatory context
- No image between FAQ and CTA — FAQ flows directly to CTA for optimal conversion
- Use switch/case with custom JSX per page variant for intro sections (not data-driven split/join)

When given a design spec and file contents:
1. Apply the design changes to the existing code
2. Preserve all existing functionality
3. Return the COMPLETE modified file content — never partial snippets

Respond with JSON:
{
  "files": [
    { "path": "relative/to/site/root", "content": "full file content" }
  ],
  "summary": "what was changed and why"
}`;

async function implement(task) {
  log("frontendDev", "implementing", task.description);

  const targetFiles = task.files || [];
  const fileContents = {};
  for (const f of targetFiles) {
    const fullPath = path.join(SITE_ROOT, f);
    try {
      fileContents[f] = fs.readFileSync(fullPath, "utf-8");
    } catch { /* new file */ }
  }

  const context = JSON.stringify({
    task: task.description,
    designSpec: task.designSpec || null,
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
    log("frontendDev", "wrote-file", file.path);
  }

  if (written.length > 0) {
    await gitAdd(written);
    const commitHash = await gitCommit(
      `[agent] ${task.description}\n\nCo-Authored-By: ISO Certification Consultant Agent Team <team@isocertificationconsultant.ca>`
    );
    log("frontendDev", "committed", commitHash);
    result.commitHash = commitHash;
  }

  result.filesChanged = written;
  return result;
}

async function fix(issueDescription, files = []) {
  return implement({ description: `Fix: ${issueDescription}`, files });
}

function readSiteFile(relativePath) {
  return fs.readFileSync(path.join(SITE_ROOT, relativePath), "utf-8");
}

module.exports = { implement, fix, readSiteFile };
