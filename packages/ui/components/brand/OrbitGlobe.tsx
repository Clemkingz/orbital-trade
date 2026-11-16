import { cn } from "../../lib/cn";

/**
 * Original illustration: a glowing violet planet with latitude lines and two
 * animated orbit rings carrying satellites. Pure SVG/CSS, no external assets.
 */
export function OrbitGlobe({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none relative aspect-square", className)} aria-hidden="true">
      <div className="absolute inset-[10%] animate-glow rounded-full bg-primary/40 blur-3xl" />
      {/* planet */}
      <svg viewBox="0 0 400 400" className="absolute inset-0 size-full">
        <defs>
          <radialGradient id="og-planet" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#4a1fd0" />
            <stop offset="45%" stopColor="#22086e" />
            <stop offset="85%" stopColor="#0d0020" />
          </radialGradient>
          <radialGradient id="og-shade" cx="72%" cy="76%" r="60%">
            <stop offset="30%" stopColor="#0d0020" stopOpacity="0" />
            <stop offset="100%" stopColor="#0d0020" stopOpacity="0.85" />
          </radialGradient>
          <clipPath id="og-clip">
            <circle cx="200" cy="200" r="128" />
          </clipPath>
        </defs>
        <circle cx="200" cy="200" r="128" fill="url(#og-planet)" />
        <g clipPath="url(#og-clip)" stroke="#b79bff" strokeOpacity="0.22" fill="none" strokeWidth="1">
          {[-90, -60, -30, 0, 30, 60, 90].map((y) => (
            <ellipse key={y} cx="200" cy={200 + y} rx={Math.sqrt(128 ** 2 - y ** 2)} ry={Math.max(4, 18 - Math.abs(y) / 6)} />
          ))}
          {[20, 50, 80, 110].map((rx) => (
            <ellipse key={rx} cx="200" cy="200" rx={rx} ry="128" />
          ))}
        </g>
        {/* lit "markets" */}
        <g fill="#00ffbb">
          <circle cx="168" cy="222" r="3" opacity="0.9" />
          <circle cx="232" cy="168" r="2.4" opacity="0.7" />
          <circle cx="146" cy="160" r="2" opacity="0.6" />
          <circle cx="250" cy="236" r="2.2" opacity="0.5" />
        </g>
        <circle cx="200" cy="200" r="128" fill="url(#og-shade)" />
        <circle cx="200" cy="200" r="128" fill="none" stroke="#7c3aff" strokeOpacity="0.5" />
      </svg>
      {/* orbit 1 */}
      <div className="absolute inset-0 animate-orbit" style={{ transformOrigin: "50% 50%" }}>
        <svg viewBox="0 0 400 400" className="size-full">
          <ellipse cx="200" cy="200" rx="185" ry="70" fill="none" stroke="#ffffff" strokeOpacity="0.18" transform="rotate(-24 200 200)" />
          <circle cx="368" cy="125" r="6" fill="#00ffbb" />
          <circle cx="368" cy="125" r="12" fill="#00ffbb" opacity="0.2" />
        </svg>
      </div>
      {/* orbit 2 */}
      <div className="absolute inset-[6%] animate-orbit-reverse" style={{ transformOrigin: "50% 50%" }}>
        <svg viewBox="0 0 400 400" className="size-full">
          <ellipse cx="200" cy="200" rx="190" ry="96" fill="none" stroke="#ff00a6" strokeOpacity="0.22" strokeDasharray="3 7" transform="rotate(32 200 200)" />
          <circle cx="40" cy="105" r="4.5" fill="#ff00a6" />
        </svg>
      </div>
    </div>
  );
}
