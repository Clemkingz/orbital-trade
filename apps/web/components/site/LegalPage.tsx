import type { ReactNode } from "react";
import { Footer } from "@/components/landing/Footer";
import { SiteNav } from "@/components/landing/SiteNav";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <>
      <SiteNav />
      <div className="relative overflow-hidden bg-night pb-14 pt-32 text-white">
        <div className="pointer-events-none absolute -right-20 -top-32 size-96 animate-glow rounded-full bg-primary/30 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
          <h1 className="animate-rise text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-2 animate-rise text-sm text-white/60">Last updated {updated} · Draft pending legal review</p>
        </div>
      </div>
      <main id="main" className="bg-surface">
        <article className="mx-auto max-w-3xl animate-fade space-y-6 px-4 py-14 text-[15px] leading-relaxed text-text-muted sm:px-6 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-text">
          {children}
        </article>
      </main>
      <Footer />
    </>
  );
}
