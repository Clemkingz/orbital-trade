import { ImageResponse } from "next/og";
import { BRAND } from "@orbit/ui/lib/config";

export const alt = `${BRAND.name} — ${BRAND.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#0d0020", color: "#fff", padding: 72, fontFamily: "sans-serif", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -160, top: -160, width: 620, height: 620, borderRadius: 9999, background: "radial-gradient(circle, rgba(85,1,255,0.65), rgba(85,1,255,0) 70%)" }} />
        <div style={{ position: "absolute", left: -120, bottom: -220, width: 560, height: 560, borderRadius: 9999, background: "radial-gradient(circle, rgba(255,0,166,0.25), rgba(255,0,166,0) 70%)" }} />
        <svg width="520" height="520" viewBox="0 0 400 400" style={{ position: "absolute", right: 40, top: 55 }}>
          <circle cx="200" cy="200" r="128" fill="#2a0c8a" />
          <ellipse cx="200" cy="200" rx="185" ry="70" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" transform="rotate(-24 200 200)" />
          <circle cx="368" cy="125" r="10" fill="#00ffbb" />
          <ellipse cx="200" cy="200" rx="190" ry="96" fill="none" stroke="rgba(255,0,166,0.45)" strokeWidth="2" strokeDasharray="4 10" transform="rotate(32 200 200)" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 640 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 36, fontWeight: 700 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: "#5501ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 20, height: 20, borderRadius: 9999, background: "#fff" }} />
            </div>
            {BRAND.name}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", fontSize: 68, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
              <span>Trade Bitcoin with traders</span>
              <span style={{ color: "#00ffbb" }}>you can verify.</span>
            </div>
            <div style={{ fontSize: 28, color: "rgba(255,255,255,0.7)" }}>ID-verified accounts · Live market data · Withdraw anytime</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
