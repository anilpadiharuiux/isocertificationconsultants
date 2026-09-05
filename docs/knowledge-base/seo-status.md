# SEO Status

> Current SEO state for isocertificationconsultant.ca. Update weekly with Google Search Console data.

---

## Overview (as of 2026-03-31)

| Metric | Value |
|--------|-------|
| **Total user-facing pages** | ~1,595 |
| **Static pages in sitemap** | 29 |
| **Dynamic blog posts in sitemap** | ~1,566 (fetched from Sanity at build time) |
| **Sitemap URL** | https://isocertificationconsultant.ca/sitemap.xml |
| **Robots.txt** | Dynamic via `app/robots.ts` |
| **IndexNow** | Active (Bing/Yandex, token file in `public/`) |
| **Google Site Verification** | Via `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` env var |

---

## Indexing Strategy

### Allowed
- All static pages (homepage, about, contact, process, services, industries, blog, assessment, resources)
- All blog posts (`/blog/*`)
- All service pages (`/services/*`)
- All industry pages (`/industries/*`)

### Blocked (in robots.ts)
- `/api/*` — API routes
- `/_next/*` — Next.js internal files
- `/sanity/*` — CMS studio

### Instant Indexing
- **IndexNow** integration for Bing and Yandex — automatic submission after blog publish
- Token file: `public/isocertificationconsultant-indexnow.txt`
- Agent: `team/agents/seo/indexingAgent.js`
- Last submission: 2026-04-01 (15 URLs, status 202 Accepted)

---

## Structured Data

| Schema Type | Pages | Details |
|-------------|-------|---------|
| `ProfessionalService` | Homepage (`layout.tsx`) | 10 serviceTypes, aggregateRating, areaServed (CA provinces + US states) |
| `FAQPage` | Homepage (HomeFAQ), service pages, industry pages | 5-6 Q&As per page |
| `WebSite` | Homepage | Site-level schema |
| `BlogPosting` | Blog posts | Title, author, date, description |
| `HowTo` | Process page | 6-stage certification process |

---

## hreflang Configuration

| Tag | Value | Location |
|-----|-------|----------|
| `en-CA` | `https://isocertificationconsultant.ca` | `app/layout.tsx` |
| `en-US` | `https://isocertificationconsultant.ca` | `app/layout.tsx` |
| `x-default` | `https://isocertificationconsultant.ca` | `app/layout.tsx` |

---

## Target Markets

| Market | Priority | Focus |
|--------|----------|-------|
| **Canada** | Primary | Ontario (SW Ontario + Golden Horseshoe focus), all provinces |
| **United States** | Secondary | Manufacturing states |

### City-Level Targeting (Blog Content)
- **SW Ontario:** London, Windsor, Kitchener, Guelph, Chatham-Kent, Stratford, Woodstock, Sarnia, St. Thomas
- **Golden Horseshoe:** Hamilton, Mississauga, Toronto, Oshawa, Brampton, Markham, St. Catharines, Barrie, Niagara Falls

---

## Keyword Targets (Primary)

| Keyword | Target Page | Current Position |
|---------|-------------|-----------------|
| iso consultant canada | `/` | Not tracked yet |
| iso 9001 certification canada | `/services/iso-9001` | Not tracked yet |
| iso certification consultant | `/services` | Not tracked yet |
| iso 9001 consultant toronto | `/` | Not tracked yet |
| iso 14001 certification canada | `/services/iso-14001` | Not tracked yet |
| iso 45001 certification canada | `/services/iso-45001` | Not tracked yet |
| iso 13485 consulting canada | `/services/iso-13485` | Not tracked yet |

> Full keyword list: `team/memory/seo-targets.json` (1.2 KB)
> Keyword queue: `team/memory/keyword-queue.json` (157 pending keywords)

---

## Rankings Tracker Status

- Framework initialized in `team/memory/rankings-tracker.json`
- **All SERP positions currently NULL** — needs integration with SERP tracking tool
- 2 keywords tracked: "iso 9001 certification cost canada", "iso consultant toronto"

---

## AI Search Visibility

Last assessed: 2026-03-27 (via `team/agents/seo/aiSearchAgent.js`)

| AI Engine | Citation Likelihood | Notes |
|-----------|-------------------|-------|
| ChatGPT | Low | Needs third-party mentions, strong backlinks |
| Perplexity | Medium | Active web crawl; page 1-2 Google rank + schema helps |
| Gemini | Low | Heavy Google Business Profile bias |

### Improvement Actions
1. List on Clutch.co, GoodFirms, Google Business Profile (target 20+ reviews)
2. Create dedicated long-form "ISO Consulting in Canada" landing pages with FAQ schema
3. Earn editorial coverage from CMA (Canadian Manufacturers & Exporters)

---

## Google Search Console Issues

> **TODO:** Populate this section weekly with GSC data.

| Issue | Pages Affected | Status | Date Found |
|-------|---------------|--------|------------|
| *(none logged yet)* | — | — | — |

---

## Competitor Landscape

Top competitors identified by AI visibility tracker:
- bsigroup.com
- bureauveritas.com
- clutch.co
- isocertification.ca
- qmscanada.com
- nsf.org

---

## Weekly Update Log

| Date | Updated By | Changes |
|------|-----------|---------|
| 2026-03-31 | Initial | Knowledge base created, baseline established |

---

*Last updated: 2026-03-31*
