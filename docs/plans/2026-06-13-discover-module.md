# Discover Module (Foundation + `/builderkit:discover`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the shared BuilderKit foundation (config, studio scaffold, setup wiring) and a working, self-contained `/builderkit:discover` module that turns a raw seed (problem/idea/population) into a red-team-hardened, reality-probed Hypothesis Brief.

**Architecture:** This is a Claude Code *plugin* — the deliverables are markdown skill/command files, `references/*.md`, and `templates/*`. There is no application runtime here, so verification is **`scripts/lint.sh`** (frontmatter + portability + JSON + manifest checks) plus targeted cross-reference greps, not a unit-test runner. The one subsystem with genuinely unit-testable logic (Gate V evaluator, landing capture) is the `validate` module — that is **Plan 2**, where real TDD applies. `discover` is prompt-encoded: each task authors a file, verifies it structurally, and commits.

**Tech Stack:** Markdown (skills/commands/references), YAML (config + templates), Bash (`scripts/lint.sh`), `python3` (JSON validation, already required by lint). Plugin primitives only — no external plugin dependencies (constraint C1).

**Spec:** `docs/specs/2026-06-13-discover-validate-design.md` (rev 2). This plan implements the Foundation (§0–§2, §6 config, §5 studio scaffold) and Module 1 `discover` (§3). The `validate` module (§4), the studio *rebuild logic* (§5), and the `ship-feature` handoff edit (§4.8) are Plan 2.

