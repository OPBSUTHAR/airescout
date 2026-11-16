// OSRM routing client: returns candidate routes as coordinate polylines.
//
// Built by Omprakash Suthar (@OPBSUTHAR) — https://github.com/OPBSUTHAR/airescout

import { OSRM_ENDPOINT, ROUTE_ALTERNATIVES } from "./config";
import type { Coord } from "./aqi-fetch";

export interface RouteCandidate {
  /** OSRM route index. */
  index: number;
  /** Full polyline as [lon, lat] pairs. */
  coords: Coord[];
  /** Distance in metres. */
  distanceM: number;
  /** Duration in seconds (free-flow estimate). */
  durationS: number;
}

interface OsrmRoute {
  distance: number;
  duration: number;
  geometry: { coordinates: Coord[] };
}

interface OsrmResponse {
  code: string;
  routes?: OsrmRoute[];
}

/**
 * Request up to ROUTE_ALTERNATIVES driving routes between two points.
 * Returns an empty array if routing fails (offline, no coverage, etc.).
 */
export async function fetchRoutes(
  from: Coord,
  to: Coord,
): Promise<RouteCandidate[]> {
  const url = `${OSRM_ENDPOINT}/${from[0]},${from[1]};${to[0]},${to[1]}` +
    `?alternatives=true&overview=full&geometries=geojson&steps=false`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = (await res.json()) as OsrmResponse;
    if (json.code !== "Ok" || !json.routes?.length) return [];
    return json.routes.slice(0, ROUTE_ALTERNATIVES).map((r, index) => ({
      index,
      coords: r.geometry.coordinates,
      distanceM: r.distance,
      durationS: r.duration,
    }));
  } catch {
    return [];
  }
}

/**
 * Resample a polyline so that consecutive points are at most `spacingM`
 * metres apart. Uses a haversine approximation — good enough for AQI sampling.
 */
export function resampleLine(
  coords: Coord[],
  spacingM: number,
): Coord[] {
  if (coords.length < 2) return coords.slice();

  const out: Coord[] = [coords[0]];
  let last = coords[0];

  for (let i = 1; i < coords.length; i++) {
    const cur = coords[i];
    const d = distanceMeters(last, cur);
    if (d >= spacingM) {
      out.push(cur);
      last = cur;
    }
  }
  // Always include the destination.
  const finalPt = coords[coords.length - 1];
  const tail = out[out.length - 1];
  if (tail[0] !== finalPt[0] || tail[1] !== finalPt[1]) out.push(finalPt);
  return out;
}

/** Great-circle distance in metres (haversine). */
export function distanceMeters(a: Coord, b: Coord): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}