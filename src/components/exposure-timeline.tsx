"use client";

// Exposure timeline: per-sample AQI along the selected route, drawn as an
// SVG area chart. Highlights the worst stretch to avoid.
//
// Built by Omprakash Suthar (@OPBSUTHAR) — https://github.com/OPBSUTHAR/airescout

import { useMemo, useState } from "react";
import type { ScoredRoute } from "@/lib/scoring";
import { bandForAqi } from "@/lib/aqi-bands";

interface Props {
  route: ScoredRoute | null;
}

const W = 640;
const H = 140;
const PAD = 8;

export default function ExposureTimeline({ route }: Props) {
  const [hover, setHover] = useState<number | null>(null);

  const chart = useMemo(() => {
    if (!route || route.samples.length < 2) return null;

    const aqis = route.samples.map((s) => s.aqi);
    const maxAqi = Math.max(...aqis, 50);
    const minAqi = Math.min(...aqis);
    const span = Math.max(maxAqi - minAqi, 1);

    const pts = aqis.map((aqi, i) => {
      const x = PAD + (i / (aqis.length - 1)) * (W - PAD * 2);
      const y = PAD + (1 - (aqi - minAqi) / span) * (H - PAD * 2);
      return { x, y, aqi };
    });

    const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const area = `${line} L${W - PAD},${H - PAD} L${PAD},${H - PAD} Z`;

    const worst = pts.reduce((a, b) => (b.aqi > a.aqi ? b : a), pts[0]);
    return { pts, line, area, worst, maxAqi, minAqi };
  }, [route]);

  if (!route || !chart) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
        Pick a route to see its air-quality profile along the way.
      </div>
    );
  }

  const hovered = hover !== null ? chart.pts[hover] : null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Air quality along this route</h3>
        <span className="text-xs text-zinc-500">
          peak {Math.round(chart.maxAqi)} · low {Math.round(chart.minAqi)}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`AQI profile for route ${route.index + 1}`}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * W;
          let best = 0;
          let bestD = Infinity;
          chart.pts.forEach((p, i) => {
            const d = Math.abs(p.x - x);
            if (d < bestD) { bestD = d; best = i; }
          });
          setHover(best);
        }}
      >
        <defs>
          <linearGradient id="aqGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={chart.area} fill="url(#aqGrad)" />
        <path
          d={chart.line}
          fill="none"
          stroke="#f97316"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <line
          x1={chart.worst.x}
          y1={PAD}
          x2={chart.worst.x}
          y2={H - PAD}
          stroke="#ef4444"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        {hovered && (
          <>
            <line
              x1={hovered.x}
              y1={PAD}
              x2={hovered.x}
              y2={H - PAD}
              stroke="#3b82f6"
              strokeWidth="1"
            />
            <circle cx={hovered.x} cy={hovered.y} r="4" fill="#3b82f6" />
          </>
        )}
      </svg>

      <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
        <span>Start</span>
        <span className="ml-auto">
          {hovered
            ? `AQI ${Math.round(hovered.aqi)} — ${bandForAqi(hovered.aqi).label}`
            : "Worst stretch marked in red — consider avoiding it."}
        </span>
      </div>
    </div>
  );
}