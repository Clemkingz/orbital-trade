import type { Metadata } from "next";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { MarketBand } from "@/components/landing/MarketBand";
import { MarketNews } from "@/components/landing/MarketNews";
import { Faq, FeaturedTraders, FinalCta, HowItWorks, Security } from "@/components/landing/Sections";
import { SiteNav } from "@/components/landing/SiteNav";
import { BRAND } from "@orbit/ui/lib/config";

export const metadata: Metadata = {
  title: { absolute: `${BRAND.name} — Copy verified Bitcoin traders` },
  alternates: { canonical: "/" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FinancialService",
  name: BRAND.name,
  description: BRAND.description,
  url: BRAND.url,
  areaServed: "NG",
  email: BRAND.supportEmail,
};

export default function LandingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteNav />
      <main id="main">
        <Hero />
        <MarketBand />
        <HowItWorks />
        <MarketNews />
        <FeaturedTraders />
        <Security />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
