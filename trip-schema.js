/*
 * trip-schema.js — PlanToGuide trip schema v3
 *
 * Defines the versioned, machine-readable trip schema, serializes the active
 * trip into it, and imports an AI-updated TRIP-PLAN.md (or bare JSON) back
 * into the app. This closes the loop:
 *
 *   Generate → Export TRIP-PLAN.md → Enrich with your AI agent → Import → Re-render
 *
 * Loaded after app.js; shares its top-level bindings (trip, renderTrip, etc.).
 */

const TRIP_SCHEMA_NAME = "plantoguide-trip";
const TRIP_SCHEMA_ALIASES = [TRIP_SCHEMA_NAME, "xtravel-trip"];
const TRIP_SCHEMA_VERSION = 3;
const TRIP_JSON_FENCE_OPEN = "```json plantoguide-trip";

/* ---------------------------------------------------------------- serialize */

function serializeTripData(activeTrip = trip) {
  if (!activeTrip) return null;
  const hasEntryStorage = typeof loadUserEntries === "function";
  const storedEntries = hasEntryStorage
    ? { booking: loadUserEntries("booking"), food: loadUserEntries("food"), shop: loadUserEntries("shop") }
    : { booking: [], food: [], shop: [] };
  const userEntries = hasEntryStorage ? storedEntries : (activeTrip.userEntries || storedEntries);
  const hasPhotoStorage = typeof loadStoredTripPhotos === "function";
  const storedPhotos = hasPhotoStorage ? loadStoredTripPhotos() : [];
  const photos = (hasPhotoStorage ? storedPhotos : (activeTrip.photos || [])).map(photoMetadataOnly).filter((photo) => photo.id);
  return {
    schema: TRIP_SCHEMA_NAME,
    version: TRIP_SCHEMA_VERSION,
    destination: activeTrip.destination,
    start: toInputDate(activeTrip.start),
    end: toInputDate(activeTrip.end),
    wishes: activeTrip.wishes || "",
    refinementInstructions: Array.isArray(activeTrip.refinementInstructions) ? [...activeTrip.refinementInstructions] : [],
    preferences: { ...activeTrip.preferences },
    bookings: (activeTrip.bookings || []).map((item) => ({
      name: item.name,
      date: item.date || "",
      time: item.time || "",
      status: item.status || "confirmed"
    })),
    practical: activeTrip.practical || createEmptyPracticalInfo(activeTrip.destination),
    userEntries: {
      booking: normalizeUserEntries(userEntries.booking),
      food: normalizeUserEntries(userEntries.food),
      shop: normalizeUserEntries(userEntries.shop)
    },
    photos,
    days: (activeTrip.days || []).map((day) => ({
      date: toInputDate(day.date),
      title: day.title,
      zone: day.zone ? { name: day.zone.name, icon: day.zone.icon || "📍" } : null,
      activities: (day.activities || []).map((item) => ({
        time: item.time,
        title: item.title,
        type: item.type || "Explore",
        icon: item.icon || "📍",
        status: item.status || "Recommended",
        description: item.description || ""
      }))
    }))
  };
}

function serializeTripJson(activeTrip = trip, options = {}) {
  const data = serializeTripData(activeTrip);
  if (data && options.includePhotoData) {
    const hasPhotoStorage = typeof loadStoredTripPhotos === "function";
    const storedPhotos = hasPhotoStorage ? loadStoredTripPhotos() : [];
    data.photos = (hasPhotoStorage ? storedPhotos : (activeTrip.photos || [])).map((photo) => ({ ...photo }));
  }
  return data ? JSON.stringify(data, null, 2) : "";
}

function normalizeUserEntries(entries) {
  return (Array.isArray(entries) ? entries : []).map((item) => ({
    id: String(item?.id || ""),
    title: String(item?.title || ""),
    date: String(item?.date || ""),
    details: String(item?.details || "")
  })).filter((item) => item.title);
}

function photoMetadataOnly(photo) {
  const metadata = {
    id: String(photo?.id || ""),
    date: String(photo?.date || ""),
    caption: String(photo?.caption || ""),
    capturedAt: String(photo?.capturedAt || ""),
    source: String(photo?.source || "")
  };
  if (Number.isFinite(photo?.latitude)) metadata.latitude = photo.latitude;
  if (Number.isFinite(photo?.longitude)) metadata.longitude = photo.longitude;
  return metadata;
}

