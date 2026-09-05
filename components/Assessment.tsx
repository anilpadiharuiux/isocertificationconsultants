"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, ShieldCheck } from "./Icons";

const QUESTIONS = [
  "Do you have documented processes for your core operations?",
  "Is there a controlled system for document and record versions?",
  "Do you run internal audits on a defined schedule?",
  "Are corrective actions tracked to root cause and closed out?",
  "Does leadership review quality objectives and performance regularly?",
  "Do you assess risks and opportunities across key processes?",
  "Are staff trained and competency records kept up to date?",
  "Do you monitor suppliers against defined quality requirements?",
];

const OPTIONS = [
  { label: "Yes, fully", score: 2 },
  { label: "Partially", score: 1 },
  { label: "Not yet", score: 0 },
];

const easeOut = [0.22, 1, 0.36, 1] as const;

export function Assessment() {
  const [step, setStep] = useState(0); // 0..QUESTIONS.length-1, then results
  const [answers, setAnswers] = useState<number[]>([]);
  const finished = step >= QUESTIONS.length;

  const result = useMemo(() => {
    const max = QUESTIONS.length * 2;
    const total = answers.reduce((a, b) => a + b, 0);
    const pct = Math.round((total / max) * 100);
    let band = "Early stage";
    let note =
      "There is groundwork to do, but that is exactly what a structured engagement is for. A gap analysis will map the fastest route.";
    if (pct >= 75) {
      band = "Audit-ready track";
      note =
        "Strong foundations. A focused gap analysis and internal audit could get you certification-ready quickly.";
    } else if (pct >= 45) {
      band = "In progress";
      note =
        "A real system is forming. Targeted work on the weaker areas will close the distance to certification.";
    }
    return { pct, band, note };
  }, [answers]);

  function answer(score: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[step] = score;
      return next;
    });
    setStep((s) => s + 1);
  }

  function restart() {
    setAnswers([]);
    setStep(0);
  }

  const progress = Math.round((Math.min(step, QUESTIONS.length) / QUESTIONS.length) * 100);

  return (
    <div className="mx-auto max-w-2xl">
      {/* progress */}
      {!finished && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-600">
              Question {step + 1} of {QUESTIONS.length}
            </span>
            <span className="font-semibold text-teal-700">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-600"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: easeOut }}
            />
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_20px_60px_-40px_rgba(22,43,77,0.5)] lg:p-10">
        <AnimatePresence mode="wait">
          {!finished ? (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35, ease: easeOut }}
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <h2 className="mt-5 font-heading text-2xl font-bold leading-snug text-navy-900">
                {QUESTIONS[step]}
              </h2>
              <div className="mt-7 space-y-3">
                {OPTIONS.map((o) => (
                  <button
                    key={o.label}
                    onClick={() => answer(o.score)}
                    className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 text-left text-sm font-medium text-navy-900 transition-all duration-300 hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50/60 hover:shadow-sm"
                  >
                    {o.label}
                    <ArrowRight className="h-4 w-4 text-slate-500 transition-all group-hover:translate-x-1 group-hover:text-teal-700" />
                  </button>
                ))}
              </div>
              {step > 0 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="mt-6 text-sm font-medium text-slate-500 hover:text-navy-900"
                >
                  ← Back
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: easeOut }}
              className="text-center"
            >
              <ResultRing value={result.pct} />
              <span className="mt-5 inline-block rounded-full bg-teal-50 px-4 py-1.5 text-sm font-semibold text-teal-700 ring-1 ring-teal-100">
                {result.band}
              </span>
              <h2 className="mt-4 font-heading text-2xl font-bold text-navy-900">
                Your readiness snapshot
              </h2>
              <p className="mx-auto mt-3 max-w-md text-slate-600">{result.note}</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/contact" className="btn-primary">
                  Get a detailed gap analysis <ArrowRight className="h-4 w-4" />
                </Link>
                <button onClick={restart} className="btn-ghost">
                  Retake assessment
                </button>
              </div>
              <p className="mt-6 text-xs text-slate-500">
                This is an indicative snapshot. The full platform assessment covers 350+
                questions across all 10 standards.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ResultRing({ value }: { value: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto grid h-36 w-36 place-items-center">
      <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <motion.circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="#0891B2"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * value) / 100 }}
          transition={{ duration: 1.3, ease: easeOut }}
        />
      </svg>
      <div className="absolute text-center">
        <span className="font-heading text-3xl font-bold text-navy-900">{value}%</span>
        <span className="block text-[11px] font-medium text-slate-500">ready</span>
      </div>
    </div>
  );
}
