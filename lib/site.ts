// Central site data — standards, industries, process, platform, stats.
// Source of truth mirrors docs/knowledge-base/page-registry.md + brand-guide.md.

export const SITE = {
  name: "ISO Certification Consultant",
  legalName: "ISO Certification Consultant Inc.",
  domain: "isocertificationconsultant.ca",
  url: "https://isocertificationconsultant.ca",
  tagline:
    "A configurable QMS platform for manufacturers — customized to your processes, ready for any standard",
  email: "hello@isocertificationconsultant.ca",
  phone: "+1 (000) 000-0000",
  region: "Ontario, Canada",
};

// Positioning constants — customization first, any standard.
export const ANY_STANDARD = {
  title: "Your standard not listed?",
  detail:
    "ISO, IATF and AS are just the start. Customer-specific requirements, regulatory frameworks, internal quality standards — if you're audited against it, we can model it in the platform and onboard it.",
};

export type Standard = {
  slug: string;
  code: string;
  name: string;
  category: string;
  summary: string;
  keyword: string;
  clauses: string;
  tools: string[];
};

export const STANDARDS: Standard[] = [
  {
    slug: "iso-9001",
    code: "ISO 9001",
    name: "Quality Management",
    category: "Quality",
    summary:
      "The foundation of every certified operation. Risk-based thinking, document control, and continual improvement built around your real production floor.",
    keyword: "iso 9001 certification canada",
    clauses: "10 clauses · 7 quality principles",
    tools: ["Document Control", "Internal Auditing", "Management Review", "CAPA"],
  },
  {
    slug: "iatf-16949",
    code: "IATF 16949",
    name: "Automotive Quality",
    category: "Automotive",
    summary:
      "The automotive supplement to ISO 9001. APQP, PPAP, FMEA and SPC wired into a QMS your OEM customers will audit against.",
    keyword: "iatf 16949 certification canada",
    clauses: "Built on ISO 9001 + automotive core tools",
    tools: ["APQP", "PPAP", "FMEA", "SPC", "MSA"],
  },
  {
    slug: "as9100",
    code: "AS9100",
    name: "Aerospace Quality",
    category: "Aerospace",
    summary:
      "Aerospace, space and defence quality with configuration management, counterfeit-part prevention and FOD control layered onto ISO 9001.",
    keyword: "as9100 consulting canada",
    clauses: "AS9100D · aligned to ISO 9001",
    tools: ["FOD Prevention", "Configuration Management", "Counterfeit Parts Control"],
  },
  {
    slug: "iso-13485",
    code: "ISO 13485",
    name: "Medical Devices",
    category: "Medical",
    summary:
      "Design controls, MDSAP readiness and Health Canada MDEL alignment for device makers who cannot afford a nonconformance.",
    keyword: "iso 13485 consulting canada",
    clauses: "Medical device QMS · MDSAP ready",
    tools: ["Design Controls", "MDSAP", "MDEL", "Supplier Management"],
  },
  {
    slug: "iso-14001",
    code: "ISO 14001",
    name: "Environmental Management",
    category: "Environment",
    summary:
      "Environmental aspects, lifecycle thinking and legal-compliance tracking that stand up to regulators and customer sustainability audits.",
    keyword: "iso 14001 certification canada",
    clauses: "Environmental management system",
    tools: ["Aspects & Impacts", "Legal Compliance", "Emergency Preparedness"],
  },
  {
    slug: "iso-45001",
    code: "ISO 45001",
    name: "OH&S Management",
    category: "Safety",
    summary:
      "Occupational health and safety built on hazard identification, the hierarchy of controls and worker participation — not just paperwork.",
    keyword: "iso 45001 certification canada",
    clauses: "Occupational health & safety",
    tools: ["Hazard Identification", "Hierarchy of Controls", "Emergency Response"],
  },
  {
    slug: "iso-27001",
    code: "ISO 27001",
    name: "Information Security",
    category: "Security",
    summary:
      "An information security management system with a risk-driven Statement of Applicability, ready for the customers demanding proof.",
    keyword: "iso 27001 consulting canada",
    clauses: "ISMS · Annex A controls",
    tools: ["Risk Assessment", "Statement of Applicability", "Access Control"],
  },
  {
    slug: "iso-22000",
    code: "ISO 22000",
    name: "Food Safety",
    category: "Food",
    summary:
      "Food safety management integrating HACCP, prerequisite programs and CFIA compliance for Canadian processors and manufacturers.",
    keyword: "iso 22000 consulting canada",
    clauses: "Food safety management system",
    tools: ["HACCP", "Prerequisite Programs", "CFIA Compliance"],
  },
  {
    slug: "iso-22301",
    code: "ISO 22301",
    name: "Business Continuity",
    category: "Continuity",
    summary:
      "Business continuity management — impact analysis, recovery strategies and tested plans that keep production running through disruption.",
    keyword: "iso 22301 consulting canada",
    clauses: "Business continuity management",
    tools: ["Business Impact Analysis", "Recovery Strategy", "Continuity Testing"],
  },
  {
    slug: "iso-17025",
    code: "ISO/IEC 17025",
    name: "Lab Accreditation",
    category: "Laboratory",
    summary:
      "Testing and calibration laboratory accreditation with measurement traceability, method validation and competence you can defend.",
    keyword: "iso 17025 accreditation canada",
    clauses: "Laboratory competence & accreditation",
    tools: ["Measurement Traceability", "Method Validation", "Proficiency Testing"],
  },
];

