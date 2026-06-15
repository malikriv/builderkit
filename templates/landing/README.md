# templates/landing — the validate conversion asset

A provider-shaped scaffold for the 48-hour validation sprint. Copy into your project,
fill the `{{TOKENS}}` from `.builderkit/config.yaml` + the discover brief, wire the two
connectors, deploy.

## Pieces
- `wiring-reference.html` — a WIRING REFERENCE (not a launch page): shows how a page
  calls `capture()` / `recordLand()` / `startPreauth()`. You build and design the real
  page in your own tool (see `skills/validate/references/landing-conversion.md`) and
  reuse this wiring. The kit ships no auto-page.
- `capture.js` — cookieless, idempotent client capture; cohort from the link's `?src=`.
- `schema.sql` — the `builderkit_events` table (unique `dedupe_key` = idempotency).
- `payment-intent.mjs` — the HARD signal: a Stripe manual-capture **pre-auth** (no money moves).
- `gate-eval.mjs` — recomputes the Gate V verdict from the raw rows (see below).
- `gate-run.mjs` — the canonical Gate V scorer CLI (`node gate-run.mjs --export rows.json
  --gate gate.json --price N --window-start <s> --window-end <e> [--lands N]`).
- `server/capture.route.mjs`, `server/preauth.route.mjs` — copy-paste reference backends
  for `/api/capture` (Supabase insert) and `/api/preauth` (Stripe manual-capture hold).
- `privacy.md` — fill-in privacy/consent.

## Wiring (from config)
- `validate.deploy.*` → where your built page is hosted (e.g. Vercel static).
- `validate.data.*` → `STORE_ENDPOINT` in `capture.js` + apply `schema.sql`.
- `validate.payments.*` → `STRIPE_PUBLISHABLE_KEY` + the `/api/preauth` route.

## Planner-mode (constraint C2)
Any connector left blank degrades gracefully: with no payments connector, the reserve
button records a SOFT intent only and the founder collects a pre-sell/LOI by hand; with
no data connector, the founder reconciles signups from a form/CSV export. The Gate V
verdict is then computed by running `gate-eval.mjs` over the hand-collected rows.

## Scoring the gate
Run `gate-run.mjs` (above) — it builds the nested predicates from `validate.gate`
(computing `min_amount` from the D2 price), derives `lands` from in-window `land` rows,
calls `gate-eval.mjs`, and prints the verdict + counted rows so a human or a separate
agent can reproduce it. It WARNS if 0 rows fall in-window (a timestamp-units mistake).
The builder is never the sole scorer (spec C6).
