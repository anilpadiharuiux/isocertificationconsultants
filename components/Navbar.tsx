"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Phone, ChevronDown, Icon } from "./Icons";
import { SITE } from "@/lib/site";

// One "Solutions" menu, two clearly-differentiated offerings (+ overview).
const SOLUTIONS_MENU = [
  {
    href: "/solutions",
    icon: "dashboard",
    title: "Platform Modules",
    desc: "Nine ready-made QMS modules, configured to your workflow",
  },
  {
    href: "/custom-solutions",
    icon: "design",
    title: "Custom-Built Solutions",
    desc: "Built for your specific challenge by experts & engineers",
  },
  {
    href: "/platform",
    icon: "assessment",
    title: "Platform Overview",
    desc: "What's inside the platform and how it works",
  },
];

const NAV = [
  { href: "/roi", label: "ROI" },
  { href: "/services", label: "Standards" },
  { href: "/industries", label: "Industries" },
  { href: "/about", label: "About" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function openMenu() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMenuOpen(true);
  }
  function scheduleClose() {
    closeTimer.current = setTimeout(() => setMenuOpen(false), 140);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* Utility bar — trust + phone (hidden once scrolled to save space) */}
      <div
        className={`hidden overflow-hidden bg-navy-900 text-slate-300 transition-all duration-300 lg:block ${
          scrolled ? "max-h-0" : "max-h-12"
        }`}
      >
        <div className="container-page flex h-10 items-center justify-between text-[13px]">
          <p className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-teal-400" />
            ISO certification consulting for Canadian manufacturers — {SITE.region}
          </p>
          <div className="flex items-center gap-6">
            <a
              href={`tel:${SITE.phone.replace(/[^+\d]/g, "")}`}
              className="flex items-center gap-2 font-semibold text-white hover:text-teal-300"
            >
              <Phone className="h-4 w-4 text-teal-400" />
              {SITE.phone}
            </a>
            <span className="text-slate-400">Mon–Fri · 8am–6pm ET</span>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div
        className={`border-b transition-all duration-300 ${
          scrolled
            ? "border-slate-200 bg-white/95 shadow-[0_4px_20px_-16px_rgba(22,43,77,0.5)] backdrop-blur"
            : "border-transparent bg-white"
        }`}
      >
        <nav className="container-page flex h-16 items-center justify-between lg:h-[70px]">
          <Link href="/" className="group flex items-center gap-3" onClick={() => setOpen(false)}>
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-navy-900 transition-transform duration-200 group-hover:scale-105">
              <ShieldCheck className="h-5 w-5 text-teal-400" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-heading text-[16px] font-bold text-navy-900">
                ISO Certification Consultant
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-700">
                Quality Management · Canada
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {/* Solutions dropdown */}
            <div className="relative" onMouseEnter={openMenu} onMouseLeave={scheduleClose}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                className={`group relative flex items-center gap-1.5 rounded-md px-3.5 py-2 text-[15px] font-semibold transition-colors ${
                  menuOpen ? "text-teal-700" : "text-navy-800 hover:text-teal-700"
                }`}
              >
                Solutions
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    className="absolute left-0 top-full w-[380px] pt-3"
                  >
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-[0_24px_60px_-24px_rgba(22,43,77,0.45)]">
                      {SOLUTIONS_MENU.map((item, i) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                          className={`group/item flex items-start gap-3.5 rounded-lg p-3.5 transition-colors hover:bg-teal-50 ${
                            i < SOLUTIONS_MENU.length - 1 ? "mb-0.5" : ""
                          }`}
                        >
                          <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-navy-900 text-teal-400 transition-colors group-hover/item:bg-teal-600 group-hover/item:text-white">
                            <Icon name={item.icon} className="h-5 w-5" />
                          </span>
                          <span>
                            <span className="flex items-center gap-1.5 font-heading text-[15px] font-bold text-navy-900">
                              {item.title}
                              <ArrowRight className="h-3.5 w-3.5 text-teal-600 opacity-0 transition-all group-hover/item:translate-x-0.5 group-hover/item:opacity-100" />
                            </span>
                            <span className="mt-0.5 block text-[13px] leading-snug text-slate-500">
                              {item.desc}
                            </span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group relative rounded-md px-3.5 py-2 text-[15px] font-semibold text-navy-800 transition-colors hover:text-teal-700"
              >
                {item.label}
                <span className="absolute inset-x-3.5 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded bg-teal-600 transition-transform duration-300 group-hover:scale-x-100" />
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <Link href="/assessment" className="btn-ghost px-4 py-2.5">
              Free Assessment
            </Link>
            <Link href="/contact" className="btn-primary px-5 py-2.5">
              Book a Consultation
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <button
            aria-label="Toggle menu"
            className="relative z-50 grid h-10 w-10 place-items-center rounded-lg text-navy-900 lg:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Menu</span>
            <div className="flex w-6 flex-col gap-1.5">
              <span className={`h-0.5 w-full rounded bg-current transition-all duration-300 ${open ? "translate-y-2 rotate-45" : ""}`} />
              <span className={`h-0.5 w-full rounded bg-current transition-all duration-300 ${open ? "opacity-0" : ""}`} />
              <span className={`h-0.5 w-full rounded bg-current transition-all duration-300 ${open ? "-translate-y-2 -rotate-45" : ""}`} />
            </div>
          </button>
        </nav>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-slate-200 bg-white px-5 pb-8 pt-3 shadow-lg lg:hidden"
          >
            <p className="px-1 pb-1 pt-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Solutions
            </p>
            {SOLUTIONS_MENU.map((item, i) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * i }}
              >
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 rounded-lg px-1 py-3"
                >
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-navy-900 text-teal-400">
                    <Icon name={item.icon} className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-heading text-[15px] font-bold text-navy-900">
                      {item.title}
                    </span>
                    <span className="block text-[13px] text-slate-500">{item.desc}</span>
                  </span>
                </Link>
              </motion.div>
            ))}

            <p className="px-1 pb-1 pt-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Company
            </p>
            <div className="flex flex-col">
              {NAV.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * (i + SOLUTIONS_MENU.length) }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block border-b border-slate-100 py-3.5 text-base font-semibold text-navy-900"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </div>

            <a
              href={`tel:${SITE.phone.replace(/[^+\d]/g, "")}`}
              className="mt-5 flex items-center justify-center gap-2 text-lg font-bold text-navy-900"
            >
              <Phone className="h-5 w-5 text-teal-600" />
              {SITE.phone}
            </a>
            <div className="mt-4 flex flex-col gap-3">
              <Link href="/assessment" onClick={() => setOpen(false)} className="btn-outline w-full">
                Free Assessment
              </Link>
              <Link href="/contact" onClick={() => setOpen(false)} className="btn-primary w-full">
                Book a Consultation
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
