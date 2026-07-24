/**
 * Adtona feedback API + static asset Worker.
 *
 * The browser posts to the same-origin /api/feedback route. This Worker keeps the
 * GitHub credential in the encrypted GITHUB_TOKEN secret and creates the public
 * issue on the reporter's behalf. Every non-API request passes through to the
 * Cloudflare static-assets binding.
 */

const API_PATH = "/api/feedback";
const DEFAULT_REPO = "christopher-013/Adtona";
const DEFAULT_ALLOWED_ORIGINS = [
  "https://adtona.com",
  "https://www.adtona.com",
  "https://adtona.cch13.workers.dev",
  "http://127.0.0.1:8767",
  "http://localhost:8767"
];

const MAX_BODY_BYTES = 16 * 1024;
const MAX_SUMMARY = 140;
const MAX_MESSAGE = 4000;
const MAX_PAGE = 300;
const MAX_VIEWPORT = 40;
const MAX_VERSION = 40;
const MAX_USER_AGENT = 400;
const UNSAFE_FEEDBACK_ERROR = "Feedback contains content that cannot be submitted.";
const CATEGORIES = ["bug", "idea", "praise", "other"];
const CATEGORY_LABELS = {
  bug: ["bug"],
  idea: ["enhancement"],
  praise: [],
  other: []
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== API_PATH) {
      if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
        return env.ASSETS.fetch(request);
      }
      return new Response("Not found", { status: 404 });
    }

    const allowedOrigins = parseAllowedOrigins(env.ALLOWED_ORIGINS);
    const origin = request.headers.get("Origin") || "";
    const originAllowed = allowedOrigins.includes(origin);
    const cors = corsHeaders(originAllowed ? origin : "");

    if (request.method === "OPTIONS") {
      if (!originAllowed) {
        return json({ ok: false, error: "Origin not allowed" }, 403, cors);
      }
      return new Response(null, { status: 204, headers: cors });
    }
    if (!originAllowed) {
      return json({ ok: false, error: "Origin not allowed" }, 403, cors);
    }
    if (request.method !== "POST") {
      return json({ ok: false, error: "Method not allowed" }, 405, cors);
    }

    const mediaType = (request.headers.get("Content-Type") || "")
      .split(";", 1)[0]
      .trim()
      .toLowerCase();
    if (mediaType !== "application/json") {
      return json({ ok: false, error: "Content-Type must be application/json" }, 415, cors);
    }

    const declaredLength = Number.parseInt(request.headers.get("Content-Length") || "", 10);
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
      return json({ ok: false, error: "Feedback is too large" }, 413, cors);
    }

    let rawBody;
    try {
      rawBody = await request.text();
    } catch {
      return json({ ok: false, error: "Could not read request body" }, 400, cors);
    }
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return json({ ok: false, error: "Feedback is too large" }, 413, cors);
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return json({ ok: false, error: "Invalid JSON body" }, 400, cors);
    }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return json({ ok: false, error: "Invalid feedback payload" }, 400, cors);
    }

    // Quietly accept bot submissions that fill the hidden field. Do this before
    // checking the GitHub secret so the trap behaves consistently in every environment.
    if (String(payload.website || "").trim()) {
      return json({ ok: true, number: null }, 201, cors);
    }

    const fieldsToValidate = [
      ["summary", payload.summary, MAX_SUMMARY, true],
      ["message", payload.message, MAX_MESSAGE, false],
      ["page", payload.page || "—", MAX_PAGE, true],
      ["viewport", payload.viewport || "—", MAX_VIEWPORT, true],
      ["version", payload.version || "—", MAX_VERSION, true],
      ["userAgent", payload.userAgent || "—", MAX_USER_AGENT, true]
    ];
    if (fieldsToValidate.some(([, value, maxLength, singleLine]) =>
      !isSafeFeedbackText(value, { maxLength, singleLine })
    )) {
      return json({ ok: false, error: UNSAFE_FEEDBACK_ERROR }, 400, cors);
    }

    const summary = sanitizeUserText(payload.summary, MAX_SUMMARY, true);
    if (!summary) {
      return json({ ok: false, error: "A summary is required." }, 400, cors);
    }

    if (env.FEEDBACK_RATE_LIMITER && typeof env.FEEDBACK_RATE_LIMITER.limit === "function") {
      const clientKey = request.headers.get("CF-Connecting-IP") || "unknown-client";
      let rateLimitResult;
      try {
        rateLimitResult = await env.FEEDBACK_RATE_LIMITER.limit({ key: clientKey });
      } catch {
        return json(
          { ok: false, error: "Feedback service is temporarily unavailable." },
          503,
          cors
        );
      }
      if (!rateLimitResult?.success) {
        return json(
          { ok: false, error: "Too many feedback submissions. Please try again shortly." },
          429,
          { ...cors, "Retry-After": "60" }
        );
      }
    }

    if (!env.GITHUB_TOKEN) {
      return json(
        { ok: false, error: "Feedback service is temporarily unavailable." },
        500,
        cors
      );
    }

    const category = CATEGORIES.includes(payload.category) ? payload.category : "other";
    const typeLabel = {
      bug: "Bug",
      idea: "Idea",
      praise: "Praise",
      other: "Feedback"
    }[category];
    const message = sanitizeUserText(payload.message, MAX_MESSAGE, false);
    const page = sanitizeUserText(payload.page || "—", MAX_PAGE, true);
    const viewport = sanitizeUserText(payload.viewport || "—", MAX_VIEWPORT, true);
    const version = sanitizeUserText(payload.version || "—", MAX_VERSION, true);
    const userAgent = sanitizeUserText(payload.userAgent || "—", MAX_USER_AGENT, true);

    const issueTitle = `[${typeLabel}] ${summary}`;
    const issueBody = [
      `**Type:** ${typeLabel}`,
      "",
      message || "_(no description provided)_",
      "",
      "---",
      `**Page:** ${page}`,
      `**Viewport:** ${viewport}`,
      `**Version:** ${version}`,
      `**User agent:** ${userAgent}`,
      "",
      "_Filed automatically from the Adtona in-app beta feedback form._"
    ].join("\n");

    const repo = String(env.GITHUB_REPO || DEFAULT_REPO).trim() || DEFAULT_REPO;
    let githubResponse;
    try {
      githubResponse = await fetch(`https://api.github.com/repos/${repo}/issues`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
          "Accept": "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
          "User-Agent": "Adtona-Feedback-Worker"
        },
        body: JSON.stringify({
          title: issueTitle,
          body: issueBody,
          labels: CATEGORY_LABELS[category]
        })
      });
    } catch {
      console.error("GitHub feedback issue request failed");
      return json(
        { ok: false, error: "Feedback could not be submitted right now." },
        502,
        cors
      );
    }

    if (!githubResponse.ok) {
      console.error("GitHub feedback issue creation failed", {
        status: githubResponse.status
      });
      return json(
        { ok: false, error: "Feedback could not be submitted right now." },
        502,
        cors
      );
    }

    const issue = await githubResponse.json().catch(() => ({}));
    return json({
      ok: true,
      number: Number.isFinite(issue.number) ? issue.number : null
    }, 201, cors);
  }
};

