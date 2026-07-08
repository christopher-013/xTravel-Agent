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
- `plan-x-guide-centered-compass-morph-clean-x.svg` — animated PlanToGuide logo
- `TRIP-PLAN.md` — human-readable source of truth with embedded trip JSON
- `TRIP-DATA.json` — full machine-readable trip data, including local photo data when available
- `AGENT-INSTRUCTIONS.md` — editing rules for AI agents
- `assets/` — available bundled banners and place images

## Featured example

[Tokyo 2026 Family Trip](https://christopher-013.github.io/Tokyo2026/) demonstrates the richer target experience: daily routes, locked bookings, maps, food, shopping, weather, practical information, notes, and photos.

## Run locally

Open `index.html` directly, or run:

```powershell
powershell -ExecutionPolicy Bypass -File .\dev-server.ps1
```

Then visit `http://127.0.0.1:8767`.

The browser edition requires no account or API key. Optional live weather uses keyless Open-Meteo endpoints.
