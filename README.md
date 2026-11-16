# AirScout

Clean-air routing for Indian cities. Compare driving routes by the air you actually
breathe along them — not just the minutes saved.

- Live AQI from the [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api) (no key).
- Driving routes from [OSRM](http://project-osrm.org/) (no key).
- Map tiles from [OpenStreetMap](https://www.openstreetmap.org/) (no key).

Built by [Omprakash Suthar (@OPBSUTHAR)](https://github.com/OPBSUTHAR).

## Problem

In Indian cities, the shortest route is rarely the healthiest one. A 15-minute
shorter trip through a traffic corridor can mean an hour of concentrated PM2.5
exposure. Existing routers optimise for time and distance only.

AirScout scores each candidate path by the air quality along it, and tells you
what the cleaner route costs you in minutes.

## Quick start

```bash
git clone https://github.com/OPBSUTHAR/airescout.git
cd airescout
npm ci
npm run dev
```

Open http://localhost:3000.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint (flat config) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests |

## Architecture

```
src/
├── app/
│   ├── page.tsx              # Landing + planner
│   └── api/compare/route.ts  # POST /api/compare
├── components/
│   ├── planner.tsx           # Controls, orchestration
│   ├── route-map.tsx         # Leaflet map (client-only)
│   ├── route-card.tsx        # Per-route comparison card
│   └── exposure-timeline.tsx # Per-sample AQI profile
└── lib/
    ├── config.ts             # Tunables, city presets
    ├── aqi-bands.ts          # AQI bands + helpers
    ├── aqi-fetch.ts          # Open-Meteo client + cache
    ├── routing.ts            # OSRM client + resampling
    └── scoring.ts            # Scoring + recommendation
```

## Data sources

| Source | Endpoint | Key required |
| --- | --- | --- |
| Open-Meteo Air Quality | `air-quality-api.open-meteo.com` | No |
| OSRM demo server | `router.project-osrm.org` | No |
| OpenStreetMap tiles | `tile.openstreetmap.org` | No (follow usage policy) |

AQI bands follow the US EPA breakpoints for PM2.5, which is what Open-Meteo's
`us_aqi` reports. They are deliberately close to India's CPCB bands so the UI
reads correctly to Indian users.

## Roadmap

See the GitHub Project board and milestones for M1–M8. Upcoming work:
- M5: exposure timeline polish
- M6: GitHub Actions CI + GitHub Pages docs
- M7: Vitest + Playwright + Lighthouse CI
- M8: monitoring, CHANGELOG, v1.0.0 release

## Contributing

Issues and PRs are welcome. Please open a tracking issue first for anything
non-trivial. All code is credited to Omprakash Suthar (@OPBSUTHAR).

## License

MIT — see `LICENSE`.
```

## Author

Omprakash Suthar (@OPBSUTHAR) — https://github.com/OPBSUTHAR