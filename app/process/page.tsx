import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, CTASection } from "@/components/ui";
import { Reveal } from "@/components/motion";
import { ArrowRight, Check } from "@/components/Icons";
import { PROCESS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Our 6-Stage ISO Certification Process",
  description:
    "A transparent, six-stage path from gap analysis to certification — typically 24 weeks. See exactly how the platform and consultants get Canadian manufacturers audit-ready.",
  alternates: { canonical: "/process" },
};

export default function ProcessPage() {
  return (
    <>
      <PageHeader
        eyebrow="The process"
        title={<>Six stages to <span className="text-teal-700">certified</span></>}
        intro="No mystery, no open-ended retainer. A transparent path from your first assessment to a passed certification audit — typically around 24 weeks."
      >
        <Link href="/assessment" className="btn-primary">
          Start with a free assessment <ArrowRight className="h-4 w-4" />
        </Link>
      </PageHeader>

      <section className="bg-white py-16 lg:py-24">
        <div className="container-page">
          <div className="relative mx-auto max-w-3xl">
            {/* vertical line */}
            <div className="absolute left-[27px] top-2 bottom-2 w-px bg-gradient-to-b from-teal-300 via-slate-200 to-transparent" />
            <ol className="space-y-8">
              {PROCESS.map((p, i) => (
                <Reveal as="li" key={p.n} delay={i * 0.05} className="relative pl-20">
                  <span className="absolute left-0 top-0 grid h-14 w-14 place-items-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                    <span className="font-heading text-lg font-bold">{p.n}</span>
                  </span>
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-40px_rgba(22,43,77,0.5)]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="font-heading text-xl font-bold text-navy-900">{p.title}</h2>
                      <span className="rounded-full bg-teal-50 px-3 py-1 text-[11px] font-semibold text-teal-700 ring-1 ring-teal-100">
                        {p.duration}
                      </span>
                    </div>
                    <p className="mt-3 leading-relaxed text-slate-600">{p.detail}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>

          <Reveal className="mx-auto mt-16 max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_-40px_rgba(22,43,77,0.5)]">
            <h2 className="font-heading text-xl font-bold text-navy-900">
              What you can expect throughout
            </h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                "A single point of contact — your lead consultant",
                "The platform tracking every action and owner",
                "Lean documentation your team will actually use",
                "No surprises before Stage 1 or Stage 2 audits",
                "Training and competency records built in",
                "Surveillance-audit readiness after certification",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                    <Check className="h-3 w-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <CTASection />
    </>
  );
}
