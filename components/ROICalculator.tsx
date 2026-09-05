"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Check, Icon } from "./Icons";

/**
 * Interactive ROI estimator — industry & process aware.
 * Every output is calculated from the visitor's own inputs (including the
 * improvement levers), so nothing is a fabricated claim.
 */

const INDUSTRY_OPTIONS = [
  { key: "fabrication", label: "Metal Fabrication", icon: "production" },
  { key: "manufacturing", label: "Manufacturing", icon: "dashboard" },
  { key: "automotive", label: "Automotive", icon: "supplier" },
  { key: "aerospace", label: "Aerospace & Defence", icon: "calibration" },
  { key: "food", label: "Food & Beverage", icon: "inventory" },
  { key: "medical", label: "Medical Devices", icon: "inspection" },
  { key: "other", label: "Other / Mixed", icon: "document" },
] as const;

const PROCESS_OPTIONS = [
  { key: "inspection", label: "Inspection & QC", icon: "inspection" },
  { key: "inventory", label: "Inventory & Traceability", icon: "inventory" },
  { key: "training", label: "Training & Competence", icon: "training" },
  { key: "production", label: "Production Control", icon: "production" },
  { key: "capa", label: "Nonconformance & CAPA", icon: "capa" },
  { key: "supplier", label: "Supplier Quality", icon: "supplier" },
] as const;

// Sensible starting points per industry — every one remains user-adjustable.
const INDUSTRY_DEFAULTS: Record<string, { hours: number; contract: number; bids: number; failCost: number }> = {
  fabrication: { hours: 14, contract: 150, bids: 6, failCost: 60 },
  manufacturing: { hours: 16, contract: 200, bids: 6, failCost: 80 },
  automotive: { hours: 22, contract: 350, bids: 4, failCost: 120 },
  aerospace: { hours: 24, contract: 400, bids: 4, failCost: 100 },
  food: { hours: 18, contract: 175, bids: 5, failCost: 110 },
  medical: { hours: 24, contract: 300, bids: 3, failCost: 100 },
  other: { hours: 15, contract: 150, bids: 5, failCost: 75 },
};

