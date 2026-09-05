const { chromium, webkit, devices } = require("playwright");
const path = require("path");
const fs = require("fs");
const { log } = require("../shared/logger");
const { SITE_URL, PAGES, REPORTS_DIR } = require("../shared/config");

// Device matrix — covers phones, tablets, desktop across iOS, Android, Windows
const DEVICE_PROFILES = [
  // iOS
  { name: "iPhone SE", ...devices["iPhone SE"], engine: "webkit" },
  { name: "iPhone 12", ...devices["iPhone 12"], engine: "webkit" },
  { name: "iPhone 14", ...devices["iPhone 14"], engine: "webkit" },
  { name: "iPad Mini", ...devices["iPad Mini"], engine: "webkit" },
  { name: "iPad Pro 11", ...devices["iPad Pro 11"], engine: "webkit" },

  // Android
  { name: "Pixel 5", ...devices["Pixel 5"], engine: "chromium" },
  { name: "Pixel 7", ...devices["Pixel 7"], engine: "chromium" },
  { name: "Galaxy S9+", ...devices["Galaxy S9+"], engine: "chromium" },
  { name: "Galaxy Tab S4", viewport: { width: 712, height: 1138 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (Linux; Android 12; SM-T830) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", engine: "chromium" },

  // Desktop
  { name: "Desktop 1280", viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false, userAgent: "", engine: "chromium" },
  { name: "Desktop 1920", viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false, userAgent: "", engine: "chromium" },

  // Windows tablet
  { name: "Surface Pro", viewport: { width: 912, height: 1368 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (Windows NT 10.0; ARM; Surface Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", engine: "chromium" },
];

const SCREENSHOTS_DIR = path.join(REPORTS_DIR, "screenshots");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function checkPage(page, pageUrl, deviceName) {
  const checks = [];
  const errors = [];

  // Navigate
  try {
    const response = await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    const status = response?.status() || 0;

    checks.push({
      name: "http-status",
      pass: status === 200,
      severity: status === 200 ? "low" : "critical",
      detail: `HTTP ${status}`,
    });

    if (status !== 200) {
      return { checks, errors, score: 0 };
    }
  } catch (err) {
    checks.push({ name: "http-status", pass: false, severity: "critical", detail: `Navigation failed: ${err.message}` });
    return { checks, errors, score: 0 };
  }

  // Wait for page to settle
  await page.waitForTimeout(2000);

  // 1. No horizontal overflow
  const hasOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  checks.push({
    name: "no-horizontal-overflow",
    pass: !hasOverflow,
    severity: "high",
    detail: hasOverflow ? `Content overflows viewport (${await page.evaluate(() => document.documentElement.scrollWidth)}px > ${await page.evaluate(() => document.documentElement.clientWidth)}px)` : "No overflow",
  });

  // 2. Viewport meta present
  const hasViewport = await page.evaluate(() => {
    return !!document.querySelector('meta[name="viewport"]');
  });
  checks.push({
    name: "viewport-meta",
    pass: hasViewport,
    severity: "high",
    detail: hasViewport ? "Present" : "Missing viewport meta tag",
  });

  // 3. All images loaded (no broken images)
  const brokenImages = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll("img"));
    return imgs
      .filter((img) => img.src && !img.complete)
      .map((img) => img.src.slice(0, 80));
  });
  // Give images a moment, then recheck
  await page.waitForTimeout(1000);
  const brokenAfterWait = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll("img"));
    return imgs
      .filter((img) => img.src && img.naturalWidth === 0 && img.naturalHeight === 0)
      .map((img) => img.src.slice(0, 80));
  });
  checks.push({
    name: "images-loaded",
    pass: brokenAfterWait.length === 0,
    severity: "medium",
    detail: brokenAfterWait.length === 0 ? "All images loaded" : `${brokenAfterWait.length} broken: ${brokenAfterWait.join(", ")}`,
  });

  // 4. Video autoplay attributes (only on pages with video)
  const videoInfo = await page.evaluate(() => {
    const videos = Array.from(document.querySelectorAll("video"));
    if (videos.length === 0) return null;
    return videos.map((v) => ({
      src: v.src || v.querySelector("source")?.src || "unknown",
      autoplay: v.autoplay,
      muted: v.muted,
      playsInline: v.playsInline,
      paused: v.paused,
    }));
  });
  if (videoInfo) {
    const allAutoplayReady = videoInfo.every((v) => v.autoplay && v.muted && v.playsInline);
    checks.push({
      name: "video-autoplay-attrs",
      pass: allAutoplayReady,
      severity: "high",
      detail: allAutoplayReady
        ? `${videoInfo.length} video(s) have autoplay+muted+playsInline`
        : `Missing attributes: ${videoInfo.filter((v) => !v.autoplay).length} without autoplay, ${videoInfo.filter((v) => !v.muted).length} without muted, ${videoInfo.filter((v) => !v.playsInline).length} without playsInline`,
    });
  }

  // 5. Touch targets >= 44px (mobile only)
  const isMobileDevice = await page.evaluate(() => window.innerWidth < 768);
  if (isMobileDevice) {
    const smallTargets = await page.evaluate(() => {
      const interactives = Array.from(document.querySelectorAll("a, button, input, select, textarea, [role='button']"));
      const small = [];
      for (const el of interactives) {
        const rect = el.getBoundingClientRect();
        // Skip elements that are hidden (zero-size or off-screen) or inside hidden parents
        if (rect.width === 0 || rect.height === 0) continue;
        const style = window.getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") continue;
        // Skip elements hidden by parent (e.g., desktop nav hidden on mobile)
        const parent = el.closest("[class*='hidden']");
        if (parent && window.getComputedStyle(parent).display === "none") continue;
        if (rect.width < 44 || rect.height < 44) {
          const text = el.textContent?.trim().slice(0, 30) || el.tagName;
          small.push(`${text} (${Math.round(rect.width)}x${Math.round(rect.height)})`);
        }
      }
      return small.slice(0, 5); // Cap at 5 for readability
    });
    checks.push({
      name: "touch-targets-44px",
      pass: smallTargets.length === 0,
      severity: "medium",
      detail: smallTargets.length === 0 ? "All touch targets >= 44px" : `${smallTargets.length} undersized: ${smallTargets.join(", ")}`,
    });
  }

  // 6. Text not truncated / clipped
  const clippedText = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll("h1, h2, h3, p, span, a"));
    const clipped = [];
    for (const el of elements) {
      const style = window.getComputedStyle(el);
      if (style.overflow === "hidden" && style.textOverflow !== "ellipsis") {
        const rect = el.getBoundingClientRect();
        if (el.scrollWidth > rect.width + 2 && rect.width > 0) {
          clipped.push(el.textContent?.trim().slice(0, 30) || el.tagName);
        }
      }
    }
    return clipped.slice(0, 3);
  });
  checks.push({
    name: "no-clipped-text",
    pass: clippedText.length === 0,
    severity: "medium",
    detail: clippedText.length === 0 ? "No clipped text" : `Clipped: ${clippedText.join(", ")}`,
  });

  // 7. Navbar/header visible (on mobile, the <nav> is hidden but header with hamburger is visible)
  const navVisible = await page.evaluate(() => {
    // Check for visible header, nav, or mobile menu toggle
    const header = document.querySelector("header");
    if (header) {
      const rect = header.getBoundingClientRect();
      if (rect.height > 0 && rect.width > 0) return true;
    }
    const nav = document.querySelector("nav");
    if (nav) {
      const rect = nav.getBoundingClientRect();
      if (rect.height > 0 && rect.width > 0) return true;
    }
    // Check for mobile menu button (hamburger)
    const menuBtn = document.querySelector('[aria-label="Toggle menu"]');
    if (menuBtn) {
      const rect = menuBtn.getBoundingClientRect();
      if (rect.height > 0 && rect.width > 0) return true;
    }
    return false;
  });
  checks.push({
    name: "navbar-visible",
    pass: navVisible,
    severity: "high",
    detail: navVisible ? "Navbar rendered" : "Navbar missing or hidden",
  });

  // 8. No console errors
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 80));
  });

  // Score
  const passed = checks.filter((c) => c.pass).length;
  const score = checks.length > 0 ? Math.round((passed / checks.length) * 100) : 100;

  return { checks, errors: consoleErrors, score };
}

