# PlanToGuide trip schema (`xtravel-trip`, version 2)

Every exported `TRIP-PLAN.md` ends with a **Machine-Readable Trip Data** section containing a fenced block that opens with:

    ```json xtravel-trip

The block holds one JSON object describing the entire trip. PlanToGuide's **Import updated plan** feature reads this block (from a pasted file, a pasted AI reply, or a bare JSON paste) and re-renders the trip website from it.

## Top-level fields

| Field | Type | Notes |
|---|---|---|
| `schema` | string | Always `"xtravel-trip"`. Required. |
| `version` | number | Currently `2`. Imports reject versions newer than the app supports. |
| `destination` | string | Required. |
| `start`, `end` | string | `YYYY-MM-DD`. Required. |
| `wishes` | string | Free-text traveler interests. |
| `preferences` | object | Pace, party, home base, budget, restrictions, etc. Unknown keys are preserved. |
| `bookings` | array | `{ name, date, time, status }`. Status: confirmed, needs booking, optional, backup, needs verification. |
| `practical` | object | See below. |
| `days` | array | Required, at least one day. |

## `days[]`

| Field | Type | Notes |
|---|---|---|
| `date` | string | `YYYY-MM-DD`. Required. |
| `title` | string | Day headline. |
| `zone` | object or null | `{ name, icon }` — the day's geographic focus. |
| `activities` | array | Required, at least one. |

### `activities[]`

`{ time, title, type, icon, status, description }` — `time` and `title` are required. Activities are re-sorted by time on import.

## `practical`

Verified on-the-ground details an AI assistant should research and fill:

`emergencyNumbers`, `touristHotline`, `nearestEmbassy`, `hospitalOrClinic`, `transitTips`, `tipping`, `keyPhrases` (array of strings), `notes`.

Values still containing the phrase "Needs verification" are treated as unfilled and are not shown as verified in the trip website.

## Rules for AI assistants

1. Preserve confirmed bookings and traveler must-dos unless explicitly asked to change them.
2. Keep the JSON block and the human-readable sections in sync.
3. Return the **complete** updated `TRIP-PLAN.md` — all headings plus the updated JSON block — so the traveler can import it.
4. Never invent live facts; mark unverified items with status "Needs verification".

## Import tolerance

The importer accepts the full markdown file, any fenced JSON block containing `"xtravel-trip"`, or a bare JSON object. It repairs trailing commas, smart quotes, and stray control characters, and reports friendly per-field validation errors for anything else.

