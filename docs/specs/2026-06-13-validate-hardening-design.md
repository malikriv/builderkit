# BuilderKit — validate hardening (pre-deployment NO-GO remediation)

Date: 2026-06-13
Status: approved design, pre-implementation
Author: malikriv (with Claude Code)

> A 22-agent pre-deployment review returned **NO-GO**: `discover`/`audit`/`ship` are
> fine and the Gate-V scoring math is correct (12/12 unit tests pass), but the
> `validate` phase would face-plant a real first run — the gate crashes on the
> documented config shape, the required pay-proof can't be produced honestly, no
> capture/preauth backend ships (and failures are swallowed), planner-mode is
> mathematically unwinnable, there's no driver to run the scorer, and setup railroads
> an idea-stage founder into e2e phases for an app that doesn't exist. All fixes are
> **wiring / drivers / docs — not a redesign.** This spec covers the 6 confirmed
> blockers + 3 winnability fixes the user approved. Branch: `feat/validate-hardening`
> off `main`. The parked `feat/validate-enhancements` (EXTEND/ledger/founder-hours) is
> separate; where this overlaps (planner-mode), this hardening supersedes.

## Goal / non-goals

**Goal:** make a real first `validate` run **runnable and winnable** — the gate
produces a correct, honest verdict, the founder has a working path to the one signal
it requires, and setup sends an idea-stage founder to `/discover` not e2e.
**Non-goals:** redesigning the gate math (it's correct); the parked enhancements
(EXTEND verdict, standing ledger, founder-hour budget); shipping a full Elements
checkout (contradicts the human-builds-the-page stance).

## B1 — `gate-eval` must not crash on the config shape (blocker; small)

The evaluator reads **nested** predicates (`p.rate.*`, `p.pay_proof.min_amount`,
`p.window_start/end`) but `validate.gate` config is **flat** and has no window →
`TypeError` on the only scoring step.

- **Fix (code, TDD):** add nullish-safe access in `gate-eval.mjs` so a flat/partial
  predicates object degrades to a clear result instead of throwing (e.g. read
  `p.rate?.rate_min_sample_visits`; if rate config is absent, skip the rate guard
  rather than crash). Add a test that a flat object does not throw.
- **Fix (driver, B5):** the canonical predicate construction lives in a
  `buildPredicates(config, {windowStart, windowEnd, price})` helper (in `gate-run.mjs`)
  that maps flat `validate.gate` → the nested shape, computes
  `pay_proof.min_amount = ceil(min_pct_of_price/100 × price)`, and supplies the window.
- **Docs:** SKILL.md V0 + `templates/landing/README.md` state the exact nested shape
  and point at `gate-run.mjs` as the way to build it.

## B2 — the required cold pay-proof must be producible honestly (blocker; medium)

`payment-intent.mjs` sets `live:true` after a bare `fetch('/api/preauth')` — no
Stripe.js, no card, no confirmation → a **fabricated** hard signal (false PASS); and a
mis-wired page has no real path to the signal the gate demands.

- **Fix (code-honesty guard):** in `payment-intent.mjs`, never set `live:true` on a
  bare fetch. The flow: `/api/preauth` returns a `client_secret`; the client calls
  `stripe.confirmCardPayment(client_secret)`; only on a `requires_capture`/`succeeded`
  authorization does it `capture('payment', {amount, live:true})`. Any other outcome
  (no Stripe key, failed/declined, no confirmation) records a **soft `intent_click`**,
  so a mis-wired page degrades to an honest soft signal — never a fake PASS.
- **Recipe (docs):** add the Stripe **manual-capture pre-auth** recipe (load Stripe.js,
  mount a card field, manual-capture PaymentIntent at the D2 price in LIVE mode, void
  at sprint end) to `landing-conversion.md` + `templates/landing/README.md`, stating
  `live:true` is valid ONLY after a confirmed authorization. No full Elements checkout.

## B3 — ship the capture/preauth backend; never swallow failures (blocker; medium)

`capture.js`→`/api/capture` and `payment-intent.mjs`→`/api/preauth` have no shipped
backend, and `capture.js` `catch(_){}` hides failures → a wired-but-broken store
"fires" in the browser while the table stays empty; discovered only at V4.

- **Fix (visible failure):** in `capture.js`, when `STORE_ENDPOINT` is set, read the
  response and `console.error` + surface an on-page warning on non-2xx / network
  reject. Keep the silent no-op ONLY when `STORE_ENDPOINT === ''` (true planner-mode).
  Same for `payment-intent.mjs` vs `/api/preauth`.
- **Fix (reference routes):** ship copy-paste reference handlers under
  `templates/landing/server/`: `capture.route.mjs` (Supabase insert with
  `on conflict (dedupe_key) do nothing`) and `preauth.route.mjs` (Stripe
  manual-capture PaymentIntent returning `client_secret`). `studio-setup` copies the
  matching route when `DATA_PROVIDER` / `PAY_PROVIDER` are non-blank; each route header
  documents the env vars to set.
- **Fix (gate change):** the V2 pre-launch gate changes from "capture fires" to **"the
  test event LANDS"** — confirm a row exists in the store (or a CSV/manual row in
  planner-mode) before the sprint counts.

