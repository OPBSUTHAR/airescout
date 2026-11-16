"use client";

// One comparison card per candidate route.
//
// Built by Omprakash Suthar (@OPBSUTHAR) — https://github.com/OPBSUTHAR/airescout

import type { ScoredRoute } from "@/lib/scoring";
import { scoreLabel } from "@/lib/aqi-bands";

interface Props {
  route: ScoredRoute;
  isFastest: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

export default function RouteCard({ route, isFastest, isSelected, onSelect }: Props) {
  const border = isSelected ? "border-blue-500 ring-2 ring-blue-500/30" : "border-zinc-200 dark:border-zinc-800";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={`w-full rounded-xl border bg-white p-4 text-left transition hover:border-blue-400 dark:bg-zinc-900 ${border}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: route.band.color }}
            />
            <span className="text-sm font-semibold">Route {route.index + 1}</span>
            {route.recommended && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                Recommended
              </span>
            )}
            {isFastest && !route.recommended && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                Fastest
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {route.durationMin.toFixed(0)} min · {route.distanceKm.toFixed(1)} km
          </p>
        </div>
        <div className="text-right">
          <div
            className="text-lg font-bold leading-none"
            style={{ color: route.band.color }}
          >
            {Math.round(route.meanAqi)}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-zinc-500">
            mean AQI
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-zinc-500">Cleanliness</div>
          <div className="font-semibold">{scoreLabel(route.score)} ({route.score})</div>
        </div>
        <div>
          <div className="text-zinc-500">Peak AQI</div>
          <div className="font-semibold">{Math.round(route.peakAqi)}</div>
        </div>
        <div>
          <div className="text-zinc-500">Exposure</div>
          <div className="font-semibold">{Math.round(route.exposureIndex)}</div>
        </div>
      </div>
    </button>
  );
}