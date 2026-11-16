// Air-quality band helpers shared by the UI and the scoring engine.
//
// Built by Omprakash Suthar (@OPBSUTHAR) — https://github.com/OPBSUTHAR/airescout

export type AqiLevel = "good" | "moderate" | "poor" | "very-poor" | "severe";

export interface AqiBand {
  level: AqiLevel;
  label: string;
  /** Upper bound (inclusive) of this band in US AQI. */
  max: number;
  /** Tailwind-friendly hex colour for the band. */
  color: string;
  /** Human advice shown in the UI. */
  advice: string;
}

/**
 * Bands follow the US EPA breakpoints for PM2.5, which is what Open-Meteo's
 * `us_aqi` reports. These are deliberately close to India's CPCB bands so the
 * UI reads correctly to Indian users.
 */
export const AQI_BANDS: AqiBand[] = [
  {
    level: "good",
    label: "Good",
    max: 50,
    color: "#22c55e",
    advice: "Air is clean. Great for outdoor activity.",
  },
  {
    level: "moderate",
    label: "Moderate",
    max: 100,
    color: "#eab308",
    advice: "Acceptable. Sensitive people should take it easy outdoors.",
  },
  {
    level: "poor",
    label: "Poor",
    max: 150,
    color: "#f97316",
    advice: "Limit prolonged outdoor exertion, especially for kids and elders.",
  },
  {
    level: "very-poor",
    label: "Very Poor",
    max: 200,
    color: "#ef4444",
    advice: "Avoid long outdoor exposure. Wear an N95 if you must go out.",
  },
  {
    level: "severe",
    label: "Severe",
    max: 500,
    color: "#a21caf",
    advice: "Health emergency levels. Stay indoors and run an air purifier.",
  },
];

/** Return the band for a numeric AQI value. */
export function bandForAqi(aqi: number): AqiBand {
  const clamped = Math.max(0, aqi);
  for (const band of AQI_BANDS) {
    if (clamped <= band.max) return band;
  }
  return AQI_BANDS[AQI_BANDS.length - 1];
}

/** Format an AQI number for display, e.g. 172 -> "172". */
export function formatAqi(aqi: number): string {
  return Math.round(aqi).toString();
}

/**
 * Convert a mean AQI over a route into a 0-100 "cleanliness score" where
 * higher is better. 100 = AQI 0, 0 = AQI 300+.
 */
export function aqiToScore(meanAqi: number): number {
  const clamped = Math.max(0, Math.min(300, meanAqi));
  return Math.round(100 - (clamped / 300) * 100);
}

/** Qualitative label for a cleanliness score. */
export function scoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  if (score >= 20) return "Poor";
  return "Very Poor";
}