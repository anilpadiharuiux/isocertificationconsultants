import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, CTASection } from "@/components/ui";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { ArrowRight, Check } from "@/components/Icons";
import { INDUSTRIES, STANDARDS } from "@/lib/site";

export function generateStaticParams() {
  return INDUSTRIES.map((i) => ({ industry: i.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { industry: string };
}): Metadata {
  const i = INDUSTRIES.find((x) => x.slug === params.industry);
  if (!i) return {};
  return {
    title: `ISO Consulting for ${i.name} in Canada`,
    description: `ISO certification consulting tailored to ${i.name}. ${i.blurb}`,
    alternates: { canonical: `/industries/${i.slug}` },
  };
}

const CHALLENGES: Record<string, string[]> = {
  manufacturing: [
    "Customer audits demanding documented, repeatable processes",
    "Scaling a quality system as the line and headcount grow",
    "Reducing scrap, rework and nonconformances without slowing output",
  ],
  automotive: [
    "OEM customers requiring IATF 16949 and full core-tool evidence",
    "PPAP submissions and APQP timing that cannot slip",
    "Traceability and FMEA discipline across every part number",
  ],
  "aerospace-defence": [
    "AS9100 with airtight configuration and change control",
    "Counterfeit-part prevention and full material traceability",
    "FOD control designed into the process, not bolted on",
  ],
  "healthcare-medical-devices": [
    "ISO 13485 design controls and design history files",
    "MDSAP readiness and Health Canada MDEL licensing",
    "Supplier qualification that stands up to a regulator",
  ],
  "food-beverage": [
    "ISO 22000 and HACCP integrated into daily operations",
    "CFIA and Canadian regulatory compliance",
    "Prerequisite programs, sanitation and traceability",
  ],
  "oil-gas-energy": [
    "Managing quality, environment and safety in high-consequence work",
    "Regulatory scrutiny across multiple jurisdictions",
    "Contractor and supply-chain compliance at scale",
  ],
  construction: [
    "Winning tenders that require certified management systems",
    "Site safety and environmental compliance under ISO 45001 / 14001",
    "Subcontractor quality and document control across projects",
  ],
  "mining-natural-resources": [
    "Proving environmental stewardship under public scrutiny",
    "Safety leadership in inherently high-risk operations",
    "Integrated management across remote, multi-site operations",
  ],
};

export default function IndustryPage({ params }: { params: { industry: string } }) {
  const ind = INDUSTRIES.find((x) => x.slug === params.industry);
  if (!ind) notFound();

  const challenges = CHALLENGES[ind.slug] ?? [];
  const stds = ind.standards
    .map((code) => STANDARDS.find((s) => s.code === code))
    .filter((s): s is (typeof STANDARDS)[number] => Boolean(s));
  const otherIndustries = INDUSTRIES.filter((x) => x.slug !== ind.slug).slice(0, 4);

  return (
    <>
      <PageHeader
        eyebrow="Industry focus"
        title={
          <>
            ISO consulting for{" "}
            <span className="text-teal-700">{ind.name}</span>
          </>
        }
        intro={ind.blurb}
      >
        <Link href="/contact" className="btn-primary">
          Talk to a {ind.name.toLowerCase()} specialist <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/assessment" className="btn-ghost">
          Free readiness check
        </Link>
      </PageHeader>

      <section className="bg-white py-16 lg:py-24">
        <div className="container-page grid gap-14 lg:grid-cols-2">
          <div>
            <Reveal>
              <h2 className="font-heading text-2xl font-bold text-navy-900">
                The pressures you are under
              </h2>
              <p className="mt-4 text-slate-600">
                {ind.name} operations face requirements that generic consultants miss.
                These are the ones we build the system around.
              </p>
            </Reveal>
            <Stagger className="mt-8 space-y-4">
              {challenges.map((c) => (
                <StaggerItem key={c}>
                  <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold-50 text-gold-700">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <p className="text-sm text-slate-700">{c}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>

          <div>
            <Reveal>
              <h2 className="font-heading text-2xl font-bold text-navy-900">
                Standards we implement here
              </h2>
              <p className="mt-4 text-slate-600">
                Most {ind.name.toLowerCase()} clients integrate two or three standards
                into a single management system rather than running them in parallel.
              </p>
            </Reveal>
            <Stagger className="mt-8 space-y-4">
              {stds.map((s) => (
                <StaggerItem key={s.slug}>
                  <Link
                    href={`/services/${s.slug}`}
                    className="card card-hover group flex items-center gap-4 p-5"
                  >
                    <span className="rounded-lg bg-navy-50 px-2.5 py-1 font-heading text-sm font-bold text-navy-900">
                      {s.code}
                    </span>
                    <div className="flex-1">
                      <p className="font-heading text-sm font-semibold text-navy-900">{s.name}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-teal-700 transition-transform group-hover:translate-x-1" />
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </section>

      <section className="bg-soft py-16">
        <div className="container-page">
          <h2 className="font-heading text-xl font-bold text-navy-900">Other industries we serve</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {otherIndustries.map((o) => (
              <Link
                key={o.slug}
                href={`/industries/${o.slug}`}
                className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-300 hover:shadow-md"
              >
                <span className="font-heading text-sm font-semibold text-navy-900">{o.name}</span>
                <ArrowRight className="h-4 w-4 text-teal-700 transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CTASection title={`Get your ${ind.name.toLowerCase()} operation certified`} />
    </>
  );
}
