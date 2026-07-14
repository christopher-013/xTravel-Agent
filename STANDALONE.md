# Standalone PlanToGuide

The standalone edition is a static browser application. It does not use OpenAI, ChatGPT, an API key, Node.js, a database, or a backend server. It optionally reads current conditions from Open-Meteo's keyless public weather and geocoding endpoints; the bundled seasonal estimate remains available if that request fails.

For unsupported destinations, hosted/http deployments can also build a keyless live research catalog from Open-Meteo geocoding plus Wikivoyage/Wikipedia public APIs. If those requests fail, are blocked, or return too little useful data, the app remains functional in starter mode.

## Application files

- `index.html` — questionnaire and report structure
- `version.js` — shared release version used by the app and service worker cache
- `catalogs.json` — detailed destination suggestions loaded by hosted/http deployments
- `dynamic-catalog.js` — keyless live destination research for unsupported places
- `styles.css` — full-screen responsive presentation
- `app.js` — destination catalog, itinerary generation, navigation, weather estimates, and browser storage
- `trip-schema.js` — versioned export/import schema and AI handoff
- `export-styles.js` — bundled stylesheet fallback used by ZIP export
- `icon-source.js` — bundled logo fallback used by standalone export
- `photo-store.js` — IndexedDB photo payload storage used by the browser app
- `plan-x-guide-centered-compass-morph-clean-x.svg` — animated application logo
- `manifest.webmanifest` and `sw.js` — installable/offline support for the hosted builder
- `icons/icon-192.png` and `icons/icon-512.png` — home-screen install icons

The optional ChatGPT App files in this repository are not loaded by the standalone application and are excluded from the GitHub Pages deployment artifact.

## Run it

Double-click `index.html`, or use the included local static server:

```powershell
powershell -ExecutionPolicy Bypass -File .\dev-server.ps1
```

Then open `http://127.0.0.1:8767`.

## Publish it on GitHub Pages

The `standalone-pages.yml` workflow packages the required static app files, including `index.html`, `version.js`, `catalogs.json`, `dynamic-catalog.js`, `styles.css`, `app.js`, `trip-schema.js`, `export-styles.js`, `icon-source.js`, `photo-store.js`, `plan-x-guide-centered-compass-morph-clean-x.svg`, `manifest.webmanifest`, `sw.js`, and the `icons/` folder. In the repository settings, set **Pages → Source** to **GitHub Actions**, then push to the `main` branch.

## Privacy and cost

- No account or API key is requested.
- No OpenAI or metered API is called by the application.
- Trip drafts remain in the visitor's browser using `localStorage`; uploaded photo image data is kept locally in IndexedDB.
- The Content Security Policy permits the resources the app uses: same-origin files, Google Fonts, HTTPS and local photo images, Open-Meteo weather/geocoding, Wikivoyage/Wikipedia/OpenStreetMap public-source lookups, and Google Maps embeds.
- Public visitors cannot create OpenAI usage charges for the owner.

The recommendations and weather card are planning estimates from the application's bundled demo data. Travelers should verify schedules, reservations, prices, and live weather independently.
