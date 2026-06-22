---
name: validate
description: >
  LaunchThesis's 48-hour live validation sprint: prove real cold-stranger demand before
  building. V0 freeze the Gate V predicates + sprint state -> V1 guerrilla GTM (channel
  standing, named-prospect list, DM-first) -> V2 conversion brief (the kit BRIEFS; the
  HUMAN builds the page) + measurement plumbing -> V3 launch (human posts; cold-tagged
  ingestion; pull-based polling) -> V4 report with the gate-eval verdict + the AI-builder
  handoff. Gate V: >=10 cold-weighted users + >=1 cold hard pay-proof, recomputed from raw
  rows by gate-eval.mjs (the builder is not the scorer, C6). Self-contained; reads
  .launchthesis/config.yaml; input = the /launchthesis:discover Launch Thesis armed by
  /launchthesis:strategy.
---

# /validate — 48h live validation sprint

Prove real cold demand before building. Consumes a discover Launch Thesis that cleared
Gate D and was armed by /launchthesis:strategy (the strategy step supplies the conversion
brief's growth/landing plays + the sold scope the page promises). Five phases; the gate is
un-gameable by construction. On a Gate V PASS the deliverable is the **AI-builder
handoff** — full stop. The kit does not own the build.

**Config first.** Read .launchthesis/config.yaml (`validate.*`, `product:`). Missing ->
point the user at /launchthesis:setup. The project's CLAUDE.md overrides this skill.

## Operating rules
- **Self-contained (C1).** Built-ins + the project's declared connectors only.
- **Builder is not the scorer (C6).** The verdict is recomputed by
  `${CLAUDE_PLUGIN_ROOT}/templates/landing/gate-eval.mjs` over the raw rows,
  reproducibly. Never declare PASS from memory.
- **The kit ships no auto-page.** The human builds it (V2); the kit briefs + verifies.
- **Serial by default** (`validate.max_concurrent_sprints`): refuse a 2nd open sprint.
- **Report honestly.** If a gate could not run (no connector, no traffic), say so in the
  report — never imply a check happened when it didn't.
- **Communicate** per `${CLAUDE_PLUGIN_ROOT}/skills/shared/communication.md`: emit a
  `Validate · V<n>/4` breadcrumb as you enter each phase, gloss first-use jargon (Gate V,
  cold-weight fraction, pay-proof, abandoned_at) from
  `${CLAUDE_PLUGIN_ROOT}/skills/shared/glossary.md`, and end with the Gate V scorecard + the
  signpost footer. The scorecard is a faithful render of the verbatim `gate-eval.mjs` output
  — never a substitute for the recompute (C6).

## V0 — Instrument + freeze the gate
Classify archetype -> set the window (`validate.window_hours`; marketplace/considered
purchases may extend to `max_window_hours`). Build the frozen predicates from
`validate.gate` (compute `pay_proof.min_amount = min_pct_of_price x the D2 price`) and
HASH them into the brief BEFORE anything is built. Create the durable sprint-state file
at `<validate.sprints_dir>/<slug>.yaml` (window bounds, deploy/data/payments resource
ids, channels_posted, last_event_cursor, tier_counts, gate_status, `abandoned_at`). On
re-invocation, **load-and-branch**: open -> resume from the cursor; past window ->
evaluate; passed/failed -> report the prior verdict. Never re-create infra mid-sprint.

**Scoring shape (B1/B5):** the frozen predicates are the *nested* shape `gate-eval.mjs`
expects — build them with `gate-run.mjs`'s `buildPredicates(validate.gate, {windowStart,
windowEnd, price})` (it re-nests `rate.*`, computes `pay_proof.min_amount = ceil(
min_pct_of_price% × the D2 price)`, and takes the window from sprint-state). Window bounds
and event `ts` must share units; `gate-eval.mjs` normalizes ISO strings, but pass the
window in the same form your export uses.

**Compute + show the PASS target (W2):** `min_qualified_lands` (25) is the INCONCLUSIVE
floor, NOT the goal. At V0 compute and tell the founder a lands-to-PASS target ≈
`ceil(floor_users / expected_cold_signup_rate)` (≈ 100–200 cold lands at a 5–10% signup
rate). Aim there.

**Payment hard-stop (B4):** if `validate.payments.provider` is blank AND
`require_pay_proof` is true, STOP before any GTM and force a choice — **Path A:** wire a
Stripe manual-capture pre-auth / Payment Link at ≥ `min_pct_of_price`% of the D2 price in
LIVE mode (a hold; no money settles); **Path B:** the gate-eligible hand-LOI recipe — a
real signed LOI/deposit recorded as a row `{tier:"loi", cohort:"cold_public", live:true,
amount: ceil(min_pct_of_price% × price)}`. A planner-mode run with neither path CANNOT
reach PASS (an `amount:0` or warm LOI fails the pay-proof) — say so plainly.

## V1 — Guerrilla GTM (DM-first)
Run `${CLAUDE_PLUGIN_ROOT}/skills/validate/references/guerrilla-playbook.md`: channel
standing, the named-prospect list, per-channel tracked links (the `?src=` tag classifies
the cohort). Default channel order leads with 1:1 outreach. The cheap pulse already came
from discover D2's DMs; V1 scales it through WARM channels. Draft every post/DM. Stay
<= `validate.budget_cap_usd`.

## V2 — Conversion brief (kit) -> the human builds the page
Produce the conversion brief with
`${CLAUDE_PLUGIN_ROOT}/skills/validate/references/landing-conversion.md`: strategy +
copy + wireframe + the rubric, using strategy's growth/landing plays + the discover wedge
(the current `named` wedge from the Launch Thesis). Ship the measurement plumbing from
`${CLAUDE_PLUGIN_ROOT}/templates/landing/`
(`capture.js`, `schema.sql`, `payment-intent.mjs` preauth, `privacy.md`, `gate-eval.mjs`)
wired to `validate.deploy` / `validate.data` / `validate.payments` (a blank connector ->
planner-mode for that step, per C2). **The human builds and designs the page** and wires
it to the plumbing.

**Pre-launch gate (the sprint does not count until this passes):** verify the
human-built page (a) clears the conversion rubric with explicit human sign-off, (b)
clears the honesty floor
(`${CLAUDE_PLUGIN_ROOT}/skills/validate/references/honesty-floor.md`), and (c) a test
land/signup/probe event actually **LANDS in the store** (confirm the row exists by
querying the table, or a CSV/manual row in planner-mode) — not merely that the browser
"fired" it; a wired-but-broken backend records nothing visibly otherwise. A verify-fail
sends the page back for edits — no new loop. The kit never auto-launches a page.

**Honesty-floor drop-off (the kit's #1 health metric).** This is exactly where founders
quit: the floor demands a real converting page (V2) and a confirmed land (V2c) before any
signal counts. Record where the founder dropped in the sprint-state `abandoned_at` field,
the canonical enum:
`none | pre_pulse | pre_page | pre_lands | pre_launch | mid_window`. The **honesty floor**
is `pre_page` (founder never built the real converting page) and `pre_lands` (page built
but no confirmed land ever stored) — drop-off there is the make-or-break of vibe-coder
fit. Stamp `abandoned_at` here in V2 (and update it in V3 if they reach launch); V4 reports
it and it is logged to the studio validation-log.

## V3 — Launch (human posts; cold-tagged ingestion)
The founder posts from their own accounts (`auto_post: false`). The clock starts at the
first qualified impression. Ingest events tagged by source cohort; tag-and-drop founder
/ known-contact / agent rows at ingestion (`gate.founder_identifiers`, `exclude_self`) so
contamination can never trip the gate. Monitoring is **pull-based** — the founder
re-runs /validate to poll; each poll advances the cursor idempotently. An optional GitHub
Actions cron can poll hands-off, but is never required. If the founder reaches launch,
clear `abandoned_at` to `none` (or `mid_window` if they stop before the window closes); a
founder who never posts is `pre_launch`.

## Gate V — recomputed, three-way + not-measurable
Export the raw rows to JSON and `validate.gate` to JSON, then run the canonical driver:
`node ${CLAUDE_PLUGIN_ROOT}/templates/landing/gate-run.mjs --export rows.json --gate
gate.json --price <D2 price> --window-start <start> --window-end <end>` (add `--lands N`
in planner-mode). It builds the nested predicates, derives **`lands` = count of in-window,
non-founder `land` rows (deduped by session)**, calls `evaluateGate`, prints the verdict +
counted rows, and WARNS if 0 rows fall in-window. Report its output verbatim — never
declare a verdict from memory. (Planner-mode: set `--lands` to your hand-counted distinct
qualified impressions; if you can't count them, treat the run as NOT-MEASURABLE.) Outcomes:
- **PASS** — exposure met, cold-weighted floor met, >=1 cold hard pay-proof -> emit the
  **AI-builder handoff** (see V4). The wedge becomes `validated`.
- **INCONCLUSIVE** — lands below the exposure floor (thin traffic) -> extend once /
  re-channel; NEVER kick back to discover on thin traffic. Studio log: `channel_thin`.
- **FAIL** — lands met but no pay-proof or land-and-bounce -> **variant-before-kill**:
  run `validate.gate.message_variants_before_kickback` copy/offer variants + one free
  cross-channel re-test first. Two named dispositions follow:
  - **copy_weak** — a variant fixes it (a stronger page converts). Stay in validate; no
    kickback. Studio log: `copy_weak`.
  - **wedge_refuted** — the copy/offer variants ALL fail **and** the traffic floor was met
    (so it is NOT thin traffic): the position itself is not believed. The kickback to
    /launchthesis:discover is an explicit **wedge re-cut** — bump `wedge.version`, set the
    prior version `refuted` with a `refuted_by` note (e.g. "Gate V FAIL across N offer
    variants, traffic floor met — position not believed"), and return to **Research / D3**
    to harden a new cut (not just a new offer). Studio log: `wedge_refuted`.
  Bounds: copy/offer variants by `validate.max_rounds`; wedge re-cuts by
  `studio.max_wedge_recuts` (within the overall ceiling `studio.max_concept_cycles`).
- **NOT-MEASURABLE** — analytics never fired / payments stuck in sandbox -> fix
  instrumentation (bounded by `validate.gate.max_repair_attempts`); on exhaustion,
  degrade to a human-judged manual count from the raw evidence.

**Render the Gate V scorecard** (communication §4) from the `gate-eval.mjs` output — verdict,
counted/weighted users, cold-weight fraction, friend share, cold hard pay-proof, fail
attribution (FAIL only), and `abandoned_at` — in the terminal, alongside the V4 report. It
mirrors the gate-eval output exactly; never hand-author it.

## V4 — Validation Report + AI-builder handoff
Write `<docs.specs_dir>/YYYY-MM-DD-<slug>-validation.md` from
`${CLAUDE_PLUGIN_ROOT}/templates/validate/validation-report.md`: the funnel per
tier x cohort, the gate-eval verdict WITH its raw counted rows, the captured cold-user
list (PII in `validate.data.*`, never `studio/`), and the **honesty-floor drop-off**
(`abandoned_at`, the kit's #1 health metric).

On a PASS, write the **Validated Launch Thesis handoff** from
`${CLAUDE_PLUGIN_ROOT}/templates/validate/handoff.md` to
`<docs.specs_dir>/YYYY-MM-DD-<slug>-handoff.md`. This is the AI-builder build brief — the
product's payoff. Six blocks: (1) verdict + confidence (the gate counts + a
`low|medium|high` read), (2) the validated thesis + wedge (version + statement), (3)
**build this** (the sold scope) — one entry per deliverable the converting page promised
payers, each with acceptance criteria; the price; the paid-cohort count; the first-access
deadline, (4) **do NOT build this** — unvalidated extras + the **declined plays** from the
strategy brand-safety pass, (5) who + the channels that actually converted, (6) the
metric→play wiring to instrument. Then a generated paste-ready **build prompt** block. The
handoff is **GUIDANCE for the user's own build workflow, not a scope-guard contract** — the
kit stops at proven demand. The first-access window uses
`validate.handoff.max_days_to_first_access`.

On the PASS, also set the wedge `status: validated` in the discover Launch Thesis brief
(the versioned wedge object lives in `<docs.specs_dir>/…-launch-thesis.md`); note the
update in the report.

**Close the run** (communication §2): after the scorecard, print the signpost footer — echo
the validation-report path (`<docs.specs_dir>/YYYY-MM-DD-<slug>-validation.md`) and, on a
PASS, the handoff path (`…-handoff.md`) plus the studio-log row — then name the single next
action: on **PASS** `→ paste the handoff's build prompt into your AI builder`; on
**INCONCLUSIVE** `→ /launchthesis:validate` (extend / re-channel); on **FAIL** `copy_weak`
`→ /launchthesis:validate` (run a variant) or `wedge_refuted` `→ /launchthesis:discover`
(re-cut the wedge).

## Studio loop
Read `.launchthesis/studio/playbook.md` as priors (advisory; never gate). Write one
`.launchthesis/studio/validation-log.md` row, tagged (icp_type, archetype, primary_channel,
channel_standing, cold land->pay rate, founder_hours, `abandoned_at`, fail_attribution
[`channel_thin` | `copy_weak` | `wedge_refuted`], outcome) — record FAILs too. The
`abandoned_at` field is the kit's #1 health metric; surface honesty-floor drop-off
(`pre_page`/`pre_lands`) in the log. Promote a tactic to `supported` only after it
converts across >= `studio.promote_after_k` runs AND >= 2 distinct ICPs. Log a
panel-vs-outcome entry when the market confirms or refutes a discover red-team call; tie a
`wedge_refuted` outcome into the wedge-patterns ledger. No PII in `studio/`.

## Multi-agent quick reference
| Work | Agent | Parallel? |
|---|---|---|
| V1 community / standing research | `Explore` (read-only) | Yes |
| Conversion-brief copy drafts | `general-purpose` | optional |
| V0 freeze, gate-eval call, pre-launch gate, V4 report + handoff | orchestrator | Never delegated |
