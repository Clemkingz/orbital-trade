import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { CookieBanner } from "@/components/site/CookieBanner";
import { Heartbeat } from "@/components/site/Heartbeat";
import { Toaster } from "@orbit/ui/components/ui/Toast";
import { BRAND } from "@orbit/ui/lib/config";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.url),
  title: {
    default: `${BRAND.name} — Copy verified Bitcoin traders`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.description,
  applicationName: BRAND.name,
  keywords: [
    "Bitcoin",
    "BTC",
    "copy trading",
    "crypto broker",
    "buy Bitcoin Nigeria",
    "verified traders",
    "crypto Nigeria",
    "Bitcoin wallet",
    "live BTC price",
    "Wall Street news",
  ],
  authors: [{ name: BRAND.name }],
  creator: BRAND.name,
  publisher: BRAND.name,
  category: "finance",
  formatDetection: { telephone: false, email: false, address: false },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.description,
    url: "/",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  appleWebApp: { capable: true, title: BRAND.name, statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#5501ff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0020" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth">
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white">
          Skip to content
        </a>
        {children}
        <Toaster />
        <CookieBanner />
        <Heartbeat />
      </body>
    </html>
  );
}
