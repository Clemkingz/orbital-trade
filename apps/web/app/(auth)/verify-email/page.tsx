import type { Metadata } from "next";
import { MailCheck } from "lucide-react";
import { AuthHeader } from "@/components/auth/AuthShell";
import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";

export const metadata: Metadata = { title: "Verify your email", robots: { index: false } };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email = "" } = await searchParams;
  return (
    <>
      <AuthHeader
        icon={<MailCheck className="size-6" />}
        title="Check your email"
        subtitle={<>We sent a 6-digit code to {email ? <span className="font-medium text-text">{email}</span> : "your email"}.</>}
      />
      <VerifyEmailForm email={email} />
    </>
  );
}