export type Industry = {
  slug: string;
  name: string;
  blurb: string;
  standards: string[];
  keyword: string;
};

export const INDUSTRIES: Industry[] = [
  {
    slug: "manufacturing",
    name: "Manufacturing",
    blurb:
      "Discrete and process manufacturers building a QMS that survives customer audits and scales with the line.",
    standards: ["ISO 9001", "ISO 14001", "ISO 45001"],
    keyword: "iso consulting manufacturing canada",
  },
  {
    slug: "automotive",
    name: "Automotive",
    blurb:
      "Tier 1 and Tier 2 suppliers meeting IATF 16949 and the core tools their OEM customers demand.",
    standards: ["IATF 16949", "ISO 9001", "ISO 14001"],
    keyword: "iso consulting automotive canada",
  },
  {
    slug: "aerospace-defence",
    name: "Aerospace & Defence",
    blurb:
      "Precision machine shops and assemblies achieving AS9100 with airtight traceability and configuration control.",
    standards: ["AS9100", "ISO 9001", "ISO 27001"],
    keyword: "iso consulting aerospace canada",
  },
  {
    slug: "healthcare-medical-devices",
    name: "Healthcare & Medical Devices",
    blurb:
      "Device manufacturers navigating ISO 13485, MDSAP and Health Canada licensing without stalling the pipeline.",
    standards: ["ISO 13485", "ISO 9001", "ISO 27001"],
    keyword: "iso 13485 medical device canada",
  },
  {
    slug: "food-beverage",
    name: "Food & Beverage",
    blurb:
      "Processors and packagers integrating ISO 22000, HACCP and CFIA requirements into one auditable system.",
    standards: ["ISO 22000", "ISO 9001", "ISO 14001"],
    keyword: "iso consulting food beverage canada",
  },
  {
    slug: "oil-gas-energy",
    name: "Oil, Gas & Energy",
    blurb:
      "Energy operators managing quality, environment and safety across high-consequence, heavily-regulated operations.",
    standards: ["ISO 9001", "ISO 14001", "ISO 45001"],
    keyword: "iso consulting oil gas canada",
  },
  {
    slug: "construction",
    name: "Construction",
    blurb:
      "Contractors and fabricators winning tenders with integrated quality, safety and environmental management.",
    standards: ["ISO 9001", "ISO 45001", "ISO 14001"],
    keyword: "iso consulting construction canada",
  },
  {
    slug: "mining-natural-resources",
    name: "Mining & Natural Resources",
    blurb:
      "Extractive and resource operations proving environmental stewardship and safety leadership under scrutiny.",
    standards: ["ISO 14001", "ISO 45001", "ISO 9001"],
    keyword: "iso consulting mining canada",
  },
];

export type ProcessStage = {
  n: string;
  title: string;
  duration: string;
  detail: string;
};

