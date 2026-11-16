import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// Load the monorepo root .env so every app shares one config.
loadEnvConfig(path.resolve(__dirname, "../.."));

const nextConfig: NextConfig = {
  // Served under /admin. In development the user site (localhost:3000) forwards /admin here, so both
  // apps share one origin and the browser mock data. In production deploy it on its own subdomain.
  basePath: "/admin",
  transpilePackages: ["@orbit/shared", "@orbit/ui"],
  async headers() {
    // The console must never be framed or indexed.
    return [{ source: "/:path*", headers: [{ key: "X-Frame-Options", value: "DENY" }, { key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
};

export default nextConfig;
