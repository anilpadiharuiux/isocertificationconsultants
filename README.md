# ISO Certification Consultant — Website

A fresh Next.js website built on a reusable **organization + knowledge** foundation.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. Edit `app/page.tsx` to begin.

## Structure

```
app/                     Next.js App Router (the new website)
  layout.tsx             Root layout + metadata
  page.tsx               Home page
  globals.css            Tailwind entry
tailwind.config.ts       Brand tokens (navy / teal / gold)

CLAUDE.md                Multi-agent "company" system prompt (CTO / CMO / COO org)
team/                    The organization
  AGENT-COMPANY-ORG.md   Org source of truth
  pm.js                  CTO orchestrator
  agents/                Agent role definitions (content, seo, security, ops, web, growth, shared)
  utils/                 Shared helpers
  data/
    problem-statements.json   ISO domain Q&A knowledge base
docs/knowledge-base/     Reference knowledge (architecture, brand guide, conventions,
                         content calendar, SEO strategy, internal-linking, decisions)
ISO 9001 guide.docx      ISO domain reference
```

## Stack

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS 3.

## Notes

- The old website implementation and all media (~206 MB) were removed; only the
  organization structure and knowledge were retained.
- Brand: **ISO Certification Consultant Inc.** — domain **isocertificationconsultant.ca** (Canada / USA).
- Placeholders to fill when wiring services: address, GA4 id, Leadfeeder id, Calendly, GitHub account.
