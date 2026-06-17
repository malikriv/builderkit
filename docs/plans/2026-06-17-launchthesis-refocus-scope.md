# LaunchThesis — refocus scope

**Status:** proposed (scope locked; implementation not yet started)
**Date:** 2026-06-17
**Supersedes the framing in:** `README.md`, `.claude-plugin/plugin.json`

## Summary

BuilderKit grew into a full app-studio orchestrator — a one-way funnel
`discover → audit → validate → ship → e2e → Linear → loop` — where roughly half the
surface area is **demand validation** and half is **development execution**. This refocus
keeps the validation half, removes the execution half outright, reframes the build-planning
`audit` into a GTM/conversion **strategy** step, and renames the project to **LaunchThesis**.

The product becomes a **demand-validation studio**: a repeating loop that forms a falsifiable
*Launch Thesis*, refines and researches it, and tries to break it in the market with a
short-term guerrilla validation sprint — proving (or cheaply killing) real cold demand. It
stops at the PASS boundary and hands off a validated thesis. It does **not** own the build,
the tests, or the tickets.

**Audience:** **vibe coders** — people who ship apps fast with AI builders and are strong at
*building* but rarely run disciplined validation. The job is to give them confidence on
*what to build and what not to build* before they sink weeks into the wrong app.
**Distribution is deliberately undecided** (Claude Code plugin today; possibly a hosted SaaS
later). This scope is written so one portable core powers either direction, with everything
distribution-specific isolated to an adapter layer — see *Distribution-agnostic architecture*.

## Why

- The execution machinery (ship's 8-phase delivery, the `delivery:` scope-guard/waves/
  model-routing, the 4-phase e2e system, Linear journaling) is most of the "more complex than
  intended" weight and is not the value the kit is meant to deliver.
- The validation loop (refine → research → validate) plus a compounding playbook is a sharp,
  single-purpose product.
- The central artifact — discover's *Hardened Hypothesis Brief* — is literally a thesis about
  a launch. The name **LaunchThesis** makes the product's job explicit: form a thesis, prove
  or falsify it cheaply, compound what you learn.

## Positioning

**One-liner:** *Refine → Research → Validate, in loops, with a playbook that compounds.*

The thesis is one sentence — *"this ICP will pay this much for this wedge"* — and the loop's
job is to make that sentence true or kill it cheap. Gate V PASS = thesis **validated**;
KILL = thesis **falsified**, cheaply. The studio playbook is the record of theses across
products.

## Audience: vibe coders

The user ships apps fast with AI builders (Claude Code, Cursor, Lovable, v0, Bolt, Replit)
and is strong at *building* but rarely runs disciplined market validation. Their failure
mode is confidently building something nobody wants. The jobs LaunchThesis does for them:

- **Confidence on what to build** — a crisp GO with a market-backed spec, not a vibe.
- **Confidence on what *not* to build** — a cheap, evidence-backed NO-GO is a first-class
  win, not a failure. Killing a dead idea in a day *is* the product working.
- **Meet them where they build** — the payoff of a PASS is an **AI-builder-ready build
  brief**: the validated wedge, exactly what the converting page sold (scope + price +
  first-access promise), and acceptance criteria, formatted to paste straight into their
  builder. A NO-GO returns the disconfirming evidence + the cheapest adjacent wedge to try.

This audience *sharpens* two existing choices rather than fighting them:
- The "**you build the page**" step (validate V2) is light here — a vibe coder can vibe-code
  a landing page in minutes — so the honesty floor (a real, human-built converting page)
  costs them little. Keep it.
- The cheap-kill funnel maps directly to "what not to build." Lead with it.

What it must *not* do for this audience: soften the signal to feel good. Confidence is worth
nothing if the gate isn't real, so the honesty floor and "builder is not the scorer" stay
non-negotiable (see *Friction calibration*).

## The loop