**Conventions for every task:**
- After each file write, run `scripts/lint.sh` (must print `lint OK`) before committing.
- All `{{DOUBLE_BRACE}}` tokens may appear ONLY under `templates/`. Skills/commands reference config keys in prose instead (lint rule #3 fails otherwise).
- Commit per Conventional Commits; every commit message ends with the trailer:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

---

## File structure (what each new/edited file is responsible for)

**New — foundation:**
- `templates/studio/playbook.md` — cross-product playbook scaffold (aggregate patterns only; no PII). Provisioned into `.builderkit/studio/` by setup.
- `templates/studio/validation-log.md` — one-row-per-run log scaffold.

**New — discover module:**
- `commands/discover.md` — thin command entry that invokes the `discover` skill.
- `skills/discover/SKILL.md` — the phased pipeline (D0–D4 incl. D3.5 + Gate D).
- `skills/discover/references/red-team-personas.md` — the 6 evidence-bound personas + verify rules.
- `skills/discover/references/demand-intensity-rubric.md` — calibrated, symmetric need-assessment rubric.
- `skills/discover/references/reality-probe.md` — Mom-Test / pre-sale scripts + the 3-outcome rule.
- `templates/discover/hypothesis-brief.md` — the D4 handoff artifact template.

**Edited:**
- `templates/config.template.yaml` — add `discover:`, `validate:`, `studio:` sections + `modules.discover/validate` (full §6 block; validate keys are consumed in Plan 2 but written once here so setup provisions everything).
- `skills/studio-setup/SKILL.md` — provision the new config sections + the `.builderkit/studio/` scaffold.
- `scripts/lint.sh` — extend the `--complete` manifest with the new files.
- `README.md`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` — document the discover→validate→ship chain.

---

## Task 0: Initialize version control

**Files:** (none created) — establishes the git repo the plan's commits require.

- [ ] **Step 1: Check whether this is already a git repo**

Run: `git rev-parse --is-inside-work-tree 2>/dev/null || echo "no-git"`
Expected: prints `no-git` (this repo is not yet initialized). If it prints `true`, skip to Step 3.

- [ ] **Step 2: Initialize and make the baseline commit**

```bash
git init
git add -A
git commit -m "chore: baseline BuilderKit before discover module

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 3: Confirm lint passes on the baseline**

Run: `scripts/lint.sh --complete`
Expected: prints `lint OK` (baseline manifest is intact before changes).

---

## Task 1: Config template — add discover / validate / studio sections

**Files:**
- Modify: `templates/config.template.yaml` (append after the existing `modules:` block, lines 45-49)

- [ ] **Step 1: Replace the `modules:` block and append the new sections**

Replace the existing final block:

```yaml
modules:
  delivery: true
  testing: true
  linear: true
```

with:

```yaml
modules:
  delivery: true
  testing: true
  linear: true
  discover: true
  validate: true

# ── discover module (idea → hardened hypothesis) ──
discover:
  red_team:
    personas: 6
    max_rounds: 3
    kill_threshold: evidence_gated   # evidence_gated | majority | any | unanimous
  reality_probe: { enabled: true, window_hours: 24, min_contacts_drafted: 10 }
  specs_dir: {{SPECS_DIR}}           # reuse docs.specs_dir

# ── validate module (48h live sprint + guerrilla GTM) — consumed in Plan 2 ──
validate:
  window_hours: 48
  max_window_hours: 96               # marketplace / considered-purchase only
  budget_cap_usd: 50
  clock_start: first_qualified_impression
  sprints_dir: .builderkit/studio/sprints
  max_concurrent_sprints: 1          # serial-by-default; /validate refuses a 2nd open sprint
  auto_post: false                   # founder posts from own accounts (C1 / ToS)
  gate:
    floor_users: 10
    min_qualified_lands: 25          # exposure denominator
    min_lp_visit_to_signup_rate: 0.05
    rate_min_sample_visits: 40
    require_pay_proof: true
    hard_signal_default: paid        # paid | loi | scarce_action
    allow_brief_override: true
    weights: { payment: 5, loi: 5, scarce_action: 3, activation: 2, signup: 1, intent_click: 0 }
    cohort_weights: { cold_public: 1.0, warm_dm: 0.5, friend: 0.25, unverifiable: 0 }
    min_cold_weight_fraction: 0.6
    max_friend_share: 0.4
    exclude_self: true
    founder_identifiers: []          # emails/handles/cards dropped at ingestion
    pay_proof:
      mode_default: preauth_hold     # preauth_hold (default) | real_charge (opt-in)
      captured: false                # true only under real_charge
      refundable: false
      min_pct_of_price: 25
      cold_required: true
      live_mode_only: true
    max_extensions: 1
    max_repair_attempts: 3           # GATE-NOT-MEASURABLE repair loop
    message_variants_before_kickback: 2
    kill_attribution: { min_qualified_lands: 30 }
  delivery: { max_days_to_first_access: 30 }
  gtm:
    named_list_target: 30
    min_warm_channels: 1
    default_channel_order: [direct_outreach, intent_venues, borrowed_distribution, broadcast]
  deploy:   { provider: {{DEPLOY_PROVIDER}}, project: {{DEPLOY_PROJECT}} }
  data:     { provider: {{DATA_PROVIDER}},   project: {{DATA_PROJECT}} }
  payments: { provider: {{PAY_PROVIDER}},    mode: preauth_hold }
  max_rounds: 3                      # GTM/relaunch + message-variation loops

# ── studio (cross-product learning loop) ──
studio:
  enabled: true
  dir: .builderkit/studio
  success_criterion: ">=N retained paying users 30 days after first ship"
  promote_after_k: 2
  max_concept_cycles: 3              # global discover<->validate round-trips per seed
```

- [ ] **Step 2: Verify YAML parses and lint passes**

Run: `python3 -c "import yaml,sys; yaml.safe_load(open('templates/config.template.yaml'))" && scripts/lint.sh`
Expected: no Python error, then `lint OK`. (Double-brace tokens are legal here — this is under `templates/`.)

- [ ] **Step 3: Commit**

```bash
git add templates/config.template.yaml
git commit -m "feat(config): add discover, validate, studio config sections

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Studio templates (provisioned into projects by setup)

**Files:**
- Create: `templates/studio/playbook.md`
- Create: `templates/studio/validation-log.md`

- [ ] **Step 1: Write `templates/studio/playbook.md`**

```markdown
# Studio playbook — cross-product priors

> Aggregate patterns ONLY. Never store raw emails or per-user rows here (PII lives
> in the project's validate.data store). Priors are advisory and can NEVER auto-fail
> a gate. Down-weight entries older than ~90 days.

## How to read this file
Every entry carries a `status` and a sample count:
- `hypothesis (n=1)` — an untested guess from a single run. Surface as "untested guess".
- `supported (n>=k)` — corroborated across >= studio.promote_after_k runs AND >= 2 distinct ICPs.

## GTM tactics that converted (by ICP type)
<!-- | tactic | icp_type | channel | status | runs | cold land→pay rate | note | -->

## Landing patterns that converted
<!-- | pattern | icp_type | status | runs | note | -->

## Panel-vs-outcome ledger (does a red-team verdict predict the market?)
<!-- A red-team kill is OPINION until the market rules. Log a kill pattern as
     predictive ONLY when: a Gate-D-passing concept later failed for the named
     reason, OR a panel-doubted concept then passed Gate V (a disconfirmation).
     Bias writeback toward disconfirmations. -->
<!-- | predicted_failure | concept_slug | market_outcome | predictive? | -->

## Community standing spent (don't re-burn wells across products)
<!-- | venue | icp_type | pitch_angle | date | outcome | -->
```

- [ ] **Step 2: Write `templates/studio/validation-log.md`**

```markdown
# Validation log — one row per discover/validate run

> Append-only. Row key = the run slug. Record LOSERS with the same tags as winners
> (recording only survivors bakes in survivorship bias). Backfill the `outcome`
> column opportunistically when you next run any command — no scheduler.

| slug | date | seed | archetype | icp_type | primary_channel | channel_standing | gate_d | gate_v | funnel (lands/signup/activation/pay) | cold_weight_fraction | founder_hours | decision | outcome | outcome_date |
|------|------|------|-----------|----------|-----------------|------------------|--------|--------|--------------------------------------|----------------------|---------------|----------|---------|--------------|
<!-- outcome ∈ pending | shipped | retained | revenue | killed_in_market | abandoned -->
```

- [ ] **Step 3: Verify lint passes**

Run: `scripts/lint.sh`
Expected: `lint OK`.

- [ ] **Step 4: Commit**

```bash
git add templates/studio/
git commit -m "feat(studio): add cross-product playbook + validation-log templates

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: `commands/discover.md`

**Files:**
- Create: `commands/discover.md`

- [ ] **Step 1: Write the command file**

```markdown
---
description: Take a seed (problem, idea, or population) to a red-team-hardened, reality-probed hypothesis brief
argument-hint: <a problem, an idea, or a population to serve>
---
Invoke the builderkit `discover` skill with the seed: $ARGUMENTS. Read
.builderkit/config.yaml first; if missing, run /builderkit:setup before the
pipeline. The skill ends by writing a Hardened Hypothesis Brief that
/builderkit:validate consumes.
```

- [ ] **Step 2: Verify frontmatter + no placeholder leak + lint**

Run: `head -c 3 commands/discover.md && echo && grep -n '{{' commands/discover.md || echo "no-braces" && scripts/lint.sh`
Expected: prints `---`, then `no-braces`, then `lint OK`.

- [ ] **Step 3: Commit**

```bash
git add commands/discover.md
git commit -m "feat(discover): add /builderkit:discover command

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: `templates/discover/hypothesis-brief.md`

**Files:**
- Create: `templates/discover/hypothesis-brief.md`

- [ ] **Step 1: Write the brief template**

```markdown
# Hardened Hypothesis Brief — {{SEED_SLUG}}

> Written by /builderkit:discover (D4). Consumed by /builderkit:validate.
> Every claim that clears a red-team kill or establishes the WTP path carries a
> source + retrieval date. Model-opinion claims are labeled as such.

## ICP / population
{{ICP}}  <!-- sharp, not "everyone" -->

## Archetype
{{ARCHETYPE}}  <!-- acute-B2B | prosumer | consumer | marketplace — sets Gate V window + default hard_signal -->

## Founder access (for THIS seed)
<!-- communities/audiences the founder ALREADY has, with standing per community -->
| community | standing (none/lurker/member/contributor/known) | reachable now? |
|-----------|--------------------------------------------------|----------------|

## Problem + intensity
- Calibrated intensity verdict: {{BURNING | REAL-BUT-TOLERABLE | NICE-TO-HAVE}}
- Confirming evidence (sourced): {{...}}
- Disconfirming evidence (sourced): {{...}}
- Falsification register: what would have proven "no burning need", and was it found?

## Value proposition
{{VALUE_PROP}}

## Monetization + willingness to pay
- Model + who pays: {{...}}
- Existing-workaround spend: {{...}}  <!-- ASSUMPTION to test in validate, not established WTP -->

## Riskiest assumptions (ranked, provenance-tagged)
1. {{...}}  [model-opinion | cited-external-source | real-human-contact]

## Reality probe (D3.5) result
- Outcome: {{STRONG-DISCONFIRM | HARD-CONFIRM | INCONCLUSIVE}}
- Evidence / commitments captured: {{...}}

## Falsifiable validation hypothesis
> If we put {{X}} in front of {{audience Y}} via {{channel Z}}, >= {{N}} cold
> strangers will {{signup | activate | PAY}} within {{window}}.

- Mandatory hard_signal for this concept: {{paid | loi | scarce_action}}
  (non-paid requires one-line justification: {{...}})

## Pre-registered Gate V predicates (frozen at validate V0)
<!-- validate hashes these before building. Stated here so the founder commits up front. -->
- Exposure denominator (min qualified lands): {{...}}
- What counts as signup / activation / hard pay-proof: {{...}}
- Self/contact exclusion set: {{...}}

## Kill criteria
<!-- the pre-committed conditions under which this concept is killed or kicked back -->
```

- [ ] **Step 2: Verify lint passes (braces legal under templates/)**

Run: `scripts/lint.sh`
Expected: `lint OK`.

- [ ] **Step 3: Commit**

```bash
git add templates/discover/hypothesis-brief.md
git commit -m "feat(discover): add hypothesis-brief handoff template

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: `skills/discover/references/red-team-personas.md`

**Files:**
- Create: `skills/discover/references/red-team-personas.md`

- [ ] **Step 1: Write the personas reference**

```markdown
# Red-team personas (evidence-bound test-designers, not a kill-jury)

Six personas, run in parallel via the built-in `Workflow` orchestrator, then a
verify pass. Each is BOUND to a specific evidence slice from D1/D2. Their job is to
surface the assumptions most likely to be fatal and rank them — NOT to render a
verdict on the idea's worth (that is Gate V's job, with real users).

## The six lenses

| # | Persona | Bound to | Kills by asking |
|---|---------|----------|-----------------|
| 1 | Skeptical customer | D1 review/complaint corpus | "I wouldn't pay / wouldn't switch because…" |
| 2 | Demand realist | D1 frequency/recency data | vitamin vs painkiller? how often? how urgent? |
| 3 | Monetization hawk | D2 competitor pricing + existing spend | will anyone pay, and *enough*? |
| 4 | Moat / competitor critic | D1 competitor scan | why doesn't this exist already; why won't an incumbent crush it? |
| 5 | Founder-bias auditor | the D1 claims the seed leans on | which beloved assumption does the evidence not support? |
| 6 | Distribution realist | the concrete community list + founder-access map | can the founder cheaply reach these people *personally*? |

## Hard rules (these make the panel earn its keep)

1. **Evidence-bound.** Any kill OR defense that cites no external evidence is logged
   `unsupported` and CANNOT gate.
2. **No asymmetric verify.** An under-evidenced *customer-demand / WTP* kill is NOT
   "refuted" merely for being under-evidenced pre-sprint — it is promoted to the TOP
   of the riskiest-assumptions ledger as the thing the sprint must disconfirm first.
3. **Provenance tags.** Every surviving assumption is tagged
   `{model-opinion | cited-external-source | real-human-contact}`.
4. **Correlated-prior check.** If all six agree in either direction, flag
   "unanimous = possible correlated prior" and run ONE external tie-break check
   before the verdict counts (bounded by `discover.red_team.max_rounds`).

## Output: the riskiest-assumptions ledger
A single ranked list (not per-persona verdicts). The #1 item becomes the headline the
validation sprint is built to disconfirm first. Lower-ranked surviving assumptions
become sprint tests in the brief, never blockers.

## Gate D (`kill_threshold: evidence_gated`) fails ONLY on:
- (a) no plausible WTP path from real spend data, OR
- (b) no cheaply-reachable audience the founder can personally access (cannot name
  >= 2 communities with non-zero standing), OR
- (c) an unresolved TOP-ranked assumption whose provenance is `model-opinion` with no
  cheap test path, OR
- (d) a D1 intensity verdict of `nice-to-have`.

Everything else proceeds — Gate D is neutral triage ("no fatal flaw found on paper"),
and the $50 sprint is the real backstop.
```

- [ ] **Step 2: Verify lint passes + no braces in skills/**

Run: `grep -n '{{' skills/discover/references/red-team-personas.md || echo "no-braces"; scripts/lint.sh`
Expected: `no-braces`, then `lint OK`.

- [ ] **Step 3: Commit**

```bash
git add skills/discover/references/red-team-personas.md
git commit -m "feat(discover): add evidence-bound red-team personas reference

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: `skills/discover/references/demand-intensity-rubric.md`

**Files:**
- Create: `skills/discover/references/demand-intensity-rubric.md`

- [ ] **Step 1: Write the rubric**

```markdown
# Demand-intensity rubric (symmetric, calibrated)

D1 must gather the strongest CONFIRMING **and** DISCONFIRMING evidence — that the
problem is already adequately solved, low-frequency, tolerated, or that no one pays
to fix it. The output is ONE intensity verdict, not a highlight reel of the loudest
complaints. Vocal-minority forum noise is distinct from prevalence.

## Score each axis — calibrated, sourced, with a confidence flag

| Axis | What raises it | Disconfirmer to actively seek |
|------|----------------|-------------------------------|
| Recurrence / frequency | hit often (daily/weekly) | one-off or seasonal |
| Severity | blocks a job, costs money/time | mild annoyance |
| Breadth | many distinct people, not one thread | a vocal minority |
| Active solution-seeking | people search, ask, build workarounds | nobody looks |
| Current paying | people already pay to fix it | nobody pays |

**Forbidden:** inventing a precise prevalence percentage. When the base rate is
unknown, write "unknown, low confidence" — never a fabricated number.

## Verdict (pick one)
- **burning** — high severity + recurrence + active solution-seeking + some current paying.
- **real-but-tolerable** — real but infrequent or cheaply tolerated.
- **nice-to-have** — weak on most axes. This is an explicit Gate D red flag.

## Falsification register (required in the dossier)
State UP FRONT what evidence would have made you conclude "no burning need," and
whether you found it. A dossier that never had a chance to fail is not evidence.

## Hand-off
Feed the verdict + the disconfirming evidence into the D3 red-team. Carry
existing-workaround spend as a LABELED ASSUMPTION to test in validate (JTBD
substitution risk) — never as established willingness to pay.
```

- [ ] **Step 2: Verify lint + no braces**

Run: `grep -n '{{' skills/discover/references/demand-intensity-rubric.md || echo "no-braces"; scripts/lint.sh`
Expected: `no-braces`, then `lint OK`.

- [ ] **Step 3: Commit**

```bash
git add skills/discover/references/demand-intensity-rubric.md
git commit -m "feat(discover): add calibrated demand-intensity rubric

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: `skills/discover/references/reality-probe.md`

**Files:**
- Create: `skills/discover/references/reality-probe.md`

- [ ] **Step 1: Write the reality-probe reference**

```markdown
# D3.5 Reality probe — the cheapest disconfirmer

Before spending a deployed asset measured by the founder's (nonexistent)
distribution, talk to / pre-sell REAL ICP humans. 10 targeted DMs or a manual
pre-sale can produce a hard commitment in hours with zero infra — and tell you WHY
people didn't convert, which anonymous landing traffic never can.

Soft-gated, time-boxed (`discover.reality_probe.window_hours`, default 24),
HUMAN-executed (`validate.auto_post` is irrelevant here — the founder sends these
from their own accounts). The agent drafts; the founder runs as many as the time-box
allows; the agent records replies into the brief.

## Draft, cheapest-first

1. **Mom-Test interview scripts (5–10).** Ask about PAST behavior and CURRENT spend.
   Never "would you use this?", never a pitch. Examples:
   - "Last time {{problem}} happened, what did you do about it?"
   - "What do you spend on {{current workaround}} today?"
   - "Walk me through the last time this actually cost you something."
2. **Concierge / pre-sale or LOI DM** to specific named ICP members — offer to solve
   it manually now, or ask for a letter of intent / small deposit.
3. **No-build fake-door DM/post** as the floor option (honesty note below).

## Three deterministic outcomes (work always keeps moving)

- **STRONG DISCONFIRM** — people don't have the problem / won't pay / past behavior
  contradicts it → route to discover sharpen-or-pivot. Counts against
  `discover.red_team.max_rounds`.
- **HARD CONFIRM** — >= 1 real commitment (verbal pre-sale / LOI / deposit) → proceed
  to validate with that human already in the captured-user list (warm-starts the
  sprint, partially de-risks Gate V).
- **SILENCE / INCONCLUSIVE** within the window → NOT disconfirmation. Record
  "probe inconclusive: reach=N, replies=M" as an owed step and PROCEED. Silence never
  stalls the pipeline.

When a real human contradicts a simulated red-team persona, the HUMAN wins, and it is
logged to the studio playbook.

## Honesty note (fake-door floor)
If you run the no-build fake-door, state the real stage ("early access, not built
yet") — no claiming a finished product, no fabricated social proof. The full
honesty/landing red-line floor is enforced in the validate module before any public
page or payment goes live.
```

- [ ] **Step 2: Verify lint + no braces**

Run: `grep -n '{{' skills/discover/references/reality-probe.md || echo "no-braces"; scripts/lint.sh`
Expected: `no-braces`, then `lint OK`. (The `{{problem}}` etc. above are inside a fenced code block that is itself inside a `references/` markdown file — but lint rule #3 greps `skills/` for `{{`. **This file WILL trip lint.** Fix in Step 3 before committing.)

- [ ] **Step 3: Replace double-brace example tokens with single-brace placeholders**

Lint rule #3 forbids `{{` anywhere under `skills/`. Edit the three example lines to use angle-bracket placeholders instead:
- `"Last time <problem> happened, what did you do about it?"`
- `"What do you spend on <current workaround> today?"`
- and in the fake-door line leave prose only (no braces).

Run: `grep -n '{{' skills/discover/references/reality-probe.md || echo "no-braces"; scripts/lint.sh`
Expected: `no-braces`, then `lint OK`.

- [ ] **Step 4: Commit**

```bash
git add skills/discover/references/reality-probe.md
git commit -m "feat(discover): add reality-probe scripts + 3-outcome rule

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: `skills/discover/SKILL.md` (the pipeline)

**Files:**
- Create: `skills/discover/SKILL.md`

Depends on Tasks 4–7 (it cross-references the three `references/*.md` and the brief template — those must exist first so the Step 2 cross-ref grep passes).

- [ ] **Step 1: Write the skill**

````markdown
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
````

- [ ] **Step 2: Verify frontmatter, no braces, and that every referenced file exists**

```bash
head -c 3 skills/discover/SKILL.md; echo
grep -n '{{' skills/discover/SKILL.md || echo "no-braces"
for f in skills/discover/references/red-team-personas.md \
         skills/discover/references/demand-intensity-rubric.md \
         skills/discover/references/reality-probe.md \
         templates/discover/hypothesis-brief.md; do
  [ -f "$f" ] && echo "OK $f" || echo "MISSING $f"
done
scripts/lint.sh
```
Expected: `---`, then `no-braces`, then four `OK ...` lines, then `lint OK`.
(`${CLAUDE_PLUGIN_ROOT}` is a runtime variable, not a `{{` placeholder, so it does
not trip lint.)

- [ ] **Step 3: Commit**

```bash
git add skills/discover/SKILL.md
git commit -m "feat(discover): add the discover pipeline skill (D0-D4 + Gate D)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 9: Wire setup to provision the new config + studio scaffold

**Files:**
- Modify: `skills/studio-setup/SKILL.md` (add a provisioning step after Step 2, and a token-map note)

- [ ] **Step 1: Add a "Step 2.5 — Provision discover/validate/studio" subsection**

Insert immediately after the Step 2 block (after line 28, before "## Step 3"):

```markdown
## Step 2.5 — Provision discover / validate / studio

The config template now carries `discover:`, `validate:`, `studio:` sections and
`modules.discover/validate` (written in Step 2). Additionally:

- If `modules.discover` or `modules.validate` is true, create the studio store:
  copy `${CLAUDE_PLUGIN_ROOT}/templates/studio/playbook.md` and
  `templates/studio/validation-log.md` into `.builderkit/studio/` (the dir from
  `studio.dir`), and create `.builderkit/studio/sprints/` (from `validate.sprints_dir`).
  Never overwrite an existing studio file without showing a diff.
- Fill the new template tokens from detection/confirmation:
  `SPECS_DIR` (= `docs.specs_dir`), and the validate infra targets
  `DEPLOY_PROVIDER`/`DEPLOY_PROJECT`, `DATA_PROVIDER`/`DATA_PROJECT`,
  `PAY_PROVIDER`. Leave any unknown infra target blank — `validate` degrades that
  step to planner-mode (constraint C2).
- gitignore `.builderkit/studio/sprints/` (ephemeral per-sprint state).
```

- [ ] **Step 2: Add the new tokens to the token map table**

In the "## Token map" table, append these rows after the existing rows:

```markdown
| `SPECS_DIR` | `docs.specs_dir` | scalar |
| `DEPLOY_PROVIDER` / `DEPLOY_PROJECT` | `validate.deploy.*` | scalar (blank → planner-mode) |
| `DATA_PROVIDER` / `DATA_PROJECT` | `validate.data.*` | scalar (blank → planner-mode) |
| `PAY_PROVIDER` | `validate.payments.provider` | scalar (blank → planner-mode) |
```

- [ ] **Step 3: Verify lint passes**

Run: `grep -n '{{' skills/studio-setup/SKILL.md || echo "no-braces"; scripts/lint.sh`
Expected: `no-braces`, then `lint OK`. (The token names above are written as inline
code with single backticks and NO double braces, so lint rule #3 stays green.)

- [ ] **Step 4: Commit**

```bash
git add skills/studio-setup/SKILL.md
git commit -m "feat(setup): provision discover/validate/studio config + studio scaffold

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 10: Manifest, README, and plugin descriptions

**Files:**
- Modify: `scripts/lint.sh` (the `--complete` manifest list, lines 36-44)
- Modify: `README.md` (Commands table + a new section)
- Modify: `.claude-plugin/plugin.json` (description)
- Modify: `.claude-plugin/marketplace.json` (descriptions)

- [ ] **Step 1: Extend the lint `--complete` manifest**

In `scripts/lint.sh`, inside the `--complete` file list, add these entries to the
`for f in \` block (before the closing `; do`):

```bash
    commands/discover.md \
    skills/discover/SKILL.md \
    skills/discover/references/red-team-personas.md \
    skills/discover/references/demand-intensity-rubric.md \
    skills/discover/references/reality-probe.md \
    templates/discover/hypothesis-brief.md \
    templates/studio/playbook.md templates/studio/validation-log.md \
```

- [ ] **Step 2: Update the README Commands table and add a section**

In `README.md`, add this row to the Commands table (after the `setup` row):

```markdown
| `/builderkit:discover <seed>` | Take a problem/idea/population to a red-team-hardened, reality-probed Hypothesis Brief (Gate D). Feeds `/builderkit:validate`. |
```

And add this section after "## Quickstart":

```markdown
## The product chain (discover → validate → ship)

BuilderKit now starts *before* the build. `/builderkit:discover` hardens a raw seed
into a validated hypothesis (symmetric need assessment, an evidence-bound red-team
panel, a cheap human reality probe, Gate D). `/builderkit:validate` (next module)
runs a 48-hour guerrilla GTM sprint and gates on real cold-stranger willingness to
pay before `/builderkit:ship` builds it. A cross-product studio playbook
(`.builderkit/studio/`) accumulates priors so each new product starts smarter.
```

- [ ] **Step 3: Update `.claude-plugin/plugin.json` description**

Replace the `"description"` value with:

```json
  "description": "App-studio orchestrator: discover (idea → hardened hypothesis), validate (48h guerrilla GTM sprint), ship-feature pipeline, 4-phase e2e testing (Maestro + Playwright), Linear historian. Per-project config in .builderkit/config.yaml.",
```

- [ ] **Step 4: Update `.claude-plugin/marketplace.json` descriptions**

Replace both `"description"` values (the top-level and the plugin entry) with:

```json
"BuilderKit — discover → validate → ship: hypothesis hardening, 48h guerrilla validation sprint, ship-feature pipeline, 4-phase e2e testing, and Linear integration for studio projects."
```

- [ ] **Step 5: Verify the full manifest + JSON validity**

Run: `scripts/lint.sh --complete`
Expected: `lint OK` (all new files present, JSON valid, no leaks).

- [ ] **Step 6: Commit**

```bash
git add scripts/lint.sh README.md .claude-plugin/plugin.json .claude-plugin/marketplace.json
git commit -m "docs(discover): document discover module + extend lint manifest

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Final verification

- [ ] **Step 1: Full lint is green**

Run: `scripts/lint.sh --complete`
Expected: `lint OK`.

- [ ] **Step 2: The discover skill's cross-references all resolve**

```bash
grep -oE 'skills/discover/references/[a-z-]+\.md|templates/discover/[a-z-]+\.md|templates/studio/[a-z-]+\.md' skills/discover/SKILL.md | sort -u | while read f; do
  [ -f "$f" ] && echo "OK $f" || echo "MISSING $f"
done
```
Expected: every line begins `OK` (no `MISSING`).

- [ ] **Step 3: No project literals or stray placeholders leaked**

Run: `grep -rinE 'meetcorda|malikcasey|glowproof' skills/ commands/ || echo "clean"; grep -rn '{{' skills/ commands/ || echo "no-braces"`
Expected: `clean`, then `no-braces`.

- [ ] **Step 4: Dry-read the skill as a new engineer**

Open `skills/discover/SKILL.md` and confirm each phase (D0, D1, D2, D3, D3.5, Gate D,
D4) names its inputs, its output, and the exact reference/template file it uses, with
no dangling concept. Confirm Gate D's four kill conditions match
`references/red-team-personas.md`. Fix any drift, re-run `scripts/lint.sh --complete`,
and amend the relevant commit.

---

## What this plan deliberately does NOT cover (→ Plan 2: validate)

- The `validate` SKILL/command and its V0–V4 phases.
- The Gate V **evaluator** (recompute PASS/FAIL/INCONCLUSIVE/NOT-MEASURABLE from raw
  rows against frozen predicates) — this is real logic and gets **true TDD** with the
  project's unit runner.
- `templates/landing/` (idempotent capture, two-signal WTP probe, cookieless
  analytics, privacy stub) — also TDD'd.
- `references/guerrilla-playbook.md`, `references/landing-conversion.md`, the shared
  `references/honesty-floor.md`.
- The studio *rebuild logic* (promotion-by-corroboration, panel-vs-outcome ledger,
  outcome backfill) and the `skills/ship-feature/SKILL.md` delivery-commitment intake
  edit (§4.8).
- The validate config keys added in Task 1 are consumed there.
- The medium-tier backlog (spec §10).
```
