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

const stepOneStart = html.indexOf('<section class="form-step active merged-start-step" data-form-step="1"');
const stepTwoStart = html.indexOf('<section class="form-step" data-form-step="2"');
const stepThreeStart = html.indexOf('<section class="form-step" data-form-step="3"');
assert.notEqual(stepOneStart, -1, "Trip Basics must use the merged branded start screen");
assert.ok(stepTwoStart > stepOneStart, "The merged Trip Basics screen must precede Adventure");
assert.ok(stepThreeStart > stepTwoStart, "Adventure must precede Travel style");
const stepOneHtml = html.slice(stepOneStart, stepTwoStart);
const stepTwoHtml = html.slice(stepTwoStart, stepThreeStart);

assert.match(stepOneHtml, /class="builder-brand home-brand-lockup"[\s\S]*?src="adtona-logo\.png"/, "The merged first screen must show the Adtona logo");
assert.doesNotMatch(stepOneHtml, /Turn your trip plan into a mobile travel guide\./, "The opening screen must omit the redundant large headline");
assert.match(stepOneHtml, /class="eyebrow">Build a shareable trip website[\s\S]{0,180}?free in your browser\.<\/p>/, "The compact product-value eyebrow must remain on Trip Basics");
assert.doesNotMatch(stepOneHtml, /Plan your trip, then/, "The opening screen must omit the secondary tagline");
assert.match(stepOneHtml, /<label class="sr-only" for="destination">Destination<\/label>/, "The destination control must retain an accessible label");
assert.doesNotMatch(stepOneHtml, />Where\?</, "The compact first screen must not show a redundant Where heading");
assert.doesNotMatch(stepOneHtml, />When\?</, "The compact first screen must not show a redundant When heading");
assert.match(stepOneHtml, /<label for="startDate">Arrive<\/label>[\s\S]*?id="startDate"[\s\S]*?<label for="endDate">Depart<\/label>[\s\S]*?id="endDate"/, "Arrival and departure inputs must retain their individual labels");
assert.match(script, /destinationInput\.value\s*=\s*"Tokyo, Japan";/, "A new browser draft must start with Tokyo, Japan");
assert.match(stepOneHtml, /data-open-import[\s\S]{0,180}?Import your AI plan/, "The first screen must provide a compact AI-plan importer");
assert.match(stepOneHtml, /id="nextStepButton"[^>]*type="button"[\s\S]{0,160}?Adto Na\. Go Now/, "The merged first screen must use the requested continue action");
assert.doesNotMatch(html, /id="startSplash(?:Continue)?"/, "Trip Basics must not be hidden behind a separate splash layer");
assert.match(script, /function showStartSplash\(/, "Refresh and workflow restarts must have an explicit merged-start lifecycle");
assert.doesNotMatch(script, /function dismissStartSplash\(/, "The merged first screen must not auto-dismiss while the traveler is typing");
assert.match(styles, /\.trip-form\[data-current-step="1"\][\s\S]{0,900}?linear-gradient\(150deg,\s*#fff4d6/, "Trip Basics must retain the branded startup background");
assert.match(styles, /prefers-reduced-motion:\s*reduce/, "The v4 animations must honor reduced-motion preferences");
assert.match(script, /Live research catalog created from keyless public sources\. Verify before travel\./, "The live-research reminder must use the compact verification copy");

assert.match(script, /function renderSuggestionDeckCard\(/, "Adventure recommendations must render as a one-card deck");
assert.match(script, /function applySuggestionDecision\(/, "The deck must apply Skip, Include, and Favorite decisions through shared state");
assert.match(script, /function undoSuggestionDecision\(/, "The deck must support redo/rewind");
assert.match(script, /const rejectedSuggestions = new Map\(\)/, "Skipped recommendations must have explicit exclusion state");
assert.match(script, /\[\.\.\.selections, \.\.\.rejectedSelections\]\.map\(recommendationKey\)/, "Automatic itinerary backfill must honor skipped recommendations");
assert.match(script, /rejectedSuggestions\.set\(key, suggestion\)/, "A left decision must record the recommendation as rejected");
assert.match(script, /rejectedValueBefore\s*=\s*rejectedSuggestions\.get\(key\)/, "History must preserve the exact prior rejection value");
assert.match(script, /previous\.rejectedValueBefore[\s\S]{0,100}?rejectedSuggestions\.set\(previous\.key, previous\.rejectedValueBefore\)/, "Redo must restore the exact prior rejection value");
assert.match(script, /rejectedSelections, preferences/, "Saved drafts must retain skipped recommendations");
assert.match(script, /form\.reset\(\);[\s\S]{0,180}?resetSuggestionDeckState\(\);/, "New Trip must reset deck review history");
assert.match(script, /addEventListener\("pointerdown"/, "The deck must support pointer and touch swipes");
assert.match(script, /event\.key === "ArrowRight"/, "The deck must support keyboard inclusion");
assert.match(script, /event\.key !== "ArrowLeft"/, "The deck must support keyboard skipping");
assert.match(styles, /\.suggestion-swipe-card[\s\S]*?touch-action:\s*pan-y/, "The swipe card must preserve vertical page gestures");
assert.match(script, /loading="eager" draggable="false"/, "Card images must not intercept desktop swipe gestures");
assert.match(script, /SUGGESTION_DECISION_SWIPE_HOLD_MS\s*=\s*0/, "Committed card swipes must continue off-screen without a decision-label pause");
assert.doesNotMatch(script, /suggestion-swipe-deck" role="region" aria-live=/, "Only the concise deck status should be announced as a live region");
assert.match(styles, /\.builder\s+\.form-step\[hidden\]\s*\{[^}]*display:\s*none\s*!important/s, "Inactive workflow steps must never paint behind the Adventure deck");
assert.match(html, /id="backStepButton"/, "Adventure Back navigation must remain available");
assert.match(html, /id="detailsStepButton"/, "Adventure Next navigation must remain available");
assert.ok(
  stepTwoHtml.indexOf('id="suggestionBoard"') < stepTwoHtml.indexOf('class="suggestion-toolbar"'),
  "The compact auto-pick helper must follow the photo and description deck"
);

const renderDeckSource = functionSource("renderSuggestionDeckCard");
const showBuilderSource = functionSource("showBuilder");
const showStartSplashSource = functionSource("showStartSplash");
const restoreSavedTripSource = functionSource("restoreSavedTrip");
const applyDecisionSource = functionSource("applySuggestionDecision");
const distributeSelectionsSource = functionSource("distributeTripSelections");
const createActivitiesSource = functionSource("createActivities");
const activityFactorySource = functionSource("activity");
const activitySelectionStateSource = functionSource("activitySelectionState");
const renderActivitySource = functionSource("renderActivity");
const uniqueActivitiesSource = functionSource("makeActivitiesUnique");

assert.match(script, /renderKnownDestinationOptions\(\);\s*showStartSplash\(\);/, "Every page load must show the opening title, even when a trip is saved");
assert.doesNotMatch(script, /if\s*\(\s*!hasSavedTripAtLoad\(\)\s*\)\s*showStartSplash\(\)/, "Saved trips must not bypass the opening title");
assert.match(showStartSplashSource, /result\.hidden\s*=\s*true[\s\S]*builder\.hidden\s*=\s*false[\s\S]*showFormStep\(1\)[\s\S]*merged-start-reveal/, "The title lifecycle must reveal the merged Trip Basics screen");
assert.doesNotMatch(showStartSplashSource, /setTimeout\(|START_SPLASH_DURATION|dismissStartSplash/, "The merged Trip Basics screen must wait for the traveler's explicit continue action");
assert.match(showBuilderSource, /options\.splash[\s\S]*showStartSplash/, "Workflow restarts must be able to replay the title");
assert.match(script, /#editTripButton"\)\.addEventListener\("click",\s*\(\)\s*=>\s*showBuilder\(\{\s*splash:\s*true\s*\}\)\)/, "Edit Trip must restart through the title page");
assert.match(script, /#newTripButton"\)[\s\S]{0,900}?showBuilder\(\{\s*splash:\s*true,\s*focusDestination:\s*true\s*\}\)/, "New Trip must restart through the title page after clearing the prior trip");
assert.match(restoreSavedTripSource, /restoreSuggestionState\(selectedSuggestions,\s*trip\.selections\)/, "Imported selections and favorites must survive the splash-first restore");
assert.doesNotMatch(restoreSavedTripSource, /builder\.hidden\s*=\s*true|result\.hidden\s*=\s*false|classList\.add\("trip-mode"\)|renderTrip\(\)|switchAppTab\(/, "Startup restoration must hydrate Trip Basics without reopening the report");
assert.match(script, /activeDay\s*\+\s*\(dx\s*<\s*0\s*\?\s*1\s*:\s*-1\)/, "Swiping left on the generated guide must advance to the next day");
assert.match(script, /currentDay\s*\+\s*\(dx<0\?1:-1\)/, "The standalone export must use the same left-to-next-day swipe mapping");

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

// Regression guard: the Skip/Include/Favorite/Redo action rail must never be pushed off-screen
// by a growing recommendation card. The deck shell must keep the card row flexible (minmax(0,
// 1fr) so it fills the space *above* the pinned action + hint rows) and the card body must clip
// its content instead of growing or scrolling.
assert.match(styles, /\.suggestion-swipe-shell\s*\{[^}]*grid-template-rows:\s*minmax\(0,\s*1fr\)\s+auto\s+auto/s, "The swipe deck shell must keep the card row flexible (grid-template-rows: minmax(0,1fr) auto auto) so the Skip/Include/Favorite action rail stays visible");
assert.match(styles, /\.suggestion-swipe-card\s+\.suggestion-card-body\s*\{[^}]*overflow:\s*hidden/s, "The recommendation card body must clip its content (overflow: hidden) so it can't grow and push the action rail below the fold");
assert.match(styles, /\.suggestion-swipe-card\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)[^}]*grid-template-rows:\s*minmax\(0,\s*2fr\)\s+minmax\(0,\s*1fr\)/s, "Recommendation cards must stack the photo above the description in a two-thirds/one-third split");
assert.match(styles, /@media\s*\(min-width:\s*761px\)[\s\S]*?\.suggestion-swipe-deck\s*\{[^}]*height:\s*clamp\(390px,\s*52dvh,\s*560px\)[^}]*min-height:\s*clamp\(390px,\s*52dvh,\s*560px\)/s, "Desktop recommendation photography must retain a large responsive height");
assert.match(styles, /@media\s*\(min-width:\s*761px\)[\s\S]*?\.trip-form\[data-current-step="2"\]\s*\{[^}]*height:\s*100%[^}]*max-height:\s*100%[^}]*min-height:\s*0[^}]*overflow-y:\s*auto/s, "Low-height desktop Adventure screens must scroll instead of clipping the taller card or navigation");
assert.match(styles, /@media\s*\(min-width:\s*761px\)[\s\S]*?\[data-form-step="2"\]\.active\s*\{[^}]*height:\s*max-content[^}]*min-height:\s*max-content[^}]*overflow:\s*visible/s, "The desktop Adventure step must grow with the taller card so its decision controls cannot overlap the selection summary");
assert.match(styles, /@media\s*\(min-width:\s*761px\)[\s\S]*?\.suggestion-swipe-shell\s*\{[^}]*grid-template-rows:\s*auto\s+auto\s+auto/s, "The desktop swipe shell must flow the card, decision controls, and hint in separate rows");
assert.match(styles, /@media\s*\(min-width:\s*761px\)[\s\S]*?\.suggestion-swipe-card\s+\.suggestion-card-body\s*\{[^}]*display:\s*grid[^}]*grid-template-rows:\s*auto\s+auto\s+minmax\(0,\s*1fr\)\s+auto/s, "Desktop recommendation text must reserve independent rows for the title, metadata, bounded description, and links");
assert.match(styles, /@media\s*\(min-width:\s*761px\)[\s\S]*?\.suggestion-card-body\s*>\s*\*\s*\{[^}]*grid-column:\s*1/s, "Legacy card-column rules must be reset so desktop recommendation text cannot overlap across implicit columns");
assert.match(styles, /@media\s*\(max-width:\s*760px\)[\s\S]*?\.suggestion-swipe-card\s*\{[^}]*grid-template-rows:\s*minmax\(0,\s*2fr\)\s+minmax\(0,\s*1fr\)/s, "Mobile recommendations must maximize the image while retaining a bounded description");
assert.doesNotMatch(styles, /grid-template-rows:\s*minmax\(0,\s*38%\)\s+minmax\(0,\s*1fr\)/, "Short phones must not regress to a description-heavy 38% photo");
assert.match(script, /section\.innerHTML[^;]*suggestion-swipe-actions/s, "Every recommendation group must render the action-rail container");

assert.match(applyDecisionSource, /decision\s*===\s*["']favorite["']/, "Favorite must be a first-class deck decision");
assert.match(applyDecisionSource, /favorite\s*:\s*(?:decision\s*===\s*["']favorite["']|true)/, "Favorite decisions must persist priority on the selected suggestion");
assert.match(applyDecisionSource, /selectedValueBefore\s*=\s*selectedSuggestions\.get\(key\)/, "Redo must preserve exact prior selection state, including Favorite");
assert.match(distributeSelectionsSource, /favorite/, "Itinerary distribution must inspect favorite priority");
assert.match(distributeSelectionsSource, /\.sort\(/, "Itinerary distribution must order selected recommendations by priority");
assert.match(createActivitiesSource, /favorite/, "Activity placement must preserve favorite priority within each day");
assert.match(createActivitiesSource, /\.sort\(/, "Favorite activities must be ordered ahead of ordinary selected activities");
assert.match(activityFactorySource, /["']userSelected["'][\s\S]{0,120}?["']favorite["']/, "Generated activities must retain selected and favorite provenance");
assert.match(activitySelectionStateSource, /activity\?\.favorite[\s\S]{0,180}?activity\?\.userSelected/, "Activity badge state must distinguish favorites from ordinary selections");
assert.match(renderActivitySource, /activity-origin-badge/, "Itinerary activities must render a traveler-choice badge beside the title");
assert.match(renderActivitySource, /selectionState\.favorite\s*\?\s*["']★ Favorite["']\s*:\s*["']✓ Selected["']/, "Favorite must replace, not duplicate, the Selected pill");
assert.match(html, /class="activity-title-row"[\s\S]{0,100}?<h4><\/h4>[\s\S]{0,100}?activity-origin-badge/, "The badge must sit beside and outside the editable itinerary title");
assert.match(styles, /\.activity-origin-badge\.is-selected\s*\{[^}]*background:/s, "Selected itinerary pills need a distinct visual treatment");
assert.match(styles, /\.activity-origin-badge\.is-favorite\s*\{[^}]*background:/s, "Favorite itinerary pills need a distinct visual treatment");
assert.match(uniqueActivitiesSource, /item\.userSelected\s*\|\|\s*item\.favorite/, "Duplicate resolution must never replace a traveler-selected or favorite stop");

assert.match(
  styles,
  /\.trip-creation-transition\.is-running\s+\.creation-output-card\s*\{[^}]*animation:\s*creationCardSequence/s,
  "Trip creation must sequence one deliverable card at a time"
);
assert.match(
  styles,
  /\.trip-creation-transition\.is-running\s+\.creation-output-card:last-child\s*\{[^}]*animation-name:\s*creationCardFinal/s,
  "The AI Source-of-Truth deliverable must be the final persistent creation card"
);
const creationCardStart = html.indexOf('class="creation-output-stack"');
const creationCardEnd = html.indexOf("</div>", creationCardStart);
const creationCards = html.slice(creationCardStart, creationCardEnd);
assert.ok(creationCardStart > -1, "The trip-creation transition must contain deliverable cards");
assert.ok(
  creationCards.lastIndexOf("AI Source-of-Truth File") > creationCards.lastIndexOf("Photo Journal"),
  "AI Source-of-Truth must be the last creation-transition deliverable"
);

const obsoleteZeroSelectionGuard = /if\s*\(\s*!selectedSuggestions\.size\s*&&\s*!wishListInput\.value\.trim\(\)\s*\)/;
assert.doesNotMatch(script, obsoleteZeroSelectionGuard, "Skipping every card must not dead-end the workflow");

console.log("Merged welcome screen and four-action swipe-deck smoke test passed.");
