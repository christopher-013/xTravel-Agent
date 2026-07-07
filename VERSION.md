# PlanToGuide — Version 2 working copy

This folder is the v2 fork of `PlanToGuide`, created 2026-07-06.

## v2 changes

- **Round-trip AI workflow**: `TRIP-PLAN.md` now ends with a versioned, machine-readable `json xtravel-trip` block (see `SCHEMA.md`), and a new **Import updated plan** dialog re-renders the trip website from an AI-updated file. New module: `trip-schema.js`.
- **Round-trip prompts**: the Claude/ChatGPT prompts and the in-file AI Instructions now require the assistant to return the complete updated file with a valid JSON block.
- **Practical info**: the plan carries emergency numbers, tourist hotline, embassy, hospital, transit tips, tipping, and key phrases. The Tokyo catalog ships verified examples; other destinations are marked "Needs verification" for the AI to fill. Verified entries render in the During-trip tools.
- **AGENT-INSTRUCTIONS.md** is now included in every exported website ZIP.
- **Docs**: README rewritten around the generate → enrich → import → publish workflow; added `SCHEMA.md`; landing-page demo link now points to the public Tokyo 2026 site.

The approved Version 1 snapshot remains in the original `PlanToGuide` folder.

