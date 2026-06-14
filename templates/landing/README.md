# templates/landing — the validate conversion asset

A provider-shaped scaffold for the 48-hour validation sprint. Copy into your project,
fill the `{{TOKENS}}` from `.builderkit/config.yaml` + the discover brief, wire the two
connectors, deploy.

## Pieces
- `index.html` — one ICP headline → problem → value → single CTA + the two-signal WTP probe.
- `capture.js` — cookieless, idempotent client capture; cohort from the link's `?src=`.
- `schema.sql` — the `builderkit_events` table (unique `dedupe_key` = idempotency).
- `payment-intent.mjs` — the HARD signal: a Stripe manual-capture **pre-auth** (no money moves).
- `gate-eval.mjs` — recomputes the Gate V verdict from the raw rows (see below).
- `privacy.md` — fill-in privacy/consent.

## Wiring (from config)
- `validate.deploy.*` → where `index.html` is hosted (e.g. Vercel static).
- `validate.data.*` → `STORE_ENDPOINT` in `capture.js` + apply `schema.sql`.
- `validate.payments.*` → `STRIPE_PUBLISHABLE_KEY` + the `/api/preauth` route.

## Planner-mode (constraint C2)
Any connector left blank degrades gracefully: with no payments connector, the reserve
button records a SOFT intent only and the founder collects a pre-sell/LOI by hand; with
no data connector, the founder reconciles signups from a form/CSV export. The Gate V
verdict is then computed by running `gate-eval.mjs` over the hand-collected rows.

## Scoring the gate
`gate-eval.mjs` is the **single source of truth** for PASS / FAIL / INCONCLUSIVE /
NOT-MEASURABLE. Export the raw rows, build the frozen predicates from
`validate.gate` (with `min_amount = min_pct_of_price × price`), and call
`evaluateGate({rows, lands, measurable}, predicates)`. The verdict carries the exact
counted rows so a human or a separate agent can reproduce it — the builder is never the
sole scorer (spec C6).
