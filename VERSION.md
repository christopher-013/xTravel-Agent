# PlanToGuide — Version 3 working copy

## v3.7.1 notability-ranked Places to See

- Queries Wikipedia categories through incoming-links-ranked search instead of alphabetical member listing, so huge categories ("Tourist attractions in London") surface Tower of London and Trafalgar Square instead of obscure A–B articles, and records that rank as a scoring boost.
- Adds average daily Wikipedia pageviews (fetched inside the existing page-details request, no extra API calls) as a secondary notability signal.
- Adds classic sight keywords (castle, palace, cathedral, tower, bridge, abbey, gallery, square) to the ranking vocabulary.
- Filters more non-attraction noise: tube stations, administrative authorities and tourism boards, suburban "Borough of …" categories, and broad city-container articles ("Central London").
- Deduplicates researched places against curated combination entries ("Tower Bridge" no longer duplicates "Tower of London and Tower Bridge").
- Carries the popularity and rank signals into cached and precomputed catalogs.

## v3.7.0 curated catalog enrichment

- Extends thin curated destinations (London, Paris, Tokyo, and the other hand-written catalogs, which carry only ~9 dining and 3 shopping entries) with real researched places from the same public-source pipeline used for uncataloged cities, replacing the generic "top-rated local restaurant"-style filler in Places to Eat and Places to Shop.
- Curated entries stay first and authoritative; enrichment items are deduplicated against them, keep their Wikivoyage/Wikipedia/OpenStreetMap source credits, and generic research filler is never merged in.
- Builds curated cities in the deploy-time catalog job too, so the live site enriches instantly from precomputed data; the browser falls back to a quiet background research pass (no loading takeover, curated board renders immediately) when no precomputed enrichment exists.
- Enrichment flows into the whole trip: suggestion board, itinerary meal/shopping backfill, and the Food and Shop tabs.

## v3.6.6 itinerary-derived day-navigation icons

- Derives each date-navigation emoji from that day's own itinerary (temples, castles, museums, markets, beaches, casinos, theme parks, and more), with the arrival day marked by a departure-flight icon.
- Guarantees every day's icon is unique across the trip: when a day has no recognizable theme, or its theme is already used by an earlier day, it receives a distinct decorative fallback style.
- Persists the derived icon on each day so the generated website, exports, and AI planning files stay consistent.

## v3.6.5 compact constraints

- Reduces every Bookings & real-world constraints entry field to one visible row.
- Keeps constraint and booking fields vertically resizable for longer details.

## v3.6.3 workflow action alignment

- Aligns the AI-updated plan importer with the Trip Basics Next Step action.
- Standardizes Back and forward workflow controls as large rectangular buttons on desktop and mobile.

## v3.6.1 golden-reference readability

- Restyles Emergency Contacts with the Tokyo reference's blush panel, brick-red accents, and stronger contrast.
- Increases emergency, itinerary, booking, route, weather, map, photo, and bottom-navigation typography across desktop and mobile.
- Stacks long emergency contact labels and values on narrow screens so larger text remains readable without horizontal overflow.
- Rebuilds the embedded export stylesheet so downloaded travel guides keep the updated presentation.

## v3.6.0 beta-readiness fixes

- Allows `commons.wikimedia.org` in the CSP so the Wikimedia Commons image fallback added in v3.4.13 actually runs instead of being silently blocked.
- Adds a quality gate to the deploy-time catalog builder: thin catalogs (e.g. a rate-limited run that captured only one Wikivoyage section with placeholder food/shopping) are rejected so runtime research stays available, instead of shipping a degraded catalog that blocks it.
- Merges each deploy with the previous deploy's good catalogs: failed or unreached cities keep their last-known-good data, fresh (< 14 days) catalogs are carried without network work, and coverage converges across deploys. Doubles the research time budget so the full city list is reachable.
- Fixes tourism keyword scoring to whole-word matching so "park" no longer matches "ballpark" and sports venues stop outranking landmarks.
- Makes practical-info merging verification-aware: verified curated or AI-supplied values win, the built-in country table beats "Needs verification" placeholders, and generic defaults are the last resort.
- Runs the Wikimedia Commons image fallback inside the shared lookup queue so image traffic respects the concurrency cap.
- Adds Open Graph / Twitter link-preview tags, a canonical URL, robots.txt, and public-beta feedback links (builder footer and trip header) pointing at GitHub Issues.

