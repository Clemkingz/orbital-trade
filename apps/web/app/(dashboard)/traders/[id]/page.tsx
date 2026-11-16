import type { Metadata } from "next";
import { TraderProfile } from "@/components/traders/TraderViews";

export const metadata: Metadata = { title: "Trader" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TraderProfile id={id} />;
}
