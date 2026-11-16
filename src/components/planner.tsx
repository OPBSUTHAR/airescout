"use client";

// AirScout planner: city picker, origin/destination inputs, route compare.
//
// Built by Omprakash Suthar (@OPBSUTHAR) — https://github.com/OPBSUTHAR/airescout

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { CITY_PRESETS, type CityPreset } from "@/lib/config";
import type { ScoredRoute } from "@/lib/scoring";
import type { Coord } from "@/lib/aqi-fetch";
import { exposureSavings } from "@/lib/scoring";
import RouteCard from "./route-card";
import ExposureTimeline from "./exposure-timeline";

const RouteMap = dynamic(() => import("./route-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] w-full animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
  ),
});

interface CompareResponse {
  origin: Coord;
  destination: Coord;
  generatedAt: string;
  routeCount: number;
  routes: ScoredRoute[];
  fastest: number;
  recommended: number;
}

/** Rough helper: turn a "lat, lon" string into a [lon, lat] pair. */
function parseLatLon(input: string): Coord | null {
  const m = input.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lon = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lon < -180 || lon > 180 || lat < -90 || lat > 90) return null;
  return [lon, lat];
}

export default function Planner() {
  const [city, setCity] = useState<CityPreset>(CITY_PRESETS[0]);
  const [fromText, setFromText] = useState("");
  const [toText, setToText] = useState("");
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  const clearResult = useCallback(() => {
    setResult(null);
    setSelected(null);
    setError(null);
  }, []);

  // Prefill origin/destination from the city centre on city change.
  useEffect(() => {
    const c = city.center;
    setFromText(`${(c[1] - 0.02).toFixed(4)}, ${c[0].toFixed(4)}`);
    setToText(`${(c[1] + 0.02).toFixed(4)}, ${c[0].toFixed(4)}`);
    clearResult();
  }, [city, clearResult]);

  async function compare() {
    const from = parseLatLon(fromText);
    const to = parseLatLon(toText);
    if (!from || !to) {
      setError("Enter both points as \"lat, lon\" (for example 28.61, 77.21).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? `Request failed (${res.status}).`);
      }
      const data = (await res.json()) as CompareResponse;
      setResult(data);
      setSelected(data.recommended);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const selectedRoute =
    result?.routes.find((r) => r.index === selected) ?? null;
  const fastestRoute =
    result?.routes.find((r) => r.index === result.fastest) ?? null;
  const savings =
    selectedRoute && fastestRoute && selectedRoute.index !== fastestRoute.index
      ? exposureSavings(selectedRoute, fastestRoute)
      : null;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">City</span>
            <select
              value={city.id}
              onChange={(e) => {
                const c = CITY_PRESETS.find((x) => x.id === e.target.value);
                if (c) setCity(c);
              }}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              {CITY_PRESETS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}, {c.state}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">From (lat, lon)</span>
            <input
              value={fromText}
              onChange={(e) => setFromText(e.target.value)}
              placeholder="28.61, 77.21"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">To (lat, lon)</span>
            <input
              value={toText}
              onChange={(e) => setToText(e.target.value)}
              placeholder="28.65, 77.23"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={compare}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Comparing…" : "Compare routes"}
          </button>
          <button
            type="button"
            onClick={() => {
              const a = fromText;
              setFromText(toText);
              setToText(a);
              clearResult();
            }}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Swap
          </button>
          {error && (
            <span className="text-sm text-red-600" role="alert">
              {error}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Map */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <RouteMap
            routes={result?.routes ?? []}
            city={city}
            origin={result?.origin ?? null}
            destination={result?.destination ?? null}
            selectedIndex={selected}
            onSelect={setSelected}
          />
        </div>

        {/* Results */}
        <div className="space-y-3">
          {!result && (
            <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
              Compare two points to see which route has cleaner air.
            </div>
          )}

          {result?.routes.map((r) => (
            <RouteCard
              key={r.index}
              route={r}
              isFastest={r.index === result.fastest}
              isSelected={selected === r.index}
              onSelect={() => setSelected(r.index)}
            />
          ))}

          {savings && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
              {savings.percentCleaner > 0 ? (
                <>
                  This route is{" "}
                  <strong>{savings.percentCleaner}% cleaner air</strong> than the
                  fastest route
                  {savings.minutesCost > 0
                    ? `, costing about ${savings.minutesCost} extra min.`
                    : " with no extra time."}
                </>
              ) : (
                <>This is already the fastest and cleanest option.</>
              )}
            </div>
          )}
        </div>
      </div>

      <ExposureTimeline route={selectedRoute} />
    </div>
  );
}