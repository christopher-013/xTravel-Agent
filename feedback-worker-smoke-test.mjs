// Contract smoke test for the integrated Cloudflare feedback Worker.
//
// This is intentionally network-free: GitHub and the static ASSETS binding are
// mocked so CI can verify routing, validation, privacy, and error handling without
// creating real issues or requiring a secret.
import assert from "node:assert/strict";
import worker from "./feedback-worker.js";

const API_URL = "https://adtona.com/api/feedback";
const ALLOWED_ORIGIN = "https://adtona.com";
const DISALLOWED_ORIGIN = "https://attacker.example";
const GITHUB_ISSUES_URL = "https://api.github.com/repos/christopher-013/Adtona/issues";
const MAX_BODY_BYTES = 16 * 1024;

let checks = 0;
const pass = (condition, message) => {
  assert.ok(condition, message);
  checks += 1;
};

const jsonRequest = (payload, {
  method = "POST",
  origin = ALLOWED_ORIGIN,
  contentType = "application/json",
  headers = {}
} = {}) => new Request(API_URL, {
  method,
  headers: {
    ...(origin == null ? {} : { Origin: origin }),
    ...(contentType == null ? {} : { "Content-Type": contentType }),
    ...headers
  },
  body: method === "GET" || method === "HEAD"
    ? undefined
    : (typeof payload === "string" ? payload : JSON.stringify(payload))
});

const validPayload = (overrides = {}) => ({
  category: "bug",
  summary: "Map route does not load",
  message: "The route preview stays blank after selecting Tuesday.",
  page: "/#maps",
  viewport: "390x844",
  version: "5.1.9",
  userAgent: "Adtona feedback smoke test",
  website: "",
  ...overrides
});

const responseJson = async (response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    assert.fail(`Expected JSON response, received: ${text.slice(0, 160)}`);
  }
};

const assetCalls = [];
const baseEnv = {
  GITHUB_TOKEN: "smoke-test-token",
  ASSETS: {
    fetch: async (request) => {
      assetCalls.push(new URL(request.url).pathname);
      return new Response(`asset:${new URL(request.url).pathname}`, {
        status: 200,
        headers: { "Content-Type": "text/plain" }
      });
    }
  }
};

// Non-API routes remain static-site routes, while only the exact feedback path is
// intercepted by the Worker.
{
  const response = await worker.fetch(new Request("https://adtona.com/styles.css"), baseEnv);
  pass(response.status === 200, "static assets must pass through to env.ASSETS");
  pass(await response.text() === "asset:/styles.css", "static asset response must be returned unchanged");

  const nearMatch = await worker.fetch(
    new Request("https://adtona.com/api/feedback-extra"),
    baseEnv
  );
  pass(nearMatch.status === 200, "non-exact feedback paths must pass through to env.ASSETS");
  pass(assetCalls.includes("/api/feedback-extra"), "near-match route must reach the ASSETS binding");
}

// CORS preflight is accepted only for configured origins.
{
  const allowed = await worker.fetch(new Request(API_URL, {
    method: "OPTIONS",
    headers: {
      Origin: ALLOWED_ORIGIN,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type"
    }
  }), baseEnv);
  pass(allowed.status === 204, "allowed feedback preflight must return 204");
  pass(
    allowed.headers.get("Access-Control-Allow-Origin") === ALLOWED_ORIGIN,
    "allowed preflight must echo the allowed origin"
  );
  pass(
    /\bPOST\b/.test(allowed.headers.get("Access-Control-Allow-Methods") || ""),
    "allowed preflight must advertise POST"
  );

  const disallowed = await worker.fetch(new Request(API_URL, {
    method: "OPTIONS",
    headers: {
      Origin: DISALLOWED_ORIGIN,
      "Access-Control-Request-Method": "POST"
    }
  }), baseEnv);
  pass(disallowed.status === 403, "disallowed feedback preflight must return 403");
  pass(
    disallowed.headers.get("Access-Control-Allow-Origin") !== DISALLOWED_ORIGIN,
    "disallowed preflight must not grant the attacker origin"
  );
}

// The exact API route supports only POST and OPTIONS.
{
  const response = await worker.fetch(jsonRequest(null, { method: "GET" }), baseEnv);
  pass(response.status === 405, "GET /api/feedback must return 405");
  pass(!assetCalls.includes("/api/feedback"), "wrong API methods must not fall through to static assets");
}

