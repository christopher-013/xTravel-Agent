import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

const html = readFileSync("index.html", "utf8");
const versionSource = readFileSync("version.js", "utf8");
const stylesheet = readFileSync("styles.css");
const exportStylesSource = readFileSync("export-styles.js", "utf8");

const ids = [...html.matchAll(/\sid=["']([^"']+)["']/g)].map((match) => match[1]);
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
assert.deepEqual(duplicateIds, [], `index.html contains duplicate IDs: ${duplicateIds.join(", ")}`);

const version = versionSource.match(/PLANTOGUIDE_VERSION\s*=\s*["']([^"']+)/)?.[1];
assert.ok(version, "version.js must define PLANTOGUIDE_VERSION");
const assetVersions = [...html.matchAll(/(?:styles\.css|(?:version|dynamic-catalog|export-styles|icon-source|photo-store|trip-schema|app)\.js)\?v=([^"']+)/g)].map((match) => match[1]);
assert.ok(assetVersions.length >= 8, "index.html should version every core stylesheet and script");
assert.ok(assetVersions.every((assetVersion) => assetVersion === version), "All index.html cache versions must match version.js");

const encodedStyles = exportStylesSource.match(/XTRAVEL_STYLES_GZIP_BASE64\s*=\s*["']([^"']+)/)?.[1];
assert.ok(encodedStyles, "export-styles.js must contain the compressed stylesheet fallback");
const exportedStylesheet = gunzipSync(Buffer.from(encodedStyles, "base64"));
assert.ok(stylesheet.equals(exportedStylesheet), "export-styles.js must be rebuilt whenever styles.css changes");

console.log("Markup and export-style smoke test passed.");
