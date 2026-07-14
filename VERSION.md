# PlanToGuide — Version 3 working copy

This root folder is now the active V3 workspace for `PlanToGuide`, started from the completed V2 snapshot on 2026-07-10.

## Version snapshots

- `versions/v1` preserves the original Version 1 app.
- `versions/v2` preserves the completed Version 2 app before new V3 changes.
- `versions/v3` is a clean starter copy of this V3 baseline.

## V3 starting point

V3 begins from the polished PlanToGuide V2 app, including:

- Five-step trip intake workflow.
- Browser-only starter generation for supported and unsupported destinations.
- Shareable mobile travel guide output.
- AI-ready planning/export workflow.
- Photo uploads, bookings, food, shop, maps, itinerary, and AI Export tabs.
- Plan × Guide / PlanToGuide branding and animated compass logo.

Use this workspace for new V3 experiments and larger product changes.

## Phase 1 started

- Added builder PWA metadata (`manifest.webmanifest`), service worker (`sw.js`), and install icons (`icons/`).
- Added exported-guide PWA files to Website ZIP generation.
- Updated the GitHub Pages workflow and standalone docs to ship the new static files.

## Phase 2 verified

- Added IndexedDB-backed photo payload storage through `photo-store.js`.
- Kept photo metadata in `localStorage` while moving resized image data out of the 5MB storage path.
- Verified 25+ photo upload, refresh rendering, ZIP export photo data, deletion cleanup, IndexedDB fallback, and legacy localStorage photo migration.

## Phase 3 implemented

- Hardened import parsing with truncation detection for incomplete `plantoguide-trip` / `xtravel-trip` JSON blocks.
- Added import-dialog pre-check messaging and capped validation error lists.
- Sanitized imported/exported icons and hardened remaining icon render paths that use `innerHTML`.

## Phase 4 implemented

- Replaced blocking `alert`/`prompt` dialogs with a non-blocking toast notification system (`showToast`).
- Added a manual-copy toast fallback with a selectable, read-only textarea when `navigator.clipboard` access is blocked.

## Phase 5 release procedure

1. Update the version string in `version.js`.
2. Update the shared `?v=` value in `index.html` to the same version.
3. Confirm the service worker creates `plantoguide-<version>` and removes older PlanToGuide caches.

## Phase 6 implemented

- Added a neutral destination availability badge on Step 1.
- Catalog destinations show detailed local data availability; unsupported destinations show starter research mode.
- Starter destinations now show a Step 2 note explaining that suggestions are limited and preserved for AI research.

## Phase 7 implemented

- Moved the full destination catalog and known-destination list into `catalogs.json`.
- Kept a Tokyo/Japan embedded fallback for `file://` and catalog fetch failures.
- Added `catalogs.json` to hosted/offline deployment files.

## Phase 9 implemented

- Added `dynamic-catalog.js` for unsupported destination research using only keyless Open-Meteo, Wikivoyage, and Wikipedia endpoints.
- Added a three-tier recommendation flow: curated catalog, live research catalog, then starter fallback.
- Cached dynamic catalogs in browser `localStorage` with a 30-day TTL and size guard.
- Added source credit rendering for public-source suggestions while keeping imported text escaped and inert.

## v3.2.0 fixes

- Allowed OpenStreetMap Overpass requests in the CSP so food/shopping OSM results are no longer silently blocked.
- Made destination research non-blocking: Next advances immediately, research continues in the background, and the suggestion board updates in place when it resolves.
- Fixed dynamic-catalog city matching to key off destination/geocode name only (never country or admin1), so nearby cities in the same country no longer inherit the wrong catalog; bumped the `localStorage` cache namespace to `ptg:dyncat2:`.
- Scoped service worker cache deletion so the builder, exported guides, and other apps on the same origin never delete each other's caches.
- Excluded the large planning files (`TRIP-PLAN.md`, `TRIP-DATA.json`, `AGENT-INSTRUCTIONS.md`, `README.md`) from the exported guide's service worker precache list.
- Fixed re-encoded mojibake (`â€"`) across tracked docs and added `.gitattributes` line-ending rules.
- Simplified `version.js` to a single `globalThis.PLANTOGUIDE_VERSION` assignment and bumped the release to 3.2.0.
- Filtered non-attraction Wikipedia geosearch results (stations beyond the nearest one, schools, faculties, and administrative-boundary articles) out of dynamic catalogs.
- Removed fabricated per-seed stock photos and the unreachable New York seed catalog; seeded cards now rely on the existing Wikipedia image lookup.
- Parallelized the Wikipedia category fetches in dynamic catalog research.
