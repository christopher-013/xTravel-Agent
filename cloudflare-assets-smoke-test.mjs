import assert from "node:assert/strict";
import { lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const outputDirectory = path.join(projectRoot, "dist");
const maxAssetBytes = 25 * 1024 * 1024;

const requiredFiles = [
  "index.html",
  "robots.txt",
  "version.js",
  "catalogs.json",
  "dynamic-catalog.js",
  "app.js",
  "styles.css",
  "export-styles.js",
  "icon-source.js",
  "photo-store.js",
  "trip-schema.js",
  "beta-tools.js",
  "plan-x-guide-centered-compass-morph-clean-x.svg",
  "adtona-logo.png",
  "adtona-mark.png",
  "manifest.webmanifest",
  "sw.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/favicon-32.png"
];

const forbiddenSegments = new Set([
  "node_modules",
  ".git",
  ".github",
  ".claude",
  ".agents",
  ".wrangler",
  "versions",
  "verification-export",
  "test-fixtures",
  "public"
]);

const wrangler = JSON.parse(await readFile(path.join(projectRoot, "wrangler.jsonc"), "utf8"));
assert.equal(wrangler.assets?.directory, "./dist", "Wrangler must publish only ./dist");
assert.notEqual(path.resolve(projectRoot, wrangler.assets.directory), projectRoot, "Wrangler must never publish the repository root");

async function collectFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = path.posix.join(prefix, entry.name);
    const absolutePath = path.join(directory, entry.name);
    const metadata = await lstat(absolutePath);
    assert.equal(metadata.isSymbolicLink(), false, `Deployment assets must not contain symlinks: ${relativePath}`);
    if (entry.isDirectory()) files.push(...await collectFiles(absolutePath, relativePath));
    else if (entry.isFile()) files.push({ relativePath, absolutePath, size: metadata.size });
  }
  return files;
}

const files = await collectFiles(outputDirectory);
const deployedPaths = new Set(files.map((file) => file.relativePath));

for (const relativePath of requiredFiles) {
  assert(deployedPaths.has(relativePath), `Missing required Cloudflare asset: ${relativePath}`);
}

for (const file of files) {
  const segments = file.relativePath.split("/");
  assert(!segments.some((segment) => forbiddenSegments.has(segment)), `Forbidden deployment path: ${file.relativePath}`);
  assert(file.size <= maxAssetBytes, `Cloudflare asset exceeds 25 MiB: ${file.relativePath} (${file.size} bytes)`);
  assert(!/(?:smoke-test|build-cloudflare|server|feedback-worker)\.(?:m?js)$/i.test(file.relativePath), `Development-only code leaked into deployment: ${file.relativePath}`);
}

function localReference(value) {
  const reference = String(value || "").trim();
  if (!reference || /^(?:https?:|data:|blob:|mailto:|tel:|#)/i.test(reference)) return "";
  return reference.split(/[?#]/, 1)[0].replace(/^\.?\//, "");
}

const html = await readFile(path.join(outputDirectory, "index.html"), "utf8");
const htmlReferences = [...html.matchAll(/\b(?:src|href)=["']([^"']+)["']/gi)]
  .map((match) => localReference(match[1]))
  .filter(Boolean);
for (const reference of htmlReferences) {
  assert(deployedPaths.has(reference), `index.html references a missing deployment asset: ${reference}`);
}

const manifest = JSON.parse(await readFile(path.join(outputDirectory, "manifest.webmanifest"), "utf8"));
for (const icon of manifest.icons || []) {
  const reference = localReference(icon.src);
  assert(reference && deployedPaths.has(reference), `Manifest references a missing icon: ${icon.src}`);
}

const serviceWorker = await readFile(path.join(outputDirectory, "sw.js"), "utf8");
const precacheMatch = serviceWorker.match(/const PRECACHE_URLS\s*=\s*(\[[\s\S]*?\]);/);
assert(precacheMatch, "Could not read service-worker precache list");
const precacheUrls = JSON.parse(precacheMatch[1]);
for (const value of precacheUrls) {
  const reference = localReference(value);
  if (!reference) continue;
  assert(deployedPaths.has(reference), `Service worker precaches a missing deployment asset: ${value}`);
}

const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
const largest = [...files].sort((a, b) => b.size - a.size).slice(0, 5);
console.log(`Cloudflare asset smoke test passed: ${files.length} files, ${(totalBytes / 1024 / 1024).toFixed(2)} MiB total.`);
console.log(`Largest assets: ${largest.map((file) => `${file.relativePath} ${(file.size / 1024 / 1024).toFixed(2)} MiB`).join(", ")}`);
