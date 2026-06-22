# LaunchThesis glossary (shared)

Plain-language definitions of the LaunchThesis vocabulary. Skills gloss a term in one clause
on first use (see `${CLAUDE_PLUGIN_ROOT}/skills/shared/communication.md` §5) and point the
founder here for the rest. Definitions only — the authoritative behavior lives in each skill.

## The loop

- **Refine → Research → Strategy → Validate** — the four passes of the loop, run by
  `/launchthesis:setup`→`discover`→`strategy`→`validate`. Each pass ends in a verdict.
- **Studio / playbook** — the cross-product memory in `.launchthesis/studio/`. Every run
  (wins *and* kills) appends aggregate patterns — no PII — so the next idea starts smarter.
  Read as priors; advisory, never a gate.

## The wedge

- **Wedge** — the differentiated *position* an incumbent would structurally avoid copying.
  It is the subject of the thesis ("this ICP will pay this much for *this wedge*"), and it
  is a versioned, first-class object — not a flat string.
- **Wedge status** — the wedge's lifecycle:
  - `candidate` — sharp enough to clear triage (D1), not yet hardened.
  - `named` — stated explicitly and hardened by the red-team (D3); this arms strategy + validate.
  - `validated` — earned a cold hard pay-proof at Gate V.
  - `refuted` — a Gate V FAIL attributable to the *position itself* (not the copy); bumps the
    version and sends the loop back to Research to cut a new wedge.
- **ICP** — Ideal Customer Profile: the sharp population the wedge serves (not "everyone").

## Discover (Refine + Research)

- **D0–D4** — the discover funnel, cheap → expensive: **D0** Frame · **D1** Triage (cheap
  go/no-go) · **D2** Demand smoke · **D3** Deep hardening (red-team) · **D4** Launch Thesis brief.
- **Pulse** — a real market signal from the cheapest possible test (a pre-sell DM, an LOI, a
  deposit, or a fake-door above its floor). No pulse → re-frame once, then kill cheap. The
  expensive red-team only runs on a pulse.
- **Gate D** — the verdict on the discover funnel: **GO** (harden + arm), **NO-GO** (kill/shelve,
  recorded as a win), or **ITERATE** (re-frame and retry).
- **Launch Thesis brief** — the doc discover writes to `<docs.specs_dir>/…-launch-thesis.md`;
  the source of truth for the versioned wedge.

## Validate (the 48h sprint)

- **V0–V4** — the sprint phases: **V0** Instrument + freeze the gate · **V1** Guerrilla GTM ·
  **V2** Conversion brief (the tool briefs; the founder builds the page) · **V3** Launch ·
  **V4** Report + handoff.
- **Gate V** — the un-gameable verdict, recomputed from the raw captured rows by
  `gate-eval.mjs` (the *builder is not the scorer*). Four outcomes: **PASS**, **FAIL**,
  **INCONCLUSIVE** (thin traffic), **NOT-MEASURABLE** (instrumentation never fired).
- **Pay-proof** — a real payment signal that counts only when it is `live: true` and its
  `amount` ≥ the gate's `min_amount`. A sandbox charge or an `amount: 0` does not count.
- **Cold-weight fraction** — the share of qualified signal coming from genuine cold strangers
  (vs. warm/friend cohorts). The gate requires the cold-weighted floor to be met, so friends
  can't carry a PASS.
- **abandoned_at / the honesty floor** — where the founder dropped, on the enum
  `none | pre_pulse | pre_page | pre_lands | pre_launch | mid_window`. The **honesty floor**
  is `pre_page` (never built a real converting page) and `pre_lands` (built it but no land was
  ever stored). Drop-off there is the tool's #1 health metric.
- **Fail attribution** — why a FAIL failed: `channel_thin` (too little traffic),
  `copy_weak` (a stronger page fixes it — stay in validate), or `wedge_refuted` (the position
  itself isn't believed — re-cut the wedge back in discover).

## The payoff

- **Handoff (AI-builder handoff)** — the artifact validate writes on a PASS to
  `<docs.specs_dir>/…-handoff.md`: the validated wedge, the sold scope with acceptance
  criteria, the channels that converted, and a paste-ready build prompt. It is guidance for
  the founder's own build workflow — LaunchThesis stops at proven demand.
