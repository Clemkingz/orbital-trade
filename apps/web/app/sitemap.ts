import type { MetadataRoute } from "next";
import { BRAND } from "@orbit/ui/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ["", "/sign-up", "/sign-in", "/legal/terms", "/legal/privacy", "/legal/risk-disclosure"].map((p) => ({
    url: `${BRAND.url}${p}`,
    lastModified: now,
    changeFrequency: p === "" ? "daily" : "monthly",
    priority: p === "" ? 1 : p === "/sign-up" ? 0.8 : 0.4,
  }));
}