```
        ┌─────────────────────────────────────────────┐
        │                                             │
   Refine ──→ Research ──→ Strategy(GTM) ──→ Validate ─┤
  (idea       (market       (guerrilla       (cold     │
  refinement)  research)     plan + page)    pay-proof)│
        │                                             │
        └──── ITERATE (re-frame / re-channel /         │
                       re-cut the wedge) ──────────────┘
                          │
              PASS → Validated Launch Thesis (hand off)
              KILL → recorded, cheap
                          │
                 Studio playbook compounds
```

| Stage | What it is | From today's |
|---|---|---|
| **Refine** (Idea Refinement) | Frame the concept; sharpen ICP / candidate wedge / offer; exit-safe framing; cheap triage | discover D0–D1 |
| **Research** (Market Research) | Symmetric need assessment, demand intensity, WTP/monetization, alternatives, red-team panel; **name the wedge** | discover D2–D3 |
| **Strategy** (Guerrilla GTM) | Weight strategy families, map + flag plays, conversion-asset brief that arms the sprint | the GTM half of `audit` |
| **Validate** (Market Validation) | Guerrilla GTM sprint → cold pay-proof → Gate V | `validate` |

Each loop ends in **PASS** (hand off), **ITERATE** (bounded re-frame / re-channel / wedge
re-cut), or **KILL/SHELVE** (cheap, recorded).

## Scope: keep / remove / change

### REMOVE — the development-execution half
- Commands: `ship.md`, `linear-issue.md`, `e2e.md`
- Skills: `ship-feature/`, `linear/`, `e2e-testing/` (+ `drivers/maestro.md`, `drivers/playwright.md`)
- Templates: all of `templates/delivery/` (scope-check + tests + scope-run + fixtures +
  sold-scope), `templates/audit/build-plan.template.yaml` (the build DAG), all of
  `templates/maestro/`, all of `templates/playwright/`
- `scripts/test.sh`: drop the `templates/delivery/*.test.mjs` run + the `scope-run` smoke
- `scripts/lint.sh`: drop the removed files from the `--complete` manifest; keep the
  portability/placeholder/frontmatter guards

### KEEP — the validation core
- Commands: `discover.md`, `validate.md`, `setup.md` (trimmed), `audit.md` (reframed → strategy)
- Skills: `discover/` (+ all 3 references), `validate/` (+ guerrilla-playbook, honesty-floor,
  landing-conversion), `product-strategy/` (+ play-engine, reframed), `studio-setup/` (trimmed)
- Templates: **all of `templates/landing/`** (the measurement plumbing — gate-eval/gate-run +
  tests, capture, schema, payment-intent, server routes, privacy, README, wiring-reference;
  this is what makes validation un-gameable, keep every file), `templates/validate/
  validation-report.md`, all `templates/studio/*`, `templates/discover/hypothesis-brief.md`
  (→ renamed `launch-thesis.md`)

### CHANGE — reframes, not deletes
- **`audit` (`product-strategy`) cut in half → "strategy".** Drop B3's complexity-for-model-
  routing, B5's `build-plan.yaml` DAG, and the sold-scope reconcile. Keep B1 (weight strategy
  families), B2 (map plays to surfaces), B4 (flag/decline plays — brand safety), B6 (metric
  wiring). Output becomes a **GTM + conversion strategy doc that arms the validate sprint**,
  not a build planner. Rename the command `audit → strategy`.
- **`validate` handoff replaces ship.** V4 stops emitting `build-plan.yaml` + `sold-scope.yaml`
  as "binding Phase-0 input" to `/ship`. Instead it emits a **Validated Launch Thesis**: the
  wedge (now `status: validated`), exactly what the converting page sold (deliverables + price
  + first-access deadline), the cold-user list, and the channels that worked. Keep the *content*
  of the old sold-scope (it is literally "what was sold"); drop its role as a scope-guard
  contract. The kit stops at proven demand.
- **`config.template.yaml` slims** to `project`, `docs`, `product`, `discover`, `validate`,
  `studio`. Drop `commands:`, `testing:`, `linear:`, `delivery:`. `modules:` collapses to
  `discover / product / validate / studio`. `validate.delivery.max_days_to_first_access`
  → `validate.handoff.max_days_to_first_access`.
