// Security smoke test — static guardrails that run in CI (npm run check / npm run smoke)
// so a build can't regress the site's security posture. All checks are static file scans;
// no network, no browser. Keep the patterns specific to avoid false positives (the public
// Cloudflare beacon token is a plain 32-hex value and must never trip the secret scan).
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const read = (file) => (existsSync(file) ? readFileSync(file, "utf8") : "");

// Files that run in the visitor's browser — these must stay XSS-safe.
const BROWSER_FILES = [
  "index.html", "app.js", "dynamic-catalog.js", "beta-tools.js",
  "trip-schema.js", "photo-store.js", "icon-source.js", "sw.js"
];
// Everything we scan for accidentally-committed secrets (public repo).
const SECRET_SCAN_FILES = [
  ...BROWSER_FILES, "export-styles.js", "version.js", "catalogs.json",
  "manifest.webmanifest", "feedback-worker.js", "server.mjs",
  "build-precomputed-catalogs.mjs", "build-export-styles.mjs", "package.json"
];

let checks = 0;
const pass = (cond, message) => { assert.ok(cond, message); checks++; };

// 1) No committed credentials. Specific prefixes only, so ordinary hashes / the public
//    Cloudflare Web Analytics beacon token never match.
const SECRET_PATTERNS = [
  [/ghp_[A-Za-z0-9]{36}/, "GitHub token (classic)"],
  [/github_pat_[A-Za-z0-9_]{40,}/, "GitHub fine-grained token"],
  [/gh[opsu]_[A-Za-z0-9]{36}/, "GitHub OAuth/user token"],
  [/AKIA[0-9A-Z]{16}/, "AWS access key id"],
  [/-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/, "private key"],
  [/\bsk-[A-Za-z0-9]{32,}\b/, "OpenAI-style secret key"],
  [/\bAIza[0-9A-Za-z_-]{35}\b/, "Google API key"],
  [/xox[baprs]-[0-9A-Za-z-]{10,}/, "Slack token"],
  [/\bglpat-[A-Za-z0-9_-]{20,}/, "GitLab token"]
];
for (const file of SECRET_SCAN_FILES) {
  const text = read(file);
  for (const [pattern, label] of SECRET_PATTERNS) {
    pass(!pattern.test(text), `Possible ${label} committed in ${file}`);
  }
}

// 2) index.html ships a strong Content-Security-Policy.
const html = read("index.html");
const cspMatch = html.match(/http-equiv=["']Content-Security-Policy["'][^>]*?content=(["'])([\s\S]*?)\1/i);
pass(Boolean(cspMatch), "index.html must ship a Content-Security-Policy meta tag");
const csp = cspMatch ? cspMatch[2] : "";
const directive = (name) =>
  csp.split(";").map((d) => d.trim()).find((d) => d === name || d.startsWith(name + " ")) || "";
pass(directive("default-src").includes("'self'"), "CSP must set default-src 'self'");
pass(directive("object-src") === "object-src 'none'", "CSP must set object-src 'none'");
pass(directive("base-uri").includes("'self'"), "CSP must set base-uri 'self'");
pass(directive("form-action").includes("'self'"), "CSP must set form-action 'self'");
const scriptSrc = directive("script-src");
pass(Boolean(scriptSrc), "CSP must define script-src");
pass(!scriptSrc.includes("'unsafe-inline'"), "CSP script-src must not allow 'unsafe-inline'");
pass(!scriptSrc.includes("'unsafe-eval'"), "CSP script-src must not allow 'unsafe-eval'");

// 3) No dangerous DOM sinks in browser-shipped scripts.
const DANGEROUS = [
  [/\beval\s*\(/, "eval("],
  [/\bnew\s+Function\s*\(/, "new Function("],
  [/\bdocument\.write\s*\(/, "document.write("],
  [/\.outerHTML\s*=/, ".outerHTML ="],
  [/\.insertAdjacentHTML\s*\(/, "insertAdjacentHTML("],
  [/setAttribute\(\s*["']on/i, 'setAttribute("on…")'],
  [/(?:href|src)\s*=\s*["']\s*javascript:/i, "javascript: URL literal"]
];
for (const file of BROWSER_FILES) {
  const text = read(file);
  for (const [pattern, label] of DANGEROUS) {
    pass(!pattern.test(text), `Dangerous sink ${label} found in ${file}`);
  }
}

// 4) Every target="_blank" link in index.html opts out of window.opener access.
for (const anchor of html.match(/<a\b[^>]*target=["']_blank["'][^>]*>/gi) || []) {
  pass(/rel=["'][^"']*noopener/i.test(anchor),
    `target="_blank" anchor missing rel="noopener": ${anchor.slice(0, 80)}`);
}

// 5) Research / imported source URLs are scheme-validated before becoming an href, so a
//    malicious javascript:/data: source URL can't produce an active link (this matters most
//    on the exported trip page, which has no CSP of its own).
const app = read("app.js");
pass(/function safeExternalUrl\s*\(/.test(app), "app.js must define safeExternalUrl()");
pass(/safeExternalUrl\(item\.sourceUrl\)/.test(app),
  "source-credit links must run sourceUrl through safeExternalUrl()");

// 6) The in-app feedback path must not fall back to opening github.com when a submission
//    endpoint is configured (the reporter stays in-app per product requirement).
const beta = read("beta-tools.js");
pass(!/\.catch\([\s\S]{0,400}github\.com/.test(beta),
  "feedback submit failure must not open github.com");

console.log(`Security smoke test passed (${checks} checks).`);
