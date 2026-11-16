import type { Metadata } from "next";
import Link from "next/link";
import { AuthHeader, FormAlert } from "@/components/auth/AuthShell";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = { title: "Sign in", description: "Sign in to your account.", alternates: { canonical: "/sign-in" } };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ verified?: string }> }) {
  const { verified } = await searchParams;
  return (
    <>
      <AuthHeader title="Welcome back" subtitle="Sign in to your Orbit Trade account." />
      {verified && <FormAlert tone="success">Email verified. Sign in to continue.</FormAlert>}
      <SignInForm />
      <p className="mt-4 rounded-xl bg-surface-alt px-3 py-2 text-center text-xs text-text-muted">Accounts are real: sign up first, then sign in here.</p>
      <p className="mt-6 text-center text-sm text-text-muted">
        New to Orbit Trade? <Link href="/sign-up" className="font-medium text-primary hover:underline">Create an account</Link>
      </p>
    </>
  );
}
