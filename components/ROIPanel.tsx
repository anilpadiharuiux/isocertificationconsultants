import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "./motion";
import { Icon, ArrowRight } from "./Icons";
import { ROI } from "@/lib/site";

type ROIData = {
  eyebrow: string;
  title: string;
  intro: string;
  cta: { href: string; label: string };
  footnote: string;
  drivers: { icon: string; title: string; detail: string }[];
};

/** ROI-focused panel — honest value drivers, reusable per segment (custom / platform). */
export function ROIPanel({
  data = ROI,
  showEstimatorLink = false,
}: {
  data?: ROIData;
  showEstimatorLink?: boolean;
}) {
  return (
    <Reveal>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-[0_20px_60px_-40px_rgba(22,43,77,0.5)]">
        <div className="grid gap-8 p-7 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12 lg:p-11">
          {/* left — message + CTA */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <span className="label">
              <span className="h-px w-7 bg-teal-600" />
              {data.eyebrow}
            </span>
            <h2 className="mt-3 font-heading text-2xl font-bold leading-tight text-navy-900 sm:text-3xl">
              {data.title}
            </h2>
            <p className="mt-4 leading-relaxed text-slate-600">{data.intro}</p>
            <Link href={data.cta.href} className="btn-primary mt-6">
              {data.cta.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-3 text-xs font-medium text-slate-500">{data.footnote}</p>
            {showEstimatorLink && (
              <Link href="/roi" className="link-arrow mt-5">
                Estimate your return with your own numbers
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          {/* right — value drivers */}
          <Stagger className="space-y-3">
            {data.drivers.map((d, i) => {
              const highlight = i === 0;
              return (
                <StaggerItem key={d.title}>
                  <div
                    className={`flex gap-4 rounded-xl border p-4 transition-colors sm:p-5 ${
                      highlight
                        ? "border-gold-200 bg-gold-50"
                        : "border-slate-200 bg-white hover:border-teal-300"
                    }`}
                  >
                    <span
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${
                        highlight ? "bg-gold-600 text-white" : "bg-navy-900 text-teal-400"
                      }`}
                    >
                      <Icon name={d.icon} className="h-6 w-6" />
                    </span>
                    <div>
                      <h3 className="font-heading text-base font-bold text-navy-900">{d.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{d.detail}</p>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </div>
    </Reveal>
  );
}