export function ROICalculator() {
  const [industry, setIndustry] = useState<string>("manufacturing");
  const [processes, setProcesses] = useState<string[]>(["inspection", "training"]);

  // Direct savings inputs
  const [hoursPerWeek, setHoursPerWeek] = useState(16);
  const [hourlyCost, setHourlyCost] = useState(45);
  const [reduction, setReduction] = useState(40);
  // Opportunity inputs
  const [bidsPerYear, setBidsPerYear] = useState(6);
  const [contractValue, setContractValue] = useState(200); // in $k
  const [winRate, setWinRate] = useState(20);
  // Other-savings inputs
  const [failCost, setFailCost] = useState(80); // in $k / year
  const [preventable, setPreventable] = useState(30);

  // Industry choice re-seeds defaults (still fully user-adjustable).
  function pickIndustry(key: string) {
    setIndustry(key);
    const d = INDUSTRY_DEFAULTS[key];
    setHoursPerWeek(d.hours);
    setContractValue(d.contract);
    setBidsPerYear(d.bids);
    setFailCost(d.failCost);
  }

  function toggleProcess(key: string) {
    setProcesses((prev) => {
      if (prev.includes(key)) {
        // keep at least one process selected — the estimate needs a scope
        return prev.length > 1 ? prev.filter((p) => p !== key) : prev;
      }
      return [...prev, key];
    });
  }

  // The processes you select define how much of your quality workload the
  // system actually covers — the improvement levers only apply to that share.
  const coverage = processes.length / PROCESS_OPTIONS.length;

  const r = useMemo(() => {
    const direct = Math.round(hoursPerWeek * 52 * coverage * (reduction / 100) * hourlyCost);
    const opportunity = Math.round(bidsPerYear * contractValue * 1000 * (winRate / 100));
    const other = Math.round(failCost * 1000 * coverage * (preventable / 100));
    const total = direct + opportunity + other;
    const hoursSaved = Math.round(hoursPerWeek * 52 * coverage * (reduction / 100));
    return { direct, opportunity, other, total, hoursSaved };
  }, [hoursPerWeek, hourlyCost, reduction, coverage, bidsPerYear, contractValue, winRate, failCost, preventable]);

  const max = Math.max(r.direct, r.opportunity, r.other, 1);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_-36px_rgba(22,43,77,0.55)]">
      <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
        {/* ── questions (left) ── */}
        <div className="border-b border-slate-200 p-7 lg:border-b-0 lg:border-r lg:p-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-navy-900 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-white">
            <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-teal-500 text-[10px]">1</span>
            Answer the questions
          </span>
          <h2 className="mt-4 font-heading text-2xl font-bold text-navy-900 sm:text-3xl">
            What is quality really costing your business?
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Five quick questions. The ROI panel {""}
            <span className="font-semibold text-navy-900">on the right</span> recalculates
            instantly with every answer — nothing to submit.
          </p>

          {/* 01 — industry */}
          <QLabel n="01" title="What industry are you in?" hint="Sets realistic starting points — adjust anything below." />
          <div className="mt-3 flex flex-wrap gap-2">
            {INDUSTRY_OPTIONS.map((o) => (
              <button
                key={o.key}
                onClick={() => pickIndustry(o.key)}
                className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold transition-all ${
                  industry === o.key
                    ? "border-teal-600 bg-teal-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-navy-800 hover:border-teal-300"
                }`}
              >
                <Icon name={o.icon} className="h-4 w-4" />
                {o.label}
              </button>
            ))}
          </div>

          {/* 02 — processes */}
          <QLabel
            n="02"
            title="Which processes should the system cover?"
            hint="This sets the scope of the estimate — savings below only count within the processes you select."
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {PROCESS_OPTIONS.map((o) => {
              const on = processes.includes(o.key);
              return (
                <button
                  key={o.key}
                  onClick={() => toggleProcess(o.key)}
                  className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold transition-all ${
                    on
                      ? "border-navy-900 bg-navy-900 text-white shadow-sm"
                      : "border-slate-200 bg-white text-navy-800 hover:border-navy-300"
                  }`}
                >
                  {on && <Check className="h-3.5 w-3.5 text-teal-400" />}
                  {o.label}
                </button>
              );
            })}
          </div>
          <p className="mt-3 rounded-lg bg-teal-50 px-3.5 py-2.5 text-xs font-medium text-teal-800">
            Covering {processes.length} of {PROCESS_OPTIONS.length} core processes — your
            time-reclaimed and failures-prevented figures are scaled to that share. Select
            more processes and watch the estimate grow.
          </p>

          {/* 03 — direct */}
          <QLabel n="03" title="Time your team spends on quality admin" />
          <div className="mt-4 space-y-6">
            <Slider label="Team hours per week on paperwork, audit prep & chasing records" value={hoursPerWeek} onChange={setHoursPerWeek} min={2} max={80} step={1} format={(v) => `${v} hrs/wk`} />
            <Slider label="Average loaded hourly cost of those people" value={hourlyCost} onChange={setHourlyCost} min={25} max={120} step={5} format={(v) => `$${v}/hr`} />
            <Slider label="Share of that admin the system could take over, within the processes you selected" value={reduction} onChange={setReduction} min={10} max={80} step={5} format={(v) => `${v}%`} />
          </div>

          {/* 04 — opportunity */}
          <QLabel n="04" title="Work you can't bid on without certification" />
          <div className="mt-4 space-y-6">
            <Slider label="Contracts or tenders per year that require certification you don't hold" value={bidsPerYear} onChange={setBidsPerYear} min={0} max={24} step={1} format={(v) => `${v}/yr`} />
            <Slider label="Typical value of one of those contracts" value={contractValue} onChange={setContractValue} min={25} max={2000} step={25} format={(v) => `$${v}k`} />
            <Slider label="Realistic share you'd win if you could bid" value={winRate} onChange={setWinRate} min={5} max={60} step={5} format={(v) => `${v}%`} />
          </div>

          {/* 05 — other */}
          <QLabel n="05" title="Cost of quality failures" />
          <div className="mt-4 space-y-6">
            <Slider label="Annual cost of scrap, rework, complaints and failed audits" value={failCost} onChange={setFailCost} min={0} max={500} step={5} format={(v) => `$${v}k/yr`} />
            <Slider label="Share you believe better process control would prevent" value={preventable} onChange={setPreventable} min={0} max={60} step={5} format={(v) => `${v}%`} />
          </div>
        </div>

        {/* ── results (right) ── */}
        <div id="roi-results" className="relative flex flex-col justify-between bg-navy-900 p-7 text-white lg:p-10">
          <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:32px_32px]" />
          <div className="relative lg:sticky lg:top-28">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-white">
              <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-gold-500 text-[10px] text-navy-900">2</span>
              Your ROI — updates live
              <span className="relative ml-0.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-400" />
              </span>
            </span>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-teal-400">
              Your estimated annual value
            </p>
            <AnimatedNumber value={r.total} prefix="$" className="mt-2 font-heading text-5xl font-bold sm:text-6xl" />
            <p className="mt-1 text-sm text-slate-400">
              per year, from your inputs — {INDUSTRY_OPTIONS.find((o) => o.key === industry)?.label},
              covering {processes.length} of {PROCESS_OPTIONS.length} processes
            </p>

            <div className="mt-8 space-y-5">
              <ResultRow color="bg-gold-500" label="Opportunity loss recovered" sub="contracts you can't bid today" value={r.opportunity} max={max} barColor="from-gold-500 to-gold-400" />
              <ResultRow color="bg-teal-400" label="Direct ROI — time reclaimed" sub={`${r.hoursSaved.toLocaleString("en-CA")} team hours/year back`} value={r.direct} max={max} barColor="from-teal-500 to-teal-400" />
              <ResultRow color="bg-slate-400" label="Other savings — failures prevented" sub="scrap, rework, complaints, failed audits" value={r.other} max={max} barColor="from-slate-400 to-slate-300" />
            </div>

            <div className="relative mt-9">
              <Link href="/contact" className="btn-primary w-full">
                Get your real number — book an onsite assessment
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-3 text-center text-xs leading-relaxed text-slate-400">
                Your estimate from your inputs — not a promise. The onsite assessment
                gives you the real figure, and its fee is credited to your solution.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* mobile live-total bar — the ROI stays visible while answering */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-navy-900/95 px-5 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-400">
              Your estimated ROI
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-400" />
              </span>
            </p>
            <AnimatedNumber value={r.total} prefix="$" className="font-heading text-xl font-bold text-white" />
          </div>
          <a href="#roi-results" className="btn-primary px-4 py-2.5 text-sm">
            See breakdown
          </a>
        </div>
      </div>
    </div>
  );
}

