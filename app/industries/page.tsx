import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, IndustryCard, CTASection } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion";
import { ArrowRight } from "@/components/Icons";
import { INDUSTRIES } from "@/lib/site";

export const metadata: Metadata = {
  title: "ISO Consulting by Industry — Manufacturing, Automotive, Aerospace & More",
  description:
    "Industry-specific ISO consulting for eight manufacturing verticals across Canada — automotive core tools, aerospace traceability, food safety, medical device design controls and more.",
  alternates: { canonical: "/industries" },
};

export default function IndustriesPage() {
  return (
    <>
      <PageHeader
        eyebrow="By industry"
        title={<>Depth where <span className="text-teal-700">it counts</span></>}
        intro="Generic quality advice does not survive an automotive PPAP submission or an aerospace configuration audit. Every engagement is built around the realities of your sector."
      >
        <Link href="/contact" className="btn-primary">
          Talk to a specialist <ArrowRight className="h-4 w-4" />
        </Link>
      </PageHeader>

      <section className="bg-white py-16 lg:py-24">
        <div className="container-page">
          <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {INDUSTRIES.map((i) => (
              <StaggerItem key={i.slug}>
                <IndustryCard i={i} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <CTASection />
    </>
  );
}
