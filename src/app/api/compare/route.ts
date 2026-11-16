// POST /api/compare
//
// Body: { from: [lon,lat], to: [lon,lat] }
// Returns: scored routes, ranked best-first, plus metadata.
//
// Built by Omprakash Suthar (@OPBSUTHAR) — https://github.com/OPBSUTHAR/airescout

import { NextRequest, NextResponse } from "next/server";
import { fetchRoutes, type RouteCandidate } from "@/lib/routing";
import { scoreRoutes } from "@/lib/scoring";
import type { Coord } from "@/lib/aqi-fetch";
import { RESULT_CACHE_TTL_MS } from "@/lib/config";

/** In-memory result cache keyed by origin|destination. */
const resultCache = new Map<
  string,
  { value: unknown; expires: number }
>();

function isValidCoord(v: unknown): v is Coord {
  return (
    Array.isArray(v) &&
    v.length === 2 &&
    typeof v[0] === "number" &&
    typeof v[1] === "number" &&
    Number.isFinite(v[0]) &&
    Number.isFinite(v[1]) &&
    v[0] >= -180 && v[0] <= 180 &&
    v[1] >= -90 && v[1] <= 90
  );
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const payload = body as { from?: unknown; to?: unknown } | null;
  if (!payload || !isValidCoord(payload.from) || !isValidCoord(payload.to)) {
    return NextResponse.json(
      { error: "Both `from` and `to` must be [longitude, latitude] numbers." },
      { status: 400 },
    );
  }

  const from = payload.from;
  const to = payload.to;
  const cacheKey = `${from[0].toFixed(3)},${from[1].toFixed(3)}|${to[0].toFixed(3)},${to[1].toFixed(3)}`;

  const cached = resultCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.value, {
      headers: { "X-Airescout-Cache": "HIT" },
    });
  }

  const rawRoutes: RouteCandidate[] = await fetchRoutes(from, to);
  if (rawRoutes.length === 0) {
    return NextResponse.json(
      { error: "No routes found for these coordinates." },
      { status: 422 },
    );
  }

  const scored = await scoreRoutes(rawRoutes);

  const result = {
    origin: from,
    destination: to,
    generatedAt: new Date().toISOString(),
    routeCount: scored.length,
    routes: scored,
    fastest: scored.reduce(
      (best, r) => (r.durationMin < best.durationMin ? r : best),
      scored[0],
    ).index,
    recommended: scored.find((r) => r.recommended)?.index ?? scored[0].index,
  };

  resultCache.set(cacheKey, {
    value: result,
    expires: Date.now() + RESULT_CACHE_TTL_MS,
  });

  return NextResponse.json(result, {
    headers: {
      "X-Airescout-Cache": "MISS",
      "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
    },
  });
}