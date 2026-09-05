# Architecture

> Tech stack, hosting, framework, styling approach, and folder structure for ISO Certification Consultant.

---

## Tech Stack

| Layer | Technology | Version/Details |
|-------|-----------|-----------------|
| **Framework** | Next.js 14 | App Router, SSG, React 18 |
| **Language** | TypeScript | Strict mode |
| **Styling** | Tailwind CSS 3.4 | Mobile-first, `darkMode: "class"` |
| **UI Library** | shadcn/ui + Radix | 50+ primitives (accordion, dialog, dropdown, etc.) |
| **CMS** | Sanity | Project ID: `uakgkw7x`, Dataset: `production`, GROQ queries |
| **AI (Chatbot)** | Groq API | Llama 3.3 70B, streaming via Vercel AI SDK v4 |
| **AI (Agents)** | Claude API | Sonnet for planning, Haiku for fast tasks |
| **Email** | Resend API | Transactional email to info@isocertificationconsultant.ca |
| **Database** | Supabase | PostgreSQL, CRM webhook receiver |
| **Images** | Pexels API | North American industrial imagery only |
| **Icons** | Lucide React | 0.462.0 |
| **Charts** | Recharts | Data visualization |
| **PDF/DOCX** | jsPDF + html2canvas | Resource generation |
| **Testing** | Playwright | 12 device configurations |

---

## Hosting & Deployment

| Item | Value |
|------|-------|
| **Host** | Vercel (auto-deploy on GitHub push) |
| **Domain** | https://isocertificationconsultant.ca |
| **Aliases** | iso-certification-consultant-site.vercel.app |
| **Redirect** | isoconsultant.ca → isocertificationconsultant.ca |
| **Repository** | YOUR_GITHUB_USERNAME/iso-certification-consultant-site (GitHub) |
| **Build** | `npm run build` (Next.js SSG) |
| **Environment** | `.env.local` (local), Vercel dashboard (production) |

---

## Folder Structure

