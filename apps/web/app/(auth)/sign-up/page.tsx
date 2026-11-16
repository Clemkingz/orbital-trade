import type { Metadata } from "next";
import Link from "next/link";
import { AuthHeader } from "@/components/auth/AuthShell";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Open an account in minutes. Verify your ID, fund your wallet and copy vetted Bitcoin traders.",
  alternates: { canonical: "/sign-up" },
};

export default function SignUpPage() {
  return (
    <>
      <AuthHeader
        title="Create your account"
        subtitle={<>Already have an account? <Link href="/sign-in" className="font-medium text-primary hover:underline">Sign in</Link></>}
      />
      <SignUpForm />
    </>
  );
}
