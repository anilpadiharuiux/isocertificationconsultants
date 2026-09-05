import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { ProcessTimeline } from "@/components/home/ProcessTimeline";
import { EngagementFlow } from "@/components/EngagementFlow";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { SectionHeading, StandardCard, IndustryCard, ModuleCard, AnyStandardCard, CTASection } from "@/components/ui";
import { ROIPanel } from "@/components/ROIPanel";
import { Icon, ArrowRight, Check } from "@/components/Icons";
import { STANDARDS, INDUSTRIES, MODULES, DIFFERENTIATORS } from "@/lib/site";

const WHY = [
  {
    icon: "production",
    title: "We know how your business runs",
    detail:
      "Automotive core tools, aerospace traceability, food safety, device design controls — practical advice grounded in how manufacturing actually works, not generic business consulting.",
  },
  {
    icon: "document",
    title: "Built around your processes",
    detail:
      "Your inspection, inventory, training and production processes stay yours. We shape the quality system around them — not a rigid template you have to bend to fit.",
  },
  {
    icon: "expert",
    title: "A consultant beside you",
    detail:
      "One certified lead consultant guides the work from gap analysis through the certification audit. You are never handed a binder and left to figure it out.",
  },
  {
    icon: "assessment",
    title: "Any standard, one team",
    detail:
      "ISO, IATF, AS or a customer-specific requirement — we onboard whatever you're audited against, so a multi-standard rollout never means juggling multiple firms.",
  },
];

export default function Home() {
  return (
    <>
      <Hero />

      {/* WHY / TRUST */}
      <section className="bg-white py-16 lg:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="Why manufacturers choose us"
            title="Straightforward help from people who understand your operation"
            intro="ISO certification has a reputation for being expensive, confusing and disruptive. It doesn't have to be. Here's how we make it manageable."
          />
          <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((w) => (
              <StaggerItem key={w.title}>
                <div className="card h-full p-6">
                  <span className="grid h-12 w-12 place-items-center rounded-lg bg-navy-900 text-teal-400">
                    <Icon name={w.icon} className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 font-heading text-lg font-bold text-navy-900">{w.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{w.detail}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* SOLUTIONS / MODULES */}
      <section className="bg-soft py-16 lg:py-24">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow="Customized to your processes"
              title="A quality system shaped around your business"
              intro="Every process module is configured to the forms, checks and routing your team already uses — the part of a QMS that decides whether it survives the first audit."
            />
            <Reveal delay={0.1}>
              <Link href="/solutions" className="btn-outline">
                View all platform modules <ArrowRight className="h-4 w-4" />
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

      {/* CUSTOMIZATION */}
      <section className="bg-white py-16 lg:py-24">
        <div className="container-page">
          <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-end">
            <SectionHeading
              eyebrow="Customized to your challenge"
              title="When an off-the-shelf module isn't enough, we build one"
              intro="Your challenge is specific — a customer audit you keep failing, a process that lives on paper, a standard your current system can't reach. Our industry experts and engineers assess your operation onsite, then build a new solution or adapt an existing one to fit exactly how you work."
            />
            <Reveal delay={0.1}>
              <div className="rounded-xl border border-slate-200 bg-soft p-5">
                <p className="text-sm leading-relaxed text-slate-600">
                  Not sure which module fits? You don&apos;t have to guess. We start with an
                  onsite gap assessment, then design the solution around what we find — and
                  the assessment fee is credited toward it.
                </p>
                <Link href="/custom-solutions" className="link-arrow mt-3">
                  Explore custom solutions <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
          </div>

          <EngagementFlow />

          <div className="mt-14">
            <ROIPanel showEstimatorLink />
          </div>

          <Reveal delay={0.1} className="mt-10 text-center">
            <Link href="/custom-solutions" className="btn-navy">
              See how customization works <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* PROCESS */}
      <section className="bg-soft py-16 lg:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="How it works"
            title="A clear, six-step path to certification"
            intro="No open-ended retainer and no mystery. You always know which stage you're in and what happens next — the roadmap fills in as your project moves forward."
            align="center"
          />
          <ProcessTimeline />
          <Reveal delay={0.1} className="mt-12 text-center">
            <Link href="/process" className="btn-navy">
              Walk through the full process <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* STANDARDS */}
      <section className="bg-white py-16 lg:py-24">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow="Standards we help with"
              title="From ISO 9001 to any standard your customers require"
              intro="These are the standards manufacturers ask for most. If you're audited against something else, we can onboard it too."
            />
            <Reveal delay={0.1}>
              <Link href="/services" className="btn-outline">
                All standards <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>
          </div>
          <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {STANDARDS.slice(0, 5).map((s) => (
              <StaggerItem key={s.slug}>
                <StandardCard s={s} />
              </StaggerItem>
            ))}
            <StaggerItem>
              <AnyStandardCard />
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section className="bg-soft py-16 lg:py-24">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow="Industries we serve"
              title="Depth in the sectors we work with"
              intro="Not generic business consulting — real familiarity with the requirements and customer demands of your industry."
            />
            <Reveal delay={0.1}>
              <Link href="/industries" className="btn-outline">
                All industries <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>
          </div>
          <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {INDUSTRIES.map((i) => (
              <StaggerItem key={i.slug}>
                <IndustryCard i={i} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* REASSURANCE BAND */}
      <section className="border-y border-slate-200 bg-white py-16 lg:py-20">
        <div className="container-page">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <Reveal>
              <span className="label">
                <span className="h-px w-7 bg-teal-600" />
                What you can count on
              </span>
              <h2 className="mt-4 font-heading text-3xl font-bold leading-tight text-navy-900 sm:text-4xl">
                A partner that makes certification feel manageable
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-600">
                We combine a practical platform with hands-on consultants, so the work
                gets done and stays defensible — from your first process map to a passed
                audit and beyond.
              </p>
              <Link href="/about" className="link-arrow mt-6">
                More about how we work <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>
            <Stagger className="grid gap-4 sm:grid-cols-2">
              {DIFFERENTIATORS.map((d) => (
                <StaggerItem key={d.title}>
                  <div className="flex h-full gap-3 rounded-xl border border-slate-200 bg-white p-5">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-teal-600 text-white">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <h3 className="font-heading text-base font-bold text-navy-900">{d.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{d.detail}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
