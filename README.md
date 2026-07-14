# PlanToGuide

Create a polished trip website, then keep improving it with ChatGPT, Claude, Codex, or another AI assistant.

## Core workflow

1. **Generate:** Complete the five-step wizard. The browser builds a day-by-day trip website with bookings and constraints preserved.
2. **Export:** Download the website ZIP or `TRIP-PLAN.md`. The planning file includes versioned, machine-readable trip data.
3. **Enrich:** Give the planning file to your preferred AI assistant. It is instructed to preserve confirmed items and return the complete updated file.
4. **Import:** Choose **Import updated plan** in PlanToGuide. Paste or upload the returned file to re-render the website.
5. **Publish:** Export again and host the static files on GitHub Pages, Netlify Drop, or another static host.

See [SCHEMA.md](SCHEMA.md) for the `plantoguide-trip` v3 schema and legacy v2 import rules.

## Export contents

- `index.html`, `styles.css`, and `app.js` — complete static trip website
- `manifest.webmanifest`, `sw.js`, and `icons/` — installable/offline support once hosted over HTTPS and opened once
- `plan-x-guide-centered-compass-morph-clean-x.svg` — animated PlanToGuide logo
- `TRIP-PLAN.md` — human-readable source of truth with embedded trip JSON
- `TRIP-DATA.json` — full machine-readable trip data, including local photo data when available
- `AGENT-INSTRUCTIONS.md` — editing rules for AI agents
- `assets/` — available bundled banners and place images

The hosted PlanToGuide builder also ships `catalogs.json` so detailed destination suggestions can be cached offline; direct `file://` use falls back to the embedded Tokyo/Japan starter catalog.

## Dynamic destination catalogs

Recommendation tiers are intentionally layered:

1. Curated browser catalogs from `catalogs.json`.
2. Keyless live research catalogs for unsupported destinations using Open-Meteo geocoding plus Wikivoyage/Wikipedia public APIs.
3. Starter mode with placeholder cards, research checklists, and AI-ready prompts when live research does not return enough usable signal.

Live research catalog items are planning starters and are labeled for verification. They do not provide current live facts such as hours, closures, prices, ratings, ticket availability, or reservations.

## Photo storage

Uploaded photo metadata stays in `localStorage`; resized image data is stored in IndexedDB through `photo-store.js` so larger journals do not hit the smaller `localStorage` quota. `TRIP-PLAN.md` remains metadata-only for AI handoff, while `TRIP-DATA.json` includes local photo data when available for round-trip export.

## Featured example

[Tokyo 2026 Family Trip](https://christopher-013.github.io/Tokyo2026/) demonstrates the richer target experience: daily routes, locked bookings, maps, food, shopping, weather, practical information, notes, and photos.

## Run locally

Open `index.html` directly, or run:

```powershell
powershell -ExecutionPolicy Bypass -File .\dev-server.ps1
```

Then visit `http://127.0.0.1:8767`.

The browser edition requires no account or API key. Optional live weather and dynamic destination research use keyless public endpoints.