export const PROCESS: ProcessStage[] = [
  {
    n: "01",
    title: "Gap Analysis",
    duration: "Weeks 1–2",
    detail:
      "A structured assessment of your current operations against the target standard — every clause scored, every gap mapped to an owner and a due date.",
  },
  {
    n: "02",
    title: "System Design",
    duration: "Weeks 2–5",
    detail:
      "We design a QMS around how your business actually runs. Processes, risks and objectives modelled in the platform, not copied from a template.",
  },
  {
    n: "03",
    title: "Documentation",
    duration: "Weeks 4–9",
    detail:
      "Procedures, work instructions and records generated with AI assistance and refined by consultants — lean documentation your team will actually use.",
  },
  {
    n: "04",
    title: "Implementation",
    duration: "Weeks 8–16",
    detail:
      "Roll-out with training, competency records and evidence capture. The platform tracks adoption so nothing slips before the audit.",
  },
  {
    n: "05",
    title: "Internal Audit",
    duration: "Weeks 14–18",
    detail:
      "A full internal audit and management review that surfaces findings early — corrective actions closed before the certification body ever arrives.",
  },
  {
    n: "06",
    title: "Certification",
    duration: "Weeks 18–24",
    detail:
      "Stage 1 and Stage 2 audit support with your registrar. We are in the room, and we stay on for surveillance-audit readiness.",
  },
];

export type PlatformFeature = {
  title: string;
  detail: string;
  icon: string;
};

export const PLATFORM: PlatformFeature[] = [
  {
    icon: "assessment",
    title: "Readiness Assessment",
    detail:
      "350+ questions across 10 standards with real-time scoring and a personalized gap report — before you spend a dollar on consulting.",
  },
  {
    icon: "document",
    title: "AI Document Engine",
    detail:
      "Generate procedures, work instructions and audit checklists tuned to your industry, then refine them with an expert in the loop.",
  },
  {
    icon: "audit",
    title: "Audit & Evidence Hub",
    detail:
      "Plan internal audits, log findings, and track corrective actions with a clear trail your registrar can follow in minutes.",
  },
  {
    icon: "assistant",
    title: "Compliance Assistant",
    detail:
      "An AI assistant trained on 8 industries and 10 standards, answering clause-level questions the moment your team hits a wall.",
  },
  {
    icon: "dashboard",
    title: "Live Compliance Dashboard",
    detail:
      "One view of every process, objective and open action — so leadership always knows exactly how audit-ready the business is.",
  },
  {
    icon: "expert",
    title: "Consultant On Call",
    detail:
      "The platform does the heavy lifting; a certified lead consultant reviews the work and joins you for the audit that matters.",
  },
];

export const STATS = [
  { value: 9, suffix: "+", label: "configurable QMS process modules" },
  { value: 100, suffix: "%", label: "configured to your workflow — no rigid templates" },
  { value: 8, suffix: "", label: "manufacturing industries served" },
  { value: 24, suffix: "wk", label: "typical path to certification" },
];

export const DIFFERENTIATORS = [
  {
    title: "Configured, not templated",
    detail:
      "Every process module adapts to your forms, fields, routing and terminology. The system fits how your business runs — not the other way around.",
  },
  {
    title: "Any standard, onboarded",
    detail:
      "ISO, IATF and AS are just the start. Customer-specific, regulatory or internal standards — if you're audited against it, we can build it into the system.",
  },
  {
    title: "Manufacturing processes first",
    detail:
      "Inspection, inventory, training, production and every process on your floor — modelled as they actually run, not forced into generic business software.",
  },
  {
    title: "Hybrid delivery",
    detail:
      "An AI-powered platform plus certified consultants configuring it with you — from the first process map to a passed certification audit.",
  },
];

// ── Process modules — the heart of the platform. Manufacturers configure these
//    to match how their business actually runs. Order leads with the Owner's priorities.
export type Module = {
  slug: string;
  name: string;
  icon: string;
  tagline: string;
  summary: string;
  features: string[];
  standardsHint: string;
};