- **`setup` / README / `plugin.json` / `marketplace.json`** rewritten around the LaunchThesis
  loop; setup drops the 4-phase-e2e walkthrough entirely.
- **CI (`ci.yml`)** stays; the test job now runs only the landing gate-eval/gate-run tests.

## The versioned-wedge model (new — folded into this scope)

The wedge is the subject of the thesis, so it is promoted from a flat config string to a
**versioned, first-class object** with an explicit refinement path through the loop. This
closes the gap where, today, the wedge is named once at D3 and then treated as fixed.

### Three-tier home (mirrors the existing config / brief / studio split)
- **Config (`product.positioning`)** — the *current* wedge one-liner, for skills that read
  config at a glance. A mirror of the in-play version's `statement`. Stays a plain string for
  backward compatibility.
- **Thesis brief (`launch-thesis.md`)** — the **source of truth**: the full versioned object
  + history, one living doc per concept slug, updated in place across iterations.
- **Studio playbook** — cross-product **wedge patterns → conversion**, aggregate only, no PII.

### Object shape (in the thesis brief)
```yaml
wedge:
  statement: "<one-line differentiated position an incumbent would avoid copying>"
  version: 2
  status: named            # candidate | named | validated | refuted
  history:
    - version: 1
      statement: "<the first cut>"
      status: refuted
      refuted_by: "Gate V FAIL across 2 offer variants, traffic floor met — position not believed"
      date: 2026-06-15
    - version: 2
      statement: "<the re-cut>"
      status: named
      date: 2026-06-17
```

### Status state machine
- **candidate** — drafted at **Refine** (D0 frame + D1 triage gate). Differentiated enough to
  pass D1, not yet hardened.
- **named** — **Research/D3** states it explicitly and writes it (brief + `product.positioning`).
  This is the wedge that arms Strategy + Validate.
- **validated** — **Gate V PASS**: a cold payer bought the offer expressing this wedge.
- **refuted** — **Gate V FAIL** attributable to the *position* (not thin traffic, not weak
  copy). Bumps `version`, sets the prior to `refuted` with a `refuted_by`, and returns the loop
  to **Research** to harden a new cut.

### The re-cut move (explicit ITERATE branch)
Today validate's FAIL path runs `message_variants_before_kickback` **copy/offer** variants and
only a same-strength page failing across variants routes back to discover. Add a third, named
disposition so the loop can say *"the wedge was wrong"* rather than only *"the copy was weak"*:

- After the copy/offer variants fail **and** the traffic floor was met (so it is not thin
  traffic), the kickback is an explicit **wedge re-cut**: bump `wedge.version`, set the prior
  `refuted` with `refuted_by`, and return to **Research (D3)** — not just to a new offer.
- Bounded by `studio.max_concept_cycles`.
- The studio validation-log distinguishes the three failure attributions:
  `channel_thin` (INCONCLUSIVE) vs `copy_weak` (variant fixed it) vs `wedge_refuted` (re-cut).

### Touchpoints
- **discover SKILL** — D1 emits a `candidate` wedge; D3 promotes to `named` and writes the
  versioned object to the brief + `product.positioning`. A re-cut iteration (entered from
  validate) produces version N+1.
- **strategy SKILL** (ex-audit) — reads the current `named` wedge for B2/B4 (unchanged
  conceptually).
- **validate SKILL** — Gate V FAIL path gains the `wedge_refuted` disposition + the re-cut
  handoff; the studio log gains wedge attribution; on PASS sets `wedge.status: validated` in
  the Validated Launch Thesis handoff.
- **`templates/studio/playbook.md`** — add a "Wedge patterns → conversion" ledger
  (`wedge pattern | icp_type | status | runs | cold land→pay | note`) and tie refuted wedges
  into the existing panel-vs-outcome ledger.
