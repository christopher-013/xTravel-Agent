/*
 * build-precomputed-catalogs.mjs — deploy-time destination research
 *
 * Runs the same research pipeline the browser uses (dynamic-catalog.js), but server-side
 * during the GitHub Pages deploy: no browser rate-limit pressure, sequential pacing, and a
 * proper API user agent. The output ships as precomputed-catalogs.json so most real queries
 * never touch the fragile runtime research path.
 *
 * Usage: node build-precomputed-catalogs.mjs [--out path] [--limit N]
 * Requires Node 18+ (global fetch). Always writes the output file and exits 0 so a bad
 * research day degrades the catalog instead of breaking the deploy.
 */

import { readFile, writeFile } from "node:fs/promises";

// Importing the browser IIFE as an ESM side-effect module attaches the api to globalThis.
await import("./dynamic-catalog.js");
const { buildDynamicCatalog, destinationMatchPattern, isWikimediaThrottled, wikimediaRetryAfterMs } = globalThis;

const TOTAL_TIME_BUDGET_MS = 20 * 60 * 1000;
const PER_CITY_DELAY_MS = 1500;

// Top tourist destinations not already covered by the hand-curated catalogs.json entries.
// Curated coverage (checked again against catalogs.json at runtime): Tokyo, Paris, London,
// New York, Rome, Lisbon, Honolulu/Oahu, Vancouver, Seattle.
const CITIES = [
  "Las Vegas", "Los Angeles", "San Diego", "San Francisco", "Chicago", "Miami", "Orlando",
  "New Orleans", "Boston", "Washington", "Austin", "Nashville", "Denver", "Philadelphia",
  "Barcelona", "Madrid", "Seville", "Amsterdam", "Berlin", "Munich", "Vienna", "Prague",
  "Budapest", "Athens", "Istanbul", "Dublin", "Edinburgh", "Venice", "Florence", "Milan",
  "Naples", "Porto", "Brussels", "Copenhagen", "Stockholm", "Oslo", "Helsinki", "Zurich",
  "Geneva", "Krakow", "Warsaw", "Dubai", "Singapore", "Bangkok", "Phuket", "Hong Kong",
  "Seoul", "Kyoto", "Osaka", "Taipei", "Kuala Lumpur", "Hanoi", "Ho Chi Minh City",
  "Sydney", "Melbourne", "Auckland", "Toronto", "Montreal", "Mexico City", "Cancun",
  "Rio de Janeiro", "Buenos Aires", "Cairo", "Marrakesh", "Cape Town"
];

function parseArgs(argv) {
  const args = { out: "precomputed-catalogs.json", limit: CITIES.length };
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--out" && argv[index + 1]) args.out = argv[++index];
    else if (argv[index] === "--limit" && argv[index + 1]) args.limit = Math.max(1, Number(argv[++index]) || CITIES.length);
  }
  return args;
}

async function loadCuratedMatchers() {
  try {
    const data = JSON.parse(await readFile(new URL("./catalogs.json", import.meta.url), "utf8"));
    return (data.destinationCatalogs || [])
      .map((catalog) => { try { return new RegExp(catalog.matchPattern, catalog.matchFlags || "i"); } catch (_) { return null; } })
      .filter(Boolean);
  } catch (_) {
    return [];
  }
}

function augmentedMatchPattern(city, catalog) {
  // The pipeline's own pattern covers the entered name and geocode name; add the common
  // "City, Region" and "City, Country" spellings travelers actually type.
  const geocodeName = catalog.label?.split(",")[0]?.trim() || city;
  const parts = String(catalog.label || "").split(",").map((part) => part.trim()).filter(Boolean);
  const admin1 = parts.length > 2 ? parts[1] : "";
  const country = parts.length > 1 ? parts[parts.length - 1] : "";
  const aliases = [city, geocodeName];
  if (admin1) aliases.push(`${geocodeName} ${admin1}`);
  if (country) aliases.push(`${geocodeName} ${country}`);
  return destinationMatchPattern(aliases);
}

async function main() {
  const { out, limit } = parseArgs(process.argv);
  const curatedMatchers = await loadCuratedMatchers();
  const started = Date.now();
  const catalogs = [];
  const failures = [];

  for (const city of CITIES.slice(0, limit)) {
    if (Date.now() - started > TOTAL_TIME_BUDGET_MS) {
      console.warn(`Time budget reached after ${catalogs.length} catalogs; stopping early.`);
      break;
    }
    if (curatedMatchers.some((matcher) => { matcher.lastIndex = 0; return matcher.test(city); })) {
      console.log(`skip (curated): ${city}`);
      continue;
    }
    if (typeof isWikimediaThrottled === "function" && isWikimediaThrottled()) {
      const waitMs = wikimediaRetryAfterMs();
      console.warn(`Rate limited; waiting ${Math.ceil(waitMs / 1000)}s before ${city}…`);
      await new Promise((resolve) => setTimeout(resolve, waitMs + 500));
    }
    try {
      const catalog = await buildDynamicCatalog(city);
      if (catalog) {
        const serializable = { ...catalog, match: undefined, matchPattern: augmentedMatchPattern(city, catalog) };
        catalogs.push(serializable);
        console.log(`ok: ${city} (${catalog.attractions?.length || 0} see / ${catalog.shopping?.length || 0} shop)`);
      } else {
        failures.push(city);
        console.warn(`no catalog: ${city}`);
      }
    } catch (error) {
      failures.push(city);
      console.warn(`failed: ${city} — ${error?.message || error}`);
    }
    await new Promise((resolve) => setTimeout(resolve, PER_CITY_DELAY_MS));
  }

  const payload = { generatedAt: new Date().toISOString(), count: catalogs.length, precomputedCatalogs: catalogs };
  await writeFile(out, JSON.stringify(payload));
  console.log(`Wrote ${out}: ${catalogs.length} catalogs, ${failures.length} failures${failures.length ? ` (${failures.join(", ")})` : ""}.`);
}

await main();
