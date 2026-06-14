# Front-end Reconciliation (demand-first tiered funnel) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconcile BuilderKit's two front-ends into one demand-first, tiered, looped funnel: `discover` (triage → demand smoke → heavy hardening) → `audit` (build plan, before validate) → `validate` → `ship` → Insight Loop; remove `evaluate`.

**Architecture:** Markdown/YAML plugin — deliverables are skill/command/reference/template files. Verification is `scripts/lint.sh` (frontmatter, no project literals, no `{{` outside `templates/`, JSON valid, `--complete` manifest) plus targeted greps, not a unit-test runner. Work happens on the existing `feat/product-strategy` branch and **updates PR #2**.

**Tech Stack:** Markdown, YAML, Bash (`scripts/lint.sh`), `python3` (JSON), `gh`. Built-in primitives only; no external plugin deps (C1).

**Spec:** `docs/specs/2026-06-13-frontend-reconciliation-design.md` (rev 2).

**Branch precondition:** be on `feat/product-strategy` (PR #2). Confirm: `git rev-parse --abbrev-ref HEAD` → `feat/product-strategy`; `git status --porcelain` → only the two committed spec/plan docs may differ from origin, working tree otherwise clean. The branch currently contains the un-reconciled product-strategy module (evaluate + audit) and the merged discover module.

**Conventions for every task:**
- After each file change, run `scripts/lint.sh` (or `--complete`) → must print `lint OK` before committing.
- No `{{` may appear under `skills/` or `commands/` (templates/ only). Use `<angle>` placeholders in skill/command/reference files.
- Commit per Conventional Commits; every message ends with:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

---

## File structure (responsibilities after this plan)

- `skills/discover/SKILL.md` — the demand-first funnel: D0 frame → D1 triage → D2 demand smoke (pulse gate) → D3 deep hardening → D4 brief → Gate D. **Rewritten** (re-ordered).
- `skills/discover/references/reality-probe.md` — the **D2 demand smoke** + re-frame-once guardrail (was the late D3.5 probe). **Rewritten.**
- `skills/discover/references/{red-team-personas,demand-intensity-rubric}.md` — unchanged (now invoked in D3).
- `templates/discover/hypothesis-brief.md` — adds exit, wedge, exit-safe framing, D2 pulse, surfaces. **Rewritten.**
- `skills/product-strategy/SKILL.md` — single-purpose Play Audit (Part A dropped), retargeted input, runs before validate. **Rewritten.**
- `skills/product-strategy/reference/play-engine.md` — unchanged.
- `commands/audit.md` — retargeted wording. **Rewritten.**
- `commands/evaluate.md` — **deleted.**
- `README.md`, `.claude-plugin/{plugin,marketplace}.json`, `templates/config.template.yaml`, `scripts/lint.sh` — reflect the single tiered/looped chain; drop `evaluate`. **Edited.**

---

## Task 1: Retire `evaluate`, retarget the Play Audit module

**Files:**
- Delete: `commands/evaluate.md`
- Overwrite: `skills/product-strategy/SKILL.md`
- Overwrite: `commands/audit.md`
- Modify: `scripts/lint.sh` (drop the evaluate manifest entry)

- [ ] **Step 1: Delete the evaluate command**

```bash
git rm commands/evaluate.md
```

- [ ] **Step 2: Drop `commands/evaluate.md` from the lint `--complete` manifest**

In `scripts/lint.sh`, the `--complete` `for f in \` list contains the line:
```
    commands/evaluate.md commands/audit.md \
```
Replace it with (evaluate removed, audit kept):
```
    commands/audit.md \
```

- [ ] **Step 3: Overwrite `skills/product-strategy/SKILL.md` with the single-purpose Play Audit skill**

Write this exact content:

````markdown
---
name: product-strategy
description: >
  BuilderKit build-planning module: turn a demand-validated concept (or an existing
  product) into a prioritised, brand-safe build list. The Play Audit — weight the 12
  strategy families, map product-design plays onto the product's surfaces, tier
  P0/P1/P2, flag the plays the brand should decline, emit a ranked build list wired to
  metrics (Insight Loop). Runs AFTER /builderkit:discover and BEFORE the
  /builderkit:validate sprint, feeding that sprint's conversion asset + GTM. Reads
  .builderkit/config.yaml (`product:` block); optional licensed deck via
  product.playbook_ref. Use via /builderkit:audit, or when the user asks "what do I
  build first", "what's the build order", or wants a play audit / brand-safety pass.
---

# /product-strategy — plan the build (Play Audit)

BuilderKit ships features well, and `/builderkit:discover` decides whether an idea has
a real market pulse. This module decides *which* features, in *what order*, and *which
plays the brand should decline* — then feeds the conversion asset + GTM into
`/builderkit:validate` and the build list into `/builderkit:ship`.

It runs **after Gate D (a hardened, pulse-confirmed concept) and before the real
validation sprint**, so the 48h sprint tests an audited, high-converting asset — not a
sandbagged one. It also runs standalone against an already-built product.

**Config first.** Read `.builderkit/config.yaml` before running. Reads the `product:`
block (`positioning`, `exit_strategy`, `sensitive_category`, `surfaces`,
`playbook_ref`) and writes to `docs.specs_dir`. If the `product:` block is missing,
self-provision it (see "Provisioning"). `CLAUDE.md` overrides this skill where they
conflict.

**Engine.** Self-sufficient — ships the full pattern library, strategy/metric tables,
flagging rules, and method in
`${CLAUDE_PLUGIN_ROOT}/skills/product-strategy/reference/play-engine.md`. Read it
first. `product.playbook_ref` is an OPTIONAL override pointing at a deck the user
licenses and keeps OUTSIDE the plugin; the engine runs fully without it.

## Operating rules

- **Honest, on-brand.** Declining manipulation-adjacent / off-brand plays is a
  deliverable; write down WHY — especially when `product.sensitive_category` is true.
- **Distribution drives P0.** The first-100-users channel (from the discover brief's
  founder-access + the named wedge) determines which growth/sharing plays are P0.
- **Exit-aligned.** Names, claims, and plays must be safe for `product.exit_strategy`.
- **Write it down.** The audit lands as a doc in `docs.specs_dir`; `/builderkit:ship`
  and `/builderkit:validate` read docs, not chat.

## Input

- The `/builderkit:discover` **Hardened Hypothesis Brief** (its intended-surfaces
  sketch + named wedge + stated exit) for a pulse-confirmed concept, OR
- an existing product's surfaces (standalone audit).

## Play Audit — the build list

### B1 — Weight the strategies
Score the 12 strategy families Critical / High / Medium / Later for THIS product using
the weighting rubric in the engine reference; one-line rationale each. Don't treat them
equally.

### B2 — Map plays to surfaces
For each surface (`product.surfaces`, the brief's surfaces sketch, or the repo) list
which plays apply and write a concrete "where it goes." Credit plays the product
already implements so they aren't rebuilt.

### B3 — Tier P0 / P1 / P2
P0 = the core loop doesn't work without it. P1 = deepens the loop / premium feel /
controlled growth. P2 = monetisation & growth after the loop is validated.

### B4 — Flag conflicts
Walk the flagging rules against the wedge and `product.sensitive_category`. Each
manipulation-adjacent or off-brand play → **use as-is / constrain (how) / skip (why).**
Mandatory, even if short.

### B5 — Ranked build list
The ordered "do this first" sequence (8–12 items).

### B6 — Wire the Insight Loop
Fill the metric → play table (engine reference) so every build-list item is measurable.

**Output:** `docs.specs_dir/<product>-play-audit.md` (B1 weights → B2 maps → B4 flags →
B5 build list → B6 metrics). The build list's growth/landing plays feed
`/builderkit:validate`'s conversion asset + GTM; every item is ready to become a
`/builderkit:ship <item>` run.

### Insight Loop (metric-first; the closing loop)
When a live loop isn't moving, or to make the build list measurable: pick ONE metric →
read that family's analysis lens (engine reference) → match to the play that kills the
friction → ship ONE play (`/builderkit:ship`) → re-measure (never batch). Outcomes
write back to the studio playbook so the next product starts smarter.

## Handoff

discover (pulse + hardened) → **audit (this)** → validate (real cold-pay-proof sprint
on the audited asset) → ship → e2e → Linear → Insight Loop. Each build-list item →
`/builderkit:ship`; acceptance criteria come from B2's "where it goes" + the wired
metric.

## Provisioning (`product:` config block)

If the block is missing/empty when audit runs, capture it first (idempotent, like
`/builderkit:setup`). One consolidated question for: `positioning` (one-line wedge),
`exit_strategy` (or "none"), `sensitive_category` (true/false), `surfaces` (optional),
`playbook_ref` (optional — leave empty; the engine is self-sufficient). Write under
`product:` in `.builderkit/config.yaml` and set `modules.product: true`. Never
overwrite an existing block without showing a diff first.
````

- [ ] **Step 4: Overwrite `commands/audit.md`**

```markdown
---
description: Run a BuilderKit Play Audit — turn a demand-validated concept (or live product) into a prioritised, brand-safe build list
argument-hint: [product-or-surface | metric:<name>]
---
Invoke the builderkit `product-strategy` skill (Play Audit) for: $ARGUMENTS. Read
.builderkit/config.yaml and the engine reference first; load the licensed deck from
product.playbook_ref if set. Input is the /builderkit:discover Hardened Hypothesis
Brief (its surfaces sketch) for a pulse-confirmed concept, or an existing product's
surfaces. Runs after Gate D and before the /builderkit:validate sprint — its
conversion/growth plays feed that sprint's asset + GTM. No args → audit the whole
product from its brief/spec/surfaces. `metric:<name>` → run the Insight Loop. Output a
ranked build list in docs.specs_dir; each item is ready for /builderkit:ship.
```

- [ ] **Step 5: Verify no evaluate refs in skills/commands/lint, and lint passes**

```bash
grep -rn 'evaluate' skills/ commands/ scripts/lint.sh || echo "no-evaluate-refs"
grep -rn '{{' skills/ commands/ || echo "no-braces"
scripts/lint.sh --complete
```
Expected: `no-evaluate-refs`, then `no-braces`, then `lint OK`.
(Note: `commands/audit.md` and the SKILL mention `/builderkit:validate` and "Insight
Loop" but the literal word "evaluate" must not appear — the grep above must print
`no-evaluate-refs`.)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(product-strategy): drop evaluate, retarget Play Audit before validate

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Re-tier `discover` into the demand-first funnel

**Files:**
- Overwrite: `skills/discover/SKILL.md`
- Overwrite: `skills/discover/references/reality-probe.md`

- [ ] **Step 1: Overwrite `skills/discover/SKILL.md`**

````markdown
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
````

- [ ] **Step 2: Overwrite `skills/discover/references/reality-probe.md`**

```markdown
# D2 Demand smoke — the cheapest real signal (front of the funnel)

Before spending any heavy analysis (D3's red-team), get a market **pulse**: put the
offer in front of real ICP humans and see if anyone leans in. 10 targeted DMs or a
manual pre-sale can produce a hard commitment in hours with zero infra — and tell you
WHY people don't bite, which anonymous traffic never will. This runs in `discover` as
**D2, before the red-team**, on the cheapest possible assets.

Cheap assets only: named-list pre-sell DMs + an optional no-build fake-door (a form or
one static page). **No landing/Supabase/Stripe stack** — that is `/builderkit:validate`.
Time-boxed (`discover.reality_probe.window_hours`, default 24). Human-executed (the
founder sends these from their own accounts). The agent drafts; the founder runs; the
agent records replies.

## Draft, cheapest-first

1. **Mom-Test pre-sell DMs (5-10)** to specific named ICP members. Ask about PAST
   behavior and CURRENT spend; offer to solve it now / ask for an LOI or small deposit.
   Never "would you use this?", never a pitch. Examples:
   - "Last time <problem> happened, what did you do about it?"
   - "What do you spend on <current workaround> today?"
2. **No-build fake-door** (optional floor) — a form or one static page stating the real
   stage ("early access, not built yet"). No fabricated product, no fake social proof.

## Pulse gate (what D2 decides)

- **PULSE** — >= 1 real pre-sell / LOI / deposit, OR a fake-door signal above the
  stated floor → escalate to D3 with that human captured.
- **NO PULSE, first pass** — do NOT kill yet. **Re-frame the offer or the audience ONCE
  and retest** within the window. A weak first framing must not false-kill a real idea.
- **NO PULSE after the re-frame** → kill/shelve; record the re-frame tried and the
  verdict. A cheap kill, before the expensive machinery.

A real human contradicting a (later) simulated red-team persona wins — log it to the
studio playbook.

## Honesty

Any fake-door states the real stage; no claiming a finished product, no fabricated
social proof. The full landing/payment honesty floor lives in `/builderkit:validate`.
```

- [ ] **Step 3: Verify phase order, no braces, references resolve, lint**

```bash
grep -nE '^## (D0|D1|D2|D3|Gate D|D4)' skills/discover/SKILL.md
grep -n 'reality-probe.md' skills/discover/SKILL.md
grep -rn '{{' skills/discover/ || echo "no-braces"
scripts/lint.sh
```
Expected: the `grep -nE` lists D0, D1, D2, D3, Gate D, D4 **in that order** with D2
appearing before D3 (reality probe before red-team); the reality-probe reference is
named under D2; `no-braces`; `lint OK`.

- [ ] **Step 4: Commit**

```bash
git add skills/discover/SKILL.md skills/discover/references/reality-probe.md
git commit -m "refactor(discover): re-tier into demand-first funnel (triage, smoke, harden)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Brief template — add exit, wedge, framing, pulse, surfaces

**Files:**
- Overwrite: `templates/discover/hypothesis-brief.md`

- [ ] **Step 1: Overwrite `templates/discover/hypothesis-brief.md`** (braces allowed — `templates/`)

```markdown
# Hardened Hypothesis Brief — {{SEED_SLUG}}

> Written by /builderkit:discover (D4). Feeds /builderkit:audit then /builderkit:validate.
> Every claim that clears a red-team kill or establishes the WTP path carries a source +
> retrieval date. Model-opinion claims are labeled as such.

## ICP / population
{{ICP}}  <!-- sharp, not "everyone" -->

## Archetype
{{ARCHETYPE}}  <!-- acute-B2B | prosumer | consumer | marketplace -->

## Stated exit
{{EXIT_STRATEGY}}  <!-- or "none" — everything below is judged against this -->

## Founder access (for THIS seed)
| community | standing (none/lurker/member/contributor/known) | reachable now? |
|-----------|--------------------------------------------------|----------------|

## D1 triage verdict
{{PASS | KILL}}  <!-- wedge? reachable audience? WTP path? exit-safe? -->

## D2 demand smoke — pulse evidence
- Outcome: {{PULSE | NO-PULSE}}
- Pre-sell / LOI / deposit / fake-door signal captured: {{...}}
- Re-frame tried (if first pass was flat): {{...}}

## Problem + intensity (D3)
- Calibrated intensity verdict: {{BURNING | REAL-BUT-TOLERABLE | NICE-TO-HAVE}}
- Confirming evidence (sourced): {{...}}
- Disconfirming evidence (sourced): {{...}}
- Falsification register: what would have proven "no burning need", and was it found?

## Value proposition
{{VALUE_PROP}}

## Named wedge
{{WEDGE}}  <!-- position vs. feature; why an incumbent would structurally avoid copying it. Recorded to product.positioning -->

## Monetization + willingness to pay
- Model + who pays: {{...}}
- Existing-workaround spend: {{...}}  <!-- ASSUMPTION to test in validate, not established WTP -->

## Exit-safe framing check
{{...}}  <!-- names/claims/trademark vs. the stated exit -->

## Riskiest assumptions (ranked, provenance-tagged)
1. {{...}}  [model-opinion | cited-external-source | real-human-contact]

## Intended surfaces sketch (for /builderkit:audit)
<!-- the screens/overlays the solution will have, so the Play Audit can map plays onto them -->
- {{...}}

## Falsifiable validation hypothesis
> If we put {{X}} in front of {{audience Y}} via {{channel Z}}, >= {{N}} cold strangers
> will {{signup | activate | PAY}} within {{window}}.

- Mandatory hard_signal for this concept: {{paid | loi | scarce_action}}
  (non-paid requires one-line justification: {{...}})

## Pre-registered Gate V predicates (frozen at validate V0)
- Exposure denominator (min qualified lands): {{...}}
- What counts as signup / activation / hard pay-proof: {{...}}
- Self/contact exclusion set: {{...}}

## Kill criteria
<!-- the pre-committed conditions under which this concept is killed or kicked back -->
```

- [ ] **Step 2: Verify the new fields exist and lint passes**

```bash
grep -nE 'Stated exit|D1 triage|demand smoke|Named wedge|Exit-safe framing|Intended surfaces' templates/discover/hypothesis-brief.md
scripts/lint.sh
```
Expected: all six headings present; `lint OK`.

- [ ] **Step 3: Commit**

```bash
git add templates/discover/hypothesis-brief.md
git commit -m "feat(discover): brief gains exit, wedge, framing, D2 pulse, surfaces

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Docs + manifests — the single tiered, looped chain

**Files:**
- Modify: `README.md`
- Modify: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`
- Modify: `templates/config.template.yaml` (comment only)

- [ ] **Step 1: README intro — replace the two-paragraph intro block**

Replace the intro paragraph + the line that begins "The full studio loop runs front to
back:" with:

```markdown
BuilderKit is an app-studio delivery orchestrator for Claude Code. It runs one
demand-first pipeline: **discover** an idea through cheap-to-expensive tiers (triage →
demand smoke → deep hardening), **audit** the survivor into a prioritised, brand-safe
build plan, **validate** real cold demand in a 48-hour sprint, **ship** each item, gate
it with **e2e**, journal it in **Linear**, and close the **Insight Loop** so the next
idea starts smarter — all in one plugin, driven by a per-project `.builderkit/config.yaml`.

The pipeline kills losers cheap and spends the expensive machinery (and real money)
only on ideas the market already nodded at: **discover → audit → validate → ship → e2e
→ Linear → loop.**
```

- [ ] **Step 2: README — replace the "## The product chain" section**

Replace the entire `## The product chain (discover → validate → ship)` section (heading
+ its paragraph) with:

```markdown
## The pipeline (discover → audit → validate → ship → loop)

BuilderKit starts *before* the build and gets to a real demand signal as early as
possible:

- **discover** (`/builderkit:discover <seed>`) — a demand-first funnel. **D0** frame
  (incl. stated exit + founder-access) → **D1** triage (cheap go/no-go) → **D2** demand
  smoke (named-list pre-sell + optional fake-door for a real *pulse*) → if a pulse,
  **D3** deep hardening (multi-agent red-team, symmetric need assessment, named wedge,
  exit-safe framing) → **D4** Hardened Hypothesis Brief → Gate D. No pulse is re-framed
  once, then killed cheap.
- **audit** (`/builderkit:audit`) — the Play Audit: weight 12 strategy families → map
  plays to surfaces → tier P0/P1/P2 → flag plays the brand should decline → ranked
  build list. Runs **before** the validation sprint and feeds its conversion asset + GTM.
- **validate** (`/builderkit:validate`) — a 48-hour guerrilla sprint that gates on real
  cold-stranger willingness to pay before `/builderkit:ship` builds it.
- **Insight Loop** — after ship, improve one metric with one play at a time; a
  cross-product studio playbook (`.builderkit/studio/`) accumulates priors so each new
  product starts smarter.
```

- [ ] **Step 3: README — Commands table: drop the evaluate row, update discover/audit rows**

In the Commands table: delete the `/builderkit:evaluate` row entirely. Replace the
`/builderkit:audit` and `/builderkit:discover` rows with:

```markdown
| `/builderkit:audit [scope]` | Play Audit: weight strategies → map plays to surfaces → tier P0/P1/P2 → flag brand/exit conflicts → ranked build list (feeds the validate sprint). `metric:<name>` runs the Insight Loop. |
| `/builderkit:discover <seed>` | Demand-first funnel: triage → demand smoke (pulse) → deep red-team hardening → Hypothesis Brief (Gate D). Feeds `/builderkit:audit`. |
```

- [ ] **Step 4: README — replace the "## The product-strategy front-end" section**

Replace the entire `## The product-strategy front-end` section (heading + both bullets +
the self-sufficiency paragraph) with:

```markdown
## The Play Audit (build planning)

`/builderkit:audit` runs after a concept clears `discover`'s Gate D and **before** the
validation sprint: it weights the 12 strategy families for the product, maps
product-design plays onto its surfaces, tiers them P0/P1/P2, **flags the plays the brand
should decline** (manipulation-adjacent or off-brand — mandatory, especially when
`product.sensitive_category` is true), and emits a ranked build list wired to metrics.
Its conversion/growth plays feed the validate sprint's asset and GTM; each build-list
item is ready for `/builderkit:ship`.

The module is **self-sufficient**: it ships a complete built-in pattern library, the
strategy/metric tables, the flagging rules, and the method in
`skills/product-strategy/reference/play-engine.md` (general product-design practice,
stack-agnostic). A user never has to supply a deck. `product.playbook_ref` is an
**optional override** — point it at a deck you license and keep *outside* the plugin;
leave it empty and the built-in engine runs the full audit on its own. The plugin
deliberately ships the method, not any third-party catalog.
```

- [ ] **Step 5: README — config example: drop the `product: true` evaluate comment drift**

In the embedded `modules:` config example, ensure the block reads exactly (no
`evaluate`):
```yaml
modules:
  delivery: true
  testing: true
  linear: true
  product: true               # play audit + insight loop
  discover: true              # demand-first idea funnel
  validate: true              # 48h cold-pay-proof sprint
# (the discover:, validate:, product:, and studio: sections follow in the generated config — see templates/config.template.yaml)
```

- [ ] **Step 6: plugin.json + marketplace.json descriptions**

`.claude-plugin/plugin.json` — set `"description"` to:
```json
  "description": "App-studio orchestrator: a demand-first pipeline — discover (tiered idea funnel) → audit (play-audit build plan) → validate (48h cold-pay-proof sprint) → ship → 4-phase e2e → Linear → insight loop. Per-project config in .builderkit/config.yaml.",
```

`.claude-plugin/marketplace.json` — set the top-level `"description"` to:
```json
  "description": "BuilderKit — demand-first app-studio pipeline: discover → audit → validate → ship → e2e → Linear → loop.",
```
and the plugin-entry `"description"` to:
```json
      "description": "Discover · audit · validate · ship · e2e · Linear · loop — the full demand-first studio pipeline for Claude Code."
```

- [ ] **Step 7: config template comment tweak**

In `templates/config.template.yaml`, change the `product:` block's lead comment from
`# read by the product-strategy module (evaluate + play audit)` to
`# read by discover (exit/positioning/sensitive) + the play audit`.

- [ ] **Step 8: Verify everything**

```bash
grep -rn 'evaluate' . --include='*.md' --include='*.json' --include='*.yaml' --include='*.sh' | grep -v '/.git/' | grep -v '/docs/' || echo "no-evaluate-anywhere"
python3 -m json.tool .claude-plugin/plugin.json >/dev/null && python3 -m json.tool .claude-plugin/marketplace.json >/dev/null && echo "json ok"
grep -rinE 'bartek|marzec|@bartek|product design playbook' skills/ commands/ templates/ README.md .claude-plugin/ || echo "ip-clean"
scripts/lint.sh --complete
```
Expected: `no-evaluate-anywhere` (docs/ specs/plans may still mention it historically —
they're excluded), `json ok`, `ip-clean`, `lint OK`.

- [ ] **Step 9: Commit**

```bash
git add README.md .claude-plugin/plugin.json .claude-plugin/marketplace.json templates/config.template.yaml
git commit -m "docs: present the single demand-first tiered/looped pipeline; drop evaluate

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Final verification & PR update

- [ ] **Step 1: Full gate**

```bash
scripts/lint.sh --complete
grep -rn 'evaluate' skills/ commands/ scripts/lint.sh .claude-plugin/ README.md || echo "no-evaluate"
grep -rn '{{' skills/ commands/ || echo "no-braces"
grep -nE '^## (D0|D1|D2|D3|Gate D|D4)' skills/discover/SKILL.md
```
Expected: `lint OK`; `no-evaluate`; `no-braces`; discover phases D0→D1→D2→D3→Gate D→D4
in order.

- [ ] **Step 2: Cross-reference resolution**

```bash
for f in $(grep -oE 'skills/discover/references/[a-z-]+\.md|templates/discover/[a-z-]+\.md|skills/product-strategy/reference/[a-z-]+\.md' skills/discover/SKILL.md skills/product-strategy/SKILL.md | sort -u); do [ -f "$f" ] && echo "OK $f" || echo "MISSING $f"; done
```
Expected: every line `OK`.

- [ ] **Step 3: Push and update PR #2**

```bash
git push
gh pr edit 2 --title "feat: reconcile front-ends into a demand-first tiered pipeline (audit + discover re-tier)"
```
Then update the PR #2 body to describe the reconciled scope (discover re-tier, audit
before validate, evaluate removed, closing loop) with a body that ends with the
`🤖 Generated with [Claude Code](https://claude.com/claude-code)` line.

- [ ] **Step 4: Dry-read pass**

Open `skills/discover/SKILL.md`, `skills/product-strategy/SKILL.md`, and `README.md`
with fresh eyes. Confirm: discover is demand-first (reality probe is D2, red-team is
D3); audit states it runs before validate and feeds its GTM; README narrates one
pipeline with the closing loop; no `evaluate` anywhere outside `docs/`. Fix any drift,
re-run `scripts/lint.sh --complete`, amend the relevant commit.

---

## Out of scope (→ later)

- Building `validate` (Plan 2) — its consumption of audit's asset/GTM is specified in
  the spec, implemented later.
- The medium-tier discover/validate review findings (spec `2026-06-13-discover-validate-design.md` §10).
