import type { MetadataRoute } from "next";
import { BRAND } from "@orbit/ui/lib/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.name,
    short_name: BRAND.name,
    description: BRAND.description,
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0d0020",
    theme_color: "#5501ff",
    categories: ["finance"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
