import type { MetadataRoute } from "next";
import { STANDARDS, INDUSTRIES, MODULES, SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url;
  const now = new Date("2026-07-02");

  const staticRoutes = [
    { path: "", priority: 1.0 },
    { path: "/custom-solutions", priority: 0.95 },
    { path: "/solutions", priority: 0.95 },
    { path: "/roi", priority: 0.9 },
    { path: "/services", priority: 0.9 },
    { path: "/industries", priority: 0.9 },
    { path: "/platform", priority: 0.9 },
    { path: "/process", priority: 0.8 },
    { path: "/assessment", priority: 0.8 },
    { path: "/about", priority: 0.7 },
    { path: "/contact", priority: 0.7 },
  ].map((r) => ({
    url: `${base}${r.path}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: r.priority,
  }));

  const moduleRoutes = MODULES.map((m) => ({
    url: `${base}/solutions/${m.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.85,
  }));

  const serviceRoutes = STANDARDS.map((s) => ({
    url: `${base}/services/${s.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.85,
  }));

  const industryRoutes = INDUSTRIES.map((i) => ({
    url: `${base}/industries/${i.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...moduleRoutes, ...serviceRoutes, ...industryRoutes];
}