## v3.5.9 prioritized Adventure backfill

- Uses traveler-selected places first as the day's primary sights, meals, and shopping stops.
- Backfills missing categories from the destination catalog's popularity-ranked recommendations according to trip length.
- Tracks recommendation names across the full itinerary so automatically added places stay unique from day to day.
- Balances selections across repeated neighborhood days instead of placing every matching choice on the first day.
- Classifies selected restaurants into suitable breakfast, lunch, or dinner slots and keeps ambiguous extras as flexible food stops.
- Evaluates selected shopping and secondary-sight stops before automatic flexible recommendations when the day's time budget is tight.
- Removes an automatic flexible stop before a traveler-selected stop during final time-budget trimming.

## v3.5.7 compact booked-items field

- Places Already booked items inside the same responsive Constraints grid as the other questions.
- Reduces the booking textarea from seven rows to three while preserving the multi-line booking format and examples.

## v3.5.6 compact Travel Style interests field

- Places the optional see, eat, and shop request inside the same responsive question grid as the other Travel Style controls.
- Reduces its textarea to a compact two-line field while preserving resize support and the full planning prompt.

## v3.5.5 recurring Trip Basics brand animation

- Replays the animated PlanToGuide compass and coordinated PLAN TO GUIDE wordmark once per minute while Trip Basics remains open.
- Resets the one-minute countdown when the user returns to Trip Basics and stops it on other workflow steps or in the generated guide.
- Preserves the reduced-motion preference by disabling automatic animation replays when reduced motion is requested.

## v3.5.4 aligned Trip Basics actions

- Places the AI-updated-plan importer and Next Step action on the same bottom row.
- Keeps the importer left-aligned and the primary navigation action right-aligned.
- Uses a compact two-column treatment on mobile without overflowing the questionnaire.

## v3.5.3 coordinated homepage wordmark

- Restyles the product name beneath the animated compass as PLAN TO GUIDE.
- Matches the hero headline's yellow, pale-yellow, and blue typography with the same animated gradient underline beneath GUIDE.
- Preserves a compact, readable treatment on mobile and reduced-motion accessibility.

## v3.5.1 Tokyo-style daily Maps list

- Keeps the existing embedded Google route map and full-route action.
- Replaces verbose Maps cards with a selected-day-only list of numbered locations and addresses.
- Shows the estimated walk, transit, or ride-share/taxi leg to the next stop using distance and traveler transport preferences.
- Removes the redundant View day itinerary buttons from the Maps tab.

## v3.5.0 realistic daily scheduling

- Reserves at least one hour for every full meal, with longer lunch and dinner blocks where appropriate.
- Uses coordinates, travel preference, and neighborhood proximity to produce conservative travel-time estimates between stops.
- Removes lower-priority activities when the complete schedule cannot fit between the traveler's selected start and evening times.
- Aligns generated activity start and end times to easy-to-follow 30-minute increments while preserving exact confirmed reservation start times.
- Carries activity duration and travel-leg details into the website and AI-ready exports.

## v3.4.13 stable Adventure spacing and image fallback

- Prevents the Adventure heading, helper text, and controls from collapsing into one another at all desktop heights.
- Makes the recommendation list the only flexible scrolling row while preserving fixed workflow controls.
- Replaces failed remote recommendation images with a local graphic fallback without exposing long broken-image alternative text.

## v3.4.12 simplified Trip Basics import action

- Removes the Tokyo Family Trip example card from the questionnaire.
- Keeps the AI-updated-plan importer as a single left-aligned support card, with full-width mobile behavior.

## v3.4.11 primary Trip Basics brand banner

