"use client";

// Interactive Leaflet map (no API key) rendering the candidate routes as
// polylines coloured by their AQI band.
//
// Built by Omprakash Suthar (@OPBSUTHAR) — https://github.com/OPBSUTHAR/airescout

import { useMemo } from "react";
import { MapContainer, TileLayer, Polyline, Popup, Tooltip } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import type { ScoredRoute } from "@/lib/scoring";
import type { Coord } from "@/lib/aqi-fetch";
import type { CityPreset } from "@/lib/config";
import "leaflet/dist/leaflet.css";

interface Props {
  routes: ScoredRoute[];
  city: CityPreset;
  /** Origin and destination in [lon, lat]. */
  origin: Coord | null;
  destination: Coord | null;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

function toLatLng(c: Coord): LatLngTuple {
  return [c[1], c[0]];
}

export default function RouteMap({
  routes,
  city,
  origin,
  destination,
  selectedIndex,
  onSelect,
}: Props) {
  const center: LatLngTuple = useMemo(() => {
    if (origin) return toLatLng(origin);
    return [city.center[1], city.center[0]];
  }, [origin, city]);

  return (
    <MapContainer
      key={city.id + (origin ? origin.join(",") : "")}
      center={center}
      zoom={12}
      scrollWheelZoom
      className="h-[420px] w-full rounded-xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {origin && (
        <Polyline positions={[]} pathOptions={{ color: "#000", weight: 0 }} />
      )}

      {routes.map((r) => {
        const isSelected = selectedIndex === r.index;
        const positions = r.coords.map(toLatLng);
        return (
          <Polyline
            key={r.index}
            positions={positions}
            pathOptions={{
              color: r.band.color,
              weight: isSelected ? 7 : 4,
              opacity: selectedIndex === null || isSelected ? 0.95 : 0.45,
            }}
            eventHandlers={{ click: () => onSelect(r.index) }}
          >
            <Tooltip sticky>
              Route {r.index + 1} · AQI {Math.round(r.meanAqi)} ·{" "}
              {Math.round(r.durationMin)} min
            </Tooltip>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">
                  Route {r.index + 1}
                  {r.recommended ? " (recommended)" : ""}
                </p>
                <p>Mean AQI: {Math.round(r.meanAqi)}</p>
                <p>Duration: {Math.round(r.durationMin)} min</p>
                <p>Distance: {r.distanceKm.toFixed(1)} km</p>
              </div>
            </Popup>
          </Polyline>
        );
      })}
    </MapContainer>
  );
}