// Origin is required even for otherwise valid payloads.
for (const origin of [DISALLOWED_ORIGIN, null]) {
  const response = await worker.fetch(jsonRequest(validPayload(), { origin }), baseEnv);
  pass(response.status === 403, `${origin || "missing"} origin must be rejected`);
}

// Only JSON is accepted.
for (const contentType of ["text/plain", "application/x-www-form-urlencoded", null]) {
  const response = await worker.fetch(jsonRequest(validPayload(), { contentType }), baseEnv);
  pass(response.status === 415, `${contentType || "missing"} content type must be rejected`);
}
{
  const response = await worker.fetch(
    jsonRequest(validPayload(), { contentType: "application/json; charset=utf-8" }),
    {
      ...baseEnv,
      GITHUB_TOKEN: ""
    }
  );
  pass(response.status === 500, "application/json with a charset must pass media-type validation");
}

// Reject the request before parsing when its UTF-8 representation exceeds 16 KiB.
{
  const oversized = JSON.stringify(validPayload({
    message: "x".repeat(MAX_BODY_BYTES)
  }));
  pass(
    new TextEncoder().encode(oversized).byteLength > MAX_BODY_BYTES,
    "test fixture must exceed the configured byte limit"
  );
  const response = await worker.fetch(jsonRequest(oversized), baseEnv);
  pass(response.status === 413, "feedback bodies over 16 KiB must return 413");
}

// Malformed JSON and blank summaries are clear client errors.
{
  const malformed = await worker.fetch(jsonRequest('{"summary":'), baseEnv);
  pass(malformed.status === 400, "malformed JSON must return 400");

  const blank = await worker.fetch(jsonRequest(validPayload({ summary: " \t\r\n " })), baseEnv);
  pass(blank.status === 400, "blank feedback summary must return 400");
}

// A real submission cannot proceed without the server-side GitHub secret.
{
  const response = await worker.fetch(jsonRequest(validPayload()), {
    ...baseEnv,
    GITHUB_TOKEN: ""
  });
  pass(response.status === 500, "missing GITHUB_TOKEN must return 500");
  const body = await responseJson(response);
  pass(body.ok === false, "missing-token response must not claim success");
}

// The production rate-limiting binding rejects bursts before they can consume
// GitHub API capacity.
{
  let receivedKey = "";
  const response = await worker.fetch(
    jsonRequest(validPayload(), {
      headers: { "CF-Connecting-IP": "203.0.113.9" }
    }),
    {
      ...baseEnv,
      FEEDBACK_RATE_LIMITER: {
        limit: async ({ key }) => {
          receivedKey = key;
          return { success: false };
        }
      }
    }
  );
  pass(receivedKey === "203.0.113.9", "rate limiter must key submissions by Cloudflare client IP");
  pass(response.status === 429, "rate-limited feedback must return 429");
  pass(response.headers.get("Retry-After") === "60", "429 response must advertise a retry delay");
}

// A rate-limiter service failure fails closed instead of sending an unmetered
// GitHub request.
{
  const response = await worker.fetch(jsonRequest(validPayload()), {
    ...baseEnv,
    FEEDBACK_RATE_LIMITER: {
      limit: async () => {
        throw new Error("simulated limiter failure");
      }
    }
  });
  pass(response.status === 503, "rate-limiter failure must return 503");
}