- Replaces the airplane and sun decorations with a large animated PlanToGuide compass-X logo beside the opening message.
- Keeps the product name paired with the logo on the left while the builder label, headline, and description remain together on the right.
- Adds a compact two-column mobile treatment and respects reduced-motion preferences.

## v3.4.10 Maps itinerary action layout

- Keeps each Maps-tab “View itinerary” action inside the stop card’s main content column instead of the narrow icon column.
- Preserves a compact pill treatment while allowing long localized dates to wrap cleanly on small screens.

## v3.4.9 split Trip Basics actions

- Anchors the Tokyo example card to the left side of the Trip Basics page and the AI-updated-plan importer to the right.
- Preserves the compact stacked-card treatment on narrow mobile screens.

## v3.4.8 shallow-screen Adventure layout

- Prevents the Adventure title, helper toolbar, and recommendation graphics from overlapping in wide, shallow desktop windows or at increased browser zoom.
- Keeps the recommendation list as the flexible scrolling region while reserving readable rows for workflow controls.

## v3.4.7 full-card Trip Basics actions

- Aligns the Tokyo example and AI-updated-plan cards as a compact group on the right side of the Trip Basics form.
- Makes the complete Tokyo card an external link and the complete AI-plan card an importer button, with keyboard-visible hover and focus feedback.
- Keeps both cards full-width and stacked on narrow screens.

## v3.4.6 quieter live-research status

- Replaces the highlighted yellow Live Research Catalog card with a subtle transparent glass status beneath the weather widget.
- Removes its drop shadow and reduces border contrast while keeping the text legible over destination photography.

## v3.4.5 simplified Trip Basics support area

- Removes the Included with every adventure / Five ready-to-use outputs preview card from Trip Basics.
- Keeps only the Tokyo example and AI-updated-plan import cards immediately before the final, right-aligned Next Step button.

## v3.4.4 Trip Basics supporting-card placement

- Moves the Tokyo example, AI-plan import, and five included-output cards out of the hero banner and into a compact supporting section at the end of Trip Basics.
- Keeps Next Step as the final control, aligned at the bottom right after every supporting card.
- Restyles the moved content for the light form surface and preserves horizontally scrollable deliverable cards on narrow screens.

## v3.4.3 reference-scale workflow and practical travel guidance

- Uses the Tokyo showcase as the desktop scale reference: larger workflow headings, controls, suggestion photography, card copy, and meaningful icons while retaining the contained mobile layout.
- Shortens the trip-building transition and offers repeat visitors a Skip animation control.
- Rejects unrelated Wikimedia image matches, checks several relevant Wikipedia results, and falls back to Wikimedia Commons before retaining an honest branded placeholder.
- Places the compact Live Research Catalog status directly beneath the destination weather card.
- Expands country-aware emergency contacts and adds transit, tipping, and key-phrase guidance for supported non-English-speaking destinations.

## v3.4.2 Home report polish and safety contacts

- Removes the redundant Day by day list from the bottom of the Home tab.
- Improves report typography, itinerary symbols, cards, and navigation readability on desktop-sized displays without changing the mobile scale.
- Reduces the unsupported-destination Live Research Catalog notice to a concise, right-aligned card.
- Keeps Police / Fire / Ambulance, Tourist Hotline (EN), and U.S. Embassy rows visible for every trip, with country-aware contacts for built-in destinations and explicit verification-safe fallbacks elsewhere.

## v3.4.1 gold-standard Home tab

- Rebuilds the generated trip site's Home tab to match the Tokyo gold-standard layout: Selected Day plan card (with locked-booking count and status-colored stops), a time-aware Next Stop widget, Next Reservation (with address and confirmation line when available), Today's Route & Transit timeline, an auto-generated Pre-Trip Checklist, and Emergency Contacts.
- Removes the old placeholder home cards (Today's plan / Next reservation / Transit note / Luggage note / Rainy-day backup / Emergency card), reusing their emoji vocabulary in the new sections.
- Auto-generates the Pre-Trip Checklist from the trip's bookings, practical info, and preferences (no schema change); check state persists per trip and stays interactive in exported guides via a small runtime handler.

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
