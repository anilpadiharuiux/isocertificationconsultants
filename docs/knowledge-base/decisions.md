# Decisions Log

> Design, content, and architecture decisions — what was decided, why, and what alternatives were rejected. Update this file whenever a non-obvious choice is made.

---

## How to Log Decisions

Each entry should include:
- **Date** — When the decision was made
- **Decision** — What was decided
- **Why** — The reasoning behind the choice
- **Alternatives Rejected** — What else was considered and why it was rejected
- **Impact** — What this affects going forward

---

## Architecture Decisions

### 2026-03 | Next.js 14 App Router with SSG
**Decision:** Use Next.js 14 with App Router and Static Site Generation.
**Why:** SEO performance requires fast page loads and crawlable HTML. SSG pre-renders all pages at build time, giving Google fully rendered content. App Router provides the latest Next.js patterns (layouts, metadata API, server components).
**Alternatives Rejected:**
- Pages Router — legacy pattern, App Router is the future
- SSR (server-side rendering) — unnecessary latency for mostly static content
- Gatsby/Hugo — less ecosystem support, harder CMS integration
**Impact:** All pages are statically generated. Dynamic content (blog posts) fetched from Sanity at build time.

### 2026-03 | Data-Driven Service & Industry Pages
**Decision:** Use dynamic routing (`[standard]/page.tsx`, `[industry]/page.tsx`) with content in TypeScript data files rather than individual page files.
**Why:** 10 service pages and 8 industry pages share identical structure. Data files (`serviceData.ts`, `industryData.ts`) make bulk content updates trivial and ensure structural consistency.
**Alternatives Rejected:**
- Individual page files per standard/industry — too much duplication, hard to maintain structural consistency
- CMS-driven pages — adds latency and complexity for pages that change infrequently
**Impact:** Adding a new standard or industry requires only a data entry, not a new page file.

### 2026-03 | Sanity CMS for Blog Only
**Decision:** Use Sanity CMS for blog posts and article series; keep service/industry content in code.
**Why:** Blog content changes daily (2 articles/day) and needs a content pipeline. Service/industry pages change rarely and benefit from type-safe TypeScript data files with build-time validation.
**Alternatives Rejected:**
- All content in Sanity — over-engineering for static pages, adds build-time fetching overhead
- All content in code — blog posts need a pipeline with drafts, scheduling, and editorial workflow
- WordPress — legacy, security overhead, slower builds
**Impact:** Blog pipeline writes to Sanity via `sanityPublisher.js`. Static pages are pure Next.js.

### 2026-03 | Groq API for Chatbot (Not Claude/OpenAI)
**Decision:** Use Groq API with Llama 3.3 70B for the public-facing chatbot.
**Why:** Groq offers extremely fast inference (sub-second streaming), free tier for moderate traffic, and Llama 3.3 70B provides strong conversational quality. Cost is a factor for a public chatbot that could see high volume.
**Alternatives Rejected:**
- Claude API — higher cost per token, better suited for internal agent tasks
- OpenAI GPT-4 — expensive for a public chatbot
- Self-hosted model — infrastructure overhead
**Impact:** Chatbot uses Vercel AI SDK v4 with OpenAI-compatible Groq provider. Claude API reserved for agent team tasks.

---

## Content Decisions

### 2026-03 | No Blog Articles About AS9100 or ISO 27001
**Decision:** Blog content pipeline excludes AS9100 and ISO 27001 articles.
**Why:** Business decision — these standards have low demand in the primary target market (Ontario manufacturing). Resources better spent on higher-volume standards (ISO 9001, IATF 16949, ISO 45001, ISO 14001).
**Alternatives Rejected:**
- Include all 10 standards equally — dilutes effort on high-value keywords
**Impact:** Blog schedule rotates across 8 standards only. Service pages for AS9100 and ISO 27001 still exist.

### 2026-03 | Mega Articles: 9-10 Chapters, 18,000-20,000 Words
**Decision:** Mega article series are exactly 9-10 chapters with 2,000+ words each, totaling 18,000-20,000 words.
**Why:** Previous attempts produced 50+ thin chapters (300-500 words each) which hurt SEO (thin content signals) and user experience (too fragmented). 9-10 substantial chapters provide depth without fragmentation.
**Alternatives Rejected:**
- Single long article (18,000 words on one page) — terrible UX, high bounce rate
- 50+ thin chapters — thin content, poor SEO signals, user confusion
- 5-6 very long chapters — chapters over 3,000 words lose reader attention
**Impact:** `outlineArchitect.js` enforces the 9-10 chapter limit. Subsections (H3) stay within chapters.

