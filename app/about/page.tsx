import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, SectionHeading, CTASection } from "@/components/ui";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { Counter } from "@/components/Counter";
import { ArrowRight, Check } from "@/components/Icons";
import { STATS, DIFFERENTIATORS } from "@/lib/site";

export const metadata: Metadata = {
  title: "About ISO Certification Consultant",
  description:
    "ISO Certification Consultant Inc. combines an AI-powered QMS platform with certified consultants to get Canadian manufacturers certified faster and more affordably.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  {
    title: "Manufacturing-native",
    detail:
      "We speak the language of your operation — cycle times, PPAP submissions, FOD control, HACCP. Our advice reflects how production actually runs.",
  },
  {
    title: "Documentation people use",
    detail:
      "A binder no one opens is worthless. We build lean systems that live in the platform and in daily work, not on a shelf.",
  },
  {
    title: "Honest about scope",
    detail:
      "We are consultants who prepare you for certification — not a certification body. We tell you plainly what it will take and how long.",
  },
  {
    title: "Canadian by focus",
    detail:
      "CFIA, Health Canada, provincial requirements — we know the regulatory landscape our clients operate in, with delivery across the country.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About us"
        title={<>Certification, <span className="text-teal-700">without the mystery</span></>}
        intro="ISO Certification Consultant Inc. pairs an enterprise QMS platform with certified consultants — a hybrid model that makes certification faster, more affordable and far less painful for Canadian manufacturers."
      >
        <Link href="/contact" className="btn-primary">
          Work with us <ArrowRight className="h-4 w-4" />
        </Link>
      </PageHeader>

      {/* mission */}
      <section className="bg-white py-16 lg:py-24">
        <div className="container-page grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-teal-700">Our mission</span>
            <h2 className="mt-5 font-heading text-3xl font-bold leading-tight text-navy-900">
              Make ISO certification accessible to every manufacturer
            </h2>
            <div className="mt-5 space-y-4 text-slate-600">
              <p>
                For most shops under 50 employees, ISO certification has meant expensive
                consultants, months of confusion and a documentation set no one
                maintains. It should not be that way.
              </p>
              <p>
                We built a platform that does the mechanical work — assessment,
                documentation, audit tracking — and paired it with certified
                consultants who make sure the system is right and stand with you through
                the audit. Broad standard coverage, real industry depth, one team.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="grid grid-cols-2 gap-5">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-[0_20px_60px_-40px_rgba(22,43,77,0.5)]"
                >
                  <p className="font-heading text-3xl font-bold text-navy-900">
                    <Counter value={s.value} suffix={s.suffix} />
                  </p>
                  <p className="mt-2 text-xs text-slate-600">{s.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* values */}
      <section className="bg-soft py-16 lg:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="What we stand for"
            title="Principles that shape every engagement"
            align="center"
          />
          <Stagger className="mt-14 grid gap-6 sm:grid-cols-2">
            {VALUES.map((v) => (
              <StaggerItem key={v.title}>
                <div className="h-full rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_20px_60px_-40px_rgba(22,43,77,0.5)]">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                    <Check className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-heading text-lg font-bold text-navy-900">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{v.detail}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* differentiators */}
      <section className="bg-white py-16 lg:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="Why us"
            title="What sets ISO Certification Consultant apart"
          />
          <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {DIFFERENTIATORS.map((d) => (
              <StaggerItem key={d.title}>
                <div className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-40px_rgba(22,43,77,0.5)]">
                  <h3 className="font-heading text-base font-bold text-navy-900">{d.title}</h3>
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
