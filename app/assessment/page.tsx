import type { Metadata } from "next";
import { Assessment } from "@/components/Assessment";
import { Reveal } from "@/components/motion";
import { ShieldCheck } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Free ISO Readiness Assessment",
  description:
    "Find out how audit-ready your quality system is in minutes. A free, interactive ISO readiness assessment for Canadian manufacturers — no signup required.",
  alternates: { canonical: "/assessment" },
};

export default function AssessmentPage() {
  return (
    <section className="relative overflow-hidden bg-blueprint pb-24 pt-32 lg:pt-40">
      <div className="container-page">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-teal-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Free · No signup
            </span>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mt-5 font-heading text-4xl font-bold leading-[1.1] text-navy-900 sm:text-5xl">
              How <span className="text-teal-700">audit-ready</span> are you?
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              Answer eight quick questions about your quality system and get an instant
              readiness snapshot — plus a clear next step toward certification.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <Assessment />
        </Reveal>
      </div>
    </section>
  );
}
