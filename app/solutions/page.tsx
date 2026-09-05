import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, SectionHeading, ModuleCard, CTASection } from "@/components/ui";
import { AnimatedTitle, HeaderIconsFX } from "@/components/HeaderFX";
import { ROIPanel } from "@/components/ROIPanel";
import { Stagger, StaggerItem, Reveal } from "@/components/motion";
import { ArrowRight } from "@/components/Icons";
import { MODULES, CUSTOMIZATION, ROI_PLATFORM } from "@/lib/site";

export const metadata: Metadata = {
  title: "Platform Modules — Inspection, Inventory, Training, Production & More",
  description:
    "Nine configurable QMS process modules built around how your business runs — inspection, inventory, training & competence, production, CAPA, supplier quality and more. Sized and priced for small and mid-size manufacturers.",
  alternates: { canonical: "/solutions" },
};

export default function SolutionsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Platform modules"
        title={<AnimatedTitle text="A QMS shaped around your operation" accent="your operation" />}
        intro="The platform gives you everything a quality system needs — nine process modules, each configured to your workflow, not forced into a rigid template. Here is what we build around your business."
        fx={<HeaderIconsFX icons={["inspection", "inventory", "training", "production", "capa", "document"]} />}
      >
        <Link href="/contact" className="btn-primary">
          Scope your configuration <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/assessment" className="btn-outline">
          Free readiness check
        </Link>
      </PageHeader>

      {/* modules */}
      <section className="bg-white py-16 lg:py-24">
        <div className="container-page">
          <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m) => (
              <StaggerItem key={m.slug}>
                <ModuleCard m={m} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ROI — platform, for small & mid-size businesses */}
      <section className="bg-soft py-16 lg:py-20">
        <div className="container-page">
          <ROIPanel data={ROI_PLATFORM} showEstimatorLink />
        </div>
      </section>

      {/* configuration process */}
      <section className="bg-white py-16 lg:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="How configuration works"
            title="From your process to a configured, certified system"
            align="center"
          />
          <div className="relative mt-14">
            <div className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-teal-300 to-transparent lg:block" />
            <Stagger className="grid gap-6 lg:grid-cols-4">
              {CUSTOMIZATION.map((c) => (
                <StaggerItem key={c.n}>
                  <div className="card relative h-full p-6 text-center">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-teal-50 font-heading font-bold text-teal-700 ring-1 ring-teal-100">
                      {c.n.replace("0", "")}
                    </span>
                    <h3 className="mt-4 font-heading text-lg font-bold text-navy-900">{c.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{c.detail}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
          <Reveal delay={0.1} className="mt-12 text-center">
            <p className="text-slate-600">
              Facing a challenge the standard modules don&apos;t cover?
            </p>
            <Link href="/custom-solutions" className="btn-navy mt-4">
              Explore custom-built solutions <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      <CTASection title="Let's configure a QMS around your processes" />
    </>
  );
}