### 2026-03 | City-Specific Content Strategy
**Decision:** Blog articles target specific Ontario cities (Windsor, Hamilton, Kitchener, etc.) with industry-city pairings.
**Why:** Local SEO — "ISO 9001 consultant Windsor Ontario" has lower competition and higher conversion intent than generic "ISO consultant Canada". Ontario manufacturing is concentrated in specific cities with known industry clusters.
**Alternatives Rejected:**
- Province-level targeting only — too broad, misses local intent
- National-only content — can't compete with global brands on broad terms
- All major Canadian cities — spreading too thin, Ontario is the primary market
**Impact:** Blog schedule alternates between SW Ontario and Golden Horseshoe cities. No same city within 7 days.

### 2026-03 | North American English (Not Canadian English)
**Decision:** Use "z" spellings (organization, customize) throughout, not British/Canadian "s" spellings.
**Why:** Target audience includes both Canadian and American quality managers. "Z" spellings are standard in North American business writing and avoid confusion. Google treats both as equivalent for SEO.
**Alternatives Rejected:**
- British/Canadian English (organisation, colour) — alienates US audience, inconsistent with ISO standard text which uses "z" spellings
**Impact:** `grammarAgent.js` enforces "z" spellings. All content must use organization (not organisation), customize (not customise), etc.

---

## Design Decisions

### 2026-03 | Glass Navbar with Mega Menu
**Decision:** Navbar uses glass morphism effect (`backdrop-blur-md bg-white/80`) with dropdown mega menus for Standards and Industries.
**Why:** 10 standards + 8 industries don't fit in a simple nav. Mega menu provides scannable grouping. Glass effect is modern without being distracting.
**Alternatives Rejected:**
- Simple dropdown — too many items, poor scanability
- Sidebar navigation — unconventional for B2B sites, confusing
- Hamburger menu on desktop — hides critical navigation
**Impact:** All 10 standards and 8 industries visible in two-column mega menu dropdowns.

### 2026-03 | 8-Video Hero Carousel
**Decision:** Homepage hero uses 8 manufacturing videos in a dual-layer crossfade carousel, 6 seconds per clip.
**Why:** Video conveys manufacturing/industrial context immediately. Dual-layer crossfade avoids black flashes between clips. 6 seconds balances engagement with attention span.
**Alternatives Rejected:**
- Static hero image — less engaging, doesn't convey scale of industries served
- Single video loop — repetitive on return visits
- Image carousel — less impactful than video for manufacturing audience
**Impact:** `hero-video-8.mp4` plays first. Mobile shows 3 videos (bandwidth optimization). iOS requires `autoPlay` + `muted` + `playsInline`.

### 2026-03 | No Glow/Pulse on Chatbot Button
**Decision:** Chatbot floating button has no glow, pulse, or attention-grabbing animation.
**Why:** User feedback — the pulsing animation was distracting and felt "cheap". Clean, static button with clear chat icon is more professional.
**Alternatives Rejected:**
- Pulsing glow animation — explicitly removed after user feedback
- Auto-open on page load — intrusive, hurts page load metrics
**Impact:** `Chatbot.tsx` renders a static floating button, bottom-right, navy header, white panel.

---

## Infrastructure Decisions

### 2026-03 | GitHub Actions Workflows Disabled
**Decision:** All 5 GitHub Actions workflows using Claude API have been disabled (cron schedules commented out).
**Why:** Daily blog must be published via Claude Code agent (Max plan) — API key approach was unreliable and expensive. Workflows were consuming API credits without oversight.
**Alternatives Rejected:**
- Keep workflows running — cost and quality control issues
- Switch to cheaper model in workflows — quality dropped below acceptable threshold
**Impact:** All automated content publishing happens through Claude Code Max plan agent sessions, not CI/CD.

### 2026-03 | IndexNow for Instant Indexing
**Decision:** Implemented IndexNow protocol for Bing and Yandex instant URL submission after every blog publish.
**Why:** Google indexing can take days/weeks for new pages. IndexNow gives Bing/Yandex near-instant awareness of new content. Google doesn't support IndexNow yet, but Bing traffic is non-trivial for B2B.
**Alternatives Rejected:**
- Google Indexing API only — requires Google Search Console verification per URL, rate limited
- No instant indexing — leaves new content undiscoverable for days
**Impact:** `indexingAgent.js` submits URLs after publish. Token file at `public/isocertificationconsultant-indexnow.txt`.

### 2026-03 | Multi-Machine Git Workflow
**Decision:** Always `git pull` before `git push` — mandatory workflow.
**Why:** Windows laptop with Claude Cowork also pushes to the same repo. Without pull-first discipline, force pushes or merge conflicts can destroy work.
**Alternatives Rejected:**
- Branch-per-machine — overhead for a single developer
- Single machine only — Windows laptop needed for some tasks
**Impact:** Every session must start with `git pull`. Every push must be preceded by `git pull`.

---

## Decision Template

```markdown
### YYYY-MM | [Short Title]
**Decision:** [What was decided]
**Why:** [The reasoning]
**Alternatives Rejected:**
- [Alternative 1] — [why rejected]
- [Alternative 2] — [why rejected]
**Impact:** [What this affects going forward]
```

---

*Last updated: 2026-03-31*
