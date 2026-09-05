import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, CTASection } from "@/components/ui";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { ArrowRight, Check, Icon } from "@/components/Icons";
import { STANDARDS, INDUSTRIES, PROCESS } from "@/lib/site";

export function generateStaticParams() {
  return STANDARDS.map((s) => ({ standard: s.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { standard: string };
}): Metadata {
  const s = STANDARDS.find((x) => x.slug === params.standard);
  if (!s) return {};
  return {
    title: `${s.code} Certification Consulting in Canada — ${s.name}`,
    description: `${s.code} (${s.name}) consulting for Canadian manufacturers. ${s.summary}`,
    alternates: { canonical: `/services/${s.slug}` },
  };
}

export default function StandardPage({ params }: { params: { standard: string } }) {
  const s = STANDARDS.find((x) => x.slug === params.standard);
  if (!s) notFound();

  const related = INDUSTRIES.filter((i) => i.standards.includes(s.code)).slice(0, 3);
  const others = STANDARDS.filter((x) => x.slug !== s.slug).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: `${s.code} certification consulting`,
    name: `${s.code} — ${s.name}`,
    description: s.summary,
    provider: { "@type": "Organization", name: "ISO Certification Consultant Inc." },
    areaServed: { "@type": "Country", name: "Canada" },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHeader
        eyebrow={`${s.category} · ${s.clauses}`}
        title={
          <>
            {s.code} —{" "}
            <span className="text-teal-700">{s.name}</span>
          </>
        }
        intro={s.summary}
      >
        <Link href="/contact" className="btn-primary">
          Scope a {s.code} project <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/assessment" className="btn-ghost">
          Free readiness check
        </Link>
      </PageHeader>

      <section className="bg-white py-16 lg:py-24">
        <div className="container-page grid gap-14 lg:grid-cols-[1.4fr_0.9fr]">
          {/* main */}
          <div>
            <Reveal>
              <h2 className="font-heading text-2xl font-bold text-navy-900">
                What a {s.code} engagement covers
              </h2>
              <p className="mt-4 text-slate-600">
                Every {s.code} project runs on the same hybrid model: the platform
                builds and tracks the system, and a certified lead consultant reviews
                the work and stands with you through the certification audit. The core
                elements below are tailored to how your operation actually runs.
              </p>
            </Reveal>

            <Stagger className="mt-8 grid gap-4 sm:grid-cols-2">
              {s.tools.map((t) => (
                <StaggerItem key={t}>
                  <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <p className="font-heading text-sm font-semibold text-navy-900">{t}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>

            <Reveal className="mt-12">
              <h2 className="font-heading text-2xl font-bold text-navy-900">
                How we get you certified
              </h2>
            </Reveal>
            <div className="mt-6 space-y-4">
              {PROCESS.map((p, idx) => (
                <Reveal key={p.n} delay={idx * 0.04}>
                  <div className="card flex gap-4 p-5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 font-heading text-sm font-bold text-teal-700 ring-1 ring-teal-100">
                      {p.n}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-x-3">
                        <h3 className="font-heading font-bold text-navy-900">{p.title}</h3>
                        <span className="text-[11px] font-medium text-teal-700">{p.duration}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{p.detail}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* sidebar */}
          <aside className="space-y-6">
            <Reveal>
              <div className="card p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                  <Icon name="assessment" className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-heading text-lg font-bold text-navy-900">
                  At a glance
                </h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-600">Standard</dt>
                    <dd className="font-semibold text-navy-900">{s.code}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-600">Focus</dt>
                    <dd className="font-semibold text-navy-900">{s.category}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-600">Structure</dt>
                    <dd className="text-right font-semibold text-navy-900">{s.clauses}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-600">Typical path</dt>
                    <dd className="font-semibold text-navy-900">~24 weeks</dd>
                  </div>
                </dl>
                <Link href="/contact" className="btn-primary mt-6 w-full">
                  Talk to an expert
                </Link>
              </div>
            </Reveal>

            {related.length > 0 && (
              <Reveal delay={0.05}>
                <div className="card p-6">
                  <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-slate-700">
                    Common in
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {related.map((i) => (
                      <li key={i.slug}>
                        <Link
                          href={`/industries/${i.slug}`}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-800"
                        >
                          <ArrowRight className="h-3.5 w-3.5" /> {i.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            )}
          </aside>
        </div>
      </section>

      {/* other standards */}
      <section className="bg-soft py-16">
        <div className="container-page">
          <h2 className="font-heading text-xl font-bold text-navy-900">Explore other standards</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {others.map((o) => (
              <Link
                key={o.slug}
                href={`/services/${o.slug}`}
                className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-300 hover:shadow-md"
              >
                <span className="font-heading text-sm font-semibold text-navy-900">
                  {o.code} · {o.name}
                </span>
                <ArrowRight className="h-4 w-4 text-teal-700 transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CTASection title={`Ready to scope your ${s.code} certification?`} />
    </>
  );
}
