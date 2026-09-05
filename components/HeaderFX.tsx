"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Icon } from "./Icons";

const easeOut = [0.22, 1, 0.36, 1] as const;

/**
 * Word-by-word animated page title with a drawn underline beneath the accent phrase.
 * Pass the full headline as `text`; the substring `accent` is rendered teal + underlined.
 */
export function AnimatedTitle({ text, accent }: { text: string; accent: string }) {
  const idx = text.indexOf(accent);
  const before = idx >= 0 ? text.slice(0, idx).trim() : text;
  const after = idx >= 0 ? text.slice(idx + accent.length).trim() : "";
  const parts: { word: string; accent: boolean }[] = [
    ...before.split(/\s+/).filter(Boolean).map((w) => ({ word: w, accent: false })),
    ...(idx >= 0 ? accent.split(/\s+/).filter(Boolean).map((w) => ({ word: w, accent: true })) : []),
    ...after.split(/\s+/).filter(Boolean).map((w) => ({ word: w, accent: false })),
  ];
  const accentWords = parts.filter((p) => p.accent).length;
  let accentSeen = 0;

  return (
    <motion.span
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } } }}
      className="inline"
    >
      {parts.map((p, i) => {
        const isLastAccent = p.accent && ++accentSeen === accentWords;
        return (
          <motion.span
            key={`${p.word}-${i}`}
            variants={{
              hidden: { opacity: 0, y: 22 },
              show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: easeOut } },
            }}
            className={`relative inline-block ${p.accent ? "text-teal-700" : ""}`}
          >
            {p.word}
            {isLastAccent && (
              <motion.svg
                className="absolute -bottom-2 right-0 w-[220%] max-w-[280px]"
                height="10"
                viewBox="0 0 200 10"
                preserveAspectRatio="none"
                fill="none"
                aria-hidden
              >
                <motion.path
                  d="M2 7 Q 50 2 100 6 T 198 5"
                  stroke="#D97706"
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, ease: easeOut, delay: 0.15 * i + 0.5 }}
                />
              </motion.svg>
            )}
            {i < parts.length - 1 && <span>&nbsp;</span>}
          </motion.span>
        );
      })}
    </motion.span>
  );
}

/**
 * Floating field of module/process icons for page-header banners.
 * Sits on the right side of the banner, behind content. Desktop only.
 */
export function HeaderIconsFX({ icons }: { icons: string[] }) {
  const reduce = useReducedMotion();
  // Deterministic scatter positions (percent of container) for up to 6 icons.
  const POS = [
    { right: "4%", top: "18%", size: 56, dur: 7 },
    { right: "16%", top: "52%", size: 48, dur: 9 },
    { right: "28%", top: "22%", size: 44, dur: 8 },
    { right: "8%", top: "72%", size: 46, dur: 10 },
    { right: "24%", top: "78%", size: 40, dur: 7.5 },
    { right: "36%", top: "56%", size: 38, dur: 9.5 },
  ];
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 lg:block" aria-hidden>
      {/* slow rotating dashed ring anchoring the cluster */}
      <motion.div
        className="absolute right-[10%] top-1/2 h-64 w-64 -translate-y-1/2 rounded-full border-2 border-dashed border-teal-200/70"
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />
      {icons.slice(0, 6).map((name, i) => {
        const p = POS[i];
        return (
          <motion.span
            key={name}
            className="absolute grid place-items-center rounded-2xl border border-slate-200 bg-white text-teal-700 shadow-[0_12px_30px_-12px_rgba(22,43,77,0.35)]"
            style={{ right: p.right, top: p.top, width: p.size, height: p.size }}
            initial={{ opacity: 0, scale: 0.6, y: 14 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: reduce ? 0 : [0, -9, 0],
            }}
            transition={{
              opacity: { duration: 0.5, delay: 0.3 + i * 0.1 },
              scale: { duration: 0.5, delay: 0.3 + i * 0.1, ease: easeOut },
              y: { duration: p.dur, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 },
            }}
          >
            <Icon name={name} style={{ width: p.size * 0.45, height: p.size * 0.45 }} />
          </motion.span>
        );
      })}
    </div>
  );
}