function parseAllowedOrigins(value) {
  if (!value) return DEFAULT_ALLOWED_ORIGINS;
  const configured = String(value)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return configured.length ? configured : DEFAULT_ALLOWED_ORIGINS;
}

function corsHeaders(allowedOrigin) {
  const headers = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "Cache-Control": "no-store"
  };
  if (allowedOrigin) headers["Access-Control-Allow-Origin"] = allowedOrigin;
  return headers;
}

function json(value, status, headers) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...headers
    }
  });
}

function sanitizeUserText(value, maxLength, singleLine) {
  let text = String(value == null ? "" : value)
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
    .replace(/[\u202A-\u202E\u2066-\u2069]/g, "")
    .replace(/@/g, "＠")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  if (singleLine) text = text.replace(/\s+/g, " ");
  text = text.trim();
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function isSafeFeedbackText(value, { maxLength, singleLine }) {
  const raw = String(value == null ? "" : value);
  if (raw.length > maxLength) return false;
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u202A-\u202E\u2066-\u2069]/u.test(raw)) {
    return false;
  }
  if (singleLine && /[\r\n]/u.test(raw)) return false;

  const text = canonicalizeForDetection(raw);
  if (!text) return true;

  // Reject executable markup and URI payloads while still allowing useful bug
  // report snippets such as CSS selectors, route.js, and ordinary punctuation.
  if (/<\s*\/?\s*(?:script|iframe|img|svg|object|embed|link|meta|style|form|input|button|video|audio|source|base|math)\b/iu.test(text)) {
    return false;
  }
  if (/\bon[a-z]{2,30}\s*=/iu.test(text)) return false;
  if (/\b(?:javascript|vbscript)\s*:/iu.test(text)) return false;
  if (/\bdata\s*:\s*(?:text\/html|image\/svg\+xml|application\/(?:javascript|xhtml\+xml))/iu.test(text)) {
    return false;
  }
  if (containsLinkOrContact(text)) return false;
  if (containsProfanity(text)) return false;
  return true;
}