function createEmptyPracticalInfo(destination = "") {
  return {
    emergencyNumbers: "Needs verification — local police / fire / ambulance numbers",
    touristHotline: "Needs verification",
    nearestEmbassy: "Needs verification — traveler's embassy or consulate near " + (destination || "the destination"),
    hospitalOrClinic: "Needs verification — English-friendly hospital or clinic near the home base",
    transitTips: "Needs verification — best transit card or pass for this trip",
    tipping: "Needs verification — local tipping etiquette",
    keyPhrases: [],
    notes: ""
  };
}

/* ------------------------------------------------------------------ extract */

function extractTripJsonBlock(text) {
  if (!text) return null;
  const source = String(text);

  // Preferred: fenced block tagged for the current or legacy schema.
  for (const schema of TRIP_SCHEMA_ALIASES) {
    const tagged = source.indexOf(`\`\`\`json ${schema}`);
    if (tagged !== -1) {
      const start = source.indexOf("\n", tagged);
      const close = source.indexOf("```", start + 1);
      if (start !== -1 && close !== -1) return source.slice(start + 1, close);
    }
  }

  // Any fenced json block containing the schema name.
  const fenceRegex = /```(?:json)?\s*\n([\s\S]*?)```/g;
  let match;
  while ((match = fenceRegex.exec(source)) !== null) {
    if (TRIP_SCHEMA_ALIASES.some((schema) => match[1].includes(`"${schema}"`))) return match[1];
  }

  // Bare JSON paste.
  const firstBrace = source.indexOf("{");
  const lastBrace = source.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace && TRIP_SCHEMA_ALIASES.some((schema) => source.includes(`"${schema}"`))) {
    return source.slice(firstBrace, lastBrace + 1);
  }
  return null;
}

function tolerantJsonParse(raw) {
  const cleaned = String(raw)
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/,\s*([}\]])/g, "$1");
  return JSON.parse(cleaned);
}

/* ----------------------------------------------------------------- validate */

function validateTripData(data) {
  const errors = [];
  if (!data || typeof data !== "object") return ["The pasted content is not a JSON object."];
  if (!TRIP_SCHEMA_ALIASES.includes(data.schema)) errors.push(`Missing or wrong "schema" field (expected "${TRIP_SCHEMA_NAME}").`);
  if (!Number.isInteger(data.version) || data.version < 2 || data.version > TRIP_SCHEMA_VERSION) errors.push(`Unsupported schema version "${data.version}" (this app supports versions 2–${TRIP_SCHEMA_VERSION}).`);
  if (!data.destination || typeof data.destination !== "string") errors.push("Missing destination.");
  const dateOk = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parseDate(value).getTime());
  if (!dateOk(data.start)) errors.push('Missing or invalid "start" date (expected YYYY-MM-DD).');
  if (!dateOk(data.end)) errors.push('Missing or invalid "end" date (expected YYYY-MM-DD).');
  if (!Array.isArray(data.days) || !data.days.length) {
    errors.push('Missing "days" array with at least one day.');
    return errors;
  }
  data.days.forEach((day, index) => {
    const label = `Day ${index + 1}`;
    if (!dateOk(day.date)) errors.push(`${label}: missing or invalid date (expected YYYY-MM-DD).`);
    if (!Array.isArray(day.activities) || !day.activities.length) errors.push(`${label}: needs at least one activity.`);
    else day.activities.forEach((item, itemIndex) => {
      if (!item || typeof item !== "object") { errors.push(`${label}, activity ${itemIndex + 1}: not an object.`); return; }
      if (!item.title) errors.push(`${label}, activity ${itemIndex + 1}: missing title.`);
      if (!item.time) errors.push(`${label}, activity ${itemIndex + 1}: missing time.`);
    });
  });
  if (data.userEntries !== undefined) {
    if (!data.userEntries || typeof data.userEntries !== "object") errors.push('"userEntries" must be an object.');
    else ["booking", "food", "shop"].forEach((kind) => {
      if (data.userEntries[kind] !== undefined && !Array.isArray(data.userEntries[kind])) errors.push(`"userEntries.${kind}" must be an array.`);
    });
  }
  if (data.photos !== undefined && !Array.isArray(data.photos)) errors.push('"photos" must be an array.');
  return errors;
}