## B4 — planner-mode must be winnable (or honestly stop) (blocker; small)

Setup tells the broke founder to leave infra blank → planner-mode, but planner-mode
records only `intent_click` (weight 0) while Gate V hard-requires a cold live pay-proof
→ 30 real cold signups still `FAIL`. A hand-LOI at `amount=0` also silently FAILs.

- **Fix (V0 hard-stop):** in `validate` SKILL V0, if `validate.payments.provider` is
  blank AND `require_pay_proof` is true, STOP before any GTM and force a choice:
  - **Path A** — wire a Stripe Payment Link / manual-capture pre-auth at ≥
    `min_pct_of_price`% of the D2 price in LIVE mode (a hold; no money settles).
  - **Path B** — a copy-pasteable **gate-eligible LOI recipe**: a hand-authored row
    `{tier:"loi", cohort:"cold_public", live:true, amount: ceil(min_pct_of_price/100 ×
    price)}` backed by a real signed LOI/deposit.
- **Fix (report):** `validation-report.md` funnel table gains **`live`** and
  **`amount`** columns; `amount` is shown as a required non-zero field for any
  pay-proof row, so an `amount=0` LOI can't silently FAIL.

## B5 — ship a driver to run the gate; fix the timestamp-units trap (blocker; medium)

`gate-eval.mjs` is a pure function whose only caller is the test; the founder must
hand-build predicates, derive `lands`, and match `ts` units to the window. The trap:
`schema.sql` stores `ts` as `timestamptz` → a raw export yields ISO strings → the
numeric `x.ts >= p.window_start` compare silently counts 0 in-window rows → a wrong
clean-looking FAIL.

- **Fix (code, TDD):** in `gate-eval.mjs` normalize `ts` and window bounds through one
  helper before the compare (`toMs = v => typeof v === 'number' ? v : Date.parse(v)`).
  Add an ISO-string-`ts` test row.
- **Fix (driver, TDD):** ship `templates/landing/gate-run.mjs` — the canonical V4
  scorer: load `.builderkit/config.yaml`, read the JSON/CSV export, `buildPredicates`
  (B1, failing loudly if the D2 price is absent), derive **`lands` = count of
  in-window non-founder `land` rows** (`--lands N` override for planner-mode), call
  `evaluateGate`, print verdict + counted rows + in-window count, and **warn if 0 rows
  land in-window while the export is non-empty**. Unit-test `buildPredicates` + the
  lands derivation + ISO-ts handling.
- **Docs:** document `node gate-run.mjs <export> [--price N] [--lands N]` as THE Gate V
  step in SKILL.md + README; add `gate-run.mjs` to `scripts/lint.sh` manifest and a
  smoke to `scripts/test.sh`.

## B6 — setup must not railroad an idea-stage founder into e2e (blocker; small)

`/builderkit:setup` makes the 4 e2e phases the body of onboarding; on a greenfield repo
stack detection is empty → unfillable `{{DRIVER}}`/`{{DEV}}` tokens; no skip guidance.
But the first-run protagonist has only an idea — their real first command is `/discover`.

- **Fix:** add a **greenfield branch** to `studio-setup`: Step 1 treats empty
  stack/driver/dev as EXPECTED; Step 2 writes only the app-free sections (`project.name`,
  `docs`, `product`, `discover`, `validate`, `studio`, `modules`) with
  `modules.testing: false` and `testing.*` left blank; Step 3 skips the four-phase walk
  and says "setup done — run `/builderkit:discover <seed>` next"; blank `testing.*` is
  not flagged as drift while `modules.testing` is false.
- **Docs:** README Quickstart step 1 states setup does NOT require an app; an
  idea-stage founder goes straight to `/builderkit:discover`.

## W1–W3 — winnability should-fixes (approved)

- **W1 — channel order vs the cold-only gate.** DMs (warm, weight 0.5) alone can't
  clear the gate (needs ≥1 `cold_public` pay-proof + ≥60% cold weight). Add a
  **PASS-anchor** at V0/V1 + reframe `guerrilla-playbook.md`: DMs build the list; at
  least one channel must drive **strangers** to the public `?src=cold_public` link.
- **W2 — exposure target.** Keep `min_qualified_lands: 25` as the **INCONCLUSIVE
  floor**, but V0 computes + displays a **lands-to-PASS target**
  (`ceil(floor_users / expected_cold_signup_rate)` ≈ 100–200 cold lands at 5–10%), and
  labels 25 explicitly as "below this = INCONCLUSIVE, not FAIL."
