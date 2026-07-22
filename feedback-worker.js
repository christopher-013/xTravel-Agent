/* feedback-worker.js — Cloudflare Worker that files PlanToGuide beta feedback as a
 * GitHub issue on the user's behalf, so the reporter never leaves the app or needs a
 * GitHub account.
 *
 * WHY A WORKER: creating a GitHub issue requires a write token. A public static site
 * (GitHub Pages) cannot hold that token safely — anyone could read it and spam the
 * repo. This Worker keeps the token as a server-side secret and is the only thing that
 * talks to the GitHub API. The browser just POSTs the feedback JSON here.
 *
 * ── One-time setup (see FEEDBACK-WORKER-SETUP.md for the full walkthrough) ──
 *   1. Create a GitHub fine-grained personal access token scoped to the PlanToGuide
 *      repo with "Issues: Read and write" permission.
 *   2. Deploy this file as a Cloudflare Worker (dashboard → Workers & Pages → Create,
 *      or `npx wrangler deploy`). Note the workers.dev URL it gives you.
 *   3. Add the token as a secret named GITHUB_TOKEN (Worker → Settings → Variables →
 *      Add secret, or `npx wrangler secret put GITHUB_TOKEN`).
 *   4. Paste the Worker URL into FEEDBACK_ENDPOINT at the top of beta-tools.js.
 *
 * Optional environment variables (Worker → Settings → Variables):
 *   GITHUB_REPO      "owner/name"  (default "christopher-013/PlanToGuide")
 *   ALLOWED_ORIGINS  comma-separated list of origins allowed to submit
 *                    (default the PlanToGuide Pages site + localhost for testing)
 */

const DEFAULT_REPO = "christopher-013/PlanToGuide";
const DEFAULT_ALLOWED_ORIGINS = [
  "https://christopher-013.github.io",
  "http://127.0.0.1:8767",
  "http://localhost:8767"
];

const MAX_SUMMARY = 140;
const MAX_MESSAGE = 4000;
const MAX_EMAIL = 160;

export default {
  async fetch(request, env) {
    const allowedOrigins = (env.ALLOWED_ORIGINS
      ? env.ALLOWED_ORIGINS.split(",").map((value) => value.trim()).filter(Boolean)
      : DEFAULT_ALLOWED_ORIGINS);
    const origin = request.headers.get("Origin") || "";
    const originAllowed = allowedOrigins.includes(origin);
    const corsOrigin = originAllowed ? origin : allowedOrigins[0];

    const cors = {
      "Access-Control-Allow-Origin": corsOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== "POST") {
      return json({ ok: false, error: "Method not allowed" }, 405, cors);
    }
    // Browsers always send Origin on cross-origin POST; require an allowed one (this also
    // rejects Origin-less non-browser callers). Light friction against casual abuse — add
    // Cloudflare Turnstile for stronger protection if the beta attracts spam.
    if (!originAllowed) {
      return json({ ok: false, error: "Origin not allowed" }, 403, cors);
    }
    if (!env.GITHUB_TOKEN) {
      return json({ ok: false, error: "Feedback service is not configured (missing token)." }, 500, cors);
    }

    let payload;
    try {
      payload = await request.json();
    } catch (e) {
      return json({ ok: false, error: "Invalid JSON body" }, 400, cors);
    }

    const category = pick(["bug", "idea", "praise", "other"], payload.category, "other");
    const summary = clip(String(payload.summary || "").trim(), MAX_SUMMARY);
    const message = clip(String(payload.message || "").trim(), MAX_MESSAGE);
    const email = clip(String(payload.email || "").trim(), MAX_EMAIL);
    if (!summary) {
      return json({ ok: false, error: "A summary is required." }, 400, cors);
    }

    const typeLabel = { bug: "Bug", idea: "Idea", praise: "Praise", other: "Feedback" }[category];
    const title = `[${typeLabel}] ${summary}`;
    const body = [
      `**Type:** ${typeLabel}`,
      "",
      message || "_(no description provided)_",
      "",
      "---",
      `**Contact (optional):** ${email || "—"}`,
      `**Page:** ${clip(String(payload.page || "—"), 300)}`,
      `**Viewport:** ${clip(String(payload.viewport || "—"), 40)}`,
      `**Version:** ${clip(String(payload.version || "—"), 40)}`,
      `**User agent:** ${clip(String(payload.userAgent || "—"), 400)}`,
      "",
      "_Filed automatically from the in-app beta feedback form._"
    ].join("\n");

    const repo = env.GITHUB_REPO || DEFAULT_REPO;
    const ghResponse = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        "User-Agent": "PlanToGuide-Feedback-Worker"
      },
      body: JSON.stringify({ title, body, labels: ["feedback", "beta"] })
    });

    if (!ghResponse.ok) {
      const detail = await ghResponse.text().catch(() => "");
      return json({ ok: false, error: `GitHub API error ${ghResponse.status}`, detail: clip(detail, 300) }, 502, cors);
    }

    const issue = await ghResponse.json().catch(() => ({}));
    return json({ ok: true, url: issue.html_url || "", number: issue.number || null }, 201, cors);
  }
};

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...cors }
  });
}

function clip(value, max) {
  return value.length > max ? value.slice(0, max) : value;
}

function pick(allowed, value, fallback) {
  return allowed.includes(value) ? value : fallback;
}