- **`templates/discover/launch-thesis.md`** — add a `## Wedge` section carrying the object +
  history table.

## Config sketch (slimmed `product:` + wedge note)

```yaml
product:                      # read by discover (frame/exit/positioning) + strategy
  positioning: {{POSITIONING}}        # CURRENT wedge one-liner (mirror of thesis wedge in play)
  exit_strategy: {{EXIT_STRATEGY}}    # stated exit; keeps framing/claims safe (or "none")
  sensitive_category: {{SENSITIVE}}   # true → strategy flags manipulative plays harder
  surfaces: []                        # optional: screens the strategy step maps plays onto
  playbook_ref: {{PLAYBOOK_REF}}      # OPTIONAL override; engine is self-sufficient

modules:
  discover: true              # refine + research (idea → named, hardened wedge)
  product: true               # strategy: GTM + conversion plays that arm the sprint
  validate: true              # 48h cold-pay-proof guerrilla sprint
  studio: true                # cross-product playbook
```

## Rename mechanics (LaunchThesis)

- Plugin/project name: `builderkit` → **`launchthesis`** (`plugin.json`, `marketplace.json`)
- Command namespace: `/builderkit:*` → **`/launchthesis:*`**
- Config dir: `.builderkit/` → **`.launchthesis/`** (skills read `.launchthesis/config.yaml`)
- Commands keep `discover` & `validate`; **`audit` → `strategy`**
- Thesis brief file: `hypothesis-brief.md` → **`launch-thesis.md`**; output path
  `<docs.specs_dir>/YYYY-MM-DD-<slug>-launch-thesis.md`
- Git repo (`malikriv/builderkit`) and marketplace source rename: **separate, optional**
  GitHub-side action; the plugin works regardless. Left for later.

## Implementation order (when we proceed)

1. Slim `config.template.yaml` + rewrite `scripts/lint.sh` manifest and `scripts/test.sh`.
2. Rewrite README + `plugin.json` + `marketplace.json` around the LaunchThesis loop.
3. Reframe skills: `product-strategy` (→ strategy), `validate` (handoff + wedge-refuted path),
   `discover` (versioned wedge); rename the brief template + add the `## Wedge` section.
4. Add the wedge-patterns ledger to `templates/studio/playbook.md`.
5. Delete the execution modules (commands/skills/templates listed under REMOVE).
6. Namespace rename `/builderkit:* → /launchthesis:*`, `.builderkit/ → .launchthesis/`,
   `audit → strategy`.
7. Green `scripts/lint.sh --complete` + `scripts/test.sh` on the branch.

## Distribution-agnostic architecture (SaaS or plugin)

Distribution is undecided — Claude Code plugin today, possibly a hosted SaaS later. To keep
that choice cheap and deferred, the scope separates a **portable core** from
**distribution adapters**. The rule: *the core never imports anything distribution-specific;
everything that differs hides behind an adapter interface.* Hold that line now and the
SaaS-vs-plugin decision never forces a fork.

### Three layers

1. **Methodology (portable content).** The loop's prose — gate definitions, rubrics,
   red-team personas, the guerrilla playbook, the conversion rubric, the honesty floor, the
   wedge state machine. Runtime-agnostic instruction text; identical in both distributions.
   *Action now:* keep the method free of hard Claude-Code couplings — isolate
   `${CLAUDE_PLUGIN_ROOT}` paths and the Agent/Explore/Workflow orchestration into clearly
   marked "runtime binding" notes, so a SaaS agent runtime can substitute its own
   orchestration. Separate *what the step does* from *how the runtime executes it*.
2. **Deterministic core (portable code).** The un-gameable scoring — `gate-eval` / `gate-run`
   (predicate building, lands derivation, cohort weighting). Pure, framework-free functions:
   data in, verdict out. This is what guarantees "builder is not the scorer" in *both* worlds
   — in the plugin it runs via node, in SaaS it's a server-side scoring endpoint, same code.
   *Action now:* keep `evaluateGate` / `buildPredicates` free of file-path/CLI assumptions;
   the CLI wrapper stays a thin plugin adapter over them.
