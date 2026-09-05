# ISO Certification Consultant Knowledge Base

> **Read this file first at the start of every Claude Code or Codex session.**
> This is the canonical index for project context, conventions, and current state.

---

## How to Use This Knowledge Base

1. **Every new session** starts by reading this README
2. **Before creating a page**, check `page-registry.md` and `internal-linking-map.md`
3. **Before writing content**, check `content-calendar.md` and `brand-guide.md`
4. **Before making architecture changes**, check `architecture.md` and `conventions.md`
5. **Before making strategic decisions**, check `decisions.md` for prior reasoning

---

## Documents

| File | Purpose | Update Frequency |
|------|---------|-----------------|
| [architecture.md](architecture.md) | Tech stack, hosting, framework, folder structure | On architecture changes |
| [conventions.md](conventions.md) | Component patterns, file naming, imports, styling, images | On convention changes |
| [page-registry.md](page-registry.md) | All pages: route, title, status, indexed, word count, links | Every new page or article |
| [seo-status.md](seo-status.md) | Total pages, indexed count, sitemap, GSC issues, strategy | Weekly |
| [content-calendar.md](content-calendar.md) | Publishing schedule, topic pipeline, mega-article cadence | Always 2 weeks ahead |
| [internal-linking-map.md](internal-linking-map.md) | Which pages link to which, CTA destinations, hub structure | Every new page |
| [feature-pages.md](feature-pages.md) | Product feature pages with target keywords | On feature page changes |
| [brand-guide.md](brand-guide.md) | Voice, tone, audience, messaging, competitor positioning | On brand changes |
| [decisions.md](decisions.md) | Design/content decisions: what, why, alternatives rejected | Every significant decision |

---

## Maintenance Rules

1. **Every new page or article** must be added to `page-registry.md`
2. **Every new page** must be added to `internal-linking-map.md` with at least 3 internal links
3. **`seo-status.md`** must be updated weekly with Google Search Console data
4. **`content-calendar.md`** must always have 2 weeks of planned topics ahead
5. **`decisions.md`** must be updated whenever a non-obvious choice is made

---

## Related Project Files

These files also contain important project context (located in the repo root or `team/`):

| File | Purpose |
|------|---------|
| `PROMPT-iso-certification-consultant-website.md` | Master project prompt (in parent `nextgen/` directory) |
| `team/CLAUDE.md` | Agent workflow rules, QA gates, session protocol |
| `team/ARCHITECTURE.md` | Auto-generated architecture snapshot |
| `team/memory/` | Agent state files (published articles, keyword queue, link map, etc.) |

---

*Last updated: 2026-03-31*