export const MODULES: Module[] = [
  {
    slug: "inspection",
    name: "Inspection & Quality Control",
    icon: "inspection",
    tagline: "Catch defects where they happen",
    summary:
      "Digital inspection built around your product and your floor — incoming, in-process and final — with the checks, tolerances and sign-offs your operation actually uses.",
    features: [
      "Incoming, in-process and final inspection plans",
      "Configurable digital checklists on the floor or in the lab",
      "Defect and nonconformance logging with photos",
      "First-article inspection (FAI / AS9102) and SPC data capture",
    ],
    standardsHint: "Supports ISO 9001, IATF 16949, AS9100",
  },
  {
    slug: "inventory",
    name: "Inventory & Traceability",
    icon: "inventory",
    tagline: "Full genealogy, receipt to shipment",
    summary:
      "Lot and serial traceability, material certifications and quarantine control configured to your part numbering, storage rules and recall requirements.",
    features: [
      "Lot and serial traceability from receipt to shipment",
      "Material certifications and quarantine / hold control",
      "FIFO / FEFO and shelf-life management",
      "Recall-ready genealogy and where-used lookups",
    ],
    standardsHint: "Supports ISO 9001, ISO 22000, ISO 13485",
  },
  {
    slug: "training-competence",
    name: "Training & Competence",
    icon: "training",
    tagline: "Prove competence, never lapse",
    summary:
      "A skills matrix mapped to your work centers and roles, with certification tracking and evidence that stands up to any auditor asking 'who is qualified to do this?'",
    features: [
      "Skills matrix mapped to work centers and roles",
      "Certification and re-qualification tracking with expiries",
      "On-the-job training sign-offs and competency evidence",
      "Automatic reminders before competencies lapse",
    ],
    standardsHint: "Supports every management-system standard",
  },
  {
    slug: "production",
    name: "Production & Process Control",
    icon: "production",
    tagline: "Control the process, not just the paperwork",
    summary:
      "Work orders, routings and control plans wired to your process parameters — with real-time SPC and scrap tracking configured to the way your lines run.",
    features: [
      "Work orders, routings and process parameters",
      "In-line process checks and control plans",
      "Real-time SPC (Cpk / Ppk) with out-of-control alerts",
      "Scrap, rework and yield tracking",
    ],
    standardsHint: "Supports ISO 9001, IATF 16949",
  },
  {
    slug: "nonconformance-capa",
    name: "Nonconformance & CAPA",
    icon: "capa",
    tagline: "Close the loop on every finding",
    summary:
      "Capture a nonconformance from anywhere on the floor, drive it to root cause and verify the fix — with the disposition and approval routing your quality system requires.",
    features: [
      "Nonconformance capture from any point on the floor",
      "Root-cause analysis (5-Why, fishbone, 8D)",
      "Corrective / preventive actions with effectiveness checks",
      "Findings linked to audits, suppliers and inspections",
    ],
    standardsHint: "Supports ISO 9001, ISO 13485, IATF 16949",
  },
  {
    slug: "audits-management-review",
    name: "Audits & Management Review",
    icon: "audit",
    tagline: "Walk into every audit prepared",
    summary:
      "Internal audit scheduling, findings tracked to closure and management-review dashboards built from your objectives and KPIs — configured to your audit program.",
    features: [
      "Internal audit scheduling and configurable checklists",
      "Findings tracked to closure with owners and due dates",
      "Management review inputs, outputs and KPI dashboards",
      "A clean evidence trail for your registrar",
    ],
    standardsHint: "Supports every ISO / IATF / AS standard",
  },
  {
    slug: "supplier-quality",
    name: "Supplier Quality",
    icon: "supplier",
    tagline: "Hold your supply chain to your standard",
    summary:
      "Approved supplier lists, scorecards and supplier corrective actions configured to your qualification criteria and incoming-quality workflow.",
    features: [
      "Approved supplier list and qualification workflow",
      "Incoming quality and supplier scorecards",
      "Supplier corrective actions (SCAR) tracking",
      "PPAP / material certification management",
    ],
    standardsHint: "Supports ISO 9001, IATF 16949, AS9100",
  },
  {
    slug: "calibration-maintenance",
    name: "Calibration & Maintenance",
    icon: "calibration",
    tagline: "Trusted measurements, uptime you can plan",
    summary:
      "Gauge and equipment registers with due-date alerts and preventive-maintenance schedules configured to your assets and traceability requirements.",
    features: [
      "Gauge and equipment registers with due-date alerts",
      "Calibration records traceable to national standards",
      "Preventive maintenance schedules and history",
      "Out-of-tolerance impact assessment",
    ],
    standardsHint: "Supports ISO 9001, ISO/IEC 17025",
  },
  {
    slug: "document-control",
    name: "Document & Records Control",
    icon: "document",
    tagline: "One controlled source of truth",
    summary:
      "Controlled documents, versions, approvals and distribution configured to your terminology, approval routing and retention rules — the backbone every standard requires.",
    features: [
      "Version control with approval and distribution workflows",
      "Configurable numbering, terminology and retention rules",
      "Read-and-understood acknowledgements",
      "Records management with retention scheduling",
    ],
    standardsHint: "Foundation for every standard",
  },
];