function QLabel({ n, title, hint }: { n: string; title: string; hint?: string }) {
  return (
    <div className="mt-9 flex items-baseline gap-3">
      <span className="font-heading text-sm font-bold text-teal-700">{n}</span>
      <div>
        <p className="font-heading text-base font-bold text-navy-900">{title}</p>
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}

function Slider({
  label, value, onChange, min, max, step, format,
}: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; format: (v: number) => string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-4">
        <label className="text-sm font-medium leading-snug text-slate-700">{label}</label>
        <span className="shrink-0 rounded-md bg-teal-50 px-2.5 py-1 font-heading text-sm font-bold text-teal-700">
          {format(value)}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-teal-600"
      />
    </div>
  );
}

function ResultRow({
  color, label, sub, value, max, barColor,
}: {
  color: string; label: string; sub: string; value: number; max: number; barColor: string;
}) {
  const pct = Math.max((value / max) * 100, 2);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-white">
          <span className={`h-2 w-2 rounded-full ${color}`} />
          {label}
        </p>
        <AnimatedNumber value={value} prefix="$" className="font-heading text-xl font-bold" />
      </div>
      <p className="ml-4 text-xs text-slate-400">{sub}</p>
      <div className="ml-4 mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 20 }}
        />
      </div>
    </div>
  );
}

function AnimatedNumber({
  value, prefix = "", className = "",
}: {
  value: number; prefix?: string; className?: string;
}) {
  const spring = useSpring(value, { stiffness: 90, damping: 22 });
  useEffect(() => {
    spring.set(value);
  }, [spring, value]);
  const display = useTransform(spring, (v) => `${prefix}${Math.round(v).toLocaleString("en-CA")}`);
  return <motion.p className={className}>{display}</motion.p>;
}
