/*
 * trip-schema.js — PlanToGuide v2
 *
 * Defines the versioned, machine-readable trip schema, serializes the active
 * trip into it, and imports an AI-updated TRIP-PLAN.md (or bare JSON) back
 * into the app. This closes the loop:
 *
 *   Generate → Export TRIP-PLAN.md → Enrich with your AI agent → Import → Re-render
 *
 * Loaded after app.js; shares its top-level bindings (trip, renderTrip, etc.).
 */

const TRIP_SCHEMA_NAME = "xtravel-trip";
const TRIP_SCHEMA_VERSION = 2;
const TRIP_JSON_FENCE_OPEN = "```json xtravel-trip";

/* ---------------------------------------------------------------- serialize */

function serializeTripData(activeTrip = trip) {
  if (!activeTrip) return null;
  return {
    schema: TRIP_SCHEMA_NAME,
    version: TRIP_SCHEMA_VERSION,
    destination: activeTrip.destination,
    start: toInputDate(activeTrip.start),
    end: toInputDate(activeTrip.end),
    wishes: activeTrip.wishes || "",
    preferences: { ...activeTrip.preferences },
    bookings: (activeTrip.bookings || []).map((item) => ({
      name: item.name,
      date: item.date || "",
      time: item.time || "",
      status: item.status || "confirmed"
    })),
    practical: activeTrip.practical || createEmptyPracticalInfo(activeTrip.destination),
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

function serializeTripJson(activeTrip = trip) {
  const data = serializeTripData(activeTrip);
  return data ? JSON.stringify(data, null, 2) : "";
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

  // Preferred: fenced block tagged for this schema.
  const tagged = source.indexOf(TRIP_JSON_FENCE_OPEN);
  if (tagged !== -1) {
    const start = source.indexOf("\n", tagged);
    const close = source.indexOf("```", start + 1);
    if (start !== -1 && close !== -1) return source.slice(start + 1, close);
  }

  // Any fenced json block containing the schema name.
  const fenceRegex = /```(?:json)?\s*\n([\s\S]*?)```/g;
  let match;
  while ((match = fenceRegex.exec(source)) !== null) {
    if (match[1].includes(`"${TRIP_SCHEMA_NAME}"`)) return match[1];
  }

  // Bare JSON paste.
  const firstBrace = source.indexOf("{");
  const lastBrace = source.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace && source.includes(`"${TRIP_SCHEMA_NAME}"`)) {
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
  if (data.schema !== TRIP_SCHEMA_NAME) errors.push(`Missing or wrong "schema" field (expected "${TRIP_SCHEMA_NAME}").`);
  if (typeof data.version !== "number" || data.version > TRIP_SCHEMA_VERSION) errors.push(`Unsupported schema version "${data.version}" (this app supports up to ${TRIP_SCHEMA_VERSION}).`);
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
    selections: [],
    preferences,
    bookings,
    guide,
    researchMode: false, // an imported plan has been through AI research
    imported: true,
    practical: data.practical && typeof data.practical === "object" ? data.practical : null,
    days
  };
}

function importTripFromText(text) {
  const raw = extractTripJsonBlock(text);
  if (!raw) return { ok: false, errors: ["No xtravel-trip JSON block found. Paste the complete TRIP-PLAN.md returned by your AI (it must include the \"Machine-Readable Trip Data\" section) or the JSON block itself."] };
  let data;
  try {
    data = tolerantJsonParse(raw);
  } catch (error) {
    return { ok: false, errors: [`The JSON block could not be parsed: ${error.message}`] };
  }
  const errors = validateTripData(data);
  if (errors.length) return { ok: false, errors };

  trip = buildTripFromData(data);
  activeDay = 0;
  activeTab = "home";
  builder.hidden = true;
  result.hidden = false;
  document.body.classList.add("trip-mode");
  renderTrip();
  switchAppTab("home");
  safeStorageSet("x-travel-agent-imported-trip", JSON.stringify(data));
  window.scrollTo({ top: 0, behavior: "smooth" });
  return { ok: true, errors: [] };
}

/* -------------------------------------------------------- agent instructions */

function createAgentInstructions(activeTrip = trip) {
  const destination = activeTrip ? activeTrip.destination : "the destination";
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