```
iso-certification-consultant-site/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Homepage
│   ├── layout.tsx                # Root layout (fonts, metadata, structured data, hreflang)
│   ├── globals.css               # Global styles
│   ├── sitemap.ts                # Dynamic XML sitemap (static + Sanity blog posts)
│   ├── robots.ts                 # Dynamic robots.txt
│   ├── about/page.tsx
│   ├── contact/page.tsx
│   ├── process/page.tsx
│   ├── blog/
│   │   ├── page.tsx              # Blog listing (Guides + Articles)
│   │   └── [slug]/page.tsx       # Individual posts (custom Portable Text renderer)
│   ├── services/
│   │   ├── page.tsx              # Services overview
│   │   └── [standard]/
│   │       ├── page.tsx          # Dynamic service pages (10 standards)
│   │       └── serviceData.ts    # All service page content (1,399 lines)
│   ├── industries/
│   │   ├── page.tsx              # Industries overview
│   │   └── [industry]/
│   │       ├── page.tsx          # Dynamic industry pages (8 industries)
│   │       └── industryData.ts   # All industry page content (553 lines)
│   ├── assessment/page.tsx       # ISO readiness assessment tool
│   ├── resources/page.tsx        # Downloadable templates & guides
│   ├── privacy/page.tsx
│   ├── terms/page.tsx
│   └── api/                      # API routes
│       ├── contact/route.ts      # Contact form → CRM + Resend (bot protection)
│       ├── chat/route.ts         # AI chatbot streaming (Groq)
│       ├── chat/lead/route.ts    # Chatbot lead capture
│       ├── leads/webhook/route.ts # CRM webhook receiver
│       ├── assessment/generate/route.ts
│       ├── assessment/results/route.ts
│       ├── resources/generate/route.ts
│       ├── resources/download/route.ts
│       └── telegram/route.ts     # Telegram integration
│
├── components/                   # React components
│   ├── Navbar.tsx                # Glass navbar + mega menu (469 lines)
│   ├── HeroCarousel.tsx          # 8-video crossfade carousel
│   ├── HeroTextCycler.tsx        # ISO standards marquee
│   ├── Chatbot.tsx               # AI chatbot widget
│   ├── ISOJourney.tsx            # 6-stage interactive stepper
│   ├── IndustrySelector.tsx      # 8-industry card grid
│   ├── HomeFAQ.tsx               # Accordion FAQ + JSON-LD
│   ├── Footer.tsx                # Site footer
│   ├── Testimonials.tsx          # Client testimonials carousel
│   ├── ChapterNavigation.tsx     # Mega article chapter nav
│   ├── BlogResourceHub.tsx       # Blog: Latest Articles + Browse by Topic
│   ├── BlogArticlesSection.tsx   # Blog article listing
│   ├── BlogHero.tsx              # Blog hero section
│   ├── BlogPreview.tsx           # Article preview card
│   ├── PageHero.tsx              # Reusable inner page hero
│   ├── BookConsultationButton.tsx # CTA button
│   ├── SidebarContactForm.tsx    # Sidebar form on blog/service pages
│   ├── NewsletterSignup.tsx      # Email signup
│   ├── CookieConsent.tsx         # Cookie banner
│   ├── MobileCTA.tsx             # Mobile-only CTA
│   ├── TopBar.tsx                # Top announcement bar
│   └── ui/                       # shadcn/ui primitives (50+ files)
│
├── lib/                          # Utilities
│   ├── sanity.ts                 # Sanity client + GROQ queries
│   ├── assessment-data.ts        # 350+ assessment questions
│   ├── assessment-scoring.ts     # Scoring algorithm
│   ├── resources-data.ts         # Resource library metadata
│   ├── bot-protection.ts         # Honeypot, rate limiting
│   ├── calendly.ts               # Calendly embed config
│   ├── consent.ts                # Cookie consent
│   └── utils.ts                  # General utilities
│
├── hooks/                        # React hooks
│   ├── use-mobile.tsx            # Mobile detection
│   ├── use-toast.ts              # Toast notifications
│   ├── useCountUp.tsx            # Animated counter
│   └── useScrollReveal.ts        # Scroll reveal animation
│
├── public/                       # Static assets
│   ├── hero-video*.mp4 (8 files) # Hero carousel videos
│   ├── logo.svg, favicon.ico, og-image.jpg
│   ├── isocertificationconsultant-indexnow.txt # IndexNow token
│   └── resources/                # Downloadable PDFs/templates
│
├── team/                         # AI Agent system (50+ agents)
│   ├── CLAUDE.md                 # Agent workflow rules
│   ├── ARCHITECTURE.md           # Auto-generated architecture
│   ├── pm.js                     # Pipeline manager (npm run morning)
│   ├── agents/
│   │   ├── content/ (18 agents)  # Article pipeline
│   │   ├── seo/ (9 agents)       # SEO optimization
│   │   ├── web/ (8 agents)       # Development & QA
│   │   ├── security/ (2 agents)  # Compliance & VAPT
│   │   ├── growth/ (1 agent)     # LinkedIn posting
│   │   ├── ops/ (3 agents)       # Analytics & reporting
│   │   └── shared/ (12 files)    # Shared utilities
│   ├── memory/                   # Agent state (30+ JSON files)
│   ├── reports/                  # Generated audit reports
│   └── scripts/                  # Publishing & maintenance
│
├── sanity/                       # Sanity CMS config & schemas
├── scripts/                      # Utility/migration scripts
├── blog-pipeline/                # Blog publish I/O (_published/, _failed/, logs/)
└── blog-pipeline-scripts/        # Standalone markdown → Sanity publisher
```

---

## Key Architecture Patterns

### Data-Driven Pages
Service pages (10 standards) and industry pages (8 industries) use **dynamic routing** with content defined in TypeScript data files (`serviceData.ts`, `industryData.ts`). No hardcoded page files per standard/industry.

### Blog Architecture
- **CMS:** Sanity (blogPost type, Portable Text)
- **Two content types:** Mega article series (via `seriesSlug` + `chapterNumber`) and standalone articles
- **Custom renderer** in `app/blog/[slug]/page.tsx` handles code fences, HR markers, raw markdown, blockquotes, tables
- **Pipeline:** 13-step automated pipeline via `contentManager.js`

### Security
- Contact form: honeypot field, timestamp speed check, IP rate limiting (`lib/bot-protection.ts`)
- CSP headers, X-Frame-Options, X-Content-Type-Options in `next.config.js`
- Allowed image domains: Unsplash, Sanity CDN, isoconsultant.ca

### SEO Infrastructure
- Dynamic `sitemap.ts` (static pages + all Sanity blog posts + Sanity service pages)
- Dynamic `robots.ts` (disallows `/api/`, `/_next/`, `/sanity/`)
- IndexNow integration for Bing/Yandex instant indexing
- Structured data: `ProfessionalService`, `FAQPage`, `WebSite` schemas
- hreflang: `en-CA`, `en-US`, `x-default`

---

## Environment Variables

```
# CMS
SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_TOKEN

# AI
GROQ_API_KEY, ANTHROPIC_API_KEY

# Email & CRM
RESEND_API_KEY, CRM_WEBHOOK_API_KEY

# Tracking
NEXT_PUBLIC_LEADFEEDER_ID, NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
LEADFEEDER_API_KEY, RB2B_WEBHOOK_SECRET

# SEO & Images
SERPAPI_KEY, PEXELS_API_KEY
```

---

*Last updated: 2026-03-31*
