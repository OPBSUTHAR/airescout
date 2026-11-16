// Vitest tests for AQI bands, routing and scoring helpers.
//
// Built by Omprakash Suthar (@OPBSUTHAR) — https://github.com/OPBSUTHAR/airescout

import { describe, expect, it } from "vitest";
import {
  AQI_BANDS,
  aqiToScore,
  bandForAqi,
  scoreLabel,
} from "@/lib/aqi-bands";
import { distanceMeters, resampleLine } from "@/lib/routing";
import { aqiToScore as aqiScore2 } from "@/lib/aqi-bands";

describe("aqi-bands", () => {
  it("maps AQI to the correct band", () => {
    expect(bandForAqi(40).level).toBe("good");
    expect(bandForAqi(80).level).toBe("moderate");
    expect(bandForAqi(130).level).toBe("poor");
    expect(bandForAqi(180).level).toBe("very-poor");
    expect(bandForAqi(250).level).toBe("severe");
  });

  it("clamps negative AQI to the first band", () => {
    expect(bandForAqi(-5).level).toBe("good");
  });

  it("converts AQI to a 0-100 cleanliness score", () => {
    expect(aqiToScore(0)).toBe(100);
    expect(aqiToScore(300)).toBe(0);
    expect(aqiToScore(150)).toBe(50);
  });

  it("label helpers", () => {
    expect(scoreLabel(90)).toBe("Excellent");
    expect(scoreLabel(40)).toBe("Fair");
    expect(scoreLabel(10)).toBe("Very Poor");
  });

  it("bands are ordered by max ascending", () => {
    const maxes = AQI_BANDS.map((b) => b.max);
    for (let i = 1; i < maxes.length; i++) {
      expect(maxes[i]).toBeGreaterThan(maxes[i - 1]);
    }
  });

  it("aqiScore2 matches aqiToScore", () => {
    expect(aqiScore2(120)).toBe(aqiToScore(120));
  });
});

describe("routing helpers", () => {
  it("distanceMeters is symmetric and sane", () => {
    const a: [number, number] = [77.209, 28.6139];
    const b: [number, number] = [77.2167, 28.6448];
    const d1 = distanceMeters(a, b);
    const d2 = distanceMeters(b, a);
    expect(d1).toBeCloseTo(d2, 3);
    expect(d1).toBeGreaterThan(3000);
    expect(d1).toBeLessThan(6000);
  });

  it("resampleLine keeps endpoints", () => {
    const line: [number, number][] = [
      [77.2, 28.6],
      [77.21, 28.61],
      [77.22, 28.62],
      [77.23, 28.63],
    ];
    const out = resampleLine(line, 500);
    expect(out[0]).toEqual(line[0]);
    expect(out[out.length - 1]).toEqual(line[line.length - 1]);
  });

  it("resampleLine handles tiny lines", () => {
    const line: [number, number][] = [[77.2, 28.6]];
    expect(resampleLine(line, 500)).toEqual(line);
  });
});