// How customization actually happens — the delivery model that sets us apart.
export const CUSTOMIZATION = [
  {
    n: "01",
    title: "Map your process",
    detail:
      "We model how your business actually runs — the routings, checks, forms and approvals your team already uses — instead of starting from a generic template.",
  },
  {
    n: "02",
    title: "Configure the modules",
    detail:
      "Fields, checklists, terminology and routing are configured to match your operation. The platform speaks your language, not software jargon.",
  },
  {
    n: "03",
    title: "Onboard your standards",
    detail:
      "Map every module and control to the standards you certify against — ISO, IATF, AS, customer-specific or internal. Any standard, one system.",
  },
  {
    n: "04",
    title: "Deploy to the floor",
    detail:
      "Roll out with training, competency records and evidence capture — with a certified consultant reviewing the configuration through to your audit.",
  },
];

// ── CUSTOM SOLUTIONS — the engagement model. The platform is customized to the
//    specific challenge a client faces: onsite assessment → gaps → a solution
//    built (new or adapted) by experts and engineers. Gap fee credited to solution.
export type CustomStep = {
  n: string;
  title: string;
  icon: string;
  detail: string;
};

export const CUSTOM_STEPS: CustomStep[] = [
  {
    n: "01",
    title: "Onsite assessment",
    icon: "inspection",
    detail:
      "Our engineers come to your facility and walk the floor with your team — inspection, inventory, training, production — to see exactly how work gets done and where the standard is at risk.",
  },
  {
    n: "02",
    title: "Gap analysis & scope",
    icon: "audit",
    detail:
      "We document every gap against the target standard and your business goals, then scope precisely what must be built or adapted — delivered as a clear findings report and a fixed-price proposal.",
  },
  {
    n: "03",
    title: "Built by experts & engineers",
    icon: "design",
    detail:
      "Our industry experts and engineers create a new solution — or tailor an existing module — to fit your exact challenge, terminology and workflow. Nothing generic, nothing off the shelf.",
  },
  {
    n: "04",
    title: "Delivery, integration & support",
    icon: "rollout",
    detail:
      "We deploy and configure the solution on your floor, integrate it with how your team already works, train your people, and stay on through your certification audit.",
  },
];

export const CUSTOM_FEEDBACK = {
  title: "A feedback loop at every step — until it fits",
  detail:
    "Customization is not a hand-off. We walk each draft of the solution through your actual processes with your team, gather their feedback, and refine — repeating until it genuinely matches your needs and clears the challenges you started with. The result is built purely around your organization, never a template bent to fit.",
  cycle: ["Walk it through your process", "Gather your team's feedback", "Refine and re-check"],
};

export const GAP_CREDIT = {
  title: "Your gap assessment fee is credited toward your solution",
  detail:
    "Start with a paid onsite gap assessment — a fixed, no-surprises fee. When you move forward, its full cost is applied to your customized solution. The assessment effectively pays for itself, and you never commit blind.",
};

// ROI focus for customization — honest value drivers, no fabricated figures.
// Framed for the businesses that need it most: shops under 50 employees and
// mid-size operations without a large quality department.
export const ROI = {
  eyebrow: "The return — custom solutions",
  title: "Customization that pays for itself",
  intro:
    "For growing shops and mid-size operations, a custom-built solution is not a cost centre. It protects the revenue you have, wins the contracts you're chasing, and gives your lean team back the hours certification usually eats. This is where the return shows up.",
  cta: { href: "/contact", label: "Book an onsite assessment" },
  footnote: "Fixed-fee assessment — credited in full toward your solution.",
  drivers: [
    {
      icon: "certificate",
      title: "The assessment fee, credited back",
      detail:
        "The onsite gap assessment is a fixed fee — and its full value is applied to your solution. You never pay for it twice.",
    },
    {
      icon: "audit",
      title: "Faster, cleaner certification",
      detail:
        "Gaps are found and fixed once, correctly — so you spend less on failed audits, repeat visits and last-minute rework before Stage 2.",
    },
    {
      icon: "inspection",
      title: "Fewer costly nonconformances",
      detail:
        "Issues get caught before they become scrap, rework, recalls or customer complaints — the failures that quietly drain margin.",
    },
    {
      icon: "supplier",
      title: "Contracts won and protected",
      detail:
        "Meet the certification your customers require, keep the accounts that mandate it, and qualify for tenders that were closed to you before.",
    },
    {
      icon: "dashboard",
      title: "Hours your team gets back",
      detail:
        "Audit prep, evidence-gathering and paperwork that used to consume days run largely on their own — freeing skilled people for real work.",
    },
  ],
};

