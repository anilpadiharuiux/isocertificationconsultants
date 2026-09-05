# Coding Conventions

> Component patterns, file naming, import rules, styling rules, and image handling.

---

## File Naming

| Type | Convention | Example |
|------|-----------|---------|
| **Pages** | `app/<route>/page.tsx` | `app/about/page.tsx` |
| **Dynamic pages** | `app/<route>/[param]/page.tsx` | `app/services/[standard]/page.tsx` |
| **API routes** | `app/api/<name>/route.ts` | `app/api/contact/route.ts` |
| **Components** | PascalCase `.tsx` | `HeroCarousel.tsx`, `HomeFAQ.tsx` |
| **UI primitives** | kebab-case `.tsx` in `components/ui/` | `components/ui/alert-dialog.tsx` |
| **Hooks** | camelCase with `use` prefix | `hooks/useScrollReveal.ts` |
| **Libraries** | kebab-case `.ts` in `lib/` | `lib/bot-protection.ts` |
| **Data files** | camelCase `.ts` co-located with page | `serviceData.ts`, `industryData.ts` |
| **Agent files** | camelCase `.js` | `team/agents/content/articleWriter.js` |

---

## Component Patterns

### Page Structure
Every service/industry page follows this structure:
1. Hero section (PageHero component or custom)
2. Introduction (3-5 paragraphs)
3. Feature/benefit sections
4. Implementation process (4 steps)
5. FAQs (5 Q&As with JSON-LD)
6. Related standards/industries links
7. CTA section with "Book Free Consultation" button → `/contact`

### Required Page Elements
Every page must have:
- One `<h1>` tag
- Meta title (30-70 characters) and description (120-170 characters)
- Open Graph and JSON-LD structured data
- A visible CTA section linking to `/contact`
- No placeholder text or content markers
- Minimum 1,500 words for service/industry pages

### Component Conventions
- Use shadcn/ui + Radix primitives from `components/ui/` for all UI elements
- Import UI components from `@/components/ui/<component>`
- Import utility functions from `@/lib/utils`
- Use `cn()` (from `lib/utils.ts`) for conditional class merging

---

## Import Rules

```tsx
// 1. React/Next.js imports
import { Metadata } from "next";
import Image from "next/image";

// 2. Third-party imports
import { motion } from "framer-motion";

// 3. UI component imports (from shadcn/ui)
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// 4. Custom component imports
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

// 5. Library/utility imports
import { sanityClient } from "@/lib/sanity";
import { cn } from "@/lib/utils";

// 6. Hook imports
import { useScrollReveal } from "@/hooks/useScrollReveal";
```

- Use `@/` path aliases (configured in `tsconfig.json`)
- Never use relative paths like `../../components/`

---

## Styling Rules

### Tailwind CSS (Mobile-First)

```
Base classes   = mobile (< 640px)
sm:            = 640px+
md:            = 768px+
lg:            = 1024px+
xl:            = 1280px+
```

### Design System Colors

| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| **Primary** | `hsl(216, 55%, 19%)` | `#162B4D` | Dark navy — headers, nav, buttons |
| **Secondary** | `hsl(189, 94%, 37%)` | `#0891B2` | Teal — accents, links, highlights |
| **Accent** | `hsl(37, 90%, 44%)` | `#D97706` | Gold — CTAs, badges, emphasis |

### Fonts

| Usage | Font | CSS Variable |
|-------|------|-------------|
| **Headings** | Outfit | `--font-heading` |
| **Body** | DM Sans | `--font-body` |

### Common Patterns

```tsx
// Responsive padding
className="p-5 sm:p-7"
className="px-4 sm:px-6 lg:px-8"

// Responsive text
className="text-sm sm:text-base"
className="text-lg sm:text-xl"

// Touch targets (44px minimum on mobile)
className="min-h-[44px] py-3"

// Glass effect (navbar)
className="backdrop-blur-md bg-white/80"

// Scroll reveal animation
className="animate-reveal-up"
```

### Animations (Defined in `tailwind.config.ts`)
- `accordion` — Accordion open/close
- `marquee` — Continuous horizontal scroll (ISO standards strip)
- `reveal-up` — Scroll-triggered fade-in from below
- `hero-word` — Hero text entrance
- `subtle-float` — Gentle floating effect
- `shimmer` — Loading shimmer
- `fade-in-up` — General fade-in entrance

---

## Image Handling

### Rules (Hard)
- **North American imagery ONLY** — no non-Western settings anywhere
- **Manufacturing/industrial scenes ONLY** — no office, boardroom, desk, or corporate photos
- **Every blog image must be unique** — tracked in `team/memory/image-registry.json`
- **16:9 aspect ratio** for blog hero images
- **Sources:** Pexels API (primary), Unsplash (secondary)

### Allowed Image Domains (in `next.config.js`)
- `images.unsplash.com`
- `cdn.sanity.io`
- `www.isoconsultant.ca`

### Image Components
- Use Next.js `<Image>` component for all images (optimized loading)
- Hero carousel uses `<video>` tags with `autoPlay`, `muted`, `playsInline` (all three required for iOS Safari)

---

## Content Conventions

### Language
- **North American English** — use "z" spellings (organization, customize, optimize)
- Never British/Canadian spellings (no organisation, colour, labour)

### Banned Patterns
- No first person (we/our/I) in mega articles
- No "Pro Tips" labels
- No "Phase" labels
- No AS9100 or ISO 27001 blog articles
- See `PROMPT-iso-certification-consultant-website.md` for full banned patterns list

### Internal Links
- Must be woven mid-sentence, never appended at end of paragraphs
- Never in a "Related Links" section
- Every new page must have at least 3 internal links

---

## Git Conventions

- **Always `git pull` before `git push`** (multi-machine setup with Windows laptop)
- **Co-Author line:** `Co-Authored-By: ISO Consultant <info@isocertificationconsultant.ca>`
- Never mention Claude, Anthropic, or AI in commits or website code
- Run `npm run build` after every change before committing
- Run `node scripts/update-architecture.cjs` before committing

---

*Last updated: 2026-03-31*
