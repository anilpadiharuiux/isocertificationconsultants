# Internal Linking Map

> Which pages link to which. Every new page must be added here with at least 3 internal links.

---

## Link Strategy

- Internal links must be woven **mid-sentence** — never appended at end of paragraphs
- Never create "Related Links" sections — links must feel natural
- Every new page must have **at least 3 inbound and 3 outbound** internal links
- Full link graph tracked in `team/memory/link-map.json` (51 KB)
- Link opportunities managed by `team/agents/seo/linkBuilder.js`

---

## Hub Pages (High Authority — Link Targets)

These pages should receive the most inbound links:

| Hub Page | Route | Inbound Link Sources |
|----------|-------|---------------------|
| **Homepage** | `/` | All pages (via navbar, footer, logo) |
| **Services Overview** | `/services` | All service pages, industry pages, blog articles |
| **Industries Overview** | `/industries` | All industry pages, service pages, blog articles |
| **Blog** | `/blog` | All blog posts (breadcrumb), homepage, navbar |
| **Contact** | `/contact` | All pages (CTA buttons), chatbot lead capture |
| **Process** | `/process` | Service pages, industry pages, about page |
| **Assessment** | `/assessment` | Navbar, service pages, blog CTAs |
| **Resources** | `/resources` | Navbar, blog articles, service pages |

---

## Service Page Cross-Links

Each service page links to related standards and relevant industries:

| Service Page | Links To (Standards) | Links To (Industries) |
|-------------|---------------------|----------------------|
| `/services/iso-9001` | ISO 14001, ISO 45001 (integrated systems) | Manufacturing, Automotive, Construction |
| `/services/iso-14001` | ISO 9001, ISO 45001 (integrated systems) | Manufacturing, Oil-Gas, Mining, Construction |
| `/services/iso-45001` | ISO 9001, ISO 14001 (integrated systems) | Construction, Mining, Oil-Gas, Manufacturing |
| `/services/iso-13485` | ISO 9001 (foundation) | Healthcare-Medical-Devices |
| `/services/iso-27001` | ISO 9001, ISO 22301 | Manufacturing (IT/data) |
| `/services/iso-22000` | ISO 9001, FSSC 22000 | Food-Beverage |
| `/services/iatf-16949` | ISO 9001 (foundation), AS9100 (comparison) | Automotive, Manufacturing |
| `/services/as9100` | ISO 9001 (foundation), IATF 16949 (comparison) | Aerospace-Defence |
| `/services/iso-22301` | ISO 27001, ISO 9001 | All industries (business continuity) |
| `/services/iso-17025` | ISO 9001 | Manufacturing (testing labs) |

---

## Industry Page Cross-Links

Each industry page links to its relevant standards and related industries:

| Industry Page | Links To (Standards) | Links To (Industries) |
|--------------|---------------------|----------------------|
| `/industries/manufacturing` | ISO 9001, ISO 14001, ISO 45001 | Automotive, Construction |
| `/industries/automotive` | IATF 16949, ISO 9001, ISO 14001, ISO 45001 | Manufacturing, Aerospace |
| `/industries/aerospace-defence` | AS9100, ISO 9001, ISO 45001 | Manufacturing, Automotive |
| `/industries/healthcare-medical-devices` | ISO 13485, ISO 9001 | Manufacturing |
| `/industries/food-beverage` | ISO 22000, FSSC 22000, ISO 9001 | Manufacturing |
| `/industries/oil-gas-energy` | ISO 14001, ISO 45001, ISO 9001 | Mining, Construction |
| `/industries/construction` | ISO 9001, ISO 45001, ISO 14001 | Manufacturing, Mining |
| `/industries/mining-natural-resources` | ISO 14001, ISO 45001, ISO 9001 | Oil-Gas, Construction |

---

## Global Navigation Links (Present on All Pages)

### Navbar (components/Navbar.tsx)
- **Standards dropdown:** All 10 service pages
- **Industries dropdown:** All 8 industry pages
- **Resources dropdown:** Blog, ISO Guides, Process, Resource Library, FAQ
- **About dropdown:** About, Contact
- **CTA buttons:** Free Assessment → `/assessment`, Book Consultation → Calendly

### Footer (components/Footer.tsx)
- Links to: Homepage, About, Contact, Process, Blog, Privacy, Terms
- Links to: All 10 service pages
- Links to: All 8 industry pages
- Social links (external)

### Chatbot (components/Chatbot.tsx)
- Lead capture → CRM webhook + Resend email
- Quick prompts reference service pages contextually

---

## Blog Article Linking Rules

### Outbound Links (from each blog article)
1. **Primary service page** — link to the ISO standard discussed in the article
2. **Related service page** — link to a complementary standard (e.g., ISO 9001 article links to ISO 14001)
3. **Industry page** — link to the relevant industry
4. **Process page** — when discussing certification steps
5. **Contact/Assessment** — CTA links at article conclusion

### Inbound Links (to blog articles)
- Service pages link to relevant blog articles via "Learn More" contextual references
- Industry pages link to relevant articles
- Other blog articles cross-reference related topics

### Article-to-Article Links
- Each article should link to 2-3 other blog articles on related topics
- Links placed mid-paragraph, not in lists
- Mega article chapters link to the series hub and adjacent chapters via `ChapterNavigation.tsx`

---

## CTA Destinations

| CTA Type | Destination | Used On |
|----------|------------|---------|
| "Book Free Consultation" button | `/contact` or Calendly embed | All service pages, industry pages, homepage |
| "Free Assessment" button | `/assessment` | Navbar, homepage, service pages |
| "Contact Us" | `/contact` | Footer, about page, blog CTAs |
| "View Our Process" | `/process` | Homepage, about page |
| "Browse Resources" | `/resources` | Navbar, blog articles |
| "Read More" (blog) | `/blog/[slug]` | Blog listing, homepage blog preview |

---

## Orphan Page Check

Pages that must NOT be orphaned (must have inbound links beyond navbar/footer):

- [x] `/assessment` — linked from navbar CTA, service pages, blog articles
- [x] `/resources` — linked from navbar, blog articles
- [x] `/process` — linked from homepage, service pages, about page
- [x] `/privacy` — linked from footer
- [x] `/terms` — linked from footer

---

*Last updated: 2026-03-31*
