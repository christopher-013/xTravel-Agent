# Standalone PlanToGuide

The standalone edition is a static browser application. It does not use OpenAI, ChatGPT, an API key, Node.js, a database, or a backend server. It optionally reads current conditions from Open-Meteo's keyless public weather and geocoding endpoints; the bundled seasonal estimate remains available if that request fails.

## Application files

- `index.html` — questionnaire and report structure
- `styles.css` — full-screen responsive presentation
- `app.js` — destination catalog, itinerary generation, navigation, weather estimates, and browser storage
- `trip-schema.js` — versioned export/import schema and AI handoff
- `export-styles.js` — bundled stylesheet fallback used by ZIP export
- `icon-source.js` — bundled logo fallback used by standalone export
- `plan-x-guide-centered-compass-morph-clean-x.svg` — animated application logo

The optional ChatGPT App files in this repository are not loaded by the standalone application and are excluded from the GitHub Pages deployment artifact.

## Run it

Double-click `index.html`, or use the included local static server:

```powershell
powershell -ExecutionPolicy Bypass -File .\dev-server.ps1
```

Then open `http://127.0.0.1:8767`.

## Publish it on GitHub Pages

The `standalone-pages.yml` workflow packages the seven required files: `index.html`, `styles.css`, `app.js`, `trip-schema.js`, `export-styles.js`, `icon-source.js`, and `plan-x-guide-centered-compass-morph-clean-x.svg`. In the repository settings, set **Pages → Source** to **GitHub Actions**, then push to the `main` branch.

## Privacy and cost

- No account or API key is requested.
- No OpenAI or metered API is called by the application.
- Trip drafts remain in the visitor's browser using `localStorage`.
- The Content Security Policy permits the resources the app uses: same-origin files, Google Fonts, HTTPS and local photo images, Open-Meteo weather/geocoding, Wikipedia image lookup, and Google Maps embeds.
- Public visitors cannot create OpenAI usage charges for the owner.

The recommendations and weather card are planning estimates from the application's bundled demo data. Travelers should verify schedules, reservations, prices, and live weather independently.
