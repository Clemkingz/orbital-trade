import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// Load the monorepo root .env so every app shares one config.
// forceReload: Next already loaded (and cached) env for the app folder; load the root .env instead.
loadEnvConfig(path.resolve(__dirname, "../.."), process.env.NODE_ENV !== "production", console, true);

const nextConfig: NextConfig = {
  transpilePackages: ["@orbit/shared", "@orbit/ui"],
  /** The admin console (apps/admin, basePath /admin) is reached through this origin in development. */
  async rewrites() {
    const admin = process.env.ADMIN_DEV_URL ?? "http://localhost:3001";
    return [
      { source: "/admin", destination: `${admin}/admin` },
      { source: "/admin/:path*", destination: `${admin}/admin/:path*` },
    ];
  },
};

export default nextConfig;