3. **Adapters (distribution-specific).** Everything that differs:

| Concern | Plugin adapter | SaaS adapter |
|---|---|---|
| **Orchestration** | Claude Code skills + Agent/Explore/Workflow | agent loop on the Anthropic API w/ tool-use |
| **Persistence / state** | files (`.launchthesis/config.yaml`, sprint-state, `studio/*.md`) | DB rows (projects, theses, wedge-versions, sprints, playbook) — **same schema** |
| **Connectors** (deploy / data / payments) | the user's declared MCP connectors, user-owned keys | managed infra or OAuth, platform-owned |
| **Identity / tenancy** | single local user | accounts, multi-tenant, billing |
| **Studio playbook scope** | local, per-user priors | optionally **cross-user, anonymized** priors → network effect / data moat |

### What this buys

- The decision is **deferred at near-zero cost**: ship the plugin now (core + plugin
  adapters); add SaaS later by writing SaaS adapters against the same core + schema.
- The **deterministic core is already SaaS-ready** — the `.mjs` evaluators are pure libraries
  today. That is the crown jewel of portability and the reason the honesty floor ports for free.
- The one feature that genuinely *wants* SaaS — a **cross-user anonymized playbook** (every
  user's validation outcomes compounding into shared priors, a real moat) — is purely an
  adapter-level upgrade; the core loop doesn't change to gain it.

### To stay forkless, do this now (folds into the implementation order)

- Define the **project / thesis / wedge / sprint data schema** explicitly (today it's implicit
  in the YAML templates) so it maps cleanly to either YAML files or DB tables. The
  versioned-wedge object is the template for this.
- Express the three connector needs as a small **capability interface** —
  `deploy.publish(html) → url`, `data.insert(row)` / `data.query(window) → rows`,
  `payments.createHold(amount) → proof` — so a managed SaaS provider can satisfy the same
  contract the MCP connectors do today.
- Mark every Claude-Code-specific reference in the skills as a runtime binding, not method.

## Friction calibration for vibe coders

The tension: vibe coders want fast + cheap; real confidence needs a real signal. Resolve it
by **keeping the floor and cutting the friction around it** — never by lowering the floor.

- **Non-negotiable (the signal):** real cold-stranger exposure, ≥1 cold hard pay-proof in
  LIVE mode, "builder is not the scorer" recompute. These *are* the confidence; soften them
  and the tool is a horoscope.
- **Cut everywhere else (the friction):** lean on the audience's strength — they build fast.
  A templated, vibe-code-ready landing scaffold; guided DM/post drafting; planner-mode
  fallbacks when a connector is missing; and in SaaS, managed deploy + a managed Stripe hold
  so the only things the user supplies are the offer and the audience.
- **Always emit a verdict, never a vibe.** Every loop ends in **GO / NO-GO / ITERATE** with
  the evidence and a confidence read — that crispness is the product for this audience.

## Non-goals

- Owning the build, tests, CI, or ticketing after PASS (that is the founder's downstream choice).
- A scope-guard / drift contract (it existed only to keep the *build* honest; out of scope now).
- Auto-posting or auto-launching anything — the founder still posts and builds the page.

## Open items

- Whether `studio.max_concept_cycles` should count wedge re-cuts separately from offer/channel
  iterations (leaning: a re-cut is the expensive cycle and should be the thing that's bounded).
- Final copy for the README tagline and the `plugin.json` description.
- Plugin-first vs SaaS-first sequencing. The architecture supports either; plugin is
  lowest-friction for the Claude-Code-native slice of vibe coders, SaaS unlocks the
  cross-user playbook moat and reaches vibe coders on non-CC builders (Lovable, v0, Bolt).
- Whether to track **post-launch outcome** (did a validated thesis actually launch + retain
  payers?) to prove the tool's own success metric — richer in SaaS (longitudinal cohorts)
  than plugin (a local log line).