async function auditPageAcrossDevices(pageRoute, deviceList) {
  const results = [];
  const dateStr = new Date().toISOString().split("T")[0];
  const screenshotDir = path.join(SCREENSHOTS_DIR, dateStr);
  ensureDir(screenshotDir);

  // Group by engine to minimize browser launches
  const chromiumDevices = deviceList.filter((d) => d.engine === "chromium");
  const webkitDevices = deviceList.filter((d) => d.engine === "webkit");

  const pageSlug = pageRoute === "/" ? "home" : pageRoute.replace(/\//g, "-").replace(/^-/, "");

  // Run Chromium devices
  if (chromiumDevices.length > 0) {
    let browser;
    try {
      browser = await chromium.launch({ headless: true });
      for (const device of chromiumDevices) {
        const contextOpts = {
          viewport: device.viewport,
          deviceScaleFactor: device.deviceScaleFactor || 1,
          isMobile: device.isMobile || false,
          hasTouch: device.hasTouch || false,
        };
        if (device.userAgent) contextOpts.userAgent = device.userAgent;

        const context = await browser.newContext(contextOpts);
        const page = await context.newPage();

        const url = `${SITE_URL}${pageRoute}`;
        log("deviceQA", "test", `${device.name} → ${pageRoute}`);

        const result = await checkPage(page, url, device.name);

        // Screenshot
        const screenshotName = `${pageSlug}_${device.name.replace(/\s+/g, "-").toLowerCase()}.png`;
        try {
          await page.screenshot({ path: path.join(screenshotDir, screenshotName), fullPage: true });
        } catch (e) {
          // Screenshot failure is non-blocking
        }

        results.push({
          device: device.name,
          engine: "chromium",
          viewport: `${device.viewport.width}x${device.viewport.height}`,
          ...result,
        });

        await context.close();
      }
    } catch (err) {
      log("deviceQA", "error", `Chromium launch failed: ${err.message}`);
    } finally {
      if (browser) await browser.close();
    }
  }

  // Run WebKit devices (iOS Safari emulation)
  if (webkitDevices.length > 0) {
    let browser;
    try {
      browser = await webkit.launch({ headless: true });
      for (const device of webkitDevices) {
        const contextOpts = {
          viewport: device.viewport,
          deviceScaleFactor: device.deviceScaleFactor || 1,
          isMobile: device.isMobile !== false,
          hasTouch: device.hasTouch !== false,
        };
        if (device.userAgent) contextOpts.userAgent = device.userAgent;

        const context = await browser.newContext(contextOpts);
        const page = await context.newPage();

        const url = `${SITE_URL}${pageRoute}`;
        log("deviceQA", "test", `${device.name} (WebKit) → ${pageRoute}`);

        const result = await checkPage(page, url, device.name);

        const screenshotName = `${pageSlug}_${device.name.replace(/\s+/g, "-").toLowerCase()}_webkit.png`;
        try {
          await page.screenshot({ path: path.join(screenshotDir, screenshotName), fullPage: true });
        } catch (e) {
          // Screenshot failure is non-blocking
        }

        results.push({
          device: device.name,
          engine: "webkit",
          viewport: `${device.viewport.width}x${device.viewport.height}`,
          ...result,
        });

        await context.close();
      }
    } catch (err) {
      log("deviceQA", "error", `WebKit launch failed: ${err.message}`);
    } finally {
      if (browser) await browser.close();
    }
  }

  return results;
}

async function auditHomepage() {
  log("deviceQA", "audit", "Homepage across all devices");
  return auditPageAcrossDevices("/", DEVICE_PROFILES);
}

async function fullAudit(pagesSubset) {
  const pagesToTest = pagesSubset || ["/", "/services", "/process", "/contact", "/about", "/blog"];
  log("deviceQA", "full-audit", `Testing ${pagesToTest.length} pages × ${DEVICE_PROFILES.length} devices`);

  const allResults = {};
  for (const pageRoute of pagesToTest) {
    allResults[pageRoute] = await auditPageAcrossDevices(pageRoute, DEVICE_PROFILES);
  }

  // Summary
  let totalChecks = 0;
  let totalPassed = 0;
  const failures = [];

  for (const [route, deviceResults] of Object.entries(allResults)) {
    for (const dr of deviceResults) {
      totalChecks += dr.checks.length;
      totalPassed += dr.checks.filter((c) => c.pass).length;
      const failedChecks = dr.checks.filter((c) => !c.pass);
      if (failedChecks.length > 0) {
        failures.push({ route, device: dr.device, viewport: dr.viewport, failed: failedChecks });
      }
    }
  }

  const overallScore = totalChecks > 0 ? Math.round((totalPassed / totalChecks) * 100) : 100;

  log("deviceQA", "full-audit", `Complete — ${overallScore}/100 across ${Object.keys(allResults).length} pages × ${DEVICE_PROFILES.length} devices`);

  return {
    overallScore,
    pass: overallScore >= 85,
    totalDevices: DEVICE_PROFILES.length,
    pagesAudited: Object.keys(allResults).length,
    totalChecks,
    totalPassed,
    failures,
    details: allResults,
  };
}

module.exports = { auditHomepage, auditPageAcrossDevices, fullAudit, DEVICE_PROFILES };
