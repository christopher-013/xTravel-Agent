# Direct feedback setup

Adtona submits the in-app feedback form to the same-origin endpoint
`POST /api/feedback`. The Cloudflare Worker in `feedback-worker.js` creates an
issue in `christopher-013/Adtona`, so visitors never see a GitHub dialog and do
not need a GitHub account.

The GitHub credential must remain an encrypted Cloudflare secret. Never place it
in `beta-tools.js`, `index.html`, `wrangler.jsonc`, a GitHub Actions variable, or
any other browser/downloadable file.

## One-time GitHub setup

1. In GitHub, create a **fine-grained personal access token**.
2. Limit repository access to **Only select repositories → Adtona**.
3. Under repository permissions, grant **Issues: Read and write** only.
4. Give the token a short expiration and rotate it before it expires.

The form creates public GitHub issues. The UI therefore warns visitors not to
submit email addresses, passwords, private trip details, or other personal
information.

## Add the encrypted Cloudflare secret

The production Worker is named `adtona`.

### Cloudflare dashboard

1. Open **Workers & Pages → adtona**.
2. Open **Settings → Variables and Secrets**.
3. Add `GITHUB_TOKEN`.
4. Choose **Secret/Encrypt**, paste the fine-grained token, and save.
5. Deploy the latest Worker version if Cloudflare does not redeploy it
   automatically.

### Wrangler (only from an authenticated local terminal)

```powershell
npx wrangler secret put GITHUB_TOKEN --name adtona
npx wrangler deploy
```

Wrangler prompts for the token without writing it to the repository. Do not
paste the token into a chat, issue, build log, or command argument.

## Configuration

`wrangler.jsonc` provides only non-secret configuration:

- Worker entry point: `feedback-worker.js`
- Required secret declaration: `GITHUB_TOKEN` (the value is never stored in this file)
- Static asset binding: `ASSETS`
- Worker-first route: `/api/feedback`
- GitHub repository: `christopher-013/Adtona`
- Allowed production and localhost origins
- A Cloudflare rate-limiting binding that allows five submissions per minute per client

`beta-tools.js` always posts to `/api/feedback`; there is no browser-side GitHub
fallback.

## Verify

Run the network-free validation suite:

```powershell
npm run check
npm run smoke
npm run build:cloudflare
npm run verify:cloudflare
```

After deployment:

1. Open Adtona and select **Send feedback**.
2. Submit a clearly labeled test report.
3. Confirm the in-app success message appears and no GitHub page opens.
4. Confirm the issue was created in `christopher-013/Adtona`.
5. Delete or close the test issue.

If the form reports a temporary failure, verify that `GITHUB_TOKEN` exists on
the `adtona` Worker and still has Issues read/write access.

## Abuse protection

The Worker includes origin checks, strict JSON and size validation, output
sanitization, a hidden honeypot, and a Cloudflare rate-limiting binding. Add
Cloudflare Turnstile if automated spam becomes a problem.
