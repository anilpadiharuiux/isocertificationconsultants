"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Subtle, professional animated decoration for page-header banners. */
export function BannerDecor() {
  const reduce = useReducedMotion();
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-teal-50/60 to-transparent" />
      {!reduce && (
        <>
          <motion.div
            className="absolute -left-20 -top-10 h-64 w-64 rounded-full bg-teal-200/25 blur-3xl"
            animate={{ x: [0, 24, 0], y: [0, 16, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute right-0 top-8 h-64 w-64 rounded-full bg-gold-200/20 blur-3xl"
            animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -right-6 top-16 hidden h-24 w-24 rounded-full border-2 border-teal-200/60 lg:block"
            animate={{ rotate: 360 }}
            transition={{ duration: 44, repeat: Infinity, ease: "linear" }}
          />
        </>
      )}
    </div>
  );
}
