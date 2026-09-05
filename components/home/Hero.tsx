"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, ShieldCheck, Phone } from "../Icons";
import { SITE } from "@/lib/site";

const easeOut = [0.22, 1, 0.36, 1] as const;
const container = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } };
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
};

const HERO_STANDARDS = ["ISO 9001", "IATF 16949", "AS9100", "ISO 13485", "ISO 14001", "ISO 45001", "ISO 27001"];

export function Hero() {
  const reduce = useReducedMotion();
  return (
    <section className="relative overflow-hidden bg-blueprint pt-28 lg:pt-36">
      <HeroBackground reduce={!!reduce} />

      <div className="container-page relative pb-16 lg:pb-20">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Left — message */}
          <motion.div variants={container} initial="hidden" animate="show">
            <motion.div variants={item}>
              <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-teal-700">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-500 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-600" />
                </span>
                ISO Certification Consulting · Canada
              </span>
            </motion.div>

            <h1 className="mt-5 font-heading text-4xl font-bold leading-[1.07] text-navy-900 sm:text-5xl lg:text-[3.4rem]">
              <AnimatedHeadline />
            </h1>

            <motion.p variants={item} className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              A quality management system built around your real processes — inspection,
              inventory, training, production — backed by certified consultants who guide
              you from first gap analysis to a passed certification audit. Any standard,
              one team.
            </motion.p>

            <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/contact" className="btn-primary group">
                Book a free consultation
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/process" className="btn-outline">
                View our consulting approach
              </Link>
            </motion.div>

            <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3">
              {["Serving Ontario & all of Canada", "10+ standards", "Consultant-led, every step"].map(
                (f) => (
                  <span key={f} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Check className="h-4 w-4 text-teal-600" />
                    {f}
                  </span>
                )
              )}
            </motion.div>

            <motion.div variants={item} className="mt-6 flex items-center gap-2 text-sm text-slate-500">
              <Phone className="h-4 w-4 text-teal-600" />
              Prefer to talk?{" "}
              <a href={`tel:${SITE.phone.replace(/[^+\d]/g, "")}`} className="font-bold text-navy-900 hover:text-teal-700">
                {SITE.phone}
              </a>
            </motion.div>
          </motion.div>

          {/* Right — animated industry image wall */}
          <IndustryImageWall />
        </div>
      </div>

      {/* animated trust strip */}
      <div className="relative border-t border-slate-200 bg-white/80 backdrop-blur">
        <div className="container-page py-8">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-5 text-center text-xs font-bold uppercase tracking-[0.14em] text-slate-500"
          >
            We prepare manufacturers for the standards their customers require
          </motion.p>
          <motion.div
            variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            {HERO_STANDARDS.map((code) => (
              <motion.span
                key={code}
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-navy-800 shadow-sm transition-colors hover:border-teal-300 hover:text-teal-700"
              >
                {code}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ---- headline with a highlighted, underline-drawing accent ---- */
function AnimatedHeadline() {
  return (
    <motion.span
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.16, delayChildren: 0.1 } } }}
      initial="hidden"
      animate="show"
      className="inline"
    >
      {["Get ISO certified without", "disrupting how your"].map((line, i) => (
        <motion.span
          key={i}
          variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } } }}
          className="block"
        >
          {line}
        </motion.span>
      ))}
      <motion.span
        variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } } }}
        className="relative inline-block text-teal-700"
      >
        business runs.
        <motion.svg
          className="absolute -bottom-1.5 left-0 w-full"
          height="10"
          viewBox="0 0 200 10"
          preserveAspectRatio="none"
          fill="none"
        >
          <motion.path
            d="M2 7 Q 50 2 100 6 T 198 5"
            stroke="#D97706"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, ease: easeOut, delay: 0.9 }}
          />
        </motion.svg>
      </motion.span>
    </motion.span>
  );
}

