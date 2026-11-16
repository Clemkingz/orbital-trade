import type { Metadata } from "next";
import { NotFoundView } from "@orbit/ui/components/site/StatusScreens";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return <NotFoundView />;
}
