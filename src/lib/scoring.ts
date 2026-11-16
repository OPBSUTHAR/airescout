// Route scoring: turns a route polyline + AQI grid into a comparison table.
//
// The score blends two things a traveller actually cares about:
//   1. How dirty the air is along the path (mean AQI).
//   2. How long you are exposed to it (duration).
//
// Built by Omprakash Suthar (@OPBSUTHAR) — https://github.com/OPBSUTHAR/airescout

import { aqiToScore, bandForAqi, type AqiBand } from "./aqi-bands";
import { fetchAqiBatch, type AqiReading, type Coord } from "./aqi-fetch";
import { resampleLine, type RouteCandidate } from "./routing";
import { SAMPLE_SPACING_M } from "./config";

export interface ScoredRoute extends RouteCandidate {
  /** Mean AQI along the route. */
  meanAqi: number;
  /** Peak (worst) AQI sample along the route. */
  peakAqi: number;
  /** Best (lowest) AQI sample along the route. */
  minAqi: number;
  /** 0-100 cleanliness score, higher is better. */
  score: number;
  /** AQI band for the mean value. */
  band: AqiBand;
  /** Per-sample readings, aligned with the sampled coords. */
  samples: AqiReading[];
  /** Duration in minutes. */
  durationMin: number;
  /** Distance in km. */
  distanceKm: number;
  /** Exposure proxy: mean AQI weighted by duration. Lower is better. */
  exposureIndex: number;
  /** True if this is the cleanest of the compared routes. */
  recommended: boolean;
}

/** Weighted composite ranking (lower is better). */
function rankValue(r: {
  score: number;
  durationMin: number;
  distanceKm: number;
  exposureIndex: number;
}): number {
  // 60% cleanliness, 25% speed, 15% distance.
  return r.score * 0.6 - r.durationMin * 0.25 - r.distanceKm * 15;
}

/**
 * Score a set of candidate routes against live AQI and return them sorted
 * best-first. The cleanest route is flagged `recommended: true`.
 */
export async function scoreRoutes(
  routes: RouteCandidate[],
  fallbackAqi = 80,
): Promise<ScoredRoute[]> {
  if (routes.length === 0) return [];

  // Resample each route for sampling, then fetch all needed AQI in batches.
  const sampled = routes.map((r) => ({
    route: r,
    points: resampleLine(r.coords, SAMPLE_SPACING_M),
  }));

  const allCoords: Coord[] = sampled.flatMap((s) => s.points);

  const readings = await fetchAqiBatch(allCoords, fallbackAqi);

  // Slice the flat readings back into per-route groups.
  let cursor = 0;
  const scored: ScoredRoute[] = sampled.map((s) => {
    const group = readings.slice(cursor, cursor + s.points.length);
    cursor += s.points.length;

    const aqis = group.map((g) => g.aqi);
    const meanAqi = aqis.length
      ? aqis.reduce((a, b) => a + b, 0) / aqis.length
      : fallbackAqi;
    const peakAqi = aqis.length ? Math.max(...aqis) : fallbackAqi;
    const minAqi = aqis.length ? Math.min(...aqis) : fallbackAqi;

    const durationMin = s.route.durationS / 60;
    const distanceKm = s.route.distanceM / 1000;
    const exposureIndex = meanAqi * durationMin;

    return {
      ...s.route,
      meanAqi,
      peakAqi,
      minAqi,
      score: aqiToScore(meanAqi),
      band: bandForAqi(meanAqi),
      samples: group,
      durationMin,
      distanceKm,
      exposureIndex,
      recommended: false,
    };
  });

  // Sort best-first using the composite rank.
  scored.sort((a, b) => rankValue(b) - rankValue(a));

  // The fastest route is a useful reference even if it is not the cleanest.
  const fastest = scored.reduce(
    (best, r) => (r.durationMin < best.durationMin ? r : best),
    scored[0],
  );

  if (scored.length > 0) {
    // Recommend the top-ranked route, unless it is grossly slower than fastest.
    const top = scored[0];
    const slowerThan2x = top.durationMin > fastest.durationMin * 2.5;
    top.recommended = !slowerThan2x || top === fastest;
    if (!top.recommended) fastest.recommended = true;
  }

  return scored;
}

/** Summary of how much cleaner the recommended route is vs the fastest. */
export function exposureSavings(
  recommended: ScoredRoute,
  fastest: ScoredRoute,
): {
  aqiDelta: number;
  percentCleaner: number;
  minutesCost: number;
} {
  const aqiDelta = fastest.meanAqi - recommended.meanAqi;
  const percentCleaner =
    fastest.meanAqi > 0 ? (aqiDelta / fastest.meanAqi) * 100 : 0;
  return {
    aqiDelta: Math.round(aqiDelta),
    percentCleaner: Math.round(percentCleaner),
    minutesCost: Math.round(recommended.durationMin - fastest.durationMin),
  };
}