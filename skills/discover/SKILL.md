---
name: discover
description: >
  Take a raw seed — a problem, an idea, or a population to serve — and harden it
  into a validated hypothesis BEFORE any build. Runs framing → symmetric calibrated
  need assessment → monetization/WTP → an evidence-bound red-team panel → a cheap
  human reality probe → a Hardened Hypothesis Brief, gated so weak ideas go back to
  the drawing board and strong-but-slow ones are not false-killed. Self-contained;
  uses only Claude Code built-in primitives + the project's declared MCP connectors.
  Reads .builderkit/config.yaml; output feeds /builderkit:validate.
---

# /discover — seed → hardened hypothesis

Turn a problem, an idea, or a population into a hypothesis worth spending real money
to test. The pipeline has five phases plus a reality probe and one hard gate. Never
skip a phase — for a thin seed, phases shrink to a few lines, but they still happen
and still get written down.

**Config first.** Read `.builderkit/config.yaml` before D0. Missing → stop and point
the user at `/builderkit:setup`. The project's `CLAUDE.md` overrides this skill where
they conflict.

## Operating rules (every phase)

- **Self-contained (C1).** Use only Claude Code built-in tools (`Agent`, `Explore`,
  `Workflow`, file tools) and MCP connectors the project declares in config. Never
  invoke another plugin's skill.
- **Symmetric, not confirmation-seeking.** The internet complains about everything;
  finding complaint threads is not validation. Seek the strongest disconfirming
  evidence as hard as the confirming evidence.
- **Provenance.** A claim that clears a red-team kill or establishes the WTP path
  carries a source + retrieval date. Model-opinion claims are labeled as such and
  cannot alone clear a kill.
- **Write things down.** The dossier, the ledger, and the decisions go in the brief,
  not just chat.
- **Optimize decision quality, not kills.** For a solo, near-broke founder the
  dominant risk is killing a winner on simulation — not wasting one <=$50 sprint.
  Gate D ranks and de-risks; the real kill happens later with real users (Gate V).

## Phase D0 — Frame the seed

Normalize any entry point into a canonical **Concept Brief**:
- ICP / population (sharp, not "everyone"); current alternatives; why-now.
- **Archetype**: acute-B2B | prosumer | consumer | marketplace. Sets the Gate V
  window and default hard_signal downstream.
- **Founder access**: the specific communities/audiences the founder ALREADY has for
  THIS seed, with standing per community (none/lurker/member/contributor/known).
- Idea-first → work backward to the problem it implies. Population-first → find its
  sharpest, most frequent pain.

## Phase D1 — Need assessment (symmetric, calibrated; fan out)

Launch parallel read-only research tracks (`Explore` / `Agent`) in ONE message: web /
forum / review / competitor / existing-spend. Score demand with
`${CLAUDE_PLUGIN_ROOT}/skills/discover/references/demand-intensity-rubric.md`.
Produce ONE calibrated verdict — **burning / real-but-tolerable / nice-to-have** —
plus a falsification register and the disconfirming evidence. Do not fabricate
prevalence numbers.

## Phase D2 — Monetization & WTP

Who pays, the model, price vs the current alternative, the smallest credible money
test. Carry existing-workaround spend as a LABELED ASSUMPTION to test in validate,
never as established WTP. No plausible WTP path → Gate D red flag.

## Phase D3 — Red-team panel (evidence-bound)

Run the six personas in
`${CLAUDE_PLUGIN_ROOT}/skills/discover/references/red-team-personas.md` via the
`Workflow` orchestrator (parallel personas, then a verify pass). Produce a single
ranked **riskiest-assumptions ledger**, provenance-tagged. The #1 item becomes the
headline the sprint must disconfirm first. Honor the hard rules: evidence-bound,
no asymmetric verify, correlated-prior tie-break.

## Phase D3.5 — Reality probe (cheap, human, soft-gated)

Run `${CLAUDE_PLUGIN_ROOT}/skills/discover/references/reality-probe.md`: the agent
drafts Mom-Test / pre-sale / fake-door scripts; the founder executes within
`discover.reality_probe.window_hours`. Apply the 3-outcome rule
(STRONG-DISCONFIRM → sharpen/pivot; HARD-CONFIRM → proceed with that human captured;
SILENCE → proceed, owed step recorded). A real human beats a simulated persona.

## Gate D — neutral triage (`kill_threshold: evidence_gated`)

Send the seed back to the drawing board ONLY on:
(a) no plausible WTP path from real spend data, OR
(b) no cheaply-reachable audience the founder can personally access (cannot name
    >= 2 communities with non-zero standing), OR
(c) an unresolved TOP-ranked assumption that is `model-opinion` with no cheap test
    path, OR
(d) a D1 verdict of `nice-to-have`.

Loop action: sharpen ICP / problem / value-prop and re-run, or pivot the seed; record
why. Bounded by `discover.red_team.max_rounds` — on exhaustion, stop and ask the human
to pivot or shelve. Surviving lower-ranked assumptions become sprint tests in the
brief, never blockers.

## Phase D4 — Hardened Hypothesis Brief

Write `<docs.specs_dir>/YYYY-MM-DD-<slug>-hypothesis.md` from
`${CLAUDE_PLUGIN_ROOT}/templates/discover/hypothesis-brief.md`. Fill every section,
including the mandatory `hard_signal`, the pre-registered Gate V predicates, and the
explicit kill criteria. This brief is the sole input to `/builderkit:validate`.

## Studio loop

Read `.builderkit/studio/playbook.md` at start as PRIORS (advisory only — they can
never gate). On finishing, append a row to `.builderkit/studio/validation-log.md`
(seed, archetype, intensity verdict, Gate D outcome). Aggregate patterns only — no
PII in `studio/`.

## Multi-agent quick reference

| Work | Agent | Parallel? |
|---|---|---|
| D1 need research | `Explore` (read-only) | Yes — fan out the research tracks |
| D3 red-team personas | `Workflow` fan-out + verify | Yes — six personas in parallel |
| Framing, monetization, ledger ranking, Gate D, brief | orchestrator | Never delegated |
