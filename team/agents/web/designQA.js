const https = require("https");
const { claudeCallFast } = require("../shared/claude");
const { log } = require("../shared/logger");
const { SITE_URL, PAGES } = require("../shared/config");

const BRAND_COLORS = {
  navy: { name: "Summit Navy", hex: "#152B4B", hsl: "216 55% 19%" },
  teal: { name: "Signal Teal", hex: "#059CB7", hsl: "189 94% 37%" },
  gold: { name: "Peak Gold", hex: "#D5870B", hsl: "37 90% 44%" },
};

const SYSTEM_PROMPT = `You are the Design QA Agent for ISO Certification Consultant, the visual standards enforcer. You operate with 30 years of Bay Area design QA experience at premium B2B SaaS companies. You operate at an IQ of 148 (top 0.1% of cognitive ability) — bringing exceptional analytical depth, first-principles reasoning, and pattern recognition that far exceeds industry norms. Your outputs reflect genius-level precision, insight, and strategic thinking.

YOUR MISSION: Catch every pixel-level design regression before it reaches production. You focus exclusively on visual quality — card shadows, spacing consistency, colour accuracy, hover states, and mobile visual fidelity.

BRAND STANDARDS TO ENFORCE:
- Summit Navy: #152B4B (CSS var: --primary)
- Signal Teal: #059CB7 (CSS var: --secondary)
- Peak Gold: #D5870B (CSS var: --accent)
- Headings: Outfit font, semibold 600
- Body: DM Sans font, regular 400
- Cards: rounded-lg, shadow-sm on rest, shadow-lg on hover, visible border
- CTAs: gold background (bg-accent), white text, consistent padding
- All images: industrial/manufacturing context, never generic business imagery

VISUAL CHECKS:
1. Card visibility — cards must NEVER disappear into backgrounds (invisible cards are Critical)
2. Colour accuracy — all brand colours match hex values exactly
3. Hover states — all interactive elements have visible hover feedback
4. Scroll-aware navbar — transparent over hero, solid after scroll
5. Typography — Outfit headings, DM Sans body, correct weight scale
6. CTA buttons — gold background, white text, consistent across pages
7. Image rendering — no broken images, no grey boxes, no distorted aspect ratios
8. Spacing — consistent padding/margin scale across components
9. Mobile layout — no horizontal scroll, no content overflow at 375px

Respond with JSON:
{
  "score": 0-100,
  "pass": true/false (pass >= 85),
  "checks": [{ "name": "string", "pass": true/false, "severity": "critical|high|medium|low", "detail": "string" }],
  "recommendations": ["specific Tailwind CSS fixes"]
}`;

function httpGet(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 15000 }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    });
    req.on("error", (err) => resolve({ status: 0, body: "", error: err.message }));
    req.on("timeout", () => { req.destroy(); resolve({ status: 0, body: "", error: "timeout" }); });
  });
}

function checkBrandColors(html) {
  const checks = [];

  // Check for hardcoded wrong colors
  const wrongColors = ["#162B4D", "#0891B2", "#D97706"];
  const correctColors = ["#152B4B", "#059CB7", "#D5870B"];

  for (let i = 0; i < wrongColors.length; i++) {
    if (html.includes(wrongColors[i])) {
      checks.push({
        name: `color-${["navy", "teal", "gold"][i]}`,
        pass: false,
        severity: "medium",
        detail: `Found old color ${wrongColors[i]} — should be ${correctColors[i]}`,
      });
    }
  }

  return checks;
}

function checkVisualElements(html) {
  const checks = [];

  // Check for invisible card patterns (bg-muted/20 etc)
  if (html.includes("bg-muted/20") || html.includes("border-border/50")) {
    checks.push({
      name: "card-visibility",
      pass: false,
      severity: "critical",
      detail: "Found low-opacity card backgrounds (bg-muted/20 or border-border/50) — cards may be invisible",
    });
  }

  // Check for hero images
  const hasHeroImg = html.includes("hero") && (html.includes("<img") || html.includes("next/image"));
  checks.push({
    name: "hero-image",
    pass: html.includes("<img") || html.includes("Image"),
    detail: hasHeroImg ? "hero image present" : "check hero image",
  });

  // Check for CTA buttons
  const hasGoldCTA = html.includes("accent") || html.includes("#D5870B") || html.includes("bg-accent");
  checks.push({
    name: "cta-visibility",
    pass: hasGoldCTA,
    severity: hasGoldCTA ? "low" : "high",
    detail: hasGoldCTA ? "gold CTA found" : "no gold accent CTA found",
  });

  return checks;
}

async function auditPage(pageUrl) {
  log("designQA", "audit-page", pageUrl);
  const res = await httpGet(pageUrl);

  if (res.status !== 200) {
    return {
      url: pageUrl,
      score: 0,
      pass: false,
      checks: [{ name: "http-status", pass: false, severity: "critical", detail: `HTTP ${res.status}` }],
    };
  }

  const html = res.body;
  const checks = [
    ...checkBrandColors(html),
    ...checkVisualElements(html),
  ];

  // Check viewport meta for mobile
  checks.push({
    name: "mobile-viewport",
    pass: html.includes('name="viewport"'),
    severity: "high",
    detail: html.includes('name="viewport"') ? "present" : "missing viewport meta",
  });

  // Check for Outfit and DM Sans fonts
  const hasOutfit = html.includes("Outfit") || html.includes("font-heading");
  const hasDMSans = html.includes("DM Sans") || html.includes("DM_Sans") || html.includes("font-body");
  checks.push({
    name: "typography-fonts",
    pass: hasOutfit && hasDMSans,
    severity: "medium",
    detail: `Outfit: ${hasOutfit ? "yes" : "no"}, DM Sans: ${hasDMSans ? "yes" : "no"}`,
  });

  const passed = checks.filter((c) => c.pass).length;
  const score = checks.length > 0 ? Math.round((passed / checks.length) * 100) : 100;

  return { url: pageUrl, score, pass: score >= 85, checks };
}

async function fullAudit() {
  log("designQA", "full-audit", "starting");
  const results = [];

  for (const page of PAGES) {
    const url = `${SITE_URL}${page}`;
    const result = await auditPage(url);
    results.push(result);
    log("designQA", "page", `${page}: ${result.score}/100`);
  }

  const avgScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
  log("designQA", "full-audit", `completed — average score ${avgScore}/100`);

  return { pages: results, averageScore: avgScore, pass: avgScore >= 85 };
}

module.exports = { auditPage, fullAudit };
