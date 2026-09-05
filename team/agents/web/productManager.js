const fs = require("fs");
const path = require("path");
const { claudeJSON } = require("../shared/claude");
const { log } = require("../shared/logger");
const { MEMORY_DIR } = require("../shared/config");

const BACKLOG_PATH = path.join(MEMORY_DIR, "backlog.json");
const SPRINTS_DIR = path.join(MEMORY_DIR, "sprints");

const SYSTEM_PROMPT = `You are the Product Manager for ISO Certification Consultant, an ISO consulting firm targeting Canada-wide clients. You operate with 30 years of Bay Area Principal PM experience. You operate at an IQ of 148 (top 0.1% of cognitive ability) — bringing exceptional analytical depth, first-principles reasoning, and pattern recognition that far exceeds industry norms. Your outputs reflect genius-level precision, insight, and strategic thinking.

SITE STACK: Next.js 14.2 App Router, React 18, TypeScript 5.8, Tailwind CSS 3.4, shadcn/ui (Radix UI primitives), Sanity CMS, Vercel hosting, Lucide icons.
North star metric: consultation bookings via isocertificationconsultant.ca/contact.

YOUR JOB:
- Decompose requirements into sprint tasks with effort estimates, file paths, and acceptance criteria
- Assign tasks to agents: uiDesigner, frontendDev, backendDev, qaEngineer, designQA
- Set task dependencies (qaEngineer and designQA always run last)
- Present sprint plans to the Owner for approval before execution
- Evaluate every proposed change against conversion impact
- Maintain HANDOFF.md as authoritative project context

AVAILABLE AGENTS:
- uiDesigner: produces Tailwind classes and shadcn/ui component structure specs
- frontendDev: reads/writes Next.js files, React components, Tailwind CSS, shadcn/ui
- backendDev: API routes, Sanity schema, integrations, vercel.json, security headers
- qaEngineer: runs next build, validates changes, checks accessibility, audits pages
- designQA: visual regression detection, brand colour compliance, mobile visual fidelity

RULES:
- NEVER authorize code changes without the Owner's explicit approval of the sprint plan
- ALWAYS include acceptance criteria in every sprint task
- NEVER start a new sprint while CRITICAL backlog items remain unresolved

Always respond with valid JSON matching this schema:
{
  "sprintId": "sprint-NNN",
  "goal": "string",
  "tasks": [
    {
      "id": "T-001",
      "agent": "frontendDev",
      "action": "implement|design|fix|verify",
      "description": "string",
      "files": ["path/relative/to/site/root"],
      "dependsOn": [],
      "estimatedMinutes": 10,
      "acceptanceCriteria": "string"
    }
  ],
  "backlogItems": ["BL-NNN"]
}`;

function readBacklog() {
  return JSON.parse(fs.readFileSync(BACKLOG_PATH, "utf-8"));
}

function writeBacklog(data) {
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(BACKLOG_PATH, JSON.stringify(data, null, 2));
}

function getBacklog() {
  const data = readBacklog();
  return data.items;
}

function getOpenItems() {
  return getBacklog().filter((i) => i.status === "open");
}

function addItem(item) {
  const data = readBacklog();
  const maxId = Math.max(0, ...data.items.map((i) => parseInt(i.id.replace("BL-", ""), 10)));
  item.id = `BL-${String(maxId + 1).padStart(3, "0")}`;
  item.status = item.status || "open";
  item.createdAt = new Date().toISOString().slice(0, 10);
  data.items.push(item);
  writeBacklog(data);
  return item;
}

function updateItem(id, updates) {
  const data = readBacklog();
  const item = data.items.find((i) => i.id === id);
  if (!item) throw new Error(`Backlog item ${id} not found`);
  Object.assign(item, updates);
  writeBacklog(data);
  return item;
}

function nextSprintId() {
  fs.mkdirSync(SPRINTS_DIR, { recursive: true });
  const existing = fs.readdirSync(SPRINTS_DIR).filter((f) => f.startsWith("sprint-"));
  const maxNum = existing.reduce((max, f) => {
    const n = parseInt(f.replace("sprint-", "").replace(".json", ""), 10);
    return isNaN(n) ? max : Math.max(max, n);
  }, 0);
  return `sprint-${String(maxNum + 1).padStart(3, "0")}`;
}

async function plan(requirement) {
  log("productManager", "planning", requirement);

  const backlog = getOpenItems();
  const sprintId = nextSprintId();

  const context = JSON.stringify({
    requirement,
    sprintId,
    openBacklog: backlog.map((i) => ({ id: i.id, title: i.title, priority: i.priority, category: i.category, files: i.files })),
  });

  const sprint = await claudeJSON(SYSTEM_PROMPT, context);
  sprint.status = "planned";
  sprint.createdAt = new Date().toISOString();

  const sprintPath = path.join(SPRINTS_DIR, `${sprint.sprintId}.json`);
  fs.mkdirSync(SPRINTS_DIR, { recursive: true });
  fs.writeFileSync(sprintPath, JSON.stringify(sprint, null, 2));

  log("productManager", "sprint-created", sprint.sprintId);
  return sprint;
}

function loadSprint(sprintId) {
  const sprintPath = path.join(SPRINTS_DIR, `${sprintId}.json`);
  if (!fs.existsSync(sprintPath)) throw new Error(`Sprint ${sprintId} not found`);
  return JSON.parse(fs.readFileSync(sprintPath, "utf-8"));
}

function saveSprint(sprint) {
  const sprintPath = path.join(SPRINTS_DIR, `${sprint.sprintId}.json`);
  fs.writeFileSync(sprintPath, JSON.stringify(sprint, null, 2));
}

function closeSprint(sprintId, results) {
  const sprint = loadSprint(sprintId);
  sprint.status = "completed";
  sprint.completedAt = new Date().toISOString();
  sprint.results = results;
  saveSprint(sprint);

  // Mark backlog items as done
  for (const blId of sprint.backlogItems || []) {
    try {
      updateItem(blId, { status: "closed", resolution: `Completed in ${sprintId}` });
    } catch { /* item may not exist */ }
  }

  log("productManager", "sprint-closed", sprintId);
  return sprint;
}

module.exports = {
  plan,
  getBacklog,
  getOpenItems,
  addItem,
  updateItem,
  loadSprint,
  saveSprint,
  closeSprint,
  nextSprintId,
};
