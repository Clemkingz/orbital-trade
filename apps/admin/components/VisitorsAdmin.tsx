"use client";

import { geoEqualEarth, geoPath } from "d3-geo";
import { useMemo, useState } from "react";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import world from "world-atlas/countries-110m.json";
import { Monitor, RefreshCw, Smartphone, Tablet } from "lucide-react";
import { PageHeader } from "@orbit/ui/components/ui/PageHeader";
import { Badge, Card, CardHeader, LiveDot } from "@orbit/ui/components/ui/misc";
import { useApi } from "@orbit/ui/lib/api";
import type { Visitor } from "@orbit/ui/lib/types";

const W = 960;
const H = 470;
const projection = geoEqualEarth().scale(170).translate([W / 2, H / 2]);
const path = geoPath(projection);
const topo = world as unknown as Topology<{ countries: GeometryCollection }>;
const land = feature(topo, topo.objects.countries);

const DEVICE = { Desktop: Monitor, Mobile: Smartphone, Tablet: Tablet };

function duration(from: string) {
  const s = Math.max(0, Math.round((Date.now() - +new Date(from)) / 1000));
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
}

/** FR-9 — live visitor map + table, refreshed every 5 s. Location is approximate (IP only). */
export function LiveVisitors() {
  const { data } = useApi<Visitor[]>("/admin/visitors", { refreshInterval: 5000 });
  const visitors = useMemo(() => data ?? [], [data]);
  const tick = visitors.length;
  const [hover, setHover] = useState<Visitor | null>(null);

  const byCountry = useMemo(() => {
    const m: Record<string, number> = {};
    visitors.forEach((v) => (m[v.country] = (m[v.country] ?? 0) + 1));
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [visitors]);
  const signedIn = visitors.filter((v) => v.userName).length;

  return (
    <>
      <PageHeader
        title="Live visitors"
        subtitle="Everyone on the site right now. A visitor is live while their browser sends a heartbeat every 15 s."
        action={
          <span className="flex items-center gap-2 text-sm text-text-muted">
            <RefreshCw className="size-4 animate-spin" style={{ animationDuration: "5s" }} /> Refreshing every 5 s
          </span>
        }
      />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Live now", visitors.length],
          ["Signed in", signedIn],
          ["Anonymous", visitors.length - signedIn],
          ["Countries", byCountry.length],
        ].map(([k, v], i) => (
          <Card key={k} className="animate-rise p-4" style={{ animationDelay: `${i * 50}ms` }}>
            <p className="flex items-center gap-2 text-xs text-text-muted">
              {i === 0 && <LiveDot color="bg-success" />} {k}
            </p>
            <p key={`${k}-${tick}`} className="tabular mt-1 animate-fade text-2xl font-bold">
              {v}
            </p>
          </Card>
        ))}
      </div>

      {visitors.length === 0 && <p className="mb-4 rounded-xl bg-surface-alt px-4 py-3 text-sm text-text-muted">No one is on the user site right now. Open localhost:3000 in another tab to see a visitor appear within 15 seconds.</p>}
      <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
        <Card className="relative animate-rise overflow-hidden border-0 bg-night">
          <div className="pointer-events-none absolute -left-20 -top-20 size-80 rounded-full bg-primary/25 blur-3xl" />
          <svg viewBox={`0 0 ${W} ${H}`} className="relative h-auto w-full" role="img" aria-label={`World map with ${visitors.length} live visitors`}>
            <path d={path({ type: "Sphere" }) ?? ""} fill="#120430" stroke="#221844" />
            <path d={path(land) ?? ""} fill="#1b1135" stroke="#2c1f56" strokeWidth={0.6} />
            {visitors.map((v) => {
              const p = projection([v.lng, v.lat]);
              if (!p) return null;
              return (
                <g key={v.sessionId} transform={`translate(${p[0]},${p[1]})`} onMouseEnter={() => setHover(v)} onMouseLeave={() => setHover(null)} className="cursor-pointer">
                  <circle r={9} fill={v.userName ? "#00ffbb" : "#7c3aff"} opacity={0.18}>
                    <animate attributeName="r" values="4;12;4" dur="2.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.35;0;0.35" dur="2.4s" repeatCount="indefinite" />
                  </circle>
                  <circle r={3.2} fill={v.userName ? "#00ffbb" : "#b79bff"} stroke="#0d0020" strokeWidth={1} />
                </g>
              );
            })}
          </svg>
          {hover && (
            <div className="pointer-events-none absolute left-4 top-4 animate-pop rounded-xl border border-white/10 bg-night/90 px-3 py-2 text-xs text-white backdrop-blur">
              <p className="font-semibold">{hover.userName ?? "Anonymous visitor"}</p>
              <p className="text-white/60">
                {hover.city}, {hover.country} · {hover.page}
              </p>
            </div>
          )}
          <div className="absolute bottom-3 left-4 flex gap-4 text-[11px] text-white/60">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-cyan" /> Signed in</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#b79bff]" /> Anonymous</span>
            <span>Approximate location from IP only</span>
          </div>
        </Card>
        <Card className="animate-rise" style={{ animationDelay: "80ms" }}>
          <CardHeader title="By country" />
          <ul className="space-y-2.5 p-5">
            {byCountry.map(([c, n]) => (
              <li key={c} className="text-sm">
                <div className="flex justify-between">
                  <span>{c}</span>
                  <span className="tabular font-semibold">{n}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${(n / Math.max(1, visitors.length)) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-5 animate-rise overflow-hidden" style={{ animationDelay: "140ms" }}>
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-border bg-surface-alt text-xs text-text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Visitor</th>
                <th className="px-3 py-3 font-medium">Country</th>
                <th className="px-3 py-3 font-medium">Region</th>
                <th className="px-3 py-3 font-medium">City</th>
                <th className="px-3 py-3 font-medium">Page</th>
                <th className="px-3 py-3 font-medium">Device</th>
                <th className="px-5 py-3 text-right font-medium">Time on site</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visitors.map((v) => {
                const D = DEVICE[v.device];
                return (
                  <tr key={v.sessionId} className="animate-fade hover:bg-surface-alt">
                    <td className="px-5 py-2.5">{v.userName ? <span className="font-medium">{v.userName}</span> : <span className="text-text-muted">Anonymous</span>}</td>
                    <td className="px-3 py-2.5">{v.country}</td>
                    <td className="px-3 py-2.5 text-text-muted">{v.region}</td>
                    <td className="px-3 py-2.5">{v.city}</td>
                    <td className="px-3 py-2.5"><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{v.page}</code></td>
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-1.5 text-text-muted">
                        <D className="size-3.5" /> {v.device} · {v.browser}
                      </span>
                    </td>
                    <td className="tabular px-5 py-2.5 text-right text-text-muted">{duration(v.startedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border px-5 py-3 text-xs text-text-muted">
          <Badge className="mr-2">Mock data</Badge>Shows browser tabs open on the user site. Location is a placeholder (Lagos) until IP geolocation is connected. Raw IPs are never shown.
        </p>
      </Card>
    </>
  );
}
