# Content Calendar

> Publishing schedule for isocertificationconsultant.ca blog. Must always have 2 weeks of planned topics ahead.

---

## Publishing Cadence

| Content Type | Frequency | Pipeline |
|-------------|-----------|----------|
| **Daily articles** | 2 per day | 13-step automated pipeline via `contentManager.js` |
| **Mega articles** | Tuesdays and Fridays | `outlineArchitect.js` → 9-10 chapters, 18,000-20,000 words total |

### Publishing Method
- **Daily blog:** Published via Claude Code agent (Max plan) — never via CLAUDE_API_KEY
- **Pipeline:** Keyword Research → Context Loading → Article Writing → Content Cleaning → Grammar Check → Originality Check → Link Validation → Hero Image → Inline Images → Featured Image → QA Review (95+ to pass) → Sanity Publish → Page Audit
- **Post-publish:** IndexNow submission to Bing/Yandex for instant indexing

---

## Content Rules

### Rotation Requirements
- No same ISO standard twice in a row
- No same city within 7 days
- Region alternation: SW Ontario ↔ Golden Horseshoe
- Must rotate across all 8 standards (excluding AS9100 and ISO 27001 for blog articles)
- Every article gets a unique hero image (tracked in `team/memory/image-registry.json`)

### Standards Rotation Pool (for blog)
1. ISO 9001
2. ISO 14001
3. ISO 45001
4. ISO 13485
5. ISO 22000
6. IATF 16949
7. FSSC 22000
8. ISO 17025

> **Hard rule:** No blog articles about AS9100 or ISO 27001.

### Geographic Rotation

**SW Ontario cities:** London, Windsor, Kitchener, Guelph, Chatham-Kent, Stratford, Woodstock, Sarnia, St. Thomas

**Golden Horseshoe cities:** Hamilton, Mississauga, Toronto, Oshawa, Brampton, Markham, St. Catharines, Barrie, Niagara Falls

---

## Scheduled Articles (April 1 – April 14, 2026)

> Source: `team/memory/blog-schedule.json` (60+ scheduled articles through May 28)

| Date | Type | Standard | City/Region | Industry Focus | Status |
|------|------|----------|-------------|---------------|--------|
| Apr 1 | Daily | IATF 16949 | Windsor, ON | Automotive/Tool & Die | Published |
| Apr 1 | Mega | ISO 9001 | — | Implementation Guide | Published |
| Apr 2 | Daily | ISO 45001 | Hamilton, ON | Steel/Heavy Manufacturing | Scheduled |
| Apr 2 | Daily | ISO 14001 | London, ON | Food Processing | Scheduled |
| Apr 3 | Daily | ISO 9001 | Mississauga, ON | Tech/Electronics | Scheduled |
| Apr 3 | Daily | ISO 13485 | Markham, ON | Medical Devices | Scheduled |
| Apr 4 | Daily | IATF 16949 | Oshawa, ON | Automotive Assembly | Scheduled |
| Apr 4 | Mega | ISO 14001 | — | Environmental Compliance | Scheduled |
| Apr 5 | Daily | ISO 22000 | Guelph, ON | Food & Beverage | Scheduled |
| Apr 5 | Daily | ISO 45001 | Brampton, ON | Logistics/Warehousing | Scheduled |
| Apr 6 | Daily | ISO 9001 | Kitchener, ON | Manufacturing | Scheduled |
| Apr 6 | Daily | ISO 14001 | St. Catharines, ON | Petrochemical | Scheduled |
| Apr 7 | Daily | ISO 13485 | Toronto, ON | Pharma/Medical | Scheduled |
| Apr 7 | Daily | IATF 16949 | Chatham-Kent, ON | Automotive Parts | Scheduled |
| Apr 8 | Daily | ISO 45001 | Sarnia, ON | Petrochemical/Energy | Scheduled |
| Apr 8 | Mega | IATF 16949 | — | Core Tools Guide | Scheduled |
| Apr 9 | Daily | ISO 22000 | Stratford, ON | Food Processing | Scheduled |
| Apr 9 | Daily | ISO 9001 | Barrie, ON | Construction | Scheduled |
| Apr 10 | Daily | ISO 14001 | Windsor, ON | Automotive | Scheduled |
| Apr 10 | Daily | ISO 17025 | Hamilton, ON | Testing Labs | Scheduled |
| Apr 11 | Daily | ISO 45001 | London, ON | Manufacturing | Scheduled |
| Apr 11 | Mega | ISO 45001 | — | Safety Leadership | Scheduled |
| Apr 12 | Daily | ISO 9001 | Niagara Falls, ON | Tourism/Manufacturing | Scheduled |
| Apr 12 | Daily | ISO 13485 | Mississauga, ON | Medical Devices | Scheduled |
| Apr 13 | Daily | IATF 16949 | Woodstock, ON | Automotive Parts | Scheduled |
| Apr 13 | Daily | ISO 14001 | Toronto, ON | Construction | Scheduled |
| Apr 14 | Daily | ISO 22000 | Brampton, ON | Food Distribution | Scheduled |
| Apr 14 | Daily | ISO 9001 | St. Thomas, ON | Manufacturing | Scheduled |

---

## Topic Pipeline (157 Pending Keywords)

Top priority keywords in queue (from `team/memory/keyword-queue.json`):

### Primary Market Keywords
- iso 9001 certification cost canada
- iso consultant ontario
- iso certification timeline
- quality management system consulting
- iso audit preparation guide

### Standard-Specific Keywords
- iatf 16949 core tools training
- iso 13485 health canada mdel
- iso 22000 haccp integration
- iso 45001 safety culture
- iso 14001 environmental compliance

### City-Specific Keywords
- iso consultant hamilton
- iso certification kitchener waterloo
- iso 9001 mississauga
- iatf 16949 windsor ontario
- iso consultant london ontario

### Industry Keywords
- iso consulting food processing
- iso certification oil and gas
- iso consulting construction companies
- medical device quality management
- automotive quality management system

### Trend Keywords
- ai quality management system
- digital transformation iso
- industry 4.0 quality
- remote iso audits
- integrated management systems

---

## Mega Article Series Published

| Series | Standard | Chapters | Total Words | Status |
|--------|----------|----------|-------------|--------|
| ISO 9001 Implementation Guide | ISO 9001 | 9-10 | ~18,000 | Published |
| IATF 16949 Complete Guide | IATF 16949 | 9-10 | ~20,000 | Published |
| ISO 14001 Environmental Guide | ISO 14001 | 9-10 | ~18,000 | Published |
| *(additional series tracked in Sanity CMS)* | | | | |

---

## Monthly Regional Roundups

| Date | Region | Content |
|------|--------|---------|
| End of April | SW Ontario | Monthly roundup of ISO certification news across SW Ontario |
| End of April | Golden Horseshoe | Monthly roundup of ISO certification activity in Golden Horseshoe |

---

*Last updated: 2026-03-31*