function canonicalizeForDetection(value) {
  let text = String(value || "").normalize("NFKC");
  for (let pass = 0; pass < 2; pass += 1) {
    text = text
      .replace(/&#(?:x([0-9a-f]{1,6})|([0-9]{1,7}));?/giu, (_, hex, decimal) => {
        const codePoint = Number.parseInt(hex || decimal, hex ? 16 : 10);
        try { return String.fromCodePoint(codePoint); } catch { return ""; }
      })
      .replace(/&(?:colon|period|sol|commat|lpar|rpar);?/giu, (entity) => ({
        "&colon;": ":", "&colon": ":", "&period;": ".", "&period": ".",
        "&sol;": "/", "&sol": "/", "&commat;": "@", "&commat": "@",
        "&lpar;": "(", "&lpar": "(", "&rpar;": ")", "&rpar": ")"
      })[entity.toLowerCase()] || entity);
    try { text = decodeURIComponent(text); } catch { /* keep malformed escapes */ }
  }
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u200B-\u200F\u2060\uFEFF]/gu, "")
    .replace(/[\u3002\uFF0E\uFF61]/gu, ".")
    .replace(/[\u2215\u2044\uFF0F]/gu, "/")
    .replace(/\bhxxps?\b/giu, "http")
    .replace(/\b(https?)\s*(?:colon|:)\s*(?:slash|\/)\s*(?:slash|\/)/giu, "$1://")
    .replace(/\[\s*(?:dot|\.)\s*\]|\(\s*(?:dot|\.)\s*\)/giu, ".")
    .replace(/\s+dot\s+/giu, ".")
    .replace(/\s+colon\s+/giu, ":")
    .replace(/\s+slash\s+/giu, "/");
}

function containsLinkOrContact(text) {
  if (/!?\[[^\]\r\n]{0,300}\]\s*\([^)\r\n]{1,500}\)/u.test(text)) return true;
  if (/\b(?:https?|ftp|ftps|file):\s*\/\//iu.test(text)) return true;
  if (/\bwww\s*\./iu.test(text)) return true;
  if (/(?:^|[^\p{L}\p{N}._%+-])[\p{L}\p{N}._%+-]{1,64}@[\p{L}\p{N}.-]+\.[\p{L}]{2,24}(?=$|[^\p{L}\p{N}_-])/iu.test(text)) {
    return true;
  }
  if (/(?:^|[\s(])(?:localhost|(?:\d{1,3}\.){3}\d{1,3})(?=$|[\s/:),])/iu.test(text)) return true;

  // This curated public-suffix list catches links without treating filenames
  // such as route.js and photo.jpg as domains.
  const publicSuffix = "(?:com|org|net|edu|gov|mil|io|co|uk|ca|au|de|fr|it|es|jp|cn|in|ph|nz|sg|eu|ch|nl|se|no|dk|fi|be|at|ie|pt|gr|pl|cz|sk|hu|ro|bg|hr|rs|ua|ru|tr|il|ae|sa|za|eg|ma|ke|ng|gh|br|ar|cl|pe|mx|cr|pa|hk|tw|kr|th|vn|id|my|travel|app|dev|me|us|info|biz|xyz|online|site|store|tech|ai|cloud|ly|tv|museum|name|mobi|pro)";
  return new RegExp(
    `(?:^|[^\\p{L}\\p{N}_-])(?:[\\p{L}\\p{N}](?:[\\p{L}\\p{N}-]{0,61}[\\p{L}\\p{N}])?\\.)+${publicSuffix}(?=$|[^\\p{L}\\p{N}_-])`,
    "iu"
  ).test(text);
}

function containsProfanity(text) {
  const normalized = text
    .replace(/[@4]/gu, "a")
    .replace(/3/gu, "e")
    .replace(/[!1|]/gu, "i")
    .replace(/0/gu, "o")
    .replace(/[$5]/gu, "s")
    .replace(/7/gu, "t");
  const blockedWords = [
    "fuck", "fucking", "motherfucker", "shit", "bullshit", "bitch", "asshole",
    "bastard", "cunt", "dick", "pussy", "whore", "slut", "nigger", "nigga",
    "faggot", "retard"
  ];
  return blockedWords.some((word) => {
    const letters = [...word].map((letter) => escapeRegExp(letter)).join("[\\s._-]*");
    return new RegExp(`(?:^|[^\\p{L}\\p{N}])${letters}(?=$|[^\\p{L}\\p{N}])`, "iu").test(normalized);
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
