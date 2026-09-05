#!/usr/bin/env node

const { Command } = require("commander");
const chalk = require("chalk");
const path = require("path");

// Load env before anything else
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const program = new Command();

function banner() {
  console.log(chalk.bold("\n" + "=".repeat(65)));
  console.log(chalk.bold("  ISO Certification Consultant Enterprise Agent Team"));
  console.log(chalk.gray("  Where Quality Meets Excellence."));
  console.log("=".repeat(65));
}

program
  .name("pm")
  .description("ISO Certification Consultant Enterprise Agent Team — Project Manager CLI")
  .version("1.0.0");

// ── morning ──────────────────────────────────────────────────────
program
  .command("morning")
  .description("Daily audit: site health, Sanity content, security headers, email report")
  .action(async () => {
    banner();
    console.log(chalk.cyan("\n  Pipeline: MORNING AUDIT\n") + "-".repeat(65));

    const qaEngineer = require("./agents/web/qaEngineer");
    const technicalSeo = require("./agents/seo/technicalSeo");
    const onPageSeo = require("./agents/seo/onPageSeo");
    const offPageSeo = require("./agents/seo/offPageSeo");
    const { countDocuments } = require("./agents/shared/sanity");
    const { claudeCallFast: claudeCall } = require("./agents/shared/claude");
    const { generateDailyReport } = require("./agents/shared/reporter");
    const { sendMorningReport } = require("./agents/shared/notifier");
    const { getHeartbeats } = require("./agents/shared/heartbeat");
    const { log } = require("./agents/shared/logger");

    log("pm", "morning", "starting");

    // 1. Quick page checks + on-page SEO audit (in parallel — both are pure HTTP, zero Claude cost)
    console.log("  Checking pages + on-page SEO audit (parallel)...");
    const [pageChecks, onPageResults] = await Promise.all([
      qaEngineer.quickCheck(),
      onPageSeo.auditAllPages(),
    ]);
    for (const c of pageChecks) {
      const icon = c.status === "ok" ? chalk.green("PASS") : chalk.red("FAIL");
      console.log(`    [${icon}] ${c.name}: ${c.detail}`);
    }

    // On-page SEO summary
    const onPageTotal = onPageResults.reduce((n, p) => n + p.checks.length, 0);
    const onPagePassed = onPageResults.reduce((n, p) => n + p.checks.filter((c) => c.pass).length, 0);
    console.log(`\n  On-Page SEO: ${onPagePassed}/${onPageTotal} checks passed across ${onPageResults.length} pages`);

    // 2. Technical SEO
    console.log("\n  Running technical SEO checks...");
    const techChecks = await technicalSeo.audit();
    for (const c of techChecks) {
      const icon = c.pass ? chalk.green("PASS") : chalk.red("FAIL");
      console.log(`    [${icon}] ${c.name}: ${c.detail}`);
    }

    // 2.5. Design QA
    console.log("\n  Running design QA checks...");
    const designQA = require("./agents/web/designQA");
    const designResult = await designQA.fullAudit();
    for (const page of designResult.pages) {
      const icon = page.pass ? chalk.green("PASS") : chalk.red("FAIL");
      console.log(`    [${icon}] ${page.url}: ${page.score}/100`);
    }

    // 3. Sanity content counts
    let contentCheck = { name: "sanity-content", status: "ok", detail: "" };
    try {
      const counts = await countDocuments();
      contentCheck.detail = `${counts.blogPosts} blog posts, ${counts.servicePages} service pages`;
    } catch (err) {
      contentCheck.status = "fail";
      contentCheck.detail = `query failed: ${err.message}`;
    }
    console.log(`\n  Sanity: ${contentCheck.detail}`);

    // 4. Merge all checks
    const allChecks = [
      ...pageChecks,
      ...techChecks.map((c) => ({ name: c.name, status: c.pass ? "ok" : "fail", detail: c.detail })),
      ...designResult.pages.map((p) => ({ name: `design-${p.url.split("/").pop() || "home"}`, status: p.pass ? "ok" : "fail", detail: `${p.score}/100` })),
      contentCheck,
    ];

    // 5. Load today's blog publications (daily + mega)
    let latestBlog = null;
    let todayArticles = [];
    try {
      const contentManager = require("./agents/content/contentManager");
      const published = contentManager.getPublished();
      const { today: todayFn } = require("./agents/shared/logger");
      const todayStr = todayFn();
      todayArticles = published.filter((a) => a.date === todayStr);
      if (published.length > 0) {
        latestBlog = published[published.length - 1];
      }
      if (todayArticles.length > 0) {
        console.log(`\n  Today's publications: ${todayArticles.length}`);
        for (const a of todayArticles) {
          const type = a.articleType === "mega" ? chalk.magenta("[MEGA]") : chalk.blue("[DAILY]");
          console.log(`    ${type} ${a.title} (${a.wordCount} words, QA: ${a.qaScore}/100)`);
          if (a.metaDescription) console.log(`      Meta: ${a.metaDescription}`);
        }
      } else if (latestBlog) {
        console.log(`\n  Latest blog: ${latestBlog.title} (${latestBlog.date})`);
      }
    } catch { /* published-articles.json may not exist yet */ }

    // 6. Generate report
    const report = generateDailyReport(allChecks, latestBlog, onPageResults);
    console.log(chalk.bold(`\n  Site Status: ${report.failed === 0 ? chalk.green("Healthy") : chalk.red(`${report.failed} issue(s)`)}`));
    console.log(`  Checks: ${report.passed}/${report.total} passed`);
    console.log(`  Report saved: ${report.filePath}`);

    // 6.5 Off-page SEO opportunities (uses Claude — ~$0.01, approved)
    let offPageOpportunities = null;
    console.log("\n  Finding off-page SEO opportunities...");
    try {
      offPageOpportunities = await offPageSeo.findOpportunities();
      console.log(`  Off-page: ${offPageOpportunities.opportunities?.length || 0} opportunities found`);
    } catch (err) {
      console.log(chalk.yellow(`  Off-page SEO skipped: ${err.message}`));
    }

    // 7. Synthesize with Claude (now includes on-page SEO data)
    let aiSummary = null;
    console.log("\n  Generating AI summary...");
    try {
      const aiPayload = {
        siteChecks: allChecks,
        onPageSeo: { totalPages: onPageResults.length, passRate: `${onPagePassed}/${onPageTotal}`, failingPages: onPageResults.filter((p) => p.checks.some((c) => !c.pass)).map((p) => ({ url: p.url, failures: p.checks.filter((c) => !c.pass).map((c) => `${c.name}: ${c.detail}`) })) },
        offPageTopFive: offPageOpportunities?.topFive || [],
      };
      aiSummary = await claudeCall(
        "You are the ISO Certification Consultant site monitor. Summarize these check results and SEO data in 5-8 bullet points. Flag critical issues including SEO problems. Suggest the top priority fix for today.",
        JSON.stringify(aiPayload),
        1024
      );
      console.log("\n" + chalk.bold("  AI Summary:"));
      for (const line of aiSummary.split("\n").filter(Boolean)) {
        console.log(`  ${line}`);
      }
      report.markdown += `\n\n## AI Summary\n\n${aiSummary}`;
    } catch (err) {
      console.log(chalk.yellow(`  AI summary skipped: ${err.message}`));
    }

    // 8. Agent heartbeat summary
    let agentSummary = null;
    try {
      const heartbeats = getHeartbeats();
      const AGENT_IDS = ["contentManager", "keywordResearcher", "articleWriter", "contentEnhancer", "contentCleaner", "imageAgent", "infographicAgent", "inlineImageAgent", "linkBuilder", "contentQA", "sanityPublisher", "productManager", "uiDesigner", "frontendDev", "backendDev", "qaEngineer", "designQA", "pageAuditor", "seoManager", "onPageSeo", "offPageSeo", "technicalSeo", "contentSeo", "aiSearchAgent", "leadsAgent", "contentRefresher", "vaptAgent", "complianceMonitor", "llmRankTracker", "brandMentionMonitor", "videoToBlog"];
      let active = 0;
      const issues = [];
      for (const id of AGENT_IDS) {
        const hb = heartbeats[id];
        if (hb && (Date.now() - new Date(hb.lastRun).getTime()) < 86400000) {
          active++;
          if (hb.lastStatus === "error" || hb.lastStatus === "failed") {
            issues.push({ agent: id, status: hb.lastStatus, metric: hb.lastMetric });
          }
        }
      }
      agentSummary = { activeAgents: active, totalAgents: AGENT_IDS.length, issues };
      console.log(`\n  Agents: ${active}/${AGENT_IDS.length} active`);
    } catch { /* heartbeat file may not exist */ }

    // 8.5 Find latest weekly SEO report
    let seoReportFile = null;
    try {
      const weeklyDir = path.join(require("./agents/shared/config").REPORTS_DIR, "weekly");
      const fs = require("fs");
      if (fs.existsSync(weeklyDir)) {
        const reports = fs.readdirSync(weeklyDir).filter((f) => f.endsWith(".md")).sort().reverse();
        if (reports.length > 0) seoReportFile = reports[0];
      }
    } catch { /* ok */ }

    // 8.7 Leads summary (yesterday's data for the morning email)
    let leadsData = null;
    try {
      const leadsAgent = require("./agents/shared/leadsAgent");
      const leads = leadsAgent.showLeads(); // today's leads (or yesterday if run early morning)
      const weekStats = leadsAgent.getStats();
      leadsData = { todayLeads: leads, weekStats };
      console.log(`\n  Leads: ${leads.length} recent, ${weekStats.hot || 0} hot this week`);
    } catch (err) {
      console.log(chalk.yellow(`  Leads data skipped: ${err.message}`));
    }

    // 8.75 Google Analytics (GA4) — traffic, demographics, sources
    let ga4Data = null;
    try {
      const { getDailySnapshot } = require("./agents/ops/analyticsManager");
      console.log("\n  Pulling GA4 analytics...");
      ga4Data = await getDailySnapshot();
      if (ga4Data.error) {
        console.log(chalk.yellow(`  GA4 skipped: ${ga4Data.error}`));
        ga4Data = null;
      } else {
        console.log(`  GA4: ${ga4Data.overview.users} users (28d), ${ga4Data.yesterday.users} yesterday, ${ga4Data.realtime} live now`);
        console.log(`  Top source: ${ga4Data.trafficSources[0]?.source || "N/A"} (${ga4Data.trafficSources[0]?.sessions || 0} sessions)`);
        console.log(`  Top country: ${ga4Data.countries[0]?.country || "N/A"} (${ga4Data.countries[0]?.users || 0} users)`);
      }
    } catch (err) {
      console.log(chalk.yellow(`  GA4 analytics skipped: ${err.message}`));
    }

    // 8.8 Full agent team dashboard data + activity log
    let agentDashboard = null;
    try {
      const { TEAMS } = require("./agents/shared/teamAuditor");
      const { readTodayLog } = require("./agents/shared/logger");
      const heartbeats = getHeartbeats();

      // Parse daily log into activity entries
      const rawLog = readTodayLog();
      const activityLog = [];
      if (rawLog) {
        for (const line of rawLog.split("\n").filter(Boolean)) {
          const m = line.match(/^\[(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\]\s*\[(\w+)\]\s*(\S+):\s*(.*)$/);
          if (m) {
            const d = new Date(m[1]);
            const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Toronto" });
            activityLog.push({ time, agent: m[2], action: m[3], detail: m[4] });
          }
        }
      }
      console.log(`\n  Activity log: ${activityLog.length} entries today`);

      agentDashboard = { teams: TEAMS, heartbeats, activityLog };
    } catch { /* ok */ }

    // 8.9 SEO Performance data (rankings + AI visibility + content stats)
    let seoPerformance = null;
    try {
      const fs = require("fs");
      const { MEMORY_DIR } = require("./agents/shared/config");

      // Rankings from rankings-tracker.json
      const rankingsPath = path.join(MEMORY_DIR, "rankings-tracker.json");
      let rankings = [];
      if (fs.existsSync(rankingsPath)) {
        const data = JSON.parse(fs.readFileSync(rankingsPath, "utf-8"));
        for (const [slug, entry] of Object.entries(data)) {
          const sorted = (entry.rankings || []).sort((a, b) => b.date.localeCompare(a.date));
          const latest = sorted[0] || {};
          const prev = sorted[1] || {};
          let trend = "stable";
          if (latest.position === null) trend = "new";
          else if (prev.position === null) trend = "new";
          else if (latest.position < prev.position) trend = "up";
          else if (latest.position > prev.position) trend = "down";
          rankings.push({ keyword: entry.keyword, position: latest.position, trend, date: latest.date });
        }
      }

      // AI visibility from latest report
      let aiVisibility = null;
      try {
        const aiReportDir = path.join(require("./agents/shared/config").REPORTS_DIR, "ai-search");
        if (fs.existsSync(aiReportDir)) {
          const files = fs.readdirSync(aiReportDir).filter((f) => f.endsWith(".json")).sort().reverse();
          if (files.length > 0) {
            const latest = JSON.parse(fs.readFileSync(path.join(aiReportDir, files[0]), "utf-8"));
            aiVisibility = { score: latest.visibilityScore, total: latest.total, date: latest.date };
          }
        }
      } catch { /* ok */ }

      // Content stats from published-articles.json
      let contentStats = null;
      try {
        const published = JSON.parse(fs.readFileSync(path.join(MEMORY_DIR, "published-articles.json"), "utf-8"));
        const totalArticles = published.length;
        const scores = published.filter((a) => a.qaScore).map((a) => a.qaScore);
        const avgQA = scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null;
        const totalWords = published.reduce((s, a) => s + (a.wordCount || 0), 0);
        contentStats = { totalArticles, avgQA, totalWords: totalWords > 1000 ? `${Math.round(totalWords / 1000)}k` : totalWords };
      } catch { /* ok */ }

      seoPerformance = { rankings, aiVisibility, contentStats };
      console.log(`\n  SEO: ${rankings.length} keywords tracked, AI visibility: ${aiVisibility ? `${aiVisibility.score}/${aiVisibility.total}` : "N/A"}`);
    } catch (err) {
      console.log(chalk.yellow(`  SEO performance skipped: ${err.message}`));
    }

    // 8.95 LinkedIn sharing status
    let linkedinData = null;
    try {
      const linkedinAgent = require("./agents/growth/linkedinAgent");
      const status = linkedinAgent.getStatus();
      linkedinData = status;
      console.log(`\n  LinkedIn: ${status.week.shared}/${status.week.limit} articles shared this week, ${status.candidateCount} in queue`);
    } catch (err) {
      console.log(chalk.yellow(`  LinkedIn agent skipped: ${err.message}`));
    }

    // 8.96 Google indexing status
    let indexingData = null;
    try {
      const indexingAgent = require("./agents/seo/indexingAgent");
      console.log("\n  Checking Google indexing status...");
      const pages = [
        "https://isocertificationconsultant.ca/",
        "https://isocertificationconsultant.ca/services/iso-9001",
        "https://isocertificationconsultant.ca/services/iso-14001",
        "https://isocertificationconsultant.ca/services/iso-45001",
        "https://isocertificationconsultant.ca/industries/manufacturing",
        "https://isocertificationconsultant.ca/blog",
      ];
      const results = [];
      for (const url of pages) {
        try {
          const r = await indexingAgent.inspectUrl(url);
          const idx = r.inspectionResult?.indexStatusResult;
          results.push({
            page: url.replace("https://isocertificationconsultant.ca", "") || "/",
            state: idx?.coverageState || "unknown",
            crawled: idx?.lastCrawlTime || "never",
          });
        } catch { /* skip on error */ }
      }
      const indexed = results.filter(r => r.state === "Submitted and indexed").length;
      indexingData = { results, indexed, total: results.length };
      console.log(`  Indexing: ${indexed}/${results.length} key pages indexed`);
    } catch (err) {
      console.log(chalk.yellow(`  Indexing check skipped: ${err.message}`));
    }

    // 9. Send consolidated daily email (ALL data in one email)
    report.checks = allChecks;
    report.blogData = latestBlog;
    report.todayArticles = todayArticles;
    report.aiSummary = aiSummary;
    report.agentSummary = agentSummary;
    report.seoReportFile = seoReportFile;
    report.onPageSeo = onPageResults;
    report.offPageOpportunities = offPageOpportunities;
    report.leadsData = leadsData;
    report.agentDashboard = agentDashboard;
    report.seoPerformance = seoPerformance;
    report.ga4Data = ga4Data;
    report.linkedinData = linkedinData;
    report.indexingData = indexingData;
    await sendMorningReport(report);

    // 10. Report Processor — parse today's report and generate action items
    try {
      const { processReport } = require("./agents/ops/reportProcessor");
      console.log(chalk.cyan("\n  [10/10] Report Processor — extracting action items..."));
      const rpResult = await processReport({ autoFix: true });
      if (rpResult) {
        console.log(`    Auto-fixed: ${rpResult.autoFixed.map((f) => `${f.type} (${f.fixed}/${f.total})`).join(", ") || "none"}`);
        console.log(`    Pending tasks: ${rpResult.pendingTasks}`);
        console.log(`    Action report: ${rpResult.summaryPath}`);
      }
    } catch (err) {
      console.log(chalk.yellow(`  Report processor skipped: ${err.message}`));
    }

    // 11. Daily indexing loop — submit unindexed pages to Google + Bing
    try {
      const indexingAgent = require("./agents/seo/indexingAgent");
      console.log(chalk.cyan("\n  [11] Daily Indexing Loop — submitting unindexed pages..."));
      const indexResult = await indexingAgent.dailyIndexLoop();
      console.log(`    Checked: ${indexResult.checked} pages`);
      console.log(`    Not indexed: ${indexResult.notIndexed.length}`);
      if (indexResult.submitted > 0) {
        console.log(chalk.green(`    Submitted ${indexResult.submitted} pages to IndexNow`));
      }
    } catch (err) {
      console.log(chalk.yellow(`  Daily indexing loop skipped: ${err.message}`));
    }

    console.log("\n" + "=".repeat(65) + "\n");
    log("pm", "morning", "completed");

    // Notify the Owner on Telegram
    try {
      const telegram = require("./agents/shared/telegram");
      await telegram.notify(`Morning Audit Complete\n\nAll checks finished. Report saved to team/reports/daily/\nEmail dashboard sent to info@isocertificationconsultant.ca\n\nAsk me for details: "how did the audit go?"`);
    } catch { /* telegram optional */ }
  });

// ── plan ─────────────────────────────────────────────────────────
program
  .command("plan <requirement>")
  .description("Decompose a requirement into a sprint plan for team approval")
  .action(async (requirement) => {
    banner();
    console.log(chalk.cyan(`\n  Planning: ${requirement}\n`) + "-".repeat(65));

    const { plan } = require("./agents/web/productManager");
    const sprint = await plan(requirement);

    console.log(chalk.bold(`\n  Sprint: ${sprint.sprintId}`));
    console.log(`  Goal: ${sprint.goal}`);
    console.log(`  Backlog items: ${(sprint.backlogItems || []).join(", ")}\n`);

    for (const task of sprint.tasks || []) {
      const deps = task.dependsOn?.length ? ` (after ${task.dependsOn.join(", ")})` : "";
      console.log(`  ${chalk.bold(task.id)} [${task.agent}] ${task.description}${deps}`);
      if (task.files?.length) console.log(`    Files: ${task.files.join(", ")}`);
      console.log(`    Est: ${task.estimatedMinutes} min`);
    }

    console.log(`\n  Run ${chalk.bold(`node pm.js execute ${sprint.sprintId}`)} to execute.`);
    console.log("=".repeat(65) + "\n");
  });

// ── execute ──────────────────────────────────────────────────────
program
  .command("execute <sprintId>")
  .description("Execute all tasks in a sprint")
  .action(async (sprintId) => {
    banner();
    console.log(chalk.cyan(`\n  Executing: ${sprintId}\n`) + "-".repeat(65));

    const pm = require("./agents/web/productManager");
    const uiDesigner = require("./agents/web/uiDesigner");
    const frontendDev = require("./agents/web/frontendDev");
    const backendDev = require("./agents/web/backendDev");
    const qaEngineer = require("./agents/web/qaEngineer");
    const designQA = require("./agents/web/designQA");
    const { log } = require("./agents/shared/logger");

    const sprint = pm.loadSprint(sprintId);
    if (sprint.status === "completed") {
      console.log(chalk.yellow("  Sprint already completed."));
      return;
    }

    const results = [];

    // Sort tasks by dependencies (simple topological sort)
    const pending = [...sprint.tasks];
    const completed = new Set();

    while (pending.length > 0) {
      const ready = pending.filter((t) =>
        (t.dependsOn || []).every((d) => completed.has(d))
      );
      if (ready.length === 0) {
        console.log(chalk.red("  Circular dependency detected!"));
        break;
      }

      for (const task of ready) {
        console.log(chalk.bold(`\n  ${task.id} [${task.agent}] ${task.description}`));
        log("pm", "execute-task", `${task.id}: ${task.description}`);

        let result;
        try {
          switch (task.agent) {
            case "uiDesigner":
              result = await uiDesigner.design(task.description, task.files);
              break;
            case "frontendDev":
              task.designSpec = results.find((r) => r.taskId === (task.dependsOn || [])[0])?.output?.designSpec;
              result = await frontendDev.implement(task);
              break;
            case "backendDev":
              result = await backendDev.createApiRoute(task);
              break;
            case "qaEngineer":
              result = await qaEngineer.check();
              break;
            case "designQA":
              result = await designQA.fullAudit();
              break;
            default:
              result = { error: `Unknown agent: ${task.agent}` };
          }
          console.log(chalk.green(`    Done`));
        } catch (err) {
          result = { error: err.message };
          console.log(chalk.red(`    Failed: ${err.message}`));
        }

        results.push({ taskId: task.id, agent: task.agent, output: result });
        completed.add(task.id);
        pending.splice(pending.indexOf(task), 1);
      }
    }

    pm.closeSprint(sprintId, results);
    console.log(chalk.bold(`\n  Sprint ${sprintId} completed.`));
    console.log("=".repeat(65) + "\n");
  });

// ── seo ──────────────────────────────────────────────────────────
const seoCmd = program.command("seo").description("SEO management commands");

seoCmd
  .command("audit")
  .description("Full SEO audit across all pages and technical checks")
  .action(async () => {
    banner();
    console.log(chalk.cyan("\n  Pipeline: SEO AUDIT\n") + "-".repeat(65));

    const seoManager = require("./agents/seo/seoManager");
    const result = await seoManager.audit();

    // Print on-page results
    for (const page of result.onPage || []) {
      console.log(chalk.bold(`\n  ${page.url}`));
      for (const check of page.checks || []) {
        const icon = check.pass ? chalk.green("PASS") : chalk.red("FAIL");
        console.log(`    [${icon}] ${check.name}: ${check.detail}`);
      }
    }

    // Print technical results
    console.log(chalk.bold("\n  Technical SEO"));
    for (const check of result.technical || []) {
      const icon = check.pass ? chalk.green("PASS") : chalk.red("FAIL");
      console.log(`    [${icon}] ${check.name}: ${check.detail}`);
    }

    // Print AI summary
    if (result.summary) {
      console.log(chalk.bold("\n  AI Analysis:"));
      for (const line of result.summary.split("\n").filter(Boolean)) {
        console.log(`  ${line}`);
      }
    }

    console.log("\n" + "=".repeat(65) + "\n");
  });

seoCmd
  .command("report")
  .description("Generate weekly SEO report (saved to file, included in morning email)")
  .action(async () => {
    banner();
    console.log(chalk.cyan("\n  Pipeline: WEEKLY SEO REPORT\n") + "-".repeat(65));

    const seoManager = require("./agents/seo/seoManager");

    const result = await seoManager.report();
    console.log(`  Report saved: ${result.filePath}`);
    console.log(`  (No separate email — report link will appear in the consolidated morning dashboard)`);
    console.log("\n" + "=".repeat(65) + "\n");
  });

seoCmd
  .command("brief <topic>")
  .description("Generate a content brief for the Python content agency")
  .action(async (topic) => {
    banner();
    console.log(chalk.cyan(`\n  Generating brief: ${topic}\n`) + "-".repeat(65));

    const seoManager = require("./agents/seo/seoManager");
    const brief = await seoManager.brief(topic);

    console.log(chalk.bold(`\n  Title: ${brief.title || topic}`));
    console.log(`  Target keyword: ${brief.targetKeyword || "N/A"}`);
    console.log(`  Search intent: ${brief.searchIntent || "N/A"}`);
    console.log(`  Word count: ${brief.wordCount || "N/A"}`);
    if (brief.h2Structure) {
      console.log(chalk.bold("\n  H2 Structure:"));
      for (const h2 of brief.h2Structure) {
        console.log(`    - ${h2}`);
      }
    }
    console.log("\n" + "=".repeat(65) + "\n");
  });

// ── fix ──────────────────────────────────────────────────────────
program
  .command("fix <issue>")
  .description("Fix a specific issue by description or backlog ID")
  .action(async (issue) => {
    banner();
    console.log(chalk.cyan(`\n  Fixing: ${issue}\n`) + "-".repeat(65));

    const pm = require("./agents/web/productManager");

    // If it matches BL-NNN, look up in backlog
    let description = issue;
    if (/^BL-\d+$/i.test(issue)) {
      const items = pm.getBacklog();
      const item = items.find((i) => i.id.toUpperCase() === issue.toUpperCase());
      if (!item) {
        console.log(chalk.red(`  Backlog item ${issue} not found`));
        return;
      }
      description = item.title;
      console.log(`  Backlog item: ${item.title}`);
    }

    const sprint = await pm.plan(`Fix: ${description}`);
    console.log(chalk.bold(`\n  Created ${sprint.sprintId} with ${sprint.tasks?.length || 0} tasks.`));
    console.log(`  Run ${chalk.bold(`node pm.js execute ${sprint.sprintId}`)} to apply the fix.`);
    console.log("=".repeat(65) + "\n");
  });

// ── indexing ─────────────────────────────────────────────────────
seoCmd
  .command("index")
  .description("Daily indexing loop — check all pages, submit unindexed to Google + Bing")
  .action(async () => {
    banner();
    console.log(chalk.cyan("\n  Pipeline: DAILY INDEXING LOOP\n") + "-".repeat(65));

    const indexing = require("./agents/seo/indexingAgent");
    const result = await indexing.dailyIndexLoop();

    console.log(chalk.bold(`\n  Pages checked: ${result.checked}`));
    console.log(`  Not indexed: ${result.notIndexed.length}`);
    if (result.notIndexed.length > 0) {
      for (const p of result.notIndexed) {
        const icon = p.state.includes("Discovered") ? chalk.yellow("◌") : chalk.red("✗");
        console.log(`    ${icon} ${p.url} — ${p.state}`);
      }
      console.log(chalk.green(`\n  Submitted ${result.submitted} pages to IndexNow (Bing/Yandex)`));
    } else {
      console.log(chalk.green("  All pages indexed!"));
    }

    if (result.errors.length > 0) {
      console.log(chalk.red(`\n  Errors: ${result.errors.join(", ")}`));
    }

    console.log("\n" + "=".repeat(65) + "\n");
  });

seoCmd
  .command("index-status")
  .description("Quick check — which pages are indexed on Google")
  .action(async () => {
    banner();
    console.log(chalk.cyan("\n  Google Indexing Status\n") + "-".repeat(65));

    const indexing = require("./agents/seo/indexingAgent");
    const pages = [
      "https://isocertificationconsultant.ca/",
      "https://isocertificationconsultant.ca/about",
      "https://isocertificationconsultant.ca/contact",
      "https://isocertificationconsultant.ca/process",
      "https://isocertificationconsultant.ca/blog",
      "https://isocertificationconsultant.ca/services/iso-9001",
      "https://isocertificationconsultant.ca/services/iso-14001",
      "https://isocertificationconsultant.ca/services/iso-45001",
      "https://isocertificationconsultant.ca/services/iso-13485",
      "https://isocertificationconsultant.ca/services/iso-22000",
      "https://isocertificationconsultant.ca/services/iatf-16949",
      "https://isocertificationconsultant.ca/services/iso-17025",
      "https://isocertificationconsultant.ca/industries/manufacturing",
      "https://isocertificationconsultant.ca/industries/automotive",
      "https://isocertificationconsultant.ca/industries/food-beverage",
      "https://isocertificationconsultant.ca/industries/construction",
    ];

    let indexed = 0;
    for (const url of pages) {
      try {
        const r = await indexing.inspectUrl(url);
        const state = r.inspectionResult?.indexStatusResult?.coverageState || "unknown";
        const crawled = r.inspectionResult?.indexStatusResult?.lastCrawlTime;
        const short = url.replace("https://isocertificationconsultant.ca", "") || "/";
        const icon = state === "Submitted and indexed" ? chalk.green("✓") : state.includes("Discovered") ? chalk.yellow("◌") : chalk.red("✗");
        if (state === "Submitted and indexed") indexed++;
        console.log(`  ${icon} ${short.padEnd(40)} ${state}${crawled ? "  (crawled " + crawled.slice(0, 10) + ")" : ""}`);
      } catch {
        const short = url.replace("https://isocertificationconsultant.ca", "") || "/";
        console.log(`  ${chalk.gray("?")} ${short.padEnd(40)} check failed`);
      }
      await new Promise((r) => setTimeout(r, 300));
    }

    console.log(chalk.bold(`\n  ${indexed}/${pages.length} pages indexed`));
    console.log("\n" + "=".repeat(65) + "\n");
  });

// ── backlog ──────────────────────────────────────────────────────
program
  .command("backlog")
  .description("Display current backlog grouped by priority")
  .action(() => {
    banner();
    const { getBacklog } = require("./agents/web/productManager");
    const items = getBacklog();

    const open = items.filter((i) => i.status === "open");
    const closed = items.filter((i) => i.status === "closed");

    console.log(chalk.bold(`\n  Backlog: ${open.length} open, ${closed.length} closed\n`));

    for (const priority of ["CRITICAL", "HIGH", "MEDIUM", "LOW"]) {
      const group = open.filter((i) => i.priority === priority);
      if (group.length === 0) continue;

      const color = priority === "CRITICAL" ? chalk.red : priority === "HIGH" ? chalk.yellow : chalk.white;
      console.log(color(`  ── ${priority} (${group.length}) ──`));
      for (const item of group) {
        const cat = item.category === "web" ? chalk.blue("[web]") : chalk.green("[seo]");
        console.log(`    ${item.id} ${cat} ${item.title}`);
      }
      console.log();
    }

    if (closed.length > 0) {
      console.log(chalk.gray(`  ── CLOSED (${closed.length}) ──`));
      for (const item of closed) {
        console.log(chalk.gray(`    ${item.id} ${item.title} — ${item.resolution || "done"}`));
      }
      console.log();
    }

    console.log("=".repeat(65) + "\n");
  });

// ── status ───────────────────────────────────────────────────────
program
  .command("status")
  .description("Show site health dashboard")
  .action(async () => {
    banner();
    const { getBacklog } = require("./agents/web/productManager");
    const qaEngineer = require("./agents/web/qaEngineer");
    const { countDocuments } = require("./agents/shared/sanity");
    const { gitLog } = require("./agents/shared/git");

    console.log(chalk.cyan("\n  Site Status Dashboard\n") + "-".repeat(65));

    // Quick page check
    const checks = await qaEngineer.quickCheck();
    const healthyPages = checks.filter((c) => c.status === "ok").length;
    console.log(`  Pages: ${healthyPages}/${checks.length} healthy`);

    // Sanity content
    try {
      const counts = await countDocuments();
      console.log(`  Content: ${counts.blogPosts} blog posts, ${counts.servicePages} service pages`);
    } catch {
      console.log(chalk.yellow("  Content: unable to query Sanity"));
    }

    // Backlog
    const items = getBacklog();
    const open = items.filter((i) => i.status === "open");
    const critical = open.filter((i) => i.priority === "CRITICAL");
    console.log(`  Backlog: ${open.length} open (${critical.length} critical)`);

    // Recent commits
    try {
      const commits = await gitLog(3);
      console.log("\n  Recent commits:");
      for (const c of commits) {
        console.log(`    ${c.hash} ${c.message.split("\n")[0]}`);
      }
    } catch { /* not in git repo */ }

    console.log("\n" + "=".repeat(65) + "\n");
  });

// ── blog ────────────────────────────────────────────────────────
const blogCmd = program.command("blog").description("Daily blog publishing pipeline");

blogCmd
  .command("publish")
  .description("Run the full daily blog pipeline — pick keyword, write, QA, publish")
  .action(async () => {
    banner();
    console.log(chalk.cyan("\n  Pipeline: DAILY BLOG PUBLISH\n") + "-".repeat(65));

    const contentManager = require("./agents/content/contentManager");
    const result = await contentManager.publishDaily();

    if (result.success) {
      console.log(chalk.green.bold("\n  Article Published Successfully"));
      console.log(`  Title:    ${result.title}`);
      console.log(`  URL:      ${result.url}`);
      console.log(`  Keyword:  ${result.primaryKeyword}`);
      console.log(`  Meta:     ${result.metaDescription || "N/A"}`);
      console.log(`  Words:    ${result.wordCount}`);
      console.log(`  QA Score: ${result.qaScore}/100`);
      console.log(`  Image:    ${result.image.photographer} (${result.image.source})`);
      console.log(`  Category: ${result.category}`);
      console.log(`  Duration: ${Math.round(result.pipelineDurationMs / 1000)}s`);
    } else {
      console.log(chalk.red.bold(`\n  Pipeline Failed: ${result.reason}`));
      if (result.score) console.log(`  QA Score: ${result.score}/100`);
    }

    console.log("\n" + "=".repeat(65) + "\n");
  });

blogCmd
  .command("preview")
  .description("Preview tomorrow's article (keyword selection only, no publishing)")
  .action(async () => {
    banner();
    console.log(chalk.cyan("\n  Preview: Next Article\n") + "-".repeat(65));

    const contentManager = require("./agents/content/contentManager");
    const brief = await contentManager.previewNext();

    console.log(chalk.bold(`\n  Title: ${brief.title}`));
    console.log(`  Keyword: ${brief.primaryKeyword}`);
    console.log(`  Secondary: ${brief.secondaryKeywords.join(", ")}`);
    console.log(`  Intent: ${brief.searchIntent}`);
    console.log(`  Target city: ${brief.targetCity || "Canada (general)"}`);
    console.log(`  Word count: ${brief.recommendedWordCount}`);
    console.log(`\n  H2 Structure:`);
    for (const h2 of brief.h2Structure) {
      console.log(`    - ${h2}`);
    }
    console.log(`\n  FAQ Questions:`);
    for (const q of brief.faqQuestions) {
      console.log(`    - ${q}`);
    }
    console.log(`\n  Reasoning: ${brief.reasoning}`);
    console.log("\n" + "=".repeat(65) + "\n");
  });

blogCmd
  .command("calendar")
  .description("View content calendar and queue status")
  .action(() => {
    banner();
    const contentManager = require("./agents/content/contentManager");
    const cal = contentManager.getCalendar();

    console.log(chalk.cyan("\n  Content Calendar\n") + "-".repeat(65));
    console.log(`  Total keywords:  ${cal.totalKeywords}`);
    console.log(`  Published:       ${cal.published}`);
    console.log(`  Remaining:       ${cal.remaining}`);
    console.log(`  Days of content: ${cal.daysOfContent}`);

    if (cal.recentArticles.length > 0) {
      console.log(chalk.bold("\n  Recent Articles:"));
      for (const a of cal.recentArticles) {
        console.log(`    ${a.date} | ${a.title} | ${a.qaScore}/100`);
      }
    }

    if (cal.nextKeywords.length > 0) {
      console.log(chalk.bold("\n  Next 14 Keywords:"));
      for (const [i, kw] of cal.nextKeywords.entries()) {
        console.log(`    ${chalk.gray(`${i + 1}.`)} ${kw}`);
      }
    }

    console.log("\n" + "=".repeat(65) + "\n");
  });

blogCmd
  .command("published")
  .description("List all published articles")
  .action(() => {
    banner();
    const contentManager = require("./agents/content/contentManager");
    const articles = contentManager.getPublished();

    console.log(chalk.cyan(`\n  Published Articles (${articles.length})\n`) + "-".repeat(65));

    if (articles.length === 0) {
      console.log("  No articles published yet.\n");
    } else {
      for (const a of articles) {
        console.log(`  ${chalk.gray(a.date)} ${a.title}`);
        console.log(`    ${chalk.blue(a.url)} | ${a.wordCount} words | QA: ${a.qaScore}/100`);
        if (a.metaDescription) {
          console.log(`    ${chalk.gray("Meta:")} ${a.metaDescription}`);
        }
      }
    }

    console.log("\n" + "=".repeat(65) + "\n");
  });

blogCmd
  .command("keyword <keyword>")
  .description("Add a new keyword to the queue")
  .action((keyword) => {
    banner();
    const keywordResearcher = require("./agents/content/keywordResearcher");
    const result = keywordResearcher.addKeyword(keyword);

    if (result.added) {
      console.log(chalk.green(`\n  Added: "${keyword}"\n`));
    } else {
      console.log(chalk.yellow(`\n  Already in queue: "${keyword}"\n`));
    }

    const status = keywordResearcher.getQueueStatus();
    console.log(`  Queue: ${status.total} total, ${status.published} published, ${status.remaining} remaining`);
    console.log("=".repeat(65) + "\n");
  });

blogCmd
  .command("retry")
  .description("Retry publishing (picks the same keyword selection logic)")
  .action(async () => {
    banner();
    console.log(chalk.cyan("\n  Pipeline: RETRY BLOG PUBLISH\n") + "-".repeat(65));

    const contentManager = require("./agents/content/contentManager");
    const result = await contentManager.publishDaily();

    if (result.success) {
      console.log(chalk.green.bold(`\n  Retry Successful: ${result.title}`));
      console.log(`  URL: ${result.url}`);
    } else {
      console.log(chalk.red.bold(`\n  Retry Failed: ${result.reason}`));
    }

    console.log("\n" + "=".repeat(65) + "\n");
  });

blogCmd
  .command("auto")
  .description("Auto-schedule: daily blog every day + mega-article on Mon & Thu")
  .action(async () => {
    banner();
    const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const day = dayNames[new Date().getDay()];
    const isMegaDay = new Date().getDay() === 1 || new Date().getDay() === 4;

    console.log(chalk.cyan(`\n  Pipeline: AUTO-SCHEDULE (${day})\n`) + "-".repeat(65));
    console.log(`  Daily blog: ${chalk.green("YES")}`);
    console.log(`  Mega-article: ${isMegaDay ? chalk.green("YES (Mon/Thu)") : chalk.gray("No (next: " + (new Date().getDay() < 1 ? "Mon" : new Date().getDay() < 4 ? "Thu" : "Mon") + ")")}`);
    console.log();

    const contentManager = require("./agents/content/contentManager");
    const results = await contentManager.publishDailySchedule();

    // Daily blog result
    if (results.daily?.success) {
      console.log(chalk.green.bold("\n  Daily Blog Published"));
      console.log(`  Title:    ${results.daily.title}`);
      console.log(`  URL:      ${results.daily.url}`);
      console.log(`  Words:    ${results.daily.wordCount}`);
      console.log(`  QA Score: ${results.daily.qaScore}/100`);
      console.log(`  Duration: ${Math.round(results.daily.pipelineDurationMs / 1000)}s`);
    } else if (results.daily) {
      console.log(chalk.red.bold(`\n  Daily Blog Failed: ${results.daily.reason}`));
    }

    // Mega-article result
    if (results.mega?.success) {
      console.log(chalk.green.bold("\n  Mega-Article Published"));
      console.log(`  Title:    ${results.mega.title}`);
      console.log(`  URL:      ${results.mega.url}`);
      console.log(`  Words:    ${chalk.bold(results.mega.wordCount.toLocaleString())}`);
      console.log(`  Chapters: ${results.mega.chapterCount}`);
      console.log(`  QA Score: ${results.mega.qaScore}/100`);
      console.log(`  Duration: ${Math.round(results.mega.pipelineDurationMs / 1000)}s`);
    } else if (results.mega) {
      console.log(chalk.red.bold(`\n  Mega-Article Failed: ${results.mega.reason}`));
    }

    console.log("\n" + "=".repeat(65) + "\n");
  });

blogCmd
  .command("mega")
  .description("Publish a mega-article (12,500+ words with chapters) — full pipeline")
  .action(async () => {
    banner();
    console.log(chalk.cyan("\n  Pipeline: MEGA-ARTICLE PUBLISH (12,500+ words)\n") + "-".repeat(65));
    console.log(chalk.gray("  This will take 15-30 minutes — writing 7-10 chapters sequentially.\n"));

    const contentManager = require("./agents/content/contentManager");
    const result = await contentManager.publishMegaArticle();

    if (result.success) {
      console.log(chalk.green.bold("\n  Mega-Article Published Successfully"));
      console.log(`  Title:      ${result.title}`);
      console.log(`  URL:        ${result.url}`);
      console.log(`  Keyword:    ${result.primaryKeyword}`);
      console.log(`  Words:      ${chalk.bold(result.wordCount.toLocaleString())}`);
      console.log(`  Chapters:   ${result.chapterCount}`);
      console.log(`  QA Score:   ${result.qaScore}/100`);
      console.log(`  Read Time:  ${result.readTime}`);
      console.log(`  Image:      ${result.image.photographer} (${result.image.source})`);
      console.log(`  Category:   ${result.category}`);
      console.log(`  Duration:   ${Math.round(result.pipelineDurationMs / 1000)}s`);
    } else {
      console.log(chalk.red.bold(`\n  Mega-Article Pipeline Failed: ${result.reason}`));
    }

    console.log("\n" + "=".repeat(65) + "\n");
  });

blogCmd
  .command("mega-preview")
  .description("Preview the next mega-article (topic + outline, no publishing)")
  .action(async () => {
    banner();
    console.log(chalk.cyan("\n  Preview: Next Mega-Article\n") + "-".repeat(65));

    const keywordResearcher = require("./agents/content/keywordResearcher");
    const outlineArchitect = require("./agents/content/outlineArchitect");

    console.log("  Selecting topic...");
    const megaBrief = await keywordResearcher.pickMegaKeyword();
    console.log(chalk.bold(`\n  Topic: ${megaBrief.primaryKeyword}`));
    console.log(`  Type: ${megaBrief.articleType}`);
    console.log(`  Audience: ${megaBrief.targetAudience}`);
    console.log(`  Context: ${megaBrief.topicContext}`);

    console.log("\n  Designing outline...");
    const outlineArchitectMod = require("./agents/content/outlineArchitect");
    const outline = await outlineArchitectMod.designOutline(megaBrief);

    console.log(chalk.bold(`\n  Title: ${outline.title}`));
    console.log(`  Estimated: ~${outline.estimatedWords} words, ${outline.estimatedReadTime}`);
    console.log(`\n  Chapters (${outline.chapters.length}):`);
    for (const ch of outline.chapters) {
      console.log(`    ${chalk.gray(`Ch${ch.number}.`)} ${ch.title} (${ch.targetWords} words)`);
      for (const sub of ch.subsections) {
        console.log(`      ${chalk.gray("-")} ${sub.title}`);
      }
    }

    if (outline.faqQuestions) {
      console.log(`\n  FAQ Questions (${outline.faqQuestions.length}):`);
      for (const q of outline.faqQuestions) {
        console.log(`    - ${q}`);
      }
    }

    console.log(`\n  Reasoning: ${megaBrief.reasoning}`);
    console.log("\n" + "=".repeat(65) + "\n");
  });

blogCmd
  .command("repair-images")
  .description("Replace duplicate hero images on existing blogs with unique ones")
  .action(async () => {
    banner();
    console.log(chalk.cyan("\n  Pipeline: REPAIR DUPLICATE IMAGES\n") + "-".repeat(65));

    const { repairDuplicateImages } = require("../blog-pipeline-scripts/repair-duplicate-images");
    const result = await repairDuplicateImages();

    if (result.replaced === 0 && result.articles.length === 0) {
      console.log(chalk.green("  No duplicate images found — all clear."));
    } else {
      for (const a of result.articles) {
        const icon = a.status === "replaced" ? chalk.green("✓") : chalk.red("✗");
        const detail = a.status === "replaced" ? `new: ${a.photographer}` : a.status;
        console.log(`  ${icon} ${a.slug} — ${detail}`);
      }
      console.log(chalk.bold(`\n  Replaced: ${result.replaced}/${result.articles.length}`));
    }

    console.log("\n" + "=".repeat(65) + "\n");
  });

// ── qa ───────────────────────────────────────────────────────────
program
  .command("qa")
  .description("Run post-deployment QA checks on all pages")
  .action(async () => {
    banner();
    console.log(chalk.cyan("\n  Pipeline: QA AUDIT\n") + "-".repeat(65));

    const qaEngineer = require("./agents/web/qaEngineer");
    const result = await qaEngineer.fullAudit();

    for (const page of result.pages) {
      console.log(chalk.bold(`\n  ${page.url}`));
      for (const check of page.checks) {
        const icon = check.pass ? chalk.green("PASS") : chalk.red("FAIL");
        console.log(`    [${icon}] ${check.name}: ${check.detail}`);
      }
    }

    console.log(chalk.bold(`\n  Total: ${result.totalPassed}/${result.totalChecks} passed`));
    console.log("=".repeat(65) + "\n");
  });

// ── design-qa ───────────────────────────────────────────────────
program
  .command("design-qa")
  .description("Run visual design QA audit on all pages")
  .action(async () => {
    banner();
    console.log(chalk.cyan("\n  Pipeline: DESIGN QA AUDIT\n") + "-".repeat(65));

    const designQA = require("./agents/web/designQA");
    const result = await designQA.fullAudit();

    for (const page of result.pages) {
      console.log(chalk.bold(`\n  ${page.url} — ${page.score}/100`));
      for (const check of page.checks) {
        const icon = check.pass ? chalk.green("PASS") : chalk.red("FAIL");
        const sev = check.severity === "critical" ? chalk.red(`[${check.severity}]`) :
          check.severity === "high" ? chalk.yellow(`[${check.severity}]`) : chalk.gray(`[${check.severity}]`);
        console.log(`    [${icon}] ${sev} ${check.name}: ${check.detail}`);
      }
    }

    console.log(chalk.bold(`\n  Average Score: ${result.averageScore}/100 — ${result.pass ? chalk.green("PASS") : chalk.red("FAIL")}`));
    console.log("=".repeat(65) + "\n");
  });

// ── page-audit ──────────────────────────────────────────────────
program
  .command("page-audit [pages...]")
  .description("Run page auditor on specific pages or all pages")
  .action(async (pages) => {
    banner();
    console.log(chalk.cyan("\n  Pipeline: PAGE AUDIT\n") + "-".repeat(65));

    const pageAuditor = require("./agents/web/pageAuditor");
    const result = await pageAuditor.auditDeployment(pages.length > 0 ? pages : []);

    for (const page of result.pages) {
      const status = page.pass ? chalk.green("PASS") : chalk.red("FAIL");
      console.log(chalk.bold(`\n  ${page.url} — ${page.score}/100 [${status}]`));
      for (const check of page.checks) {
        const icon = check.pass ? chalk.green("PASS") : chalk.red("FAIL");
        console.log(`    [${icon}] ${check.name}: ${check.detail}`);
      }
    }

    console.log(chalk.bold(`\n  Average: ${result.averageScore}/100 — ${result.pass ? chalk.green("ALL PASS") : chalk.red(`${result.criticalFails.length} FAILURES`)}`));
    console.log("=".repeat(65) + "\n");
  });

// ── compliance ──────────────────────────────────────────────────
program
  .command("compliance")
  .description("Run ISO compliance and brand consistency audit")
  .action(async () => {
    banner();
    console.log(chalk.cyan("\n  Pipeline: COMPLIANCE AUDIT\n") + "-".repeat(65));

    const complianceMonitor = require("./agents/security/complianceMonitor");
    const report = await complianceMonitor.runAudit();

    console.log(chalk.bold(`\n  Overall Risk: ${report.overallRisk === "low" ? chalk.green(report.overallRisk.toUpperCase()) : report.overallRisk === "critical" ? chalk.red(report.overallRisk.toUpperCase()) : chalk.yellow(report.overallRisk.toUpperCase())}`));
    console.log(`  Pages audited: ${report.pagesAudited}`);
    console.log(`  Issues: ${report.issues.length} (${report.criticalCount} critical, ${report.highCount} high, ${report.mediumCount} medium, ${report.lowCount} low)`);

    if (report.issues.length > 0) {
      console.log(chalk.bold("\n  Issues:"));
      for (const issue of report.issues) {
        const sev = issue.severity === "critical" ? chalk.red.bold(issue.severity.toUpperCase()) :
          issue.severity === "high" ? chalk.yellow(issue.severity.toUpperCase()) :
          chalk.gray(issue.severity.toUpperCase());
        console.log(`    [${sev}] ${issue.page}: ${issue.issue}`);
        if (issue.quote) console.log(chalk.gray(`      "${issue.quote}"`));
        if (issue.recommendation) console.log(chalk.cyan(`      Fix: ${issue.recommendation}`));
      }
    }

    console.log(`\n  ${report.summary}`);
    console.log("\n" + "=".repeat(65) + "\n");
  });

// ── vapt ────────────────────────────────────────────────────────
program
  .command("vapt")
  .description("Run monthly VAPT security scan")
  .action(async () => {
    banner();
    console.log(chalk.cyan("\n  Pipeline: VAPT SECURITY SCAN\n") + "-".repeat(65));

    const vaptAgent = require("./agents/security/vaptAgent");
    const report = await vaptAgent.runFullScan();

    console.log(chalk.bold("\n  Vulnerability Summary:"));
    console.log(`    Critical: ${chalk.red(report.summary.critical)}`);
    console.log(`    High:     ${chalk.yellow(report.summary.high)}`);
    console.log(`    Medium:   ${report.summary.medium}`);
    console.log(`    Low:      ${report.summary.low}`);
    console.log(`    Info:     ${report.summary.info}`);
    console.log(`    Total:    ${report.summary.total}`);

    if (report.findings.length > 0) {
      console.log(chalk.bold("\n  Findings:"));
      for (const f of report.findings) {
        const sev = f.severity === "critical" ? chalk.red.bold(f.severity.toUpperCase()) :
          f.severity === "high" ? chalk.yellow(f.severity.toUpperCase()) :
          chalk.gray(f.severity.toUpperCase());
        console.log(`    [${sev}] ${f.title}`);
        console.log(`      ${chalk.gray(f.description)}`);
      }
    }

    console.log(`\n  Duration: ${report.duration}`);
    console.log(chalk.gray(`  ${report.disclaimer}`));
    console.log("\n" + "=".repeat(65) + "\n");
  });

// ── link-audit ──────────────────────────────────────────────────
program
  .command("link-audit")
  .description("Run site-wide internal link audit")
  .action(async () => {
    banner();
    console.log(chalk.cyan("\n  Pipeline: LINK AUDIT\n") + "-".repeat(65));

    const linkBuilder = require("./agents/seo/linkBuilder");
    const result = await linkBuilder.auditSiteLinks();

    console.log(`  Total pages:   ${result.totalPages}`);
    console.log(`  Linked pages:  ${result.linkedPages}`);
    console.log(`  Orphaned:      ${result.orphanedPages.length}`);

    if (result.orphanedPages.length > 0) {
      console.log(chalk.yellow("\n  Orphaned Pages (no inbound internal links):"));
      for (const page of result.orphanedPages) {
        console.log(`    ${page}`);
      }
    }

    console.log("\n" + "=".repeat(65) + "\n");
  });

// ── ai-search ──────────────────────────────────────────────
const aiSearchCmd = program.command("ai-search").description("AI Search Optimization commands");

aiSearchCmd
  .command("audit", { isDefault: true })
  .description("Run AI search visibility audit")
  .action(async () => {
    banner();
    console.log(chalk.cyan("\n  Pipeline: AI SEARCH AUDIT\n") + "-".repeat(65));

    const aiSearch = require("./agents/seo/aiSearchAgent");
    const result = await aiSearch.runAudit();

    console.log(chalk.bold(`\n  AI Visibility: ${result.visibilityScore}/${result.total}`));

    if (result.results) {
      for (const r of result.results) {
        const icon = r.likelyCited ? chalk.green("CITED") : chalk.red("MISS");
        console.log(`    [${icon}] "${r.query}"`);
        if (r.competitors?.length) console.log(chalk.gray(`            Competitors: ${r.competitors.join(", ")}`));
      }
    }

    if (result.topRecommendations?.length) {
      console.log(chalk.bold("\n  Top Recommendations:"));
      for (const rec of result.topRecommendations) {
        console.log(`    → ${rec}`);
      }
    }

    if (result.citabilityIssues?.length) {
      console.log(chalk.yellow(`\n  Citability Issues: ${result.citabilityIssues.length}`));
      for (const issue of result.citabilityIssues) {
        console.log(`    ⚠️  ${issue.title}: ${issue.issue}`);
      }
    }

    console.log("\n" + "=".repeat(65) + "\n");
  });

aiSearchCmd
  .command("report")
  .description("Generate and email weekly AI search report")
  .action(async () => {
    banner();
    console.log(chalk.cyan("\n  Pipeline: AI SEARCH REPORT\n") + "-".repeat(65));

    const aiSearch = require("./agents/seo/aiSearchAgent");
    const report = await aiSearch.generateReport();

    console.log(chalk.bold(`\n  AI Visibility: ${report.visibilityScore}/${report.total}`));
    console.log(`  Articles audited: ${report.articlesAudited}`);
    console.log(`  Citability issues: ${report.citabilityIssues.length}`);
    console.log(`  Report saved (included in consolidated morning email)`);

    console.log("\n" + "=".repeat(65) + "\n");
  });

// ── audit (team auditor) ───────────────────────────────────
const auditCmd = program.command("audit").description("Team auditor commands");

auditCmd
  .command("run", { isDefault: true })
  .description("Run team audit and send dashboard email")
  .action(async () => {
    banner();
    console.log(chalk.cyan("\n  Pipeline: TEAM AUDIT\n") + "-".repeat(65));

    const teamAuditor = require("./agents/shared/teamAuditor");
    const result = await teamAuditor.runAudit();

    console.log(chalk.bold(`\n  Agents: ${result.activeAgents}/${result.totalAgents} active`));
    console.log(`  Dashboard emailed to info@isocertificationconsultant.ca`);

    console.log("\n" + "=".repeat(65) + "\n");
  });

auditCmd
  .command("status")
  .description("Show agent heartbeat status in terminal")
  .action(() => {
    banner();
    console.log(chalk.cyan("\n  Agent Heartbeat Status\n") + "-".repeat(65));

    const teamAuditor = require("./agents/shared/teamAuditor");
    console.log(teamAuditor.showStatus());

    console.log("\n" + "=".repeat(65) + "\n");
  });

// ── leads ─────────────────────────────────────────────────────
const leadsCmd = program.command("leads").description("Lead tracking and alerts");

leadsCmd
  .command("show", { isDefault: true })
  .description("Show today's leads log")
  .action(() => {
    banner();
    console.log(chalk.cyan("\n  Today's Leads\n") + "-".repeat(65));

    const leadsAgent = require("./agents/shared/leadsAgent");
    const leads = leadsAgent.showLeads();

    if (leads.length === 0) {
      console.log("  No leads today.\n");
    } else {
      for (const l of leads) {
        const heat = l.score >= 70 ? chalk.red("HOT") : l.score >= 40 ? chalk.yellow("WARM") : chalk.gray("COLD");
        const name = l.firstName ? `${l.firstName} ${l.lastName} — ${l.company}` : l.company;
        const loc = l.city ? `${l.city}, ${l.region || l.state || ""}` : l.region || l.state || "";
        console.log(`  [${heat}] ${l.score}/100  ${name}  (${loc})  ${l.tierLabel || ""}`);
      }
    }

    console.log("\n" + "=".repeat(65) + "\n");
  });

leadsCmd
  .command("hot")
  .description("Show HOT leads only")
  .action(() => {
    banner();
    console.log(chalk.cyan("\n  HOT Leads (70+)\n") + "-".repeat(65));

    const leadsAgent = require("./agents/shared/leadsAgent");
    const leads = leadsAgent.showLeads("hot");

    if (leads.length === 0) {
      console.log("  No hot leads today.\n");
    } else {
      for (const l of leads) {
        const name = l.firstName ? `${l.firstName} ${l.lastName} — ${l.company}` : l.company;
        console.log(chalk.red(`  🔥 ${l.score}/100  ${name}  (${l.city || ""}, ${l.region || l.state || ""})  ${l.tierLabel || ""}`));
      }
    }

    console.log("\n" + "=".repeat(65) + "\n");
  });

leadsCmd
  .command("digest")
  .description("Send daily leads digest email now")
  .action(async () => {
    banner();
    console.log(chalk.cyan("\n  Pipeline: LEADS DIGEST\n") + "-".repeat(65));

    const leadsAgent = require("./agents/shared/leadsAgent");
    await leadsAgent.processNewLeads();
    const result = await leadsAgent.sendDailyDigest();

    console.log(`  Total leads today: ${result.total}`);
    console.log(`    Canadian:    ${result.canadian}`);
    console.log(`    US Priority: ${result.usPriority}`);
    console.log(`    US General:  ${result.usGeneral}`);
    console.log(`  Digest emailed to info@isocertificationconsultant.ca`);

    console.log("\n" + "=".repeat(65) + "\n");
  });

leadsCmd
  .command("stats")
  .description("Weekly conversion summary")
  .action(() => {
    banner();
    console.log(chalk.cyan("\n  Leads Stats (Last 7 Days)\n") + "-".repeat(65));

    const leadsAgent = require("./agents/shared/leadsAgent");
    const stats = leadsAgent.getStats();

    console.log(`  Total all-time:  ${stats.totalAllTime}`);
    console.log(`  This week:       ${stats.thisWeek}`);
    console.log(`    Hot:           ${stats.hot}`);
    console.log(`    Warm:          ${stats.warm}`);
    console.log(`    Cold:          ${stats.cold}`);
    console.log(`  By tier:`);
    console.log(`    Canadian:      ${stats.byTier.canada}`);
    console.log(`    US Priority:   ${stats.byTier.usPriority}`);
    console.log(`    US General:    ${stats.byTier.usGeneral}`);
    console.log(`  Contacted:       ${stats.contacted}/${stats.thisWeek}`);
    console.log(`  Booked:          ${stats.booked}`);

    console.log("\n" + "=".repeat(65) + "\n");
  });

// ── audit-content ──────────────────────────────────────────
program
  .command("audit-content")
  .description("Audit all blog articles for cross-article similarity and duplicate patterns")
  .action(async () => {
    banner();
    console.log(chalk.cyan("\n  Pipeline: CONTENT SIMILARITY AUDIT\n") + "-".repeat(65));

    const { auditAllArticles, flagForRefresh } = require("./agents/content/contentSimilarityAudit");
    const report = await auditAllArticles();

    console.log(chalk.bold(`\n  Summary: ${report.summary}`));

    // Pattern usage
    console.log(chalk.bold("\n  Pattern Usage:"));
    console.log(`    Process description (verbatim): ${report.patterns.processDescription}`);
    console.log(`    "Ready to..." CTA:              ${report.patterns.readyToCTA}`);
    console.log(`    "Book consultation" CTA:         ${report.patterns.bookConsultationCTA}`);

    // Overused cost figures
    if (report.costFigures.length > 0) {
      console.log(chalk.bold("\n  Overused Cost Figures:"));
      for (const cf of report.costFigures.slice(0, 10)) {
        console.log(`    "${cf.figure}" — ${cf.count} articles`);
      }
    }

    // Most similar pairs
    if (report.topSimilarPairs.length > 0) {
      console.log(chalk.bold("\n  Most Similar Article Pairs:"));
      for (const pair of report.topSimilarPairs.slice(0, 10)) {
        console.log(`    ${chalk.yellow(`${Math.round(pair.similarity * 100)}%`)} ${pair.articleA.slice(0, 40)} ↔ ${pair.articleB.slice(0, 40)}`);
        if (pair.sharedPhrases.length > 0) {
          console.log(chalk.gray(`         Shared: "${pair.sharedPhrases[0]}"`));
        }
      }
    }

    // Articles ranked by similarity
    console.log(chalk.bold("\n  Articles Ranked by Similarity (highest = most repetitive):"));
    for (const a of report.articles.slice(0, 15)) {
      const score = a.similarityScore > 0.1 ? chalk.red(`${a.similarityScore}`) : chalk.green(`${a.similarityScore}`);
      const flags = [];
      if (a.hasProcessDesc) flags.push("PROCESS");
      if (a.hasReadyCTA) flags.push("READY-CTA");
      if (a.hasBookCTA) flags.push("BOOK-CTA");
      const flagStr = flags.length > 0 ? ` [${flags.join(", ")}]` : "";
      console.log(`    ${score}  ${a.title.slice(0, 60)}${flagStr}`);
    }

    // Flag for refresh
    const flagged = flagForRefresh(report);
    if (flagged.length > 0) {
      console.log(chalk.bold(`\n  Flagged for Refresh: ${flagged.length} articles`));
      for (const f of flagged.slice(0, 10)) {
        const pri = f.priority === "HIGH" ? chalk.red(f.priority) : chalk.yellow(f.priority);
        console.log(`    [${pri}] ${f.title.slice(0, 55)} (score: ${f.similarityScore})`);
      }
      console.log(chalk.gray(`\n  Run ${chalk.bold("node pm.js fix-duplicates")} to auto-refresh flagged articles.`));
    }

    console.log("\n" + "=".repeat(65) + "\n");
  });

// ── fix-duplicates ──────────────────────────────────────────
program
  .command("fix-duplicates")
  .option("-t, --threshold <number>", "Similarity threshold", "0.08")
  .option("-n, --max <number>", "Max articles to refresh", "3")
  .description("Auto-refresh articles with highest cross-article similarity")
  .action(async (opts) => {
    banner();
    console.log(chalk.cyan("\n  Pipeline: FIX DUPLICATE CONTENT\n") + "-".repeat(65));

    const { auditAllArticles, flagForRefresh } = require("./agents/content/contentSimilarityAudit");
    const contentRefresher = require("./agents/content/contentRefresher");

    console.log("  Running similarity audit...");
    const report = await auditAllArticles();

    const threshold = parseFloat(opts.threshold);
    const maxRefresh = parseInt(opts.max, 10);
    const flagged = flagForRefresh(report, threshold);

    if (flagged.length === 0) {
      console.log(chalk.green("\n  No articles above threshold — content is unique."));
      console.log("\n" + "=".repeat(65) + "\n");
      return;
    }

    console.log(`\n  ${flagged.length} articles flagged. Refreshing top ${Math.min(maxRefresh, flagged.length)}...\n`);

    let refreshed = 0;
    for (const article of flagged.slice(0, maxRefresh)) {
      console.log(chalk.bold(`  Refreshing: ${article.title.slice(0, 60)}`));
      console.log(chalk.gray(`    Issues: ${article.refreshInstructions.split("\n")[0]}`));

      try {
        const result = await contentRefresher.refreshArticle(article.slug, {
          additionalInstructions: `UNIQUENESS FIX: ${article.refreshInstructions}`,
        });

        if (result && result.status === "refreshed") {
          console.log(chalk.green(`    Done: ${result.wordCountBefore} → ${result.wordCountAfter} words`));
          refreshed++;
        } else {
          console.log(chalk.yellow(`    Skipped: ${result?.status || "unknown"}`));
        }
      } catch (err) {
        console.log(chalk.red(`    Error: ${err.message}`));
      }
    }

    console.log(chalk.bold(`\n  Refreshed: ${refreshed}/${Math.min(maxRefresh, flagged.length)}`));
    console.log("\n" + "=".repeat(65) + "\n");
  });

// ── refresh ──────────────────────────────────────────────────
const refreshCmd = program.command("refresh").description("Content refresh and ranking recovery");

refreshCmd
  .command("check", { isDefault: true })
  .description("Run weekly refresh check — rankings + auto-refresh flagged articles")
  .action(async () => {
    banner();
    console.log(chalk.cyan("\n  Pipeline: CONTENT REFRESH\n") + "-".repeat(65));

    const refresher = require("./agents/content/contentRefresher");
    const result = await refresher.runRefresh();

    console.log(`  Refreshed: ${result.refreshed.length}`);
    for (const r of result.refreshed) {
      const icon = r.status === "refreshed" ? chalk.green("✓") : chalk.red("✗");
      console.log(`    ${icon} ${r.slug} — ${r.status}`);
    }

    console.log(`  Candidates remaining: ${Math.max(0, result.candidates.length - 3)}`);

    console.log("\n" + "=".repeat(65) + "\n");
  });

refreshCmd
  .command("audit")
  .description("Show all articles + ranking status + refresh eligibility")
  .action(async () => {
    banner();
    console.log(chalk.cyan("\n  Content Refresh Audit\n") + "-".repeat(65));

    const refresher = require("./agents/content/contentRefresher");

    // Check rankings first if SerpApi key is configured
    if (process.env.SERPAPI_KEY) {
      console.log("  Checking current rankings...\n");
      await refresher.checkRankings();
    }

    const audit = refresher.auditRankings();

    for (const a of audit.articles) {
      const pos = a.position ? `#${a.position}` : "N/A";
      const trend = a.trend !== "—" ? ` (${a.trend})` : "";
      const refresh = a.needsRefresh ? chalk.yellow(" ← NEEDS REFRESH") : "";
      console.log(`  ${pos}${trend}  ${a.title}  [${a.wordCount}w]${refresh}`);
      if (a.reasons.length > 0) {
        for (const r of a.reasons) {
          console.log(chalk.gray(`           ${r}`));
        }
      }
    }

    console.log(`\n  Total: ${audit.articles.length} articles, ${audit.candidateCount} need refresh`);

    console.log("\n" + "=".repeat(65) + "\n");
  });

refreshCmd
  .command("force <slug>")
  .description("Force refresh a specific article by slug")
  .action(async (slug) => {
    banner();
    console.log(chalk.cyan(`\n  Force Refresh: ${slug}\n`) + "-".repeat(65));

    const refresher = require("./agents/content/contentRefresher");
    const result = await refresher.refreshArticle(slug);

    if (!result) {
      console.log(chalk.red("  Article not found in Sanity."));
    } else if (result.status === "refreshed") {
      console.log(chalk.green.bold(`  Refreshed successfully`));
      console.log(`  Words: ${result.wordCountBefore} → ${result.wordCountAfter}`);
      console.log(`  QA Score: ${result.qaScore}/100`);
      console.log(`  Links added: ${result.linksAdded}`);
    } else {
      console.log(chalk.red(`  Failed: ${result.status}`));
    }

    console.log("\n" + "=".repeat(65) + "\n");
  });

// ── image ────────────────────────────────────────────────────
const imageCmd = program.command("image").description("Image agent commands (Gemini + Pexels)");

imageCmd
  .command("test")
  .description("Test image generation with scene detection and fallback chain")
  .action(async () => {
    banner();
    console.log(chalk.cyan("\n  Pipeline: IMAGE AGENT TEST\n") + "-".repeat(65));

    const infographicAgent = require("./agents/content/infographicAgent");
    const result = await infographicAgent.testGenerate();

    if (result.type === "gemini") {
      console.log(chalk.green.bold("\n  Level 1: Gemini photorealistic image generated"));
      console.log(`  Path: ${result.data.path}`);
      console.log(`  Size: ${result.data.sizeKB}KB`);
    } else if (result.type === "pexels") {
      console.log(chalk.yellow.bold("\n  Level 2: Pexels fallback used"));
      console.log(`  Photo: ${result.data.photographer}`);
    } else if (result.type === "skipped") {
      console.log(chalk.gray.bold("\n  Skipped — article not eligible"));
    } else {
      console.log(chalk.red.bold("\n  Level 3: No image"));
    }

    console.log("\n" + "=".repeat(65) + "\n");
  });

imageCmd
  .command("log")
  .description("Show image generation log")
  .action(() => {
    banner();
    console.log(chalk.cyan("\n  Image Log\n") + "-".repeat(65));

    const infographicAgent = require("./agents/content/infographicAgent");
    const log = infographicAgent.getLog();

    if (log.length === 0) {
      console.log("  No images generated yet.\n");
    } else {
      for (const entry of log.slice(-20)) {
        const icon = entry.type === "gemini" ? chalk.green("GEM") : entry.type === "pexels" ? chalk.yellow("PXL") : chalk.gray("---");
        const scene = entry.scene ? ` [${entry.scene}]` : "";
        console.log(`  [${icon}] ${entry.date} ${entry.slug} — ${entry.type}${scene}`);
      }
    }

    console.log("\n" + "=".repeat(65) + "\n");
  });

imageCmd
  .command("stats")
  .description("Show image generation statistics")
  .action(() => {
    banner();
    console.log(chalk.cyan("\n  Image Stats\n") + "-".repeat(65));

    const infographicAgent = require("./agents/content/infographicAgent");
    const stats = infographicAgent.getStats();

    console.log(`  Total:        ${stats.total}`);
    console.log(`  Gemini:       ${stats.gemini}`);
    console.log(`  Pexels:       ${stats.pexels}`);
    console.log(`  None:         ${stats.none}`);
    console.log(`  Success rate: ${stats.total > 0 ? Math.round(((stats.gemini + stats.pexels) / stats.total) * 100) : 0}%`);

    console.log("\n" + "=".repeat(65) + "\n");
  });

imageCmd
  .command("inline-test")
  .description("Test inline image generation with sample article")
  .action(async () => {
    banner();
    console.log(chalk.cyan("\n  Pipeline: INLINE IMAGE TEST\n") + "-".repeat(65));

    const inlineImageAgent = require("./agents/content/inlineImageAgent");
    const result = await inlineImageAgent.testInlineImages();

    console.log(chalk.bold(`\n  Images placed: ${result.count}`));
    for (const img of result.images || []) {
      const icon = img.source === "gemini" ? chalk.green("GEM") : img.source === "pexels" ? chalk.yellow("PXL") : chalk.red("---");
      console.log(`  [${icon}] ${img.query.slice(0, 60)}`);
    }

    console.log("\n" + "=".repeat(65) + "\n");
  });

// ── ai-visibility ────────────────────────────────────────────────
const aiVisCmd = program.command("ai-visibility").description("LLM rank tracking — monitor AI engine citations");

aiVisCmd
  .command("track")
  .option("--quick", "Quick mode — check 5 keywords only (for testing)")
  .description("Run COMPREHENSIVE AI visibility tracking (Google + Bing + Perplexity + ChatGPT + Claude on ALL keywords)")
  .action(async (opts) => {
    banner();
    console.log(chalk.cyan("\n  Pipeline: COMPREHENSIVE AI VISIBILITY TRACKER\n") + "-".repeat(65));
    console.log(chalk.gray("  Engines: Google AI Overview, Bing Copilot, Perplexity, ChatGPT Search, Claude Analysis"));
    console.log(chalk.gray("  This may take 20-30 minutes for all keywords.\n"));

    const llmRankTracker = require("./agents/seo/llmRankTracker");
    const result = await llmRankTracker.runTracker({ quick: opts.quick || false });

    console.log(chalk.bold(`\n  Keywords checked: ${result.checked}`));
    console.log(`  Google AI citations:  ${result.googleCited}`);
    console.log(`  Bing Copilot cited:   ${result.bingCited}`);
    console.log(`  Perplexity citations: ${result.perplexityCited}`);
    console.log(`  ChatGPT citations:    ${result.chatgptCited}`);
    console.log(`  Citability score:     ${result.avgScore}/10`);
    console.log("\n" + "=".repeat(65) + "\n");
  });

aiVisCmd
  .command("report")
  .description("Generate and email comprehensive AI visibility report (5 engines)")
  .action(async () => {
    banner();
    console.log(chalk.cyan("\n  Pipeline: COMPREHENSIVE AI VISIBILITY REPORT\n") + "-".repeat(65));

    const llmRankTracker = require("./agents/seo/llmRankTracker");
    const report = await llmRankTracker.generateReport();

    if (report) {
      console.log(chalk.bold(`\n  Google AI:  ${report.googleCited}/${report.googleOverviewPresent}`));
      console.log(`  Bing:       ${report.bingCited}/${report.bingCopilotPresent}`);
      console.log(`  Perplexity: ${report.perplexityCited}/${report.totalKeywords}`);
      console.log(`  ChatGPT:    ${report.chatgptCited}/${report.totalKeywords}`);
      console.log(`  Score:      ${report.avgScore}/10`);
      console.log(chalk.bold("\n  Competitors by engine:"));
      for (const [eng, comps] of Object.entries(report.competitorReport || {})) {
        if (comps.length > 0) console.log(`    ${eng}: ${comps.slice(0, 3).map((c) => c.domain).join(", ")}`);
      }
    } else {
      console.log(chalk.yellow("  No tracking data yet — run 'ai-visibility track' first"));
    }

    console.log("\n" + "=".repeat(65) + "\n");
  });

aiVisCmd
  .command("summary")
  .description("Quick AI visibility summary (no API calls)")
  .action(() => {
    banner();
    const llmRankTracker = require("./agents/seo/llmRankTracker");
    const summary = llmRankTracker.getSummary();

    if (summary) {
      console.log(chalk.cyan("\n  AI Visibility Summary\n") + "-".repeat(65));
      console.log(`  Keywords tracked:     ${summary.totalKeywords}`);
      console.log(`  Google AI citations:  ${summary.googleAICited}/${summary.googleAITotal}`);
      console.log(`  Perplexity citations: ${summary.perplexityCited}`);
      console.log(`  Last run:             ${summary.lastRun}`);
    } else {
      console.log(chalk.yellow("\n  No AI visibility data yet. Run: node pm.js ai-visibility track"));
    }

    console.log("\n" + "=".repeat(65) + "\n");
  });

// ── brand-mentions ───────────────────────────────────────────────
const brandCmd = program.command("brand").description("Brand mention monitoring");

brandCmd
  .command("scan")
  .option("--quick", "Quick scan — mentions + competitors only (skip directories/reviews)")
  .description("COMPREHENSIVE brand scan — mentions, news, competitors, reviews, directories, social, backlinks")
  .action(async (opts) => {
    banner();
    console.log(chalk.cyan("\n  Pipeline: COMPREHENSIVE BRAND SCAN\n") + "-".repeat(65));
    console.log(chalk.gray("  Sources: Google Web, Google News, Review Sites, Directories, Social Media\n"));

    const brandMonitor = require("./agents/ops/brandMentionMonitor");
    const result = await brandMonitor.runFullScan({ includeDirectories: !opts.quick });

    console.log(chalk.bold(`\n  Mentions: ${result.mentionResult.newMentions} new (${result.mentionResult.filtered} false positives filtered)`));

    if (result.reviewResult) {
      console.log(`  Review sites: ${result.reviewResult.listed}/${result.reviewResult.total} listed`);
      for (const [name, info] of Object.entries(result.reviewResult.sites)) {
        const icon = info.listed ? chalk.green("✓") : chalk.red("✗");
        console.log(`    ${icon} ${name}`);
      }
    }

    if (result.directoryResult) {
      console.log(`\n  Directories: ${result.directoryResult.listed}/${result.directoryResult.total} listed`);
      for (const [name, info] of Object.entries(result.directoryResult.directories)) {
        const icon = info.listed ? chalk.green("✓") : chalk.red("✗");
        console.log(`    ${icon} ${name}`);
      }
    }

    if (result.socialResult) {
      console.log(`\n  Social media: ${result.socialResult.found}/${result.socialResult.total} found`);
      for (const [name, info] of Object.entries(result.socialResult.platforms)) {
        const icon = info.found ? chalk.green("✓") : chalk.red("✗");
        console.log(`    ${icon} ${name}`);
      }
    }

    console.log(chalk.bold(`\n  Backlink opportunities: ${result.backlinkResult.length}`));
    for (const b of result.backlinkResult.filter((b) => b.priority === "high").slice(0, 5)) {
      console.log(`    🔗 ${b.domain}: ${b.action}`);
    }

    console.log("\n  Competitive landscape:");
    for (const c of result.competitorResult.slice(0, 8)) {
      const pos = c.ourPosition ? chalk.green(`#${c.ourPosition}`) : chalk.red("Not ranked");
      console.log(`    "${c.query}" → ${pos}`);
    }

    console.log("\n" + "=".repeat(65) + "\n");
  });

brandCmd
  .command("report")
  .description("Generate and email brand mention report")
  .action(async () => {
    banner();
    console.log(chalk.cyan("\n  Pipeline: BRAND MENTION REPORT\n") + "-".repeat(65));

    const brandMonitor = require("./agents/ops/brandMentionMonitor");
    const report = await brandMonitor.generateReport();

    if (report) {
      console.log(chalk.bold(`\n  Recent mentions: ${report.recentMentions}`));
      console.log(`  Positive: ${report.positive} | Negative: ${report.negative} | High Priority: ${report.highPriority}`);
      console.log(`  All-time total: ${report.totalAllTime}`);
    } else {
      console.log(chalk.yellow("  No data yet — run 'brand scan' first"));
    }

    console.log("\n" + "=".repeat(65) + "\n");
  });

brandCmd
  .command("summary")
  .description("Quick brand mention summary (no API calls)")
  .action(() => {
    banner();
    const brandMonitor = require("./agents/ops/brandMentionMonitor");
    const summary = brandMonitor.getSummary();

    if (summary) {
      console.log(chalk.cyan("\n  Brand Mention Summary\n") + "-".repeat(65));
      console.log(`  This week:      ${summary.recentMentions} mentions`);
      console.log(`  Positive:       ${summary.positive}`);
      console.log(`  Negative:       ${summary.negative}`);
      console.log(`  High priority:  ${summary.highPriority}`);
      console.log(`  All-time total: ${summary.totalAllTime}`);
      console.log(`  Last scan:      ${summary.lastRun}`);
    } else {
      console.log(chalk.yellow("\n  No brand data yet. Run: node pm.js brand scan"));
    }

    console.log("\n" + "=".repeat(65) + "\n");
  });

// ── blog video ───────────────────────────────────────────────────
blogCmd
  .command("video <url>")
  .option("-k, --keyword <keyword>", "Target keyword for SEO")
  .option("-c, --category <category>", "Article category", "ISO Certification")
  .description("Convert a YouTube video into a blog article and publish")
  .action(async (url, opts) => {
    banner();
    console.log(chalk.cyan("\n  Pipeline: VIDEO → BLOG\n") + "-".repeat(65));
    console.log(`  Video: ${url}`);
    if (opts.keyword) console.log(`  Target keyword: ${opts.keyword}`);
    console.log();

    const videoToBlog = require("./agents/content/videoToBlog");
    const result = await videoToBlog.processVideo(url, {
      targetKeyword: opts.keyword || null,
      category: opts.category,
    });

    if (result.success) {
      console.log(chalk.green.bold("\n  Article Published from Video"));
      console.log(`  Title:       ${result.title}`);
      console.log(`  URL:         ${result.url}`);
      console.log(`  Keyword:     ${result.primaryKeyword}`);
      console.log(`  Words:       ${result.wordCount}`);
      console.log(`  QA Score:    ${result.qaScore}/100`);
      console.log(`  Video:       ${result.videoTitle} (${result.videoDuration})`);
      console.log(`  Duration:    ${Math.round(result.pipelineDurationMs / 1000)}s`);
    } else {
      console.log(chalk.red.bold(`\n  Pipeline Failed: ${result.reason}`));
      if (result.qaScore) console.log(`  QA Score: ${result.qaScore}/100`);
    }

    console.log("\n" + "=".repeat(65) + "\n");
  });

// ── linkedin ──────────────────────────────────────────────────────
const linkedinCmd = program.command("linkedin").description("LinkedIn — share blog articles + find posts to comment on manually");

linkedinCmd
  .command("share")
  .description("Share the next best blog article to your LinkedIn profile")
  .action(async () => {
    banner();
    console.log(chalk.cyan("\n  Pipeline: SHARE ARTICLE TO LINKEDIN\n") + "-".repeat(65));

    const linkedin = require("./agents/growth/linkedinAgent");
    const result = await linkedin.sharePost();

    if (result.skipped) {
      console.log(chalk.yellow(`  Skipped: ${result.reason}`));
    } else if (result.shared) {
      console.log(chalk.green.bold(`\n  Shared: ${result.article}`));
      console.log(chalk.gray(`  Caption: ${result.caption}`));
      console.log(chalk.gray(`  URL: ${result.url}`));
    } else {
      console.log(chalk.red(`  Failed: ${result.error}`));
    }

    console.log("\n" + "=".repeat(65) + "\n");
  });

linkedinCmd
  .command("share-slug <slug>")
  .description("Share a specific article by slug")
  .action(async (slug) => {
    banner();
    console.log(chalk.cyan(`\n  Sharing: ${slug}\n`) + "-".repeat(65));

    const linkedin = require("./agents/growth/linkedinAgent");
    const result = await linkedin.shareBySlug(slug);

    if (result.skipped) {
      console.log(chalk.yellow(`  Skipped: ${result.reason}`));
    } else if (result.shared) {
      console.log(chalk.green.bold(`\n  Shared: ${result.article}`));
      console.log(chalk.gray(`  Caption: ${result.caption}`));
    } else {
      console.log(chalk.red(`  Failed: ${result.error}`));
    }

    console.log("\n" + "=".repeat(65) + "\n");
  });

linkedinCmd
  .command("find")
  .option("-n, --count <number>", "Number of search queries to run", "3")
  .description("Find relevant LinkedIn posts for you to comment on manually")
  .action(async (opts) => {
    banner();
    console.log(chalk.cyan("\n  Finding LinkedIn posts to engage with...\n") + "-".repeat(65));

    const https = require("https");
    const { SERPAPI_KEY } = require("./agents/shared/config");
    if (!SERPAPI_KEY) { console.log(chalk.red("  No SERPAPI_KEY configured")); return; }

    const QUERIES = [
      'site:linkedin.com "ISO 9001" certification',
      'site:linkedin.com "ISO 14001" environmental management',
      'site:linkedin.com "ISO 45001" safety management',
      'site:linkedin.com "ISO 27001" information security',
      'site:linkedin.com "IATF 16949" automotive quality',
      'site:linkedin.com "quality management system" manufacturing',
      'site:linkedin.com "ISO certification" small business',
      'site:linkedin.com "management system" compliance audit',
      'site:linkedin.com "ISO implementation" consultant',
      'site:linkedin.com "internal audit" ISO',
    ];

    const shuffled = [...QUERIES].sort(() => Math.random() - 0.5);
    const queries = shuffled.slice(0, parseInt(opts.count) || 3);
    const posts = [];
    const seen = new Set();

    for (const query of queries) {
      console.log(chalk.gray(`  Searching: ${query.replace("site:linkedin.com ", "")}`));
      try {
        const params = new URLSearchParams({ q: query, api_key: SERPAPI_KEY, engine: "google", num: 10, tbs: "qdr:w" });
        const data = await new Promise((resolve, reject) => {
          https.get(`https://serpapi.com/search.json?${params}`, (res) => {
            let d = ""; res.on("data", (c) => (d += c)); res.on("end", () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
          }).on("error", reject);
        });
        for (const r of (data.organic_results || [])) {
          const url = r.link || "";
          if (!url.includes("linkedin.com/posts/") && !url.includes("linkedin.com/pulse/") && !url.includes("linkedin.com/feed/update/")) continue;
          if (seen.has(url)) continue;
          seen.add(url);
          let author = "Unknown";
          const m = url.match(/linkedin\.com\/posts\/([^_]+)/);
          if (m) author = m[1].replace(/-/g, " ");
          posts.push({ title: r.title || "", url, snippet: r.snippet || "", author });
        }
        await new Promise((r) => setTimeout(r, 1500));
      } catch (err) {
        console.log(chalk.yellow(`  Search error: ${err.message}`));
      }
    }

    console.log(chalk.green.bold(`\n  Found ${posts.length} posts to engage with:\n`));
    for (let i = 0; i < posts.length; i++) {
      const p = posts[i];
      console.log(`  ${chalk.bold(`${i + 1}.`)} ${chalk.bold(p.author)}`);
      console.log(`     ${p.title.slice(0, 80)}`);
      console.log(chalk.gray(`     ${p.snippet.slice(0, 120)}`));
      console.log(chalk.cyan(`     ${p.url}\n`));
    }

    console.log(chalk.gray("  Open the links above and comment manually for best results."));
    console.log("\n" + "=".repeat(65) + "\n");
  });

linkedinCmd
  .command("queue")
  .description("Show articles available to share next")
  .action(() => {
    banner();
    const linkedin = require("./agents/growth/linkedinAgent");
    const candidates = linkedin.listCandidates(10);

    console.log(chalk.cyan("\n  LinkedIn Share Queue\n") + "-".repeat(65));
    if (candidates.length === 0) {
      console.log(chalk.yellow("  No articles available (need QA score >= 80 and not already shared)"));
    } else {
      for (let i = 0; i < candidates.length; i++) {
        const a = candidates[i];
        console.log(`  ${i + 1}. ${chalk.bold(a.title)} (QA: ${a.qaScore}/100)`);
        console.log(chalk.gray(`     ${a.slug}\n`));
      }
    }
    console.log("\n" + "=".repeat(65) + "\n");
  });

linkedinCmd
  .command("status")
  .description("Show LinkedIn sharing status")
  .action(() => {
    banner();
    const linkedin = require("./agents/growth/linkedinAgent");
    const status = linkedin.getStatus();

    console.log(chalk.cyan("\n  LinkedIn Status\n") + "-".repeat(65));
    console.log(`  This week: ${status.week.shared}/${status.week.limit} articles shared`);
    console.log(`  All-time: ${status.totalShared} articles shared`);

    if (status.week.posts.length > 0) {
      console.log(chalk.bold("\n  Recent shares:"));
      for (const p of status.week.posts) {
        console.log(`    ${p.date}: ${p.title}`);
      }
    }

    if (status.nextUp) {
      console.log(chalk.bold(`\n  Next up: ${status.nextUp.title} (QA: ${status.nextUp.qaScore}/100)`));
      console.log(chalk.gray(`  ${status.candidateCount} articles in queue`));
    }

    console.log("\n" + "=".repeat(65) + "\n");
  });

linkedinCmd
  .command("report")
  .description("Generate LinkedIn sharing report")
  .action(() => {
    banner();
    const linkedin = require("./agents/growth/linkedinAgent");
    const report = linkedin.generateReport();

    console.log(chalk.cyan("\n  LinkedIn Report Generated\n") + "-".repeat(65));
    console.log(`  Saved to: ${report.filePath}`);
    console.log(report.markdown);
    console.log("=".repeat(65) + "\n");
  });

linkedinCmd
  .command("verify")
  .description("Verify LinkedIn API token is still valid")
  .action(async () => {
    const linkedin = require("./agents/growth/linkedinAgent");
    const result = await linkedin.verifyToken();

    if (result.valid) {
      console.log(chalk.green(`  LinkedIn token valid. Profile: ${result.name}`));
    } else {
      console.log(chalk.red(`  LinkedIn token INVALID: ${result.error}`));
      console.log(chalk.yellow("  Re-authenticate at: https://www.linkedin.com/developers/"));
    }
  });

program.parse();
