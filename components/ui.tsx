import Link from "next/link";
import { Reveal } from "./motion";
import { ArrowRight, Icon, Check } from "./Icons";
import { BannerDecor } from "./BannerDecor";
import type { Standard, Industry, Module } from "@/lib/site";
import { ANY_STANDARD, GAP_CREDIT } from "@/lib/site";

/** Small tracked label with a leading rule. */
export function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="label">
      <span className="h-px w-7 bg-teal-600" />
      {children}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  intro,
  children,
  fx,
}: {
  eyebrow: string;
  title: React.ReactNode;
  intro: string;
  children?: React.ReactNode;
  fx?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-blueprint pb-14 pt-32 lg:pb-20 lg:pt-40">
      <BannerDecor />
      {fx}
      <div className="container-page relative">
        <div className="max-w-3xl">
          <Reveal>
            <Label>{eyebrow}</Label>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mt-5 font-heading text-4xl font-bold leading-[1.08] text-navy-900 sm:text-5xl">
              {title}
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">{intro}</p>
          </Reveal>
          {children && (
            <Reveal delay={0.15}>
              <div className="mt-8 flex flex-wrap gap-4">{children}</div>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
}: {
  eyebrow: string;
  title: React.ReactNode;
  intro?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <Reveal>
        <div className={align === "center" ? "flex justify-center" : ""}>
          <Label>{eyebrow}</Label>
        </div>
      </Reveal>
      <Reveal delay={0.05}>
        <h2 className="mt-4 font-heading text-3xl font-bold leading-tight text-navy-900 sm:text-4xl">
          {title}
        </h2>
      </Reveal>
      {intro && (
        <Reveal delay={0.1}>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">{intro}</p>
        </Reveal>
      )}
    </div>
  );
}

export function StandardCard({ s }: { s: Standard }) {
  return (
    <Link href={`/services/${s.slug}`} className="card card-hover group flex h-full flex-col p-6">
      <div className="flex items-center justify-between">
        <span className="rounded-md bg-navy-50 px-2.5 py-1 font-heading text-sm font-bold text-navy-900">
          {s.code}
        </span>
        <span className="text-xs font-bold uppercase tracking-wide text-teal-700">{s.category}</span>
      </div>
      <h3 className="mt-4 font-heading text-lg font-bold text-navy-900">{s.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{s.summary}</p>
      <span className="link-arrow mt-5">
        Explore {s.code}
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

export function ModuleCard({ m }: { m: Module }) {
  return (
    <Link href={`/solutions/${m.slug}`} className="card card-hover group flex h-full flex-col p-6">
      <span className="grid h-12 w-12 place-items-center rounded-lg bg-teal-50 text-teal-700 ring-1 ring-teal-100 transition-colors duration-300 group-hover:bg-teal-600 group-hover:text-white">
        <Icon name={m.icon} className="h-6 w-6" />
      </span>
      <h3 className="mt-5 font-heading text-lg font-bold text-navy-900">{m.name}</h3>
      <p className="mt-1 text-sm font-semibold text-teal-700">{m.tagline}</p>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{m.summary}</p>
      <span className="link-arrow mt-5">
        Learn more
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

export function AnyStandardCard() {
  return (
    <Link
      href="/contact"
      className="group flex h-full flex-col justify-between rounded-xl border-2 border-dashed border-teal-300 bg-teal-50/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-teal-500 hover:bg-teal-50"
    >
      <div>
        <span className="rounded-md bg-white px-2.5 py-1 font-heading text-sm font-bold text-teal-700 shadow-sm">
          Any standard
        </span>
        <h3 className="mt-4 font-heading text-lg font-bold text-navy-900">{ANY_STANDARD.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{ANY_STANDARD.detail}</p>
      </div>
      <span className="link-arrow mt-5">
        Ask about your standard
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

export function IndustryCard({ i }: { i: Industry }) {
  return (
    <Link href={`/industries/${i.slug}`} className="card card-hover group flex h-full flex-col p-6">
      <h3 className="font-heading text-xl font-bold text-navy-900">{i.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{i.blurb}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {i.standards.map((code) => (
          <span key={code} className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
            {code}
          </span>
        ))}
      </div>
      <span className="link-arrow mt-5">
        View industry
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

export function GapCreditBanner() {
  return (
    <Reveal>
      <div className="relative overflow-hidden rounded-2xl border border-gold-200 bg-gradient-to-br from-gold-50 to-white p-8 shadow-[0_20px_50px_-30px_rgba(217,119,6,0.5)] lg:p-10">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold-200/40 blur-3xl" />
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gold-600 text-white shadow-lg">
            <Icon name="certificate" className="h-8 w-8" />
          </span>
          <div className="flex-1">
            <span className="label text-gold-700">
              <span className="h-px w-7 bg-gold-600" />
              No-risk start
            </span>
            <h3 className="mt-2 font-heading text-2xl font-bold text-navy-900">{GAP_CREDIT.title}</h3>
            <p className="mt-2 max-w-2xl text-slate-600">{GAP_CREDIT.detail}</p>
          </div>
          <Link href="/contact" className="btn-primary shrink-0">
            Book an onsite assessment
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </Reveal>
  );
}

export function CTASection({
  title = "Talk to an ISO consultant — no pressure, no obligation",
  intro = "Tell us about your operation and what you're certifying for. You'll get a clear, honest read on scope and timeline from a certified lead consultant.",
}: {
  title?: string;
  intro?: string;
}) {
  return (
    <section className="bg-navy-panel py-16 lg:py-20">
      <div className="container-page">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">{title}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-300">{intro}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/contact" className="btn-primary">
                Book a free consultation
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/assessment" className="btn border-2 border-white/30 bg-transparent text-white hover:bg-white/10">
                Take the free assessment
              </Link>
            </div>
            <p className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400">
              <Check className="h-4 w-4 text-teal-400" />
              We reply within one business day
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
