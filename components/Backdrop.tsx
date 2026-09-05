"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";

/**
 * Cinematic hero backdrop: parallax aurora blobs + a cursor-tracking spotlight.
 * Purely decorative — sits behind hero content.
 */
export function HeroBackdrop() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const fade = useTransform(scrollYProgress, [0, 1], [1, 0.2]);

  // Cursor spotlight
  const mx = useMotionValue(50);
  const my = useMotionValue(20);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 100);
    my.set(((e.clientY - r.top) / r.height) * 100);
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className="pointer-events-auto absolute inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      {/* grid + dots */}
      <div className="absolute inset-0 bg-grid mask-radial opacity-60" />
      <div className="absolute inset-0 bg-dots mask-radial opacity-40" />

      {/* parallax aurora blobs */}
      <motion.div
        style={{ y: y1, opacity: fade }}
        className="absolute -left-32 top-0 h-[34rem] w-[34rem] rounded-full bg-cyan-400/20 blur-[120px] animate-aurora"
      />
      <motion.div
        style={{ y: y2, opacity: fade }}
        className="absolute -right-24 top-24 h-[30rem] w-[30rem] rounded-full bg-violet-500/20 blur-[120px] animate-aurora"
      />
      <motion.div
        style={{ y: y1, opacity: fade }}
        className="absolute bottom-0 left-1/3 h-[26rem] w-[26rem] rounded-full bg-cyan-500/10 blur-[110px]"
      />

      {/* cursor spotlight */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: useTransform(
            [sx, sy],
            ([x, y]) =>
              `radial-gradient(500px circle at ${x}% ${y}%, rgba(34,211,238,0.12), transparent 60%)`
          ),
        }}
      />

      {/* bottom fade into page */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-ink-900" />
    </div>
  );
}

/** Lightweight ambient aurora for interior page headers (no cursor tracking). */
export function AuroraStrip() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-grid mask-radial opacity-50" />
      <div className="absolute -left-24 -top-10 h-80 w-80 rounded-full bg-cyan-400/15 blur-[110px] animate-aurora" />
      <div className="absolute -right-20 top-0 h-80 w-80 rounded-full bg-violet-500/15 blur-[110px] animate-aurora" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-ink-900" />
    </div>
  );
}
