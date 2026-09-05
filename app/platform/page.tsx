import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, SectionHeading, CTASection } from "@/components/ui";
import { Stagger, StaggerItem, Reveal } from "@/components/motion";
import { Icon, ArrowRight, Check } from "@/components/Icons";
import { PLATFORM, DIFFERENTIATORS } from "@/lib/site";

export const metadata: Metadata = {
  title: "The QMS Platform — AI-Powered Quality Management",
  description:
    "An enterprise quality management platform with AI document generation, readiness assessment, an audit hub and a live compliance dashboard — reviewed by certified consultants.",
  alternates: { canonical: "/platform" },
};

const STEPS = [
  {
    title: "Assess",
    detail: "Score your operation against any standard in minutes and get a prioritized gap report.",
  },
  {
    title: "Build",
    detail: "Generate lean, industry-specific documentation and model your processes in the platform.",
  },
  {
    title: "Operate",
    detail: "Run audits, track corrective actions and capture evidence as the system goes live.",
  },
  {
    title: "Certify",
    detail: "Walk into Stage 1 and Stage 2 audits with a consultant beside you and a clean trail behind you.",
  },
];

export default function PlatformPage() {
  return (
    <>
      <PageHeader
        eyebrow="The platform"
        title={<>The base platform, <span className="text-teal-700">configured to you</span></>}
        intro="Every quality system needs the same foundations — assessment, documentation, audits, reporting. The platform ships with all of it, then our consultants configure the process modules around how your business actually runs, mapped to any standard you certify against."
      >
        <Link href="/solutions" className="btn-primary">
          See the process modules <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/contact" className="btn-ghost">
          Request a walkthrough
        </Link>
      </PageHeader>

      {/* how it works */}
      <section className="bg-white py-16 lg:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="How it works"
            title="From gap analysis to certified — one continuous system"
            align="center"
          />
          <div className="relative mt-14">
            <div className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-teal-300 to-transparent lg:block" />
            <Stagger className="grid gap-6 lg:grid-cols-4">
              {STEPS.map((s, i) => (
                <StaggerItem key={s.title}>
                  <div className="card relative p-6 text-center">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-teal-50 text-teal-700 ring-1 ring-teal-100 font-heading font-bold">
                      {i + 1}
                    </span>
                    <h3 className="mt-4 font-heading text-lg font-bold text-navy-900">{s.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{s.detail}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </section>

      {/* features */}
      <section className="bg-soft py-16 lg:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="Capabilities"
            title="What lives inside the platform"
            intro="Six modules that carry a certification project from the first assessment to ongoing surveillance-audit readiness."
          />
          <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORM.map((f) => (
              <StaggerItem key={f.title}>
                <div className="card card-hover group h-full p-7">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100 transition-colors duration-500 group-hover:bg-teal-600 group-hover:text-white">
                    <Icon name={f.icon} className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 font-heading text-lg font-bold text-navy-900">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.detail}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* hybrid */}
      <section className="bg-white py-16 lg:py-24">
        <div className="container-page grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading
              eyebrow="The hybrid difference"
              title="Software alone will not pass your audit"
              intro="Platforms hand you templates and walk away. Consultants hand you a binder no one maintains. We put both on the same system so the work is done and defensible."
            />
          </div>
          <Stagger className="grid gap-4 sm:grid-cols-2">
            {DIFFERENTIATORS.map((d) => (
              <StaggerItem key={d.title}>
                <div className="card h-full p-6">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                    <Check className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-heading text-base font-bold text-navy-900">{d.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{d.detail}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <CTASection />
    </>
  );
}
