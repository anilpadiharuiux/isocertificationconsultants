import type { Metadata } from "next";
import Link from "next/link";
import {
  PageHeader,
  SectionHeading,
  StandardCard,
  AnyStandardCard,
  CTASection,
} from "@/components/ui";
import { Stagger, StaggerItem, Reveal } from "@/components/motion";
import { ArrowRight } from "@/components/Icons";
import { STANDARDS } from "@/lib/site";

export const metadata: Metadata = {
  title: "ISO Consulting & Certification — Any Standard, One Platform",
  description:
    "Certification support for any standard — ISO 9001, 14001, 45001, IATF 16949, AS9100, ISO 13485 and customer-specific, regulatory or internal frameworks. Serving Canadian manufacturers.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Standards & certification"
        title={<>Any standard. <span className="text-teal-700">One platform.</span></>}
        intro="The standards below are the ones manufacturers ask for most — but we're not limited to a fixed list. Customer-specific requirements, regulatory frameworks, internal quality standards: if you're audited against it, we can onboard it."
      >
        <Link href="/assessment" className="btn-primary">
          Which standard do you need? <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/contact" className="btn-ghost">
          Onboard a custom standard
        </Link>
      </PageHeader>

      <section className="bg-white py-16 lg:py-24">
        <div className="container-page">
          <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {STANDARDS.map((s) => (
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

      <section className="bg-soft py-16 lg:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="Multi-standard"
            title="Integrate several standards into one system"
            intro="ISO 9001, 14001 and 45001 share the same high-level structure. We build one integrated management system — a single set of processes, one audit program, one source of truth — instead of three parallel binders."
            align="center"
          />
          <Reveal delay={0.1} className="mt-8 text-center">
            <Link href="/process" className="btn-outline">
              See the certification process <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      <CTASection />
    </>
  );
}
