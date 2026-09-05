import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, SectionHeading, GapCreditBanner, ModuleCard, CTASection } from "@/components/ui";
import { AnimatedTitle, HeaderIconsFX } from "@/components/HeaderFX";
import { EngagementFlow } from "@/components/EngagementFlow";
import { ROIPanel } from "@/components/ROIPanel";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { Icon, ArrowRight, Check } from "@/components/Icons";
import { CUSTOM_EXAMPLES, EXPERTS, MODULES } from "@/lib/site";

export const metadata: Metadata = {
  title: "Custom QMS Solutions — Built Around Your Challenge",
  description:
    "When an off-the-shelf module isn't enough, our industry experts and engineers build one. Onsite assessment, gap analysis and a custom solution tailored to your processes — with the assessment fee credited toward your solution. Fabrication, manufacturing, food, aerospace and more.",
  alternates: { canonical: "/custom-solutions" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Custom quality management system solutions",
  name: "Custom QMS Solutions",
  description:
    "Custom-built quality management solutions designed around a manufacturer's specific challenge, following an onsite assessment and gap analysis by industry experts and engineers.",
  provider: { "@type": "Organization", name: "ISO Certification Consultant Inc." },
  areaServed: { "@type": "Country", name: "Canada" },
};

export default function CustomSolutionsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <PageHeader
        eyebrow="Custom solutions"
        title={
          <AnimatedTitle
            text="Your challenge is specific. Your solution should be too."
            accent="Your solution should be too."
          />
        }
        intro="No two businesses run the same way, and no template survives first contact with a real audit. Our industry experts and engineers assess your operation onsite, find the gaps, and build a solution — new or adapted — around exactly how you work."
        fx={<HeaderIconsFX icons={["design", "audit", "loop", "rollout", "expert", "assessment"]} />}
      >
        <Link href="/contact" className="btn-primary">
          Book an onsite assessment <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/solutions" className="btn-outline">
          Browse standard modules
        </Link>
      </PageHeader>

      {/* THE MODEL */}
      <section className="bg-white py-16 lg:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="How custom solutions are built"
            title="From onsite assessment to a solution that fits your floor"
            intro="A clear, four-step engagement. You always know what happens next — and what it costs — before any solution is built."
            align="center"
          />
          <EngagementFlow />
        </div>
      </section>

      {/* GAP CREDIT */}
      <section className="bg-soft pb-8 pt-16 lg:pt-20">
        <div className="container-page">
          <GapCreditBanner />
        </div>
      </section>

      {/* ROI */}
      <section className="bg-soft pb-16 pt-8 lg:pb-20">
        <div className="container-page">
          <ROIPanel showEstimatorLink />
        </div>
      </section>

      {/* EXPERTS */}
      <section className="bg-white py-16 lg:py-24">
        <div className="container-page grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <SectionHeading eyebrow="Who builds it" title={EXPERTS.title} intro={EXPERTS.detail} />
          </Reveal>
          <Stagger className="grid gap-4">
            {EXPERTS.points.map((pt) => (
              <StaggerItem key={pt}>
                <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-teal-600 text-white">
                    <Check className="h-5 w-5" />
                  </span>
                  <p className="font-medium text-navy-900">{pt}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* INDUSTRY EXAMPLES */}
      <section className="bg-soft py-16 lg:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="Examples by industry"
            title="Real challenges, custom-built solutions"
            intro="Representative examples of how a custom solution comes together. Your situation will differ — that's the point."
          />
          <div className="mt-12 space-y-6">
            {CUSTOM_EXAMPLES.map((ex, i) => (
              <Reveal key={ex.industry} delay={i * 0.05}>
                <div className="card grid gap-6 p-6 lg:grid-cols-[auto_1fr_1fr] lg:items-center lg:gap-8 lg:p-8">
                  <div className="flex items-center gap-4 lg:flex-col lg:items-start lg:gap-3">
                    <span className="grid h-14 w-14 place-items-center rounded-xl bg-navy-900 text-teal-400">
                      <Icon name={ex.icon} className="h-7 w-7" />
                    </span>
                    <h3 className="font-heading text-xl font-bold text-navy-900">{ex.industry}</h3>
                  </div>
                  <div className="lg:border-l lg:border-slate-200 lg:pl-8">
                    <p className="text-xs font-bold uppercase tracking-wider text-gold-700">The challenge</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{ex.challenge}</p>
                  </div>
                  <div className="lg:border-l lg:border-slate-200 lg:pl-8">
                    <p className="text-xs font-bold uppercase tracking-wider text-teal-700">What we built</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{ex.solution}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {ex.tags.map((t) => (
                        <span key={t} className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1} className="mt-10 text-center">
            <p className="text-slate-600">Don&apos;t see your situation? It&apos;s probably one we&apos;ve solved before.</p>
            <Link href="/contact" className="btn-primary mt-4">
              Tell us your challenge <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* BY PROCESS */}
      <section className="bg-white py-16 lg:py-24">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow="Examples by process"
              title="Customized around the processes you run"
              intro="Every module below starts as a foundation and is tailored to your forms, checks and routing. Explore the process closest to your challenge."
            />
            <Reveal delay={0.1}>
              <Link href="/solutions" className="btn-outline">
                All platform modules <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>
          </div>
          <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.slice(0, 6).map((m) => (
              <StaggerItem key={m.slug}>
                <ModuleCard m={m} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <CTASection
        title="Start with an onsite assessment — the fee comes off your solution"
        intro="Tell us the challenge you're facing. We'll come see your operation, map the gaps, and show you exactly what it takes to fix them — with the assessment credited toward whatever we build."
      />
    </>
  );
}
