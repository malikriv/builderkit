---
name: validate
description: >
  BuilderKit's 48-hour live validation sprint: prove real cold-stranger demand before
  building. V0 freeze the Gate V predicates + sprint state -> V1 guerrilla GTM (channel
  standing, named-prospect list, DM-first) -> V2 conversion brief (the kit BRIEFS; the
  HUMAN builds the page) + measurement plumbing -> V3 launch (human posts; cold-tagged
  ingestion; pull-based polling) -> V4 report with the gate-eval verdict + delivery
  commitment. Gate V: >=10 cold-weighted users + >=1 cold hard pay-proof, recomputed
  from raw rows by gate-eval.mjs (the builder is not the scorer, C6). Self-contained;
  reads .builderkit/config.yaml; input = the discover/audit handoff.
---

# /validate — 48h live validation sprint

Prove real cold demand before building. Consumes a discover Hardened Hypothesis Brief
that cleared Gate D and was planned by /builderkit:audit (the audit supplies the
conversion brief's growth/landing plays + the build list). Five phases; the gate is
un-gameable by construction.

**Config first.** Read .builderkit/config.yaml (`validate.*`, `product:`). Missing ->
point the user at /builderkit:setup. The project's CLAUDE.md overrides this skill.

## Operating rules
- **Self-contained (C1).** Built-ins + the project's declared connectors only.
- **Builder is not the scorer (C6).** The verdict is recomputed by
  `${CLAUDE_PLUGIN_ROOT}/templates/landing/gate-eval.mjs` over the raw rows,
  reproducibly. Never declare PASS from memory.
- **The kit ships no auto-page.** The human builds it (V2); the kit briefs + verifies.
- **Serial by default** (`validate.max_concurrent_sprints`): refuse a 2nd open sprint.
- **Report honestly.** If a gate could not run (no connector, no traffic), say so in the
  report — never imply a check happened when it didn't.

## V0 — Instrument + freeze the gate
Classify archetype -> set the window (`validate.window_hours`; marketplace/considered
purchases may extend to `max_window_hours`). Build the frozen predicates from
`validate.gate` (compute `pay_proof.min_amount = min_pct_of_price x the D2 price`) and
HASH them into the brief BEFORE anything is built. Create the durable sprint-state file
at `<validate.sprints_dir>/<slug>.yaml` (window bounds, deploy/data/payments resource
ids, channels_posted, last_event_cursor, tier_counts, gate_status). On re-invocation,
**load-and-branch**: open -> resume from the cursor; past window -> evaluate; passed/
failed -> report the prior verdict. Never re-create infra mid-sprint.

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
copy + wireframe + the rubric, using audit's growth/landing plays + the discover wedge.
Ship the measurement plumbing from `${CLAUDE_PLUGIN_ROOT}/templates/landing/`
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

## V3 — Launch (human posts; cold-tagged ingestion)
The founder posts from their own accounts (`auto_post: false`). The clock starts at the
first qualified impression. Ingest events tagged by source cohort; tag-and-drop founder
/ known-contact / agent rows at ingestion (`gate.founder_identifiers`, `exclude_self`) so
contamination can never trip the gate. Monitoring is **pull-based** — the founder
re-runs /validate to poll; each poll advances the cursor idempotently. An optional GitHub
Actions cron can poll hands-off, but is never required.

## Gate V — recomputed, three-way + not-measurable
Export the raw rows to JSON and `validate.gate` to JSON, then run the canonical driver:
`node ${CLAUDE_PLUGIN_ROOT}/templates/landing/gate-run.mjs --export rows.json --gate
gate.json --price <D2 price> --window-start <start> --window-end <end>` (add `--lands N`
in planner-mode). It builds the nested predicates, derives **`lands` = count of in-window,
non-founder `land` rows (deduped by session)**, calls `evaluateGate`, prints the verdict +
counted rows, and WARNS if 0 rows fall in-window. Report its output verbatim — never
declare a verdict from memory. (Planner-mode: set `--lands` to your hand-counted distinct
qualified impressions; if you can't count them, treat the run as NOT-MEASURABLE.) Outcomes:
- **PASS** — exposure met, cold-weighted floor met, >=1 cold hard pay-proof -> hand
  audit's build list to /builderkit:ship.
- **INCONCLUSIVE** — lands below the exposure floor -> extend once / re-channel; NEVER
  kick back to discover on thin traffic.
- **FAIL** — lands met but no pay-proof or land-and-bounce -> **variant-before-kill**:
  run `validate.gate.message_variants_before_kickback` copy/offer variants + one free
  cross-channel re-test first; only a same-strength page failing across variants routes
  back to /builderkit:discover. Bound by `validate.max_rounds` + the global
  `studio.max_concept_cycles`.
- **NOT-MEASURABLE** — analytics never fired / payments stuck in sandbox -> fix
  instrumentation (bounded by `validate.gate.max_repair_attempts`); on exhaustion,
  degrade to a human-judged manual count from the raw evidence.

## V4 — Validation Report + delivery commitment
Write `<docs.specs_dir>/YYYY-MM-DD-<slug>-validation.md` from
`${CLAUDE_PLUGIN_ROOT}/templates/validate/validation-report.md`: the funnel per
tier x cohort, the gate-eval verdict WITH its raw counted rows, the captured cold-user
list (PII in `validate.data.*`, never `studio/`), and the **delivery-commitment block**
(the promise the page made, the paid cohort, the first-access deadline) that
/builderkit:ship reads as binding Phase-0 input.

On a PASS, also write the machine-readable **`<docs.specs_dir>/sold-scope.yaml`** from
`${CLAUDE_PLUGIN_ROOT}/templates/delivery/sold-scope.template.yaml`: one `deliverables`
entry per feature the winning page actually promised, the `price`, the
`paid_cohort_count`, and `max_days_to_first_access` (= `validate.delivery.max_days_to_first_access`).
This is the drift contract the ship scope guard (`templates/delivery/scope-check.mjs`)
enforces — it is what was *sold*, derived from the page that converted, never re-scoped
afterward. PII stays in `validate.data.*`; `sold-scope.yaml` carries only the obligation
counts.

## Studio loop
Read `.builderkit/studio/playbook.md` as priors (advisory; never gate). Write one
`.builderkit/studio/validation-log.md` row, tagged (icp_type, archetype, primary_channel,
channel_standing, cold land->pay rate, founder_hours, outcome) — record FAILs too.
Promote a tactic to `supported` only after it converts across >= `studio.promote_after_k`
runs AND >= 2 distinct ICPs. Log a panel-vs-outcome entry when the market confirms or
refutes a discover red-team call. No PII in `studio/`.

## Multi-agent quick reference
| Work | Agent | Parallel? |
|---|---|---|
| V1 community / standing research | `Explore` (read-only) | Yes |
| Conversion-brief copy drafts | `general-purpose` | optional |
| V0 freeze, gate-eval call, pre-launch gate, V4 report | orchestrator | Never delegated |
