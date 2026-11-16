import type { Metadata } from "next";
import { UserDetailAdmin } from "@/components/MoneyAdmin";

export const metadata: Metadata = { title: "User" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <UserDetailAdmin id={id} />;
}