/* ------------------------------------------------------------------- import */

function buildTripFromData(data) {
  const guide = getDestinationGuide(data.destination);
  const defaults = { pace: "balanced", party: "couple", start: "standard", evening: "flexible", transport: "transit", budget: "balanced", notes: "" };
  const preferences = { ...defaults, ...(data.preferences || {}) };
  const bookings = (Array.isArray(data.bookings) ? data.bookings : []).map((item) => ({
    name: String(item.name || "").trim(),
    date: item.date || "",
    time: item.time || "",
    status: normalizeStatus(String(item.status || "confirmed"))
  })).filter((item) => item.name);
  const days = data.days.map((day, index) => {
    const zone = day.zone && day.zone.name ? { name: day.zone.name, icon: day.zone.icon || "📍", keywords: [] } : { name: data.destination, icon: "📍", keywords: [] };
    const activities = day.activities.map((item) => ({
      time: String(item.time || "Flexible"),
      title: String(item.title || "Untitled stop"),
      type: String(item.type || "Explore"),
      icon: String(item.icon || "📍"),
      status: String(item.status || "Recommended"),
      description: String(item.description || "")
    })).sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
    return {
      date: parseDate(day.date),
      zone,
      title: day.title || `${zone.name} · Day ${index + 1}`,
      activities
    };
  });
  return {
    destination: data.destination.trim(),
    start: parseDate(data.start),
    end: parseDate(data.end),
    wishes: data.wishes || "",
    refinementInstructions: Array.isArray(data.refinementInstructions) ? data.refinementInstructions.map(String).filter(Boolean) : [],
    selections: [],
    preferences,
    bookings,
    guide,
    researchMode: false, // an imported plan has been through AI research
    imported: true,
    practical: data.practical && typeof data.practical === "object" ? data.practical : null,
    userEntries: {
      booking: normalizeUserEntries(data.userEntries?.booking),
      food: normalizeUserEntries(data.userEntries?.food),
      shop: normalizeUserEntries(data.userEntries?.shop)
    },
    photos: (Array.isArray(data.photos) ? data.photos : []).map((photo) => ({ ...photoMetadataOnly(photo), ...(photo.src ? { src: photo.src } : {}) })).filter((photo) => photo.id),
    days
  };
}