// Honeypot traffic receives a plausible success without touching GitHub or requiring
// the GitHub token. This avoids teaching simple bots how to bypass the trap.
{
  const originalFetch = globalThis.fetch;
  let githubCalled = false;
  globalThis.fetch = async () => {
    githubCalled = true;
    throw new Error("honeypot must not call GitHub");
  };
  try {
    const response = await worker.fetch(
      jsonRequest(validPayload({ website: "https://spam.example" })),
      { ...baseEnv, GITHUB_TOKEN: "" }
    );
    pass(response.status === 201, "honeypot submission must receive fake 201 success");
    assert.deepEqual(
      await responseJson(response),
      { ok: true, number: null },
      "honeypot response must match the minimal public success shape"
    );
    checks += 1;
    pass(!githubCalled, "honeypot submission must never call GitHub");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

// A valid submission creates an issue in the Adtona repository. User-authored text is
// normalized before entering the public issue, and the browser receives no GitHub URL.
{
  const originalFetch = globalThis.fetch;
  let githubRequest = null;
  globalThis.fetch = async (input, init) => {
    githubRequest = { url: String(input), init };
    return new Response(JSON.stringify({
      html_url: "https://github.com/christopher-013/Adtona/issues/321",
      number: 321
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  };
  try {
    const payload = validPayload({
      category: "bug",
      summary: "Broken\u0000 title \u202E @octocat",
      message: "First line\r\n<script>alert(1)</script>\u0007 @everyone",
      email: "private@example.com"
    });
    const response = await worker.fetch(jsonRequest(payload), baseEnv);
    pass(response.status === 201, "successful GitHub issue creation must return 201");
    assert.deepEqual(
      await responseJson(response),
      { ok: true, number: 321 },
      "success response must expose only ok and issue number"
    );
    checks += 1;

    pass(githubRequest?.url === GITHUB_ISSUES_URL, "feedback must target the Adtona issue tracker");
    pass(githubRequest?.init?.method === "POST", "GitHub issue creation must use POST");
    const headers = new Headers(githubRequest?.init?.headers);
    pass(
      headers.get("Authorization") === "Bearer smoke-test-token",
      "GitHub request must use the server-side token"
    );
    pass(
      headers.get("Content-Type") === "application/json",
      "GitHub request must send JSON"
    );

    const issue = JSON.parse(githubRequest.init.body);
    pass(issue.title.startsWith("[Bug] "), "issue title must contain the normalized category");
    pass(
      Array.isArray(issue.labels) && issue.labels.length === 1 && issue.labels[0] === "bug",
      "bug feedback must use the repository's existing bug label"
    );
    pass(!/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(issue.title + issue.body),
      "issue title/body must not contain unsafe control characters");
    pass(!/[\u202A-\u202E\u2066-\u2069]/.test(issue.title + issue.body),
      "issue title/body must not contain bidi override/isolate characters");
    pass(!/(^|[^A-Za-z0-9_])@(octocat|everyone)\b/i.test(issue.title + issue.body),
      "user text must not create active GitHub mentions");
    pass((issue.title + issue.body).includes("＠octocat") && issue.body.includes("＠everyone"),
      "active mentions must use a full-width at sign");
    pass(!/<script\b/i.test(issue.body), "user HTML must be rendered inert in the GitHub issue");
    pass(!issue.body.includes("private@example.com") && !/\*\*Contact\b/i.test(issue.body),
      "public GitHub issues must not contain submitted contact information");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

// GitHub failures stay generic: no upstream response body, repository detail, token,
// or issue URL is reflected to the browser.
{
  const originalFetch = globalThis.fetch;
  const originalConsoleError = console.error;
  const logged = [];
  console.error = (...values) => logged.push(values.map(String).join(" "));
  globalThis.fetch = async () => new Response(
    "upstream diagnostic containing smoke-test-token and private details",
    { status: 422, headers: { "Content-Type": "text/plain" } }
  );
  try {
    const response = await worker.fetch(jsonRequest(validPayload()), baseEnv);
    pass(response.status === 502, "GitHub API failure must return 502");
    const text = await response.text();
    pass(!text.includes("smoke-test-token"), "502 response must not leak the GitHub token");
    pass(!text.includes("upstream diagnostic"), "502 response must not reflect GitHub diagnostics");
    pass(!text.includes(GITHUB_ISSUES_URL), "502 response must not expose the upstream endpoint");
    const body = JSON.parse(text);
    pass(body.ok === false, "502 response must clearly report failure");
    pass(!logged.join(" ").includes("smoke-test-token"), "Worker logs must not include the GitHub token");
    pass(!logged.join(" ").includes("upstream diagnostic"), "Worker logs must not include upstream response bodies");
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
  }
}

// Network failures also stay in-app and expose no upstream implementation details.
{
  const originalFetch = globalThis.fetch;
  const originalConsoleError = console.error;
  console.error = () => {};
  globalThis.fetch = async () => {
    throw new Error("simulated network failure with smoke-test-token");
  };
  try {
    const response = await worker.fetch(jsonRequest(validPayload()), baseEnv);
    pass(response.status === 502, "GitHub network failure must return 502");
    const text = await response.text();
    pass(!text.includes("smoke-test-token"), "network failure response must not leak diagnostics");
    pass(!text.includes(GITHUB_ISSUES_URL), "network failure response must not expose GitHub endpoint");
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
  }
}

console.log(`Feedback Worker smoke test passed (${checks} checks).`);
