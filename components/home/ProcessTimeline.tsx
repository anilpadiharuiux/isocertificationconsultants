"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { Icon, Check } from "../Icons";
import { PROCESS } from "@/lib/site";

const easeOut = [0.22, 1, 0.36, 1] as const;
const STAGE_ICONS = ["assessment", "design", "document", "rollout", "audit", "certificate"];

export function ProcessTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.75", "end 0.6"],
  });
  const fill = useSpring(scrollYProgress, { stiffness: 80, damping: 24, restDelta: 0.001 });

  return (
    <div ref={ref} className="relative mx-auto mt-14 max-w-3xl">
      {/* rail track */}
      <div className="absolute left-7 top-6 bottom-6 w-0.5 rounded bg-slate-200" />
      {/* animated fill */}
      <motion.div
        style={{ scaleY: fill }}
        className="absolute left-7 top-6 bottom-6 w-0.5 origin-top rounded bg-gradient-to-b from-teal-500 via-teal-600 to-gold-600"
      />

      <ol className="space-y-5">
        {PROCESS.map((p, i) => {
          const isLast = i === PROCESS.length - 1;
          return (
            <li key={p.n} className="relative flex items-stretch gap-5 sm:gap-7">
              {/* node */}
              <div className="relative z-10 flex shrink-0 flex-col items-center pt-1">
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, ease: easeOut }}
                  className={`grid place-items-center rounded-full border-4 border-white shadow-[0_8px_20px_-6px_rgba(22,43,77,0.5)] ${
                    isLast ? "bg-gold-600 text-white" : "bg-navy-900 text-teal-400"
                  }`}
                  style={{ height: 56, width: 56 }}
                >
                  {isLast ? (
                    <Check className="h-7 w-7" />
                  ) : (
                    <Icon name={STAGE_ICONS[i]} className="h-6 w-6" />
                  )}
                </motion.span>
              </div>

              {/* card */}
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, ease: easeOut, delay: 0.1 }}
                className="card card-hover mb-1 flex-1 p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-heading text-xs font-bold uppercase tracking-wider text-teal-700">
                    Step {p.n}
                  </span>
                  <span className="h-3 w-px bg-slate-200" />
                  <span className="text-xs font-semibold text-slate-500">{p.duration}</span>
                </div>
                <h3 className="mt-1.5 font-heading text-xl font-bold text-navy-900">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.detail}</p>
              </motion.div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
