#!/usr/bin/env node

/**
 * ISO Certification Consultant Cluster Page Scheduler
 *
 * Manages the daily cluster page queue: which topic comes next, which have been
 * published, indexing submission post-publish.
 *
 * Queue file: team/data/cluster-queue.json
 * History file: team/data/cluster-history.json (auto-created)
 *
 * Usage:
 *   node clusterScheduler.js next             # print next pending item (JSON)
 *   node clusterScheduler.js status           # summary: pending count, last published
 *   node clusterScheduler.js complete <id>    # mark id as published; submit to GSC sitemap + Yandex IndexNow
 *   node clusterScheduler.js list             # list all queue items with status
 */

const fs = require("node:fs");
const path = require("node:path");
const https = require("node:https");

const REPO_ROOT = path.resolve(__dirname, "../../..");
const QUEUE_PATH = path.join(REPO_ROOT, "team/data/cluster-queue.json");
const HISTORY_PATH = path.join(REPO_ROOT, "team/data/cluster-history.json");
const ENV_PATH = path.join(REPO_ROOT, "team/.env");

// ── helpers ─────────────────────────────────────────────────

function loadQueue() {
  return JSON.parse(fs.readFileSync(QUEUE_PATH, "utf-8"));
}

function saveQueue(q) {
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(q, null, 2) + "\n");
}

function loadHistory() {
  if (!fs.existsSync(HISTORY_PATH)) {
    return { version: 1, published: [] };
  }
  return JSON.parse(fs.readFileSync(HISTORY_PATH, "utf-8"));
}

function saveHistory(h) {
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(h, null, 2) + "\n");
}

function loadEnv() {
  const env = {};
  if (!fs.existsSync(ENV_PATH)) return env;
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    env[t.slice(0, i).trim()] = t
      .slice(i + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
  return env;
}

function fetchJson(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const headers = { ...(opts.headers || {}) };
    if (opts.body && !headers["Content-Length"]) {
      headers["Content-Length"] = Buffer.byteLength(opts.body);
    }
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: opts.method || "GET",
        headers,
      },
      (res) => {
        let body = "";
        res.on("data", (d) => (body += d));
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(body ? JSON.parse(body) : {});
            } catch {
              resolve({ raw: body });
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 200)}`));
          }
        });
      }
    );
    req.on("error", reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

// ── auth (Google OAuth refresh token from team/.env) ─────────

async function getAccessToken() {
  const env = loadEnv();
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REFRESH_TOKEN) {
    throw new Error("Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN in team/.env");
  }
  const body = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    refresh_token: env.GOOGLE_REFRESH_TOKEN,
    grant_type: "refresh_token",
  }).toString();
  const r = await fetchJson("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.access_token) throw new Error("OAuth: no access_token in response");
  return r.access_token;
}

// ── indexing helpers ──────────────────────────────────────────

async function resubmitSitemap() {
  const token = await getAccessToken();
  const sitemapUrl = "https://isocertificationconsultant.ca/sitemap.xml";
  const site = "sc-domain:isocertificationconsultant.ca";
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
  await fetchJson(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
  return { ok: true };
}

async function indexNowYandex(urls) {
  const body = JSON.stringify({
    host: "isocertificationconsultant.ca",
    key: "964cad32093f21d421ad7a9bd0b92bf6",
    keyLocation: "https://isocertificationconsultant.ca/964cad32093f21d421ad7a9bd0b92bf6.txt",
    urlList: urls,
  });
  await fetchJson("https://yandex.com/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  return { ok: true };
}

// ── commands ──────────────────────────────────────────────────

function cmdNext() {
  const q = loadQueue();
  const next = (q.queue || []).find((it) => it.status === "pending");
  if (!next) {
    console.log(JSON.stringify({ empty: true, message: "No pending items in queue" }));
    process.exit(0);
  }
  console.log(JSON.stringify(next, null, 2));
}

function cmdStatus() {
  const q = loadQueue();
  const h = loadHistory();
  const pending = (q.queue || []).filter((it) => it.status === "pending");
  const inProgress = (q.queue || []).filter((it) => it.status === "in-progress");
  const published = h.published || [];
  console.log(`Queue: ${pending.length} pending, ${inProgress.length} in-progress`);
  console.log(`Published: ${published.length} total`);
  if (published.length > 0) {
    const last = published[published.length - 1];
    console.log(`Last published: ${last.id} on ${last.publishedAt}`);
  }
  if (pending.length > 0) {
    console.log(`Next pending: ${pending[0].id} (${pending[0].bucket})`);
  }
}

function cmdList() {
  const q = loadQueue();
  const h = loadHistory();
  const publishedIds = new Set((h.published || []).map((p) => p.id));
  console.log(`# Queue (${q.queue?.length || 0} items)`);
  for (const it of q.queue || []) {
    const status = publishedIds.has(it.id) ? "PUBLISHED" : it.status.toUpperCase();
    console.log(`  [${status.padEnd(11)}] ${it.id}  (${it.bucket}, ${it.city?.country || "?"})`);
  }
  if (h.published?.length) {
    console.log(`\n# Recently published`);
    for (const p of h.published.slice(-5)) {
      console.log(`  ${p.publishedAt}  ${p.id}  (${p.commitHash || "?"})`);
    }
  }
}

async function cmdComplete(id) {
  if (!id) {
    console.error("Usage: clusterScheduler.js complete <id>");
    process.exit(1);
  }

  const q = loadQueue();
  const h = loadHistory();

  const item = (q.queue || []).find((it) => it.id === id);
  if (!item) {
    console.error(`Queue item ${id} not found`);
    process.exit(1);
  }

  // Move from queue to history (keep queue.queue intact for replay safety —
  // just flip status to "published")
  item.status = "published";
  item.publishedAt = item.publishedAt || new Date().toISOString().slice(0, 10);
  saveQueue(q);

  if (!h.published) h.published = [];
  if (!h.published.find((p) => p.id === id)) {
    h.published.push({
      id: item.id,
      publishedAt: item.publishedAt,
      bucket: item.bucket,
      citySlug: item.citySlug,
      country: item.city?.country,
      canonical: item.canonical,
    });
    saveHistory(h);
  }

  console.log(`Marked ${id} as published.`);

  // Submit to indexing channels
  const url = item.canonical;
  if (url) {
    console.log(`Submitting indexing for ${url}...`);
    try {
      await resubmitSitemap();
      console.log("  ✓ GSC sitemap resubmit OK");
    } catch (e) {
      console.warn(`  ⚠ sitemap resubmit failed: ${e.message}`);
    }
    try {
      await indexNowYandex([url]);
      console.log("  ✓ Yandex IndexNow OK");
    } catch (e) {
      console.warn(`  ⚠ Yandex IndexNow failed: ${e.message}`);
    }
    console.log(`  Manual: GSC URL Inspection -> Request Indexing for ${url}`);
  }
}

// ── entry ────────────────────────────────────────────────────

const cmd = process.argv[2];
const arg = process.argv[3];

(async () => {
  switch (cmd) {
    case "next":
      cmdNext();
      break;
    case "status":
      cmdStatus();
      break;
    case "list":
      cmdList();
      break;
    case "complete":
      await cmdComplete(arg);
      break;
    default:
      console.error("Usage: clusterScheduler.js {next|status|list|complete <id>}");
      process.exit(1);
  }
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
