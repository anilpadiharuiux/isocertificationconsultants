import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, SectionHeading, GapCreditBanner, CTASection } from "@/components/ui";
import { ROIPanel } from "@/components/ROIPanel";
import { ROICalculator } from "@/components/ROICalculator";
import { Reveal } from "@/components/motion";
import { ArrowRight } from "@/components/Icons";
import { ROI, ROI_PLATFORM } from "@/lib/site";

export const metadata: Metadata = {
  title: "ROI of ISO Certification — Estimate Your Return",
  description:
    "What does ISO certification actually return? Use the interactive estimator to see what quality admin costs your business today, and where the payback comes from — platform and custom solutions, sized for small and mid-size manufacturers.",
  alternates: { canonical: "/roi" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "ROI of ISO Certification",
  description:
    "Interactive ROI estimator and value breakdown for ISO certification, QMS platform modules and custom-built quality solutions.",
  provider: { "@type": "Organization", name: "ISO Certification Consultant Inc." },
};

export default function ROIPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <PageHeader
        eyebrow="Return on investment"
        title={
          <>
            Certification is an expense.{" "}
            <span className="text-teal-700">A system that fits is an investment.</span>
          </>
        }
        intro="Quality paperwork, audit fire drills and failed submissions already cost your business real money — it's just spread out where no one adds it up. Add it up below, then see exactly where the return comes from."
      >
        <Link href="#calculator" className="btn-primary">
          Estimate your return <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/contact" className="btn-outline">
          Talk to a consultant
        </Link>
      </PageHeader>

      {/* CALCULATOR — the lead magnet */}
      <section id="calculator" className="bg-soft py-16 lg:py-24">
        <div className="container-page">
          <Reveal>
            <ROICalculator />
          </Reveal>
        </div>
      </section>

      {/* PLATFORM ROI */}
      <section className="bg-white pb-8 pt-16 lg:pt-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="Where the return comes from"
            title="Two ways in — the return shows up either way"
            intro="Start with the platform modules, or start with a custom-built solution to a specific challenge. Both are sized for businesses without a big quality department."
          />
        </div>
      </section>
      <section className="bg-white py-8">
        <div className="container-page">
          <ROIPanel data={ROI_PLATFORM} />
        </div>
      </section>

      {/* CUSTOM ROI */}
      <section className="bg-white pb-16 pt-8 lg:pb-24">
        <div className="container-page">
          <ROIPanel data={ROI} />
        </div>
      </section>

      {/* GAP CREDIT */}
      <section className="bg-soft py-16 lg:py-20">
        <div className="container-page">
          <GapCreditBanner />
        </div>
      </section>

      <CTASection
        title="Stop estimating — get your real number"
        intro="An onsite assessment maps your gaps, prices the fix, and shows the payback for your operation specifically. The fee is credited in full toward whatever we build."
      />
    </>
  );
}
