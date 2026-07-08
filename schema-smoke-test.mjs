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
  preferences: { pace: "balanced" },
  bookings: [{ name: "Museum ticket", date: "2027-07-08", time: "10:00", status: "confirmed" }],
  practical: { notes: "Test" },
  days: [{
    date: new Date(2027, 6, 8),
    title: "Westminster",
    zone: { name: "Westminster", icon: "pin" },
    activities: [{ time: "10:00", title: "Westminster Abbey", type: "Explore", icon: "landmark", status: "Confirmed", description: "Tour the abbey." }]
  }]
};

const context = vm.createContext({
  console,
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
assert.equal(Object.hasOwn(v3Data.photos[0], "src"), false, "Markdown schema must omit photo data URLs");

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

console.log("Schema smoke test passed: v3 round-trip, photo-data split, and v2 legacy import.");
