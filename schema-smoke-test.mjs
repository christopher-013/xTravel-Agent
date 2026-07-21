import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("./trip-schema.js", import.meta.url), "utf8");
const coreSource = source.split("/* ----------------------------------------------------------------- UI wiring */")[0];
const entries = {
  booking: [{ id: "entry-1", title: "Museum ticket", date: "2027-07-08", details: "Confirmed 10:00" }],
  food: [{ id: "entry-2", title: "Corner cafe", date: "2027-07-08", details: "Breakfast" }],
  shop: []
};
const photos = [{ id: "photo-1", src: "data:image/jpeg;base64,AAAA", date: "2027-07-08", caption: "Arrival", capturedAt: "2027-07-08T09:00:00", latitude: 51.5, longitude: -0.12, source: "upload" }];
const trip = {
  destination: "London",
  start: new Date(2027, 6, 8),
  end: new Date(2027, 6, 8),
  wishes: "Architecture",
  selections: [{ key: "see-westminster-abbey", category: "see", name: "Westminster Abbey", area: "Westminster", detail: "Priority", lat: 51.4993, lon: -0.1273, sourceLabel: "Wikipedia", sourceUrl: "https://en.wikipedia.org/wiki/Westminster_Abbey", sourceLicense: "CC BY-SA 4.0", favorite: true }],
  preferences: { pace: "balanced" },
  bookings: [{ name: "Museum ticket", date: "2027-07-08", time: "10:00", status: "confirmed" }],
  practical: { notes: "Test" },
  guide: {
    banner: "https://example.com/london.jpg",
    zones: [{ name: "Westminster", icon: "pin", keywords: ["abbey"] }],
    attractions: [{ name: "Westminster Abbey", area: "Westminster", detail: "Historic abbey", lat: 51.4993, lon: -0.1273, sourceLabel: "Wikipedia", sourceUrl: "https://en.wikipedia.org/wiki/Westminster_Abbey", sourceLicense: "CC BY-SA 4.0" }],
    food: { breakfast: [], lunch: [], dinner: [] },
    shopping: [],
    sources: [{ label: "Wikipedia", url: "https://en.wikipedia.org/", license: "CC BY-SA 4.0", attribution: "Wikipedia contributors" }]
  },
  days: [{
    date: new Date(2027, 6, 8),
    title: "Westminster",
    zone: { name: "Westminster", icon: "pin" },
    activities: [{ time: "10:00", title: "Westminster Abbey", type: "Explore", icon: "landmark", status: "Confirmed", description: "Tour the abbey.", lat: 51.4993, lon: -0.1273, sourceLabel: "Wikipedia", sourceUrl: "https://en.wikipedia.org/wiki/Westminster_Abbey", sourceLicense: "CC BY-SA 4.0", userSelected: true, favorite: true }]
  }]
};