/* ---- layered animated background (subtle, industrial, professional) ---- */
function HeroBackground({ reduce }: { reduce: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-teal-50/70 to-transparent" />
      {!reduce && (
        <>
          <motion.div
            className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-teal-200/30 blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute right-0 top-32 h-80 w-80 rounded-full bg-gold-200/25 blur-3xl"
            animate={{ x: [0, -30, 0], y: [0, 24, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}
    </div>
  );
}

const HERO_IMAGES = [
  {
    src: "/images/hero/qms-fabrication-diverse.png",
    alt: "North American fabrication team implementing a quality management system on a plant floor",
    label: "Fabrication",
    standard: "ISO 9001",
  },
  {
    src: "/images/hero/qms-automotive-diverse.png",
    alt: "Automotive manufacturing team reviewing IATF inspection controls beside an assembly cell",
    label: "Automotive",
    standard: "IATF 16949",
  },
  {
    src: "/images/hero/qms-medical-device-diverse.png",
    alt: "Medical device manufacturing team reviewing ISO 13485 records at an inspection bench",
    label: "Medical devices",
    standard: "ISO 13485",
  },
  {
    src: "/images/hero/qms-aerospace-machining.png",
    alt: "Aerospace precision machining team reviewing AS9100 inspection evidence",
    label: "Aerospace",
    standard: "AS9100",
  },
  {
    src: "/images/hero/qms-food-beverage.png",
    alt: "Food and beverage manufacturing team reviewing quality records near a packaging line",
    label: "Food & beverage",
    standard: "ISO 22000",
  },
  {
    src: "/images/hero/qms-electronics-controls.png",
    alt: "Electronics manufacturing team reviewing quality controls at an assembly bench",
    label: "Electronics",
    standard: "ISO 9001",
  },
  {
    src: "/images/hero/qms-warehouse-traceability.png",
    alt: "Warehouse receiving team reviewing traceability records for QMS implementation",
    label: "Traceability",
    standard: "ISO 9001",
  },
  {
    src: "/images/hero/qms-training-huddle.png",
    alt: "Plant floor team in a QMS implementation training huddle",
    label: "Training",
    standard: "Implementation",
  },
];

function IndustryImageWall() {
  const reduce = useReducedMotion();
  const topRow = HERO_IMAGES.slice(0, 4);
  const bottomRow = HERO_IMAGES.slice(4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: easeOut, delay: 0.2 }}
      className="relative -mr-5 overflow-hidden py-4 sm:-mr-6 lg:-mr-8"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-white via-white/90 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-white via-white/70 to-transparent" />

      <motion.div
        className="absolute -right-6 top-0 h-28 w-28 rounded-full border-2 border-teal-200/70"
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        aria-hidden
      />

      <div className="space-y-4">
        <ScrollingImageRow images={topRow} reverse={false} reduce={!!reduce} />
        <ScrollingImageRow images={bottomRow} reverse reduce={!!reduce} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="relative z-20 mx-4 mt-5 inline-flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_18px_40px_-16px_rgba(22,43,77,0.5)] sm:mx-8"
      >
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-600 text-white">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs text-slate-500">Real plant-floor implementation</p>
          <p className="text-sm font-bold text-navy-900">across regulated manufacturing</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ScrollingImageRow({
  images,
  reverse,
  reduce,
}: {
  images: typeof HERO_IMAGES;
  reverse: boolean;
  reduce: boolean;
}) {
  const items = [...images, ...images];

  return (
    <div className="mask-fade-x overflow-hidden">
      <div
        className={`flex w-max gap-4 ${reduce ? "" : reverse ? "hero-marquee hero-marquee-reverse" : "hero-marquee"}`}
      >
        {items.map((img, index) => (
          <HeroImageCard
            key={`${img.src}-${index}`}
            img={img}
            priority={!reverse && index === 0}
          />
        ))}
      </div>
    </div>
  );
}

function HeroImageCard({
  img,
  priority,
}: {
  img: (typeof HERO_IMAGES)[number];
  priority?: boolean;
}) {
  return (
    <article
      className="relative h-44 w-[280px] shrink-0 overflow-hidden rounded-xl border border-white bg-white shadow-[0_18px_46px_-24px_rgba(22,43,77,0.55)] sm:h-56 sm:w-[360px] lg:h-60 lg:w-[390px]"
    >
      <Image
        src={img.src}
        alt={img.alt}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 390px, (min-width: 640px) 360px, 280px"
        quality={100}
        unoptimized
        className="object-cover"
      />
      <IndustryTag img={img} />
    </article>
  );
}

function IndustryTag({ img }: { img: { label: string; standard: string } }) {
  return (
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950/75 to-transparent px-3 pb-3 pt-12">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-teal-100">{img.label}</p>
      <p className="font-heading text-sm font-bold text-white">{img.standard}</p>
    </div>
  );
}
