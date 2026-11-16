// Central runtime configuration. All tunables live here so the UI and engine
// share one source of truth.
//
// Built by Omprakash Suthar (@OPBSUTHAR) — https://github.com/OPBSUTHAR/airescout

/** Public, keyless Open-Meteo air-quality endpoint. No API key required. */
export const AQI_ENDPOINT = "https://air-quality-api.open-meteo.com/v1/air-quality";

/** Public, keyless OSRM demo routing server. No API key required. */
export const OSRM_ENDPOINT = "https://router.project-osrm.org/route/v1/driving";

/**
 * Sampling grid spacing in metres. The route polyline is sampled every N
 * metres and each sample is matched to the nearest AQI grid point.
 * 2.5 km keeps requests low while staying street-level useful.
 */
export const SAMPLE_SPACING_M = 2500;

/** How many alternatives OSRM should return when comparing routes. */
export const ROUTE_ALTERNATIVES = 3;

/** Max points we will send to the AQI API in one request. */
export const MAX_AQI_BATCH = 100;

/** How long a route comparison result is cached client-side (ms). */
export const RESULT_CACHE_TTL_MS = 5 * 60 * 1000;

/** In-memory cache TTL for AQI lookups (ms). AQI updates hourly. */
export const AQI_CACHE_TTL_MS = 60 * 60 * 1000;

/** Named Indian cities with a bounding-box centre. Used for the city picker. */
export interface CityPreset {
  id: string;
  name: string;
  state: string;
  /** [longitude, latitude] as required by OSRM. */
  center: [number, number];
}

export const CITY_PRESETS: CityPreset[] = [
  { id: "delhi", name: "New Delhi", state: "Delhi", center: [77.209, 28.6139] },
  { id: "mumbai", name: "Mumbai", state: "Maharashtra", center: [72.8777, 19.076] },
  { id: "bengaluru", name: "Bengaluru", state: "Karnataka", center: [77.5946, 12.9716] },
  { id: "kolkata", name: "Kolkata", state: "West Bengal", center: [88.3639, 22.5726] },
  { id: "chennai", name: "Chennai", state: "Tamil Nadu", center: [80.2707, 13.0827] },
  { id: "hyderabad", name: "Hyderabad", state: "Telangana", center: [78.4867, 17.385] },
  { id: "pune", name: "Pune", state: "Maharashtra", center: [73.8567, 18.5204] },
  { id: "jaipur", name: "Jaipur", state: "Rajasthan", center: [75.7873, 26.9124] },
  { id: "lucknow", name: "Lucknow", state: "Uttar Pradesh", center: [80.9462, 26.8467] },
  { id: "patna", name: "Patna", state: "Bihar", center: [85.1376, 25.5941] },
];