const context = vm.createContext({
  console,
  URL,
  trip,
  loadUserEntries: (kind) => entries[kind] || [],
  loadStoredTripPhotos: () => photos,
  toInputDate: (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
  parseDate: (value) => { const [year, month, day] = value.split("-").map(Number); return new Date(year, month - 1, day); },
  getDestinationGuide: () => ({ banner: "" }),
  normalizeStatus: (value) => value.toLowerCase(),
  timeToMinutes: (value) => { const match = String(value).match(/(\d+):(\d+)/); return match ? Number(match[1]) * 60 + Number(match[2]) : 0; }
});
vm.runInContext(coreSource, context, { filename: "trip-schema.js" });

const v3Json = vm.runInContext("serializeTripJson(trip)", context);
const v3Markdown = `# Trip\n\n\`\`\`json plantoguide-trip\n${v3Json}\n\`\`\``;
const v3Raw = vm.runInContext(`extractTripJsonBlock(${JSON.stringify(v3Markdown)})`, context);
const v3Data = vm.runInContext(`tolerantJsonParse(${JSON.stringify(v3Raw)})`, context);
assert.equal(vm.runInContext(`validateTripData(${JSON.stringify(v3Data)}).length`, context), 0);
context.v3Data = v3Data;
const rebuilt = vm.runInContext("buildTripFromData(v3Data)", context);
assert.equal(rebuilt.destination, trip.destination);
assert.equal(rebuilt.days.length, 1);
assert.equal(rebuilt.days[0].activities[0].title, "Westminster Abbey");
assert.equal(rebuilt.bookings[0].name, "Museum ticket");
assert.equal(rebuilt.userEntries.booking[0].id, "entry-1");
assert.equal(rebuilt.photos[0].id, "photo-1");
assert.equal(rebuilt.guide.banner, "https://example.com/london.jpg");
assert.equal(rebuilt.selections[0].sourceLicense, "CC BY-SA 4.0");
assert.equal(v3Data.selections[0].key, "see-westminster-abbey");
assert.equal(v3Data.selections[0].category, "see");
assert.equal(v3Data.selections[0].favorite, true);
assert.equal(rebuilt.selections[0].favorite, true);
assert.equal(rebuilt.days[0].activities[0].lat, 51.4993);
assert.equal(rebuilt.days[0].activities[0].sourceUrl, "https://en.wikipedia.org/wiki/Westminster_Abbey");
assert.equal(v3Data.days[0].activities[0].userSelected, true);
assert.equal(v3Data.days[0].activities[0].favorite, true);
assert.equal(rebuilt.days[0].activities[0].userSelected, true);
assert.equal(rebuilt.days[0].activities[0].favorite, true);
assert.equal(Object.hasOwn(v3Data.photos[0], "src"), false, "Markdown schema must omit photo data URLs");

const malicious = structuredClone(v3Data);
malicious.guide.banner = "javascript:alert(1)";
malicious.days[0].title = "<b>bold</b>";
malicious.days[0].activities[0].icon = "<img src=x onerror=alert(1)>";
context.malicious = malicious;
const inert = vm.runInContext("buildTripFromData(malicious)", context);
assert.equal(inert.days[0].title, "<b>bold</b>");
assert.doesNotMatch(inert.days[0].activities[0].icon, /[<>]/);
assert.equal(inert.guide.banner, "");

const fullJson = vm.runInContext("serializeTripJson(trip, { includePhotoData: true })", context);
assert.match(fullJson, /data:image\/jpeg;base64/);

const legacy = { ...v3Data, schema: "xtravel-trip", version: 2 };
delete legacy.userEntries;
delete legacy.photos;
const v2Markdown = `\`\`\`json xtravel-trip\n${JSON.stringify(legacy)}\n\`\`\``;
const v2Raw = vm.runInContext(`extractTripJsonBlock(${JSON.stringify(v2Markdown)})`, context);
const v2Data = vm.runInContext(`tolerantJsonParse(${JSON.stringify(v2Raw)})`, context);
assert.equal(vm.runInContext(`validateTripData(${JSON.stringify(v2Data)}).length`, context), 0);
context.v2Data = v2Data;
assert.equal(vm.runInContext("buildTripFromData(v2Data).destination", context), "London");
const legacyWithoutProvenance = structuredClone(v2Data);
delete legacyWithoutProvenance.selections[0].favorite;
delete legacyWithoutProvenance.days[0].activities[0].userSelected;
delete legacyWithoutProvenance.days[0].activities[0].favorite;
context.legacyWithoutProvenance = legacyWithoutProvenance;
const rebuiltLegacy = vm.runInContext("buildTripFromData(legacyWithoutProvenance)", context);
assert.equal(rebuiltLegacy.days[0].activities[0].userSelected, false);
assert.equal(rebuiltLegacy.days[0].activities[0].favorite, false);

console.log("Schema smoke test passed: v3 round-trip, photo-data split, and v2 legacy import.");
