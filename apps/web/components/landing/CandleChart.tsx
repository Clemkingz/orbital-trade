"use client";

import { useMemo } from "react";
import type { Candle } from "@orbit/ui/lib/types";

/** Lightweight responsive SVG candlestick chart (1-minute candles). */
export function CandleChart({ candles, price, height = 220 }: { candles: Candle[]; price: number; height?: number }) {
  const W = 600;
  const H = height;
  const PAD_R = 64;
  const PAD_Y = 12;

  const { min, max, step } = useMemo(() => {
    const lo = Math.min(...candles.map((c) => c.l));
    const hi = Math.max(...candles.map((c) => c.h));
    const pad = (hi - lo) * 0.08 || 10;
    return { min: lo - pad, max: hi + pad, step: (W - PAD_R) / candles.length };
  }, [candles]);

  const y = (v: number) => PAD_Y + ((max - v) / (max - min)) * (H - PAD_Y * 2);
  const gridLines = 4;
  const last = candles[candles.length - 1];
  const up = last ? last.c >= last.o : true;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`BTC/USD 1-minute chart, last price ${price.toFixed(2)}`}>
      <defs>
        <linearGradient id="cc-fade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#5501ff" stopOpacity="0.25" />
          <stop offset="1" stopColor="#5501ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[...Array(gridLines + 1)].map((_, i) => {
        const v = max - ((max - min) / gridLines) * i;
        const yy = y(v);
        return (
          <g key={i}>
            <line x1="0" x2={W - PAD_R} y1={yy} y2={yy} stroke="#ffffff" strokeOpacity="0.06" />
            <text x={W - PAD_R + 8} y={yy + 4} fontSize="11" fill="#ffffff" fillOpacity="0.4" className="tabular">
              {Math.round(v).toLocaleString("en-US")}
            </text>
          </g>
        );
      })}
      {/* close-price area */}
      <path
        d={`M0 ${H} ${candles.map((c, i) => `L${i * step + step / 2} ${y(c.c)}`).join(" ")} L${(candles.length - 1) * step + step / 2} ${H} Z`}
        fill="url(#cc-fade)"
      />
      {candles.map((c, i) => {
        const x = i * step + step / 2;
        const isUp = c.c >= c.o;
        const color = isUp ? "#00ffbb" : "#ff4d6d";
        const top = y(Math.max(c.o, c.c));
        const bodyH = Math.max(1.5, Math.abs(y(c.o) - y(c.c)));
        return (
          <g key={c.t} className={i === candles.length - 1 ? "animate-fade" : undefined}>
            <line x1={x} x2={x} y1={y(c.h)} y2={y(c.l)} stroke={color} strokeWidth="1.2" />
            <rect x={x - step * 0.32} y={top} width={step * 0.64} height={bodyH} rx="1" fill={color} fillOpacity={isUp ? 0.9 : 0.85} />
          </g>
        );
      })}
      {/* live price line */}
      <line x1="0" x2={W - PAD_R} y1={y(price)} y2={y(price)} stroke={up ? "#00ffbb" : "#ff4d6d"} strokeDasharray="3 4" strokeOpacity="0.7" />
      <rect x={W - PAD_R + 2} y={y(price) - 10} width={PAD_R - 4} height="20" rx="5" fill={up ? "#00ffbb" : "#ff4d6d"} />
      <text x={W - PAD_R / 2} y={y(price) + 4} fontSize="11" fontWeight="700" textAnchor="middle" fill="#0d0020" className="tabular">
        {Math.round(price).toLocaleString("en-US")}
      </text>
    </svg>
  );
}
