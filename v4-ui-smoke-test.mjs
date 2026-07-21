import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const script = readFileSync("app.js", "utf8");
const styles = readFileSync("styles.css", "utf8");

function functionSource(name) {
  const start = script.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Expected app.js to define ${name}()`);
  const next = script.indexOf("\nfunction ", start + 1);
  return script.slice(start, next === -1 ? script.length : next);
}

assert.match(html, /id="startSplash"[^>]*hidden/, "The opening splash must start hidden until JavaScript decides whether a saved trip exists");
assert.match(html, /id="startSplashContinue"/, "The splash needs a keyboard-accessible continue button");
assert.match(script, /function showStartSplash\(/, "The splash must have an explicit show lifecycle");
assert.match(script, /function dismissStartSplash\(/, "The splash must have an explicit dismiss lifecycle");
assert.match(styles, /\.start-splash\.is-leaving/, "The splash must expose a fade-away state");
assert.match(styles, /prefers-reduced-motion:\s*reduce/, "The v4 animations must honor reduced-motion preferences");

assert.match(script, /function renderSuggestionDeckCard\(/, "Adventure recommendations must render as a one-card deck");
assert.match(script, /function applySuggestionDecision\(/, "The deck must apply Skip, Include, and Favorite decisions through shared state");
assert.match(script, /function undoSuggestionDecision\(/, "The deck must support redo/rewind");
assert.match(script, /const rejectedSuggestions = new Map\(\)/, "Skipped recommendations must have explicit exclusion state");
assert.match(script, /\[\.\.\.selections, \.\.\.rejectedSelections\]\.map\(recommendationKey\)/, "Automatic itinerary backfill must honor skipped recommendations");
assert.match(script, /rejectedSuggestions\.set\(key, suggestion\)/, "A left decision must record the recommendation as rejected");
assert.match(script, /rejectedSuggestions\.delete\(previous\.key\)/, "Undo must restore recommendation exclusion state");
assert.match(script, /rejectedSelections, preferences/, "Saved drafts must retain skipped recommendations");
assert.match(script, /form\.reset\(\);[\s\S]{0,180}?resetSuggestionDeckState\(\);/, "New Trip must reset deck review history");
assert.match(script, /addEventListener\("pointerdown"/, "The deck must support pointer and touch swipes");
assert.match(script, /event\.key === "ArrowRight"/, "The deck must support keyboard inclusion");
assert.match(script, /event\.key !== "ArrowLeft"/, "The deck must support keyboard skipping");
assert.match(styles, /\.suggestion-swipe-card[\s\S]*?touch-action:\s*pan-y/, "The swipe card must preserve vertical page gestures");
assert.match(script, /loading="eager" draggable="false"/, "Card images must not intercept desktop swipe gestures");
assert.doesNotMatch(script, /suggestion-swipe-deck" role="region" aria-live=/, "Only the concise deck status should be announced as a live region");
assert.match(html, /id="backStepButton"/, "Adventure Back navigation must remain available");
assert.match(html, /id="detailsStepButton"/, "Adventure Next navigation must remain available");

const renderDeckSource = functionSource("renderSuggestionDeckCard");
const applyDecisionSource = functionSource("applySuggestionDecision");
const distributeSelectionsSource = functionSource("distributeTripSelections");
const createActivitiesSource = functionSource("createActivities");

assert.match(
  renderDeckSource,
  /suggestion-(?:redo|undo)-button[\s\S]{0,1200}?suggestion-skip-button[\s\S]{0,1200}?suggestion-include-button[\s\S]{0,1200}?suggestion-favorite-button/,
  "The action rail must present redo/rewind, skip, include, and favorite in that order"
);
assert.match(renderDeckSource, /(?:Redo|Rewind) last recommendation choice/i, "The left action must be labeled as redo/rewind rather than an ambiguous arrow");
assert.match(renderDeckSource, /suggestion-skip-button[^`]*aria-label="Skip /, "The red X action must retain an accessible Skip label");
assert.match(renderDeckSource, /suggestion-include-button[^`]*aria-label="Include /, "The green heart action must retain an accessible Include label");
assert.match(renderDeckSource, /suggestion-favorite-button[^`]*aria-label="Favorite /, "The star action must retain an accessible Favorite label");

assert.match(renderDeckSource, /suggestion-(?:decision|swipe)-overlay skip[^>]*>[\s\S]{0,120}?SKIP/i, "Each card must include a red Skip decision overlay");
assert.match(renderDeckSource, /suggestion-(?:decision|swipe)-overlay include[^>]*>[\s\S]{0,120}?INCLUDE/i, "Each card must include a green Include decision overlay");
assert.match(styles, /\.suggestion-(?:decision|swipe)-overlay\s*\{[^}]*position:\s*absolute[^}]*pointer-events:\s*none/s, "Decision overlays must sit transparently above the recommendation without intercepting input");
assert.match(styles, /\.suggestion-(?:decision|swipe)-overlay\.skip\s*\{[^}]*?(?:background|--decision-color):/s, "The Skip overlay must define its red treatment");
assert.match(styles, /\.suggestion-(?:decision|swipe)-overlay\.include\s*\{[^}]*?(?:background|--decision-color):/s, "The Include overlay must define its green treatment");
assert.match(styles, /\.show-skip-decision[\s\S]{0,240}?\.skip/, "Button-triggered skips must visibly reveal the Skip overlay before the card exits");
assert.match(styles, /\.show-include-decision[\s\S]{0,240}?\.include/, "Button-triggered includes must visibly reveal the Include overlay before the card exits");
assert.match(script, /--skip-progress/, "Leftward dragging must control only the Skip overlay");
assert.match(script, /--include-progress/, "Rightward dragging must control only the Include overlay");

assert.match(applyDecisionSource, /decision\s*===\s*["']favorite["']/, "Favorite must be a first-class deck decision");
assert.match(applyDecisionSource, /favorite\s*:\s*(?:decision\s*===\s*["']favorite["']|true)/, "Favorite decisions must persist priority on the selected suggestion");
assert.match(distributeSelectionsSource, /favorite/, "Itinerary distribution must inspect favorite priority");
assert.match(distributeSelectionsSource, /\.sort\(/, "Itinerary distribution must order selected recommendations by priority");
assert.match(createActivitiesSource, /favorite/, "Activity placement must preserve favorite priority within each day");
assert.match(createActivitiesSource, /\.sort\(/, "Favorite activities must be ordered ahead of ordinary selected activities");

const obsoleteZeroSelectionGuard = /if\s*\(\s*!selectedSuggestions\.size\s*&&\s*!wishListInput\.value\.trim\(\)\s*\)/;
assert.doesNotMatch(script, obsoleteZeroSelectionGuard, "Skipping every card must not dead-end the workflow");

console.log("Version 4 splash and four-action swipe-deck smoke test passed.");
