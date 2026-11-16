import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@orbit/ui/components/ui/Toast";
import { BRAND } from "@orbit/ui/lib/config";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: `Admin · ${BRAND.name}`, template: `%s · Admin · ${BRAND.name}` },
  description: `${BRAND.name} operations console.`,
  applicationName: `${BRAND.name} Admin`,
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#0d0020",
  width: "device-width",
  initialScale: 1,
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
      </body>
    </html>
  );
}