function mergeImportedTripSideData(importedTrip) {
  if (!importedTrip) return;
  if (typeof loadUserEntries === "function" && typeof saveUserEntries === "function") {
    ["booking", "food", "shop"].forEach((kind) => {
      const byId = new Map(loadUserEntries(kind).map((item) => [item.id, item]));
      (importedTrip.userEntries?.[kind] || []).forEach((item) => byId.set(item.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`, { ...byId.get(item.id), ...item }));
      saveUserEntries(kind, [...byId.values()]);
    });
  }
  if (typeof loadStoredTripPhotos === "function" && typeof saveTripPhotos === "function") {
    const existing = loadStoredTripPhotos();
    const byId = new Map(existing.map((photo) => [photo.id, photo]));
    (importedTrip.photos || []).forEach((photo) => {
      const local = byId.get(photo.id);
      byId.set(photo.id, local ? { ...photo, ...local } : photo);
    });
    saveTripPhotos([...byId.values()]);
  }
}

function importTripFromText(text) {
  const raw = extractTripJsonBlock(text);
  if (!raw) return { ok: false, errors: ["No plantoguide-trip JSON block found. Paste the complete TRIP-PLAN.md returned by your AI (legacy xtravel-trip blocks are also supported) or the JSON block itself."] };
  let data;
  try {
    data = tolerantJsonParse(raw);
  } catch (error) {
    return { ok: false, errors: [`The JSON block could not be parsed: ${error.message}`] };
  }
  const errors = validateTripData(data);
  if (errors.length) return { ok: false, errors };

  trip = buildTripFromData(data);
  mergeImportedTripSideData(trip);
  activeDay = 0;
  activeTab = "home";
  builder.hidden = true;
  result.hidden = false;
  document.body.classList.add("trip-mode");
  renderTrip();
  switchAppTab("home");
  safeStorageSet("plantoguide-imported-trip", JSON.stringify(data));
  window.scrollTo({ top: 0, behavior: "smooth" });
  return { ok: true, errors: [] };
}

/* -------------------------------------------------------- agent instructions */

function createAgentInstructions(activeTrip = trip) {
  const destination = activeTrip ? activeTrip.destination : "the destination";
  const refinements = Array.isArray(activeTrip?.refinementInstructions) && activeTrip.refinementInstructions.length
    ? activeTrip.refinementInstructions.map((item) => `- ${item}`).join("\n")
    : "- No additional refinements selected.";
  return `# AGENT-INSTRUCTIONS.md — How AI agents should work with this trip package

This package was generated by PlanToGuide. It is designed for round-trip
editing with an AI assistant (Claude, ChatGPT, Claude Code, or similar).

## The source of truth

\`TRIP-PLAN.md\` is the authoritative planning file. It contains:

1. Human-readable sections (overview, locked bookings, preferences, day-by-day plan).
2. A **Machine-Readable Trip Data** section at the end: a fenced code block
   opening with \`${TRIP_JSON_FENCE_OPEN}\` that holds the complete trip as JSON
   (schema "${TRIP_SCHEMA_NAME}", version ${TRIP_SCHEMA_VERSION}).

The JSON block and the human-readable sections describe the same plan. When
you change one, change both so they stay in sync.

## Rules for editing

1. Preserve every booking whose status is "confirmed" and every traveler
   must-do unless the traveler explicitly asks to change it.
2. Optimize each day geographically around its stated zone and the home base.
3. Verify live facts (hours, prices, closures, reservations) with real research;
   mark anything unverified with status "Needs verification". Never invent facts.
4. Respect stated food restrictions, mobility limits, and things to avoid.
5. Fill in the "practical" object with verified emergency numbers, embassy,
   hospital, transit, and tipping details for ${destination}.
6. Keep dates in YYYY-MM-DD, keep every activity's time, title, type, icon,
   status, and description fields.

## Traveler-requested refinements

Apply all of these instructions while following the preservation rules above:

${refinements}

## Required output format

When you return an updated plan, return the **complete TRIP-PLAN.md file** —
all headings plus the updated \`${TRIP_JSON_FENCE_OPEN}\` block. The traveler
will paste your entire reply into PlanToGuide's **Import updated plan**
feature, which reads the JSON block and re-renders the trip website.

If you only return prose, the traveler cannot import your work.

## Regenerating the website

The static website in this package (\`index.html\`) is a snapshot. After the
traveler imports your updated plan into PlanToGuide, they can export a fresh
package that reflects your changes.
`;
}

/* ----------------------------------------------------------------- UI wiring */

function showImportDialog() {
  const dialog = document.querySelector("#importDialog");
  document.querySelector("#importError").hidden = true;
  document.querySelector("#importError").textContent = "";
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

function closeImportDialog() {
  const dialog = document.querySelector("#importDialog");
  if (typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
}

function runImportFromDialog(text) {
  const errorBox = document.querySelector("#importError");
  const outcome = importTripFromText(text);
  if (outcome.ok) {
    closeImportDialog();
    document.querySelector("#importPlanText").value = "";
    return;
  }
  errorBox.hidden = false;
  errorBox.innerHTML = `<strong>Import problems:</strong><ul>${outcome.errors.map((message) => `<li>${escapeHtml(message)}</li>`).join("")}</ul>`;
}

document.querySelectorAll("[data-open-import]").forEach((button) => button.addEventListener("click", showImportDialog));
document.querySelector("#importDialogClose").addEventListener("click", closeImportDialog);
document.querySelector("#importDialogCancel").addEventListener("click", closeImportDialog);
document.querySelector("#importPlanButton").addEventListener("click", () => {
  runImportFromDialog(document.querySelector("#importPlanText").value);
});
document.querySelector("#importPlanFile").addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    document.querySelector("#importPlanText").value = String(reader.result || "");
    runImportFromDialog(String(reader.result || ""));
  };
  reader.readAsText(file);
  event.target.value = "";
});
