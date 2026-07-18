# PlanToGuide — Version 3 working copy

## v3.4.0 research reliability release

- Precomputes research catalogs for ~60 top tourist cities at deploy time (`build-precomputed-catalogs.mjs` in the Pages workflow), shipped as `precomputed-catalogs.json`, so most destinations resolve instantly without touching the rate-limited runtime research path.
- Sends the documented `Api-User-Agent` header on every Wikimedia request so the app leaves the strictest anonymous rate-limit bucket.
- Cuts the research request budget roughly in half: category discovery collapsed from eight searches to two, static category names trimmed and deduplicated against discovered ones, and the merged list capped at eight.
- Adds a Wikimedia circuit breaker: the first 429 stops all further Wikimedia requests (including image lookups) until the Retry-After window passes, instead of retrying into the penalty.
- Fails loudly when research is rate limited: Step 2 explains "Live research is busy — showing starter suggestions" with a Retry button, instead of silently rendering placeholders; rate-limited image lookups are skipped without caching the miss.

## v3.3.7 Adventure step viewport sizing

- Expands the desktop Places to see panel to use available vertical space.
- Gives mobile the same contained, no-page-scroll layout while keeping the suggestion list internally scrollable.

## v3.3.6 Trip Basics card order

- Restores the AI-updated-plan import panel beside the Tokyo example on wider screens.
- Places the five deliverable previews beneath both cards across the banner width.
- Uses the same example → import → deliverables order on smaller screens.

## v3.3.5 Trip Basics showcase alignment

- Keeps the Tokyo example above the output preview.
- Places the AI-updated-plan import panel inline at the bottom right of the deliverable cards on wider screens.
- Preserves a clear example → deliverables → import sequence on smaller screens.

## v3.3.4 deliverable explanations

- Moves the static deliverables preview beneath the example and AI import panels.
- Adds detailed mouse-hover and keyboard-focus explanations for every deliverable.
- Expands focused cards on touch-sized screens so the same details remain available without a mouse.

## v3.3.3 Trip Basics output preview

- Adds five static deliverable cards beneath the PLAN TO GUIDE hero message.
- Places the output preview beside the Tokyo example and AI-plan import options on desktop.
- Uses a compact horizontally scrollable card strip on mobile.

## v3.3.2 larger dissolving deliverables

- Enlarges the five creation-transition deliverable cards and their typography across desktop, tablet, and mobile layouts.
- Makes each card expand to a prominent display size, then visibly shrink while blurring and dissolving away.
- Retunes orbit spacing so the larger cards remain within responsive viewport boundaries.
- Uses destination-neutral Mobile Trip App copy and reserves the final reveal for the AI Source-of-Truth File.

## v3.3.1 orbital creation transition

- Surrounds the animated compass and PLAN TO GUIDE message with five floating deliverable cards.
- Gives each card a readable hold before it blurs and dissolves outward, with layouts tuned for desktop, mobile, and short screens.
- Extends the full creation sequence to about 9.6 seconds while retaining a shorter, static reduced-motion experience.

## v3.3.0 four-step creation flow

- Makes Bookings &amp; constraints the final questionnaire step and removes the redundant Output step.
- Builds the complete guide directly from Step 4 with the new Create Your Own Adventure action.
- Moves every output deliverable into the branded creation transition as staggered animated cards.

## v3.2.3 real-device mobile workflow fit

- Removes repeated Step 2 chrome on small screens while retaining the progress path and readable controls.
- Lets only recommendation cards scroll so selection controls and Back/Next stay in the viewport on iPhone-sized screens.
- Prevents Safari text auto-sizing and correctly keeps hidden catalog notices out of the layout.

## v3.2.2 compact adventure workflow

- Keeps the Adventure suggestion step within one desktop or mobile viewport whenever screen height allows.
- Limits visible recommendation rows while preserving every suggestion in an independently scrollable, keyboard-focusable region.
- Keeps the workflow, selection count, and Back/Next controls visible outside the scrolling results.

## v3.2.1 P0/P1 reliability release

- Rejects unusable dynamic catalogs and adds throttled, retryable public-source research.
- Prevents ambiguous city matches and preserves Unicode destination identity.
- Builds non-overlapping day schedules with explicit activity durations and route travel time.
- Preserves imported AI plans, complete guide context, coordinates, photos, and source provenance across reloads and exports.
- Waits for IndexedDB photo transactions to commit and falls back without silently losing data.
- Makes recommendation, file-upload, wizard, tab, and day controls keyboard and screen-reader friendly.
- Adds accurate third-party network disclosure plus exported source/license attributions.

This root folder is now the active V3 workspace for `PlanToGuide`, started from the completed V2 snapshot on 2026-07-10.

## Version snapshots

- `versions/v1` preserves the original Version 1 app.
- `versions/v2` preserves the completed Version 2 app before new V3 changes.
- `versions/v3` is a clean starter copy of this V3 baseline.

## V3 starting point

V3 begins from the polished PlanToGuide V2 app, including:

- Four-step trip intake workflow, with every output introduced during the creation transition.
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
