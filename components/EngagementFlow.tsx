"use client";

import { motion } from "framer-motion";
import { Icon } from "./Icons";
import { CUSTOM_STEPS, CUSTOM_FEEDBACK } from "@/lib/site";

const easeOut = [0.22, 1, 0.36, 1] as const;

// 4 node positions on the ring: top, right, bottom, left (clockwise).
const NODES = [
  { left: "50%", top: "13%" },
  { left: "87%", top: "50%" },
  { left: "50%", top: "87%" },
  { left: "13%", top: "50%" },
];

/**
 * The customization engagement as a continuous improvement cycle: the four stages
 * sit on a ring with a flowing indicator, and the detail reads alongside it.
 */
export function EngagementFlow() {
  return (
    <div className="mt-12">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,400px)_1fr] lg:gap-14">
        <CycleDiagram />
        <StepList />
      </div>
      <p className="mx-auto mt-10 max-w-3xl text-center leading-relaxed text-slate-600">
        {CUSTOM_FEEDBACK.detail}
      </p>
    </div>
  );
}

function CycleDiagram() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[380px]">
      {/* soft glow */}
      <div className="pointer-events-none absolute inset-[6%] rounded-full bg-teal-50" />

      {/* ring track */}
      <div className="absolute inset-[16%] rounded-full border-2 border-dashed border-teal-300/70" />

      {/* rotating conic sweep for depth */}
      <motion.div
        className="absolute inset-[16%] rounded-full"
        style={{ background: "conic-gradient(from 0deg, transparent 0 280deg, rgba(8,145,178,0.14) 340deg, transparent 360deg)" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      />

      {/* flowing indicator dot travelling the ring (shows the loop direction) */}
      <motion.div
        className="absolute inset-[16%]"
        animate={{ rotate: 360 }}
        transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
      >
        <span className="absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500 shadow-[0_0_0_5px_rgba(8,145,178,0.16),0_0_16px_3px_rgba(8,145,178,0.7)]" />
      </motion.div>

      {/* center hub */}
      <div className="absolute left-1/2 top-1/2 flex aspect-square w-[38%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-slate-200 bg-white text-center shadow-[0_14px_34px_-16px_rgba(22,43,77,0.6)]">
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="text-teal-600"
        >
          <Icon name="loop" className="h-7 w-7" />
        </motion.span>
        <span className="mt-1.5 px-2 font-heading text-[13px] font-bold leading-tight text-navy-900">
          Continuous feedback
        </span>
        <span className="px-2 text-[10px] font-semibold uppercase tracking-wide text-teal-700">
          until it fits
        </span>
      </div>

      {/* stage nodes */}
      {CUSTOM_STEPS.map((s, i) => (
        <motion.div
          key={s.n}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: NODES[i].left, top: NODES[i].top }}
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.45, ease: easeOut, delay: 0.15 + i * 0.12 }}
        >
          <span className="relative grid h-16 w-16 place-items-center rounded-full border-4 border-white bg-navy-900 text-teal-400 shadow-[0_10px_24px_-8px_rgba(22,43,77,0.6)]">
            <Icon name={s.icon} className="h-7 w-7" />
            <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-gold-600 font-heading text-[11px] font-bold text-white ring-2 ring-white">
              {s.n.replace("0", "")}
            </span>
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function StepList() {
  return (
    <motion.ol
      variants={{ show: { transition: { staggerChildren: 0.1 } } }}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      className="relative space-y-4"
    >
      {CUSTOM_STEPS.map((s) => (
        <motion.li
          key={s.n}
          variants={{ hidden: { opacity: 0, x: 20 }, show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: easeOut } } }}
          className="group flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-teal-300 sm:p-5"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-navy-900 font-heading text-base font-bold text-teal-400">
            {s.n.replace("0", "")}
          </span>
          <div>
            <h3 className="font-heading text-base font-bold text-navy-900">{s.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.detail}</p>
          </div>
        </motion.li>
      ))}
      {/* loop-back cue: last step feeds the cycle */}
      <motion.li
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.5 } } }}
        className="flex items-center gap-3 pl-1 pt-1 text-sm font-semibold text-teal-700"
      >
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        >
          <Icon name="loop" className="h-4 w-4" />
        </motion.span>
        Every stage feeds back into the cycle — we refine until it fits your operation.
      </motion.li>
    </motion.ol>
  );
}
