"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { Button } from "@orbit/ui/components/ui/Button";

const KEY = "orbit-cookie-consent";

/** FR-9.5 / NDPA 2023 — discloses IP geolocation and live session tracking. */
export function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setTimeout(() => setShow(true), 900);
    } catch {
      /* ignore */
    }
  }, []);

  if (!show) return null;
  const close = (v: string) => {
    try {
      localStorage.setItem(KEY, v);
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  return (
    <div role="dialog" aria-label="Cookie notice" className="fixed inset-x-3 bottom-3 z-[80] animate-rise sm:inset-x-auto sm:bottom-6 sm:left-6 sm:max-w-md">
      <div className="rounded-2xl border border-white/10 bg-night/95 p-5 text-white shadow-2xl backdrop-blur">
        <div className="flex gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/30">
            <Cookie className="size-4.5 text-cyan" />
          </span>
          <p className="text-[13px] leading-relaxed text-white/75">
            We use essential cookies and an approximate, IP-based location to keep your account secure and show live visitor counts. We never ask for GPS location. Raw IPs are deleted after 90 days.{" "}
            <Link href="/legal/privacy" className="font-medium text-white underline underline-offset-2">
              Privacy policy
            </Link>
          </p>
        </div>
        <div className="mt-4 flex gap-2">
          <Button size="sm" onClick={() => close("accepted")} className="flex-1">
            Accept
          </Button>
          <Button size="sm" variant="outline-light" onClick={() => close("essential")} className="flex-1">
            Essential only
          </Button>
        </div>
      </div>
    </div>
  );
}
