import type { MetadataRoute } from "next";
import { BRAND } from "@orbit/ui/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/dashboard", "/verify-id", "/transactions", "/withdraw", "/deposit", "/settings", "/copying"] }],
    sitemap: `${BRAND.url}/sitemap.xml`,
  };
}
