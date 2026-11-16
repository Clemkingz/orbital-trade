"use client";

import { Inter } from "next/font/google";
import { ErrorView } from "@orbit/ui/components/site/StatusScreens";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

/** Catches errors thrown by the root layout itself. Must render its own <html>. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth">
      <body>
        <ErrorView error={error} reset={reset} />
      </body>
    </html>
  );
}
