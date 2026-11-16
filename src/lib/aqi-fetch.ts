// AQI data layer: batch point sampling against the keyless Open-Meteo API,
// with an in-memory TTL cache and graceful degradation.
//
// Built by Omprakash Suthar (@OPBSUTHAR) — https://github.com/OPBSUTHAR/airescout

import {
  AQI_CACHE_TTL_MS,
  AQI_ENDPOINT,
  MAX_AQI_BATCH,
} from "./config";

/** A single coordinate pair as [lon, lat]. */
export type Coord = [number, number];

export interface AqiReading {
  lon: number;
  lat: number;
  aqi: number;
  pm25: number | null;
  pm10: number | null;
  /** ISO timestamp of the reading, or null if unavailable. */
  measuredAt: string | null;
}

interface CacheEntry {
  value: AqiReading;
  expires: number;
}

const cache = new Map<string, CacheEntry>();

function coordKey(lon: number, lat: number): string {
  // Round to ~1 km grid so nearby samples share a reading.
  return `${lon.toFixed(2)},${lat.toFixed(2)}`;
}

/** Fetch AQI for a single point. Returns null on any failure. */
export async function fetchAqi(lon: number, lat: number): Promise<AqiReading | null> {
  const key = coordKey(lon, lat);
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;

  const url = `${AQI_ENDPOINT}?latitude=${lat}&longitude=${lon}` +
    `&current=us_aqi,pm2_5,pm10&timezone=Asia%2FKolkata`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      current?: { us_aqi?: number; pm2_5?: number; pm10?: number; time?: string };
    };
    const cur = json.current;
    if (!cur || typeof cur.us_aqi !== "number" || !Number.isFinite(cur.us_aqi)) {
      return null;
    }
    const reading: AqiReading = {
      lon,
      lat,
      aqi: cur.us_aqi,
      pm25: cur.pm2_5 ?? null,
      pm10: cur.pm10 ?? null,
      measuredAt: cur.time ?? null,
    };
    cache.set(key, { value: reading, expires: Date.now() + AQI_CACHE_TTL_MS });
    return reading;
  } catch {
    return null;
  }
}

/** Chunk an array into fixed-size groups. */
function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/**
 * Fetch AQI for many points. Points are batched to MAX_AQI_BATCH per request.
 * Missing readings fall back to a neutral value so scoring never throws.
 */
export async function fetchAqiBatch(
  coords: Coord[],
  fallbackAqi = 80,
): Promise<AqiReading[]> {
  const results: AqiReading[] = [];

  for (const batch of chunk(coords, MAX_AQI_BATCH)) {
    const lats = batch.map((c) => c[1]).join(",");
    const lons = batch.map((c) => c[0]).join(",");
    const url = `${AQI_ENDPOINT}?latitude=${lats}&longitude=${lons}` +
      `&current=us_aqi,pm2_5,pm10&timezone=Asia%2FKolkata`;

    let payload: unknown = null;
    try {
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (res.ok) payload = await res.json();
    } catch {
      payload = null;
    }

    const arr = Array.isArray(payload) ? payload : [payload];
    batch.forEach((coord, i) => {
      const entry = arr[i] as
        | { current?: { us_aqi?: number; pm2_5?: number; pm10?: number; time?: string } }
        | undefined;
      const cur = entry?.current;
      const valid =
        typeof cur?.us_aqi === "number" && Number.isFinite(cur.us_aqi);
      results.push({
        lon: coord[0],
        lat: coord[1],
        aqi: valid ? (cur!.us_aqi as number) : fallbackAqi,
        pm25: valid ? (cur!.pm2_5 ?? null) : null,
        pm10: valid ? (cur!.pm10 ?? null) : null,
        measuredAt: valid ? (cur!.time ?? null) : null,
      });
    });
  }

  return results;
}

/** Clear the AQI cache (used by tests). */
export function clearAqiCache(): void {
  cache.clear();
}