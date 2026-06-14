---
name: discover
description: >
  BuilderKit's demand-first idea funnel: take a seed — problem, idea, or population —
  through cheap-to-expensive tiers and harden the survivors into a validated hypothesis
  BEFORE any build. Triage (cheap go/no-go) → demand smoke (pre-sell / fake-door for a
  real market pulse) → deep hardening (multi-agent red-team, symmetric need assessment,
  exit-safe framing) only on a pulse → Hardened Hypothesis Brief → Gate D. Kills losers
  cheap; spends the expensive machinery only on ideas the market already nodded at.
  Self-contained; built-in primitives + the project's declared MCP connectors. Reads
  .builderkit/config.yaml; output feeds /builderkit:audit then /builderkit:validate.
---

# /discover — demand-first idea funnel

Turn a problem, idea, or population into a hypothesis worth spending real money to
test — and kill the losers as cheaply as possible. The funnel runs cheap-to-expensive:
each tier is a kill gate, and the costly machinery (the multi-agent red-team) only
touches ideas that already show a market pulse. The goal is maximum successful launches
across many ideas, so throughput and cheap disconfirmation beat per-idea rigor.

**Config first.** Read `.builderkit/config.yaml` before D0. Missing → stop and point
the user at `/builderkit:setup`. Reads the `product:` block (`exit_strategy`,
`positioning`, `sensitive_category`) and `discover.*`. The project's `CLAUDE.md`
overrides this skill where they conflict.

## Operating rules (every tier)

- **Self-contained (C1).** Only Claude Code built-ins (`Agent`, `Explore`, `Workflow`,
  file tools) + MCP connectors the project declares. Never invoke another plugin.
- **Demand-first.** The market is the oracle; desk reasoning is a proxy. Get a real
  pulse (D2) before spending the expensive red-team (D3).
- **Cheap kills first.** Each tier costs more than the last. Kill at the cheapest tier
  that settles it; never run D3 on an idea D1/D2 already rejected.
- **Don't false-kill on framing.** A weak first offer can sink a real idea — re-frame
  the offer/audience ONCE and retest before a D2 kill.
- **Optimize decision quality, not kills.** For a near-broke solo founder the worst
  outcome is killing a winner on simulation; the real kill is the market's.
- **Write it down.** Tier verdicts, the pulse evidence, and the brief go in docs.

## D0 — Frame (cheap)

Normalize any entry point into a **Concept Brief**: ICP / population (sharp, not
"everyone"); current alternatives; why-now; **archetype** (acute-B2B | prosumer |
consumer | marketplace); **stated exit** (`product.exit_strategy`, or "none" —
everything downstream is judged against it); **founder-access** (communities the
founder already has, with standing per community: none/lurker/member/contributor/known).
Idea-first → work back to the problem; population-first → find its sharpest pain.

## D1 — Triage gate (cheap go/no-go; absorbs the old evaluate)

A fast desk pass, minutes not hours. Four questions:
- **Wedge** — a differentiated *position* (not just a feature) an incumbent would
  structurally avoid copying?
- **Reachable audience** — can the founder *personally* reach >= 2 communities with
  non-zero standing (from D0)?
- **WTP path** — a plausible way someone pays, and enough?
- **Exit-safe** — nothing obviously litigious/manipulative on its face vs. the exit?

Any hard "no" with no cheap fix → **kill/shelve here** (record why). No research spend
yet. Survivors go to the smoke.

## D2 — Demand smoke (cheap real signal; pulse gate)

Get a market **pulse** with the cheapest real test before any heavy analysis. Run
`${CLAUDE_PLUGIN_ROOT}/skills/discover/references/reality-probe.md`: the agent drafts
named-list pre-sell DMs (Mom-Test framed) + an optional no-build fake-door (a form or
one static page); the founder runs them within `discover.reality_probe.window_hours`.
**No landing/Supabase/Stripe stack here** — that is `/builderkit:validate`; D2 stays
cheap on purpose.

**Pulse gate:**
- **Pulse** — >= 1 real pre-sell / LOI / deposit, or a fake-door signal above the
  stated floor → escalate to D3 with that human captured.
- **No pulse** — **re-frame the offer/audience once and retest** (guardrail against
  false-killing a real idea on a weak first framing); still flat → **kill/shelve**
  (record the re-frame tried + the verdict). A cheap kill, before the expensive
  machinery.

## D3 — Deep hardening (expensive; only on a pulse)

Now spend the costly machinery on the survivors:
- **Symmetric need assessment** — fan out read-only `Explore`/`Agent` tracks in ONE
  message; score with
  `${CLAUDE_PLUGIN_ROOT}/skills/discover/references/demand-intensity-rubric.md`
  (confirming AND disconfirming evidence; one calibrated verdict — burning /
  real-but-tolerable / nice-to-have; no fabricated prevalence numbers).
- **Monetization & WTP** — model, price vs. the current alternative; existing-workaround
  spend is a LABELED ASSUMPTION, not established WTP.
- **Red-team panel** — the six evidence-bound personas in
  `${CLAUDE_PLUGIN_ROOT}/skills/discover/references/red-team-personas.md` via the
  `Workflow` orchestrator (parallel personas + verify); a ranked riskiest-assumptions
  ledger.
- **Named wedge** — state the wedge explicitly; record to `product.positioning`.
- **Exit-safe framing check** — names/claims/trademark vs. the stated exit.

## Gate D — neutral triage (`kill_threshold: evidence_gated`)

Send back to the drawing board ONLY on:
(a) no plausible WTP path from real spend data, OR
(b) no cheaply-reachable audience the founder can personally access, OR
(c) an unresolved TOP-ranked assumption that is `model-opinion` with no cheap test
    path, OR
(d) a D3 intensity verdict of `nice-to-have`.
Bounded by `discover.red_team.max_rounds`; on exhaustion, stop and ask the human to
pivot or shelve. Surviving lower-ranked assumptions become sprint tests, never blockers.

## D4 — Hardened Hypothesis Brief

Write `<docs.specs_dir>/YYYY-MM-DD-<slug>-hypothesis.md` from
`${CLAUDE_PLUGIN_ROOT}/templates/discover/hypothesis-brief.md`, including: stated exit,
named wedge, exit-safe framing check, the D2 pulse evidence, and a light
**intended-surfaces sketch** so `/builderkit:audit` can map plays onto it. This brief
feeds `/builderkit:audit` (build plan) → `/builderkit:validate` (real cold-pay-proof
sprint).

## Studio loop

Read `.builderkit/studio/playbook.md` at start as PRIORS (advisory only — never gate).
On finishing (including kills at any tier), append a row to
`.builderkit/studio/validation-log.md` (seed, archetype, tier reached, verdict).
Aggregate patterns only — no PII in `studio/`.

## Multi-agent quick reference

| Work | Agent | Parallel? |
|---|---|---|
| D3 need research | `Explore` (read-only) | Yes — fan out the research tracks |
| D3 red-team personas | `Workflow` fan-out + verify | Yes — six personas in parallel |
| D0–D2 triage/smoke, wedge, Gate D, brief | orchestrator | Never delegated |