// Platform ROI — for small and mid-size businesses running on spreadsheets,
// binders and a stretched (or absent) quality department.
export const ROI_PLATFORM = {
  eyebrow: "The return — platform",
  title: "Enterprise-grade quality, sized for your business",
  intro:
    "Family-owned shops and mid-size operations rarely have a quality department — they have a few overloaded people and a wall of binders. The platform gives them the system larger competitors run, without the enterprise price tag or headcount.",
  cta: { href: "/assessment", label: "Start the free readiness assessment" },
  footnote: "Free, no signup — see where you stand in minutes.",
  drivers: [
    {
      icon: "dashboard",
      title: "A fraction of a full-time hire",
      detail:
        "The platform does the tracking, reminders and evidence-gathering a quality coordinator would — so you get audit-ready without adding headcount you can't justify.",
    },
    {
      icon: "document",
      title: "Retire the spreadsheets and binders",
      detail:
        "One system replaces the scattered spreadsheets, shared drives and paper logs that eat hours and fail audits — no more hunting for records the week before the auditor arrives.",
    },
    {
      icon: "audit",
      title: "Audit prep that runs itself",
      detail:
        "Evidence is captured as work happens, so surveillance and re-certification audits stop being an annual fire drill that pulls your best people off the floor.",
    },
    {
      icon: "training",
      title: "Configured with you, usable day one",
      detail:
        "Our consultants configure the modules to your workflow and train your team — you're not left alone with empty software and a manual.",
    },
    {
      icon: "production",
      title: "Grows as you grow",
      detail:
        "Start with the modules and standard you need now; add processes, sites and standards as customers demand them — without replacing the system.",
    },
  ],
};

export const EXPERTS = {
  title: "Built by industry experts and engineers — not a ticket queue",
  detail:
    "Every custom solution is designed and built by people who have run quality inside real businesses. Certified lead auditors, process engineers and software engineers work your problem together, so the solution fits the standard and the shop.",
  points: [
    "Certified lead auditors who know what the registrar looks for",
    "Process engineers who understand your production reality",
    "Software engineers who build and integrate the solution",
    "One accountable team from onsite visit to passed audit",
  ],
};

export type CustomExample = {
  industry: string;
  icon: string;
  challenge: string;
  solution: string;
  tags: string[];
};

// Representative example scenarios — illustrative, not named client case studies.
export const CUSTOM_EXAMPLES: CustomExample[] = [
  {
    industry: "Metal Fabrication",
    icon: "production",
    challenge:
      "A structural steel fabricator couldn't satisfy customer and CWB audits — weld inspection and material traceability lived on paper, clipboards and whiteboards.",
    solution:
      "Our engineers built a custom inspection and traceability solution that captures heat numbers, weld maps and NDT results against every work order — with audit records assembled automatically.",
    tags: ["Inspection", "Traceability", "ISO 9001"],
  },
  {
    industry: "Manufacturing",
    icon: "dashboard",
    challenge:
      "A contract manufacturer kept failing customer PPAP submissions because documentation was assembled by hand — late, inconsistent and impossible to reproduce.",
    solution:
      "We adapted our production and document-control modules to build PPAP packages directly from live production data, so submissions are complete and pass the first time.",
    tags: ["Production", "Document Control", "IATF 16949"],
  },
  {
    industry: "Food & Beverage",
    icon: "inventory",
    challenge:
      "A food processor was drowning in paper HACCP logs and dreaded every CFIA inspection — records were hard to find and easy to miss.",
    solution:
      "We configured a food-safety solution with CCP monitoring, automatic corrective-action triggers and CFIA-ready reporting — no binders, nothing missed.",
    tags: ["HACCP", "Monitoring", "ISO 22000"],
  },
  {
    industry: "Precision Machining",
    icon: "calibration",
    challenge:
      "An aerospace machine shop needed AS9100 configuration management and FOD control that its primes would accept — its manual system wouldn't scale.",
    solution:
      "We tailored a traceability and configuration solution with counterfeit-part checks and FOD sign-offs built directly into the router and inspection steps.",
    tags: ["Configuration", "FOD Control", "AS9100"],
  },
];
