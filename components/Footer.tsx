import Link from "next/link";
import { ShieldCheck, ArrowRight, Phone } from "./Icons";
import { STANDARDS, INDUSTRIES, MODULES, SITE } from "@/lib/site";

export function Footer() {
  const year = 2026;
  return (
    <footer className="bg-navy-900 text-slate-300">
      <div className="container-page">
        <div className="grid gap-12 border-b border-white/10 py-16 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/10">
                <ShieldCheck className="h-5 w-5 text-teal-400" />
              </span>
              <span className="font-heading text-lg font-bold text-white">
                ISO Certification Consultant
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              A quality management platform and certified consultants that take Canadian
              manufacturers from gap analysis to a passed certification audit — customized
              to your processes, ready for any standard.
            </p>
            <a
              href={`tel:${SITE.phone.replace(/[^+\d]/g, "")}`}
              className="mt-6 inline-flex items-center gap-2 font-heading text-lg font-bold text-white hover:text-teal-300"
            >
              <Phone className="h-5 w-5 text-teal-400" />
              {SITE.phone}
            </a>
            <p className="mt-2 text-sm text-slate-400">
              <a href={`mailto:${SITE.email}`} className="hover:text-teal-300">
                {SITE.email}
              </a>
            </p>
          </div>

          <FooterCol title="Platform Modules">
            {MODULES.slice(0, 6).map((m) => (
              <FooterLink key={m.slug} href={`/solutions/${m.slug}`}>
                {m.name}
              </FooterLink>
            ))}
            <FooterLink href="/solutions">All platform modules →</FooterLink>
          </FooterCol>

          <FooterCol title="Standards">
            {STANDARDS.slice(0, 5).map((s) => (
              <FooterLink key={s.slug} href={`/services/${s.slug}`}>
                {s.code}
              </FooterLink>
            ))}
            <FooterLink href="/services">Any standard →</FooterLink>
          </FooterCol>

          <FooterCol title="Industries">
            {INDUSTRIES.slice(0, 6).map((i) => (
              <FooterLink key={i.slug} href={`/industries/${i.slug}`}>
                {i.name}
              </FooterLink>
            ))}
            <FooterLink href="/industries">All industries →</FooterLink>
          </FooterCol>

          <FooterCol title="Company">
            <FooterLink href="/roi">ROI estimator</FooterLink>
            <FooterLink href="/custom-solutions">Custom-built solutions</FooterLink>
            <FooterLink href="/process">How it works</FooterLink>
            <FooterLink href="/assessment">Free assessment</FooterLink>
            <FooterLink href="/about">About</FooterLink>
            <FooterLink href="/contact">Contact</FooterLink>
          </FooterCol>
        </div>

        <div className="flex flex-col gap-4 py-8 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {SITE.legalName}. Serving manufacturers across Canada &amp; the USA.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
            <span>{SITE.region}</span>
          </div>
        </div>
      </div>

      {/* bottom CTA line */}
      <div className="border-t border-white/10 bg-navy-950">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-sm sm:flex-row">
          <p className="text-slate-300">Ready to find out where you stand?</p>
          <Link href="/contact" className="inline-flex items-center gap-1.5 font-semibold text-teal-300 hover:text-teal-200">
            Book a free consultation <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-white">{title}</h4>
      <ul className="mt-4 space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-sm text-slate-400 transition-colors hover:text-teal-300">
        {children}
      </Link>
    </li>
  );
}
