# Page Registry

> Every page on isocertificationconsultant.ca. Update this file whenever a page is added, removed, or changes status.

---

## Static Pages

| Route | Page Title | Status | In Sitemap | Indexed | Est. Words | Internal Links |
|-------|-----------|--------|------------|---------|------------|----------------|
| `/` | ISO Certification Consultant — ISO Consulting | Published | Yes (priority 1.0) | Yes | ~2,500 | 15+ |
| `/about` | About ISO Certification Consultant | Published | Yes (priority 0.8) | Yes | ~1,800 | 8 |
| `/contact` | Contact ISO Certification Consultant | Published | Yes (priority 0.7) | Yes | ~800 | 5 |
| `/process` | Our 6-Stage ISO Certification Process | Published | Yes (priority 0.7) | Yes | ~1,500 | 10 |
| `/blog` | ISO Blog & Insights | Published | Yes (priority 0.9) | Yes | Dynamic | 50+ |
| `/services` | ISO Consulting Services | Published | Yes (priority 0.9) | Yes | ~1,200 | 12 |
| `/industries` | ISO Consulting by Industry | Published | Yes (priority 0.9) | Yes | ~1,000 | 10 |
| `/assessment` | Free ISO Readiness Assessment | Published | Yes (priority 0.8) | Yes | ~1,200 | 6 |
| `/resources` | Resource Library | Published | Yes (priority 0.8) | Yes | ~1,000 | 8 |
| `/privacy` | Privacy Policy | Published | Yes (priority 0.3) | Yes | ~2,000 | 2 |
| `/terms` | Terms of Service | Published | Yes (priority 0.3) | Yes | ~2,000 | 2 |

---

## Service Pages (10 ISO Standards)

| Route | Standard | Status | In Sitemap | Indexed | Est. Words | Target Keyword |
|-------|----------|--------|------------|---------|------------|----------------|
| `/services/iso-9001` | ISO 9001 — Quality Management | Published | Yes (0.85) | Yes | ~3,500 | iso 9001 certification canada |
| `/services/iso-14001` | ISO 14001 — Environmental Management | Published | Yes (0.85) | Yes | ~3,200 | iso 14001 certification canada |
| `/services/iso-45001` | ISO 45001 — OH&S Management | Published | Yes (0.85) | Yes | ~3,100 | iso 45001 certification canada |
| `/services/iso-13485` | ISO 13485 — Medical Devices | Published | Yes (0.85) | Yes | ~3,300 | iso 13485 consulting canada |
| `/services/iso-27001` | ISO 27001 — Information Security | Published | Yes (0.85) | Yes | ~3,000 | iso 27001 consulting canada |
| `/services/iso-22000` | ISO 22000 — Food Safety | Published | Yes (0.85) | Yes | ~3,100 | iso 22000 consulting canada |
| `/services/iatf-16949` | IATF 16949 — Automotive Quality | Published | Yes (0.85) | Yes | ~3,400 | iatf 16949 certification canada |
| `/services/as9100` | AS9100 — Aerospace Quality | Published | Yes (0.85) | Yes | ~3,200 | as9100 consulting canada |
| `/services/iso-22301` | ISO 22301 — Business Continuity | Published | Yes (0.85) | Yes | ~2,900 | iso 22301 consulting canada |
| `/services/iso-17025` | ISO/IEC 17025 — Lab Accreditation | Published | Yes (0.85) | Yes | ~3,100 | iso 17025 accreditation canada |

---

## Industry Pages (8 Verticals)

| Route | Industry | Status | In Sitemap | Indexed | Est. Words | Target Keyword |
|-------|----------|--------|------------|---------|------------|----------------|
| `/industries/manufacturing` | Manufacturing | Published | Yes (0.8) | Yes | ~4,200 | iso consulting manufacturing canada |
| `/industries/automotive` | Automotive | Published | Yes (0.8) | Yes | ~4,400 | iso consulting automotive canada |
| `/industries/aerospace-defence` | Aerospace & Defence | Published | Yes (0.8) | Yes | ~4,050 | iso consulting aerospace canada |
| `/industries/healthcare-medical-devices` | Healthcare & Medical Devices | Published | Yes (0.8) | Yes | ~4,300 | iso 13485 medical device canada |
| `/industries/food-beverage` | Food & Beverage | Published | Yes (0.8) | Yes | ~3,800 | iso consulting food beverage canada |
| `/industries/oil-gas-energy` | Oil, Gas & Energy | Published | Yes (0.8) | Yes | ~3,900 | iso consulting oil gas canada |
| `/industries/construction` | Construction | Published | Yes (0.8) | Yes | ~4,100 | iso consulting construction canada |
| `/industries/mining-natural-resources` | Mining & Natural Resources | Published | Yes (0.8) | Yes | ~3,950 | iso consulting mining canada |

---

## Blog Posts (Dynamic — Sanity CMS)

| Metric | Value |
|--------|-------|
| **Total published articles** | ~1,566 (as of 2026-03-31) |
| **Article types** | Standalone articles + Mega article series (9-10 chapters each) |
| **Sitemap priority** | 0.7 (all blog posts) |
| **Change frequency** | Monthly |
| **Publishing cadence** | 2 articles daily (see content-calendar.md) |
| **Avg. word count** | 1,800-3,500 per article |
| **Mega article chapters** | 2,000-2,200 words each |

> Individual blog posts are tracked in `team/memory/published-articles.json` (86 KB, full metadata per article).

---

## API Routes

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/api/contact` | POST | Contact form submission → CRM + Resend email | Bot protection (honeypot + rate limit) |
| `/api/chat` | POST | AI chatbot streaming (Groq Llama 3.3 70B) | None (public) |
| `/api/chat/lead` | POST | Chatbot lead capture → CRM webhook + Resend | None (public) |
| `/api/leads/webhook` | POST | CRM inbound webhook receiver | API key |
| `/api/assessment/generate` | POST | Assessment question generation | None |
| `/api/assessment/results` | POST | Assessment scoring & results | None |
| `/api/resources/generate` | POST | PDF/DOCX resource generation | None |
| `/api/resources/download` | POST | File download handler | None |
| `/api/telegram` | POST | Telegram integration | Webhook secret |

---

## Page Count Summary

| Category | Count |
|----------|-------|
| Static pages | 11 |
| Service pages | 10 |
| Industry pages | 8 |
| Blog posts (dynamic) | ~1,566 |
| API routes | 9 |
| **Total user-facing pages** | **~1,595** |

---

*Last updated: 2026-03-31*
