import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #5501ff, #3e02b7)" }}>
        <svg width="140" height="140" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="10" fill="#ffffff" />
          <ellipse cx="32" cy="32" rx="24" ry="10" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeOpacity="0.85" transform="rotate(-28 32 32)" />
          <circle cx="51.5" cy="21.5" r="4.5" fill="#00ffbb" />
        </svg>
      </div>
    ),
    size,
  );
}
