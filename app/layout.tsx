import type { Metadata } from "next";
import { Outfit, DM_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://isocertificationconsultant.ca"),
  title: {
    default:
      "ISO Certification Consultant — Customized QMS Platform for Manufacturers | Canada",
    template: "%s | ISO Certification Consultant",
  },
  description:
    "A configurable QMS platform for Canadian manufacturers — customized to your processes (inspection, inventory, training, production and more) and ready to onboard any standard, from ISO 9001 and IATF 16949 to customer-specific frameworks.",
  keywords: [
    "customized QMS platform",
    "quality management system manufacturing",
    "ISO certification consultant Canada",
    "inspection software",
    "training and competence QMS",
    "any ISO standard onboarding",
    "IATF 16949",
    "ISO consulting Ontario",
  ],
  openGraph: {
    type: "website",
    locale: "en_CA",
    url: "https://isocertificationconsultant.ca",
    siteName: "ISO Certification Consultant",
    title: "Customized QMS Platform for Manufacturers — Any Standard, One System",
    description:
      "Configurable QMS process modules — inspection, inventory, training, production — built around your business and mapped to any standard you certify against.",
  },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "ISO Certification Consultant",
  legalName: "ISO Certification Consultant Inc.",
  url: "https://isocertificationconsultant.ca",
  description:
    "A configurable QMS platform for Canadian manufacturers — customized to your processes and ready to onboard any standard.",
  areaServed: [
    { "@type": "Country", name: "Canada" },
    { "@type": "Country", name: "United States" },
  ],
  knowsAbout: [
    "Quality Management Systems",
    "Inspection and quality control",
    "Inventory and traceability",
    "Training and competence",
    "Production process control",
    "Corrective and preventive action (CAPA)",
    "Supplier quality management",
    "ISO 9001",
    "IATF 16949",
    "AS9100",
    "ISO 13485",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${dmSans.variable}`}>
      <body className="bg-white text-slate-700 antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
