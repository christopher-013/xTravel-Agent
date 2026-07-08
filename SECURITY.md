# Security policy

## Public version

This repository is intentionally a static, client-only demo. It does not call OpenAI or another metered API. Its Content Security Policy allows local application assets, Google Fonts, HTTPS images and local photo `data:`/`blob:` sources, Open-Meteo forecast and geocoding requests, Wikipedia image lookup requests, and Google Maps embeds. Scripts remain limited to same-origin files and embedded objects are blocked.

## Secret handling

- Never commit API keys, access tokens, passwords, private certificates, or populated `.env` files.
- Never place an API key in `index.html`, `app.js`, URL parameters, browser storage, or client-side configuration.
- Never ask public visitors to paste an OpenAI API key into this website.
- If a key is accidentally committed, revoke it immediately, remove it from Git history, and create a new key.
- Store keys only as encrypted environment variables in a private server-side deployment.

## ChatGPT App

The Apps SDK edition does not call the OpenAI API and does not require an OpenAI API key. ChatGPT creates the structured itinerary and calls the app's MCP rendering tool. The app server must still be hosted securely over HTTPS.

The prototype is stateless and has no user accounts. Add OAuth, authorization checks, encrypted storage, deletion controls, and a privacy policy before saving trips, bookings, or other user-specific data.

## Other AI-enabled deployments

Any AI-enabled edition must be deployed separately from the public demo. It should require authentication, validate all request fields, impose per-user rate limits, set spending limits, avoid logging secrets, and return only validated structured data to the browser.

Public access to an endpoint funded by the owner's API key can create owner charges. No code can guarantee otherwise while that endpoint remains publicly callable.

## Reporting

Do not open a public issue containing a suspected credential. Revoke the credential first, then contact the repository owner privately.
