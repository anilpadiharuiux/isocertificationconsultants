import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";
import { Reveal } from "@/components/motion";
import { ShieldCheck, Check } from "@/components/Icons";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact ISO Certification Consultant",
  description:
    "Talk to a certified ISO consultant about your certification project. Serving manufacturers across Canada and the USA. We reply within one business day.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <section className="relative overflow-hidden bg-blueprint pb-20 pt-32 lg:pt-40">
      <div className="container-page grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="lg:pt-6">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-teal-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Talk to an expert
            </span>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mt-5 font-heading text-4xl font-bold leading-[1.1] text-navy-900 sm:text-5xl">
              Let&apos;s scope your <span className="text-teal-700">certification</span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-slate-600">
              Tell us about your operation and what you&apos;re certifying for. A
              certified lead consultant will get back to you within one business day —
              no obligation.
            </p>
          </Reveal>

          <Reveal delay={0.15} className="mt-8 space-y-4">
            {[
              "A clear, honest read on scope and timeline",
              "The right standard — or combination — for your goals",
              "A free readiness assessment to start from",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <p className="text-sm text-slate-700">{item}</p>
              </div>
            ))}
          </Reveal>

          <Reveal delay={0.2} className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-40px_rgba(22,43,77,0.5)]">
            <p className="text-sm text-slate-600">Prefer email?</p>
            <a
              href={`mailto:${SITE.email}`}
              className="font-heading text-lg font-bold text-navy-900 hover:text-teal-700"
            >
              {SITE.email}
            </a>
            <p className="mt-3 text-sm text-slate-600">
              Serving manufacturers across {SITE.region} and the USA.
            </p>
            <Link href="/assessment" className="mt-4 inline-block text-sm font-semibold text-teal-700 hover:text-teal-800">
              Or run the free readiness assessment →
            </Link>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <ContactForm />
        </Reveal>
      </div>
    </section>
  );
}