- **W3 — `lands` formula.** State the canonical rule everywhere: **`lands` = count of
  in-window, non-founder `land` rows** (one per session via `dedupe_key`). Planner-mode:
  hand-counted distinct qualified impressions; if unavailable, set `measurable: false`
  (→ NOT-MEASURABLE) rather than guess.

## Config additions (`templates/config.template.yaml`)
None required by the blockers (the gate keys exist). `gate-run.mjs` reads existing
`validate.gate` + the D2 price (passed via `--price` or read from the brief). The
greenfield branch sets `modules.testing: false` at write time (existing key).

## Files

**Code (TDD):** `templates/landing/gate-eval.mjs` (B1 nullish, B5 toMs) + its test;
`templates/landing/gate-run.mjs` (B5 driver) + a new test.
**Code (scaffold, syntax-checked):** `templates/landing/capture.js` (B3 visible),
`templates/landing/payment-intent.mjs` (B2 honesty guard),
`templates/landing/server/{capture.route.mjs,preauth.route.mjs}` (B3 new).
**Markdown/templates:** `skills/validate/SKILL.md` (B1 V0 shape, B2/B3 recipe+gate,
B4 V0 hard-stop, B5 driver step, W1–W3); `skills/validate/references/{landing-conversion,
guerrilla-playbook}.md` (B2 recipe, W1 reframe); `templates/validate/validation-report.md`
(B4 live/amount columns); `templates/landing/README.md` (B1/B2/B3/B5 wiring);
`skills/studio-setup/SKILL.md` (B6 greenfield); `README.md` (B6 quickstart, W2/cost note);
`scripts/lint.sh` (manifest: gate-run.mjs + the two server routes) + `scripts/test.sh`
(gate-run smoke).

## Verification
- `scripts/test.sh` green incl. new gate-eval (flat-object-no-throw, ISO-ts) + gate-run
  (buildPredicates, lands derivation) tests.
- `node --check` on capture.js / payment-intent.mjs / the server routes.
- `scripts/lint.sh --complete` → `lint OK`; no `{{` under skills/commands; IP-clean.
- Re-run the relevant pre-deployment checks: a flat-config predicate build no longer
  throws; planner-mode has a documented gate-eligible path; greenfield setup writes an
  app-free config and routes to `/discover`.

## B7 — scope-check driver (PR #5 reconciliation; medium)

PR #5 added the delivery module's **`scope-check.mjs`** — a pure scope guard (`topoWaves`
+ `evaluateScope`) consumed by `/builderkit:ship`. It has the **same gap `gate-eval` had
before B5**: no driver. `ship-feature` SKILL says to "use the rules in `scope-check.mjs`"
and the YAML contracts (`build-plan.yaml`, `sold-scope.yaml`) must be parsed to JSON to
call it — but there's no CLI, so the builder is back to eyeballing "did we stay on plan,"
re-opening the hole the module exists to close. Lower urgency than B1–B6 (ship-phase,
after a validate PASS — not the first idea→validate run) but the same integrity principle.

- **Fix (driver, mirrors `gate-run.mjs`):** ship `templates/delivery/scope-run.mjs` — a
  zero-dep CLI: `--plan plan.json --contract contract.json [--slice id,id] [--est-days N]`
  (the ship agent extracts the YAML contracts to JSON first, exactly as the validate agent
  does for the gate), call `evaluateScope`, print the verdict + the `topoWaves` layers +
  reasons/warnings, exit non-zero on any non-PASS so the pipeline halts mechanically. The
  pure `evaluateScope`/`topoWaves` are already unit-tested by `scope-check.test.mjs`;
  `scope-run.mjs` is a thin CLI verified by `node --check` + a fixture smoke.
- **Fix (docs):** `ship-feature` SKILL's scope-guard step documents `node scope-run.mjs
  --plan … --contract …` as THE way to get the verdict (extract the two YAMLs to JSON
  first), report it verbatim, halt on non-PASS.
- Add `scope-run.mjs` + fixtures to `scripts/lint.sh`'s manifest.

## Reconciliation with PR #5 (rev note)

PR #5 ("Tier 1: plan-fidelity delivery") merged after this spec was first written. It did
**not** fix B1–B6 (left `gate-eval`/`gate-run`/`capture`/`payment-intent`/greenfield setup
untouched), so all six blockers stand. It **did** rewrite some edited files but left the
high-overlap regions intact (landing files, validate V0–V3/Gate-V, the funnel table), so
the edits still anchor. Reconciliation: re-anchor `scripts/test.sh` (now runs landing **+**
delivery; landing-only glob `node --test templates/landing/*.test.mjs` is still 12 at
baseline); coexist with PR #5's V4 `sold-scope.yaml` emission + `learnings.md`
provisioning (different sub-sections, no conflict); add B7. Branch rebased onto post-#5 `main`.

## Out of scope (stay parked)
- `feat/validate-enhancements`: EXTEND verdict, standing ledger, founder-hour budget.
- spec §10: #13 fake-door detail, #18 multi-seed triage, #20 provenance/portfolio cadence.
