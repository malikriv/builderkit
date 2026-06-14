---
name: ship-feature
description: >
  Production-grade delivery pipeline for any feature request, bug report, design
  correction, or user feedback that changes app behavior. Runs intake → behavior
  recon (device/browser captures) → regression/risk analysis → implementation
  decision → written requirements → automated QA test plan → implementation +
  unit tests → verification gates → ship (commit, push, draft PR, CI watch).
  Supports multi-agent fan-out so recon and build work run in parallel without
  sacrificing the single-owner quality gates. Use whenever the user asks to
  build, fix, change, or polish product functionality. Reads
  .builderkit/config.yaml; requires /builderkit:setup once per project.
---

# /ship-feature — production-grade feature & bug-fix pipeline

Take a raw request (feature, bug, feedback, design note) and ship it with low
risk and high confidence. The pipeline has eight phases. Phases 1 and 5 fan out
to parallel agents; every other phase has a single owner (you, the
orchestrator). Never skip a phase — for tiny diffs, phases shrink to a few
sentences, but they still happen and still get written down.

**Config first.** Read `.builderkit/config.yaml` before Phase 0. Missing → stop
and point the user at `/builderkit:setup`. The project's `CLAUDE.md` overrides
both this skill and the config where they conflict.

## Operating rules (apply to every phase)

- **Repo law first.** The project's `CLAUDE.md` rules override this skill where
  they overlap (verification requirements, build/deploy restrictions, commit
  conventions, versioning).
- **Read learnings first.** Before Phase 0, read `.builderkit/learnings.md` (the
  permanent memory tier) and honor it — `critical` rules are hard stops, `guideline`
  rules are defaults you deviate from only with a written reason.
- **Orchestrator owns judgment.** Subagents gather facts and produce drafts;
  the implementation decision (Phase 3), the final diff, and the verification
  gates (Phase 7) are never delegated.
- **Single-writer rule.** A file has at most one writer at a time. Parallel
  build agents get explicitly disjoint file lists; if two workstreams need the
  same file, serialize them or keep that file with the orchestrator.
- **Write things down.** Requirements, risks, test plan, and divergences go in
  a spec doc (Phase 4), not just chat. Future sessions and reviewers read docs,
  not transcripts.
- **Report honestly.** If a gate could not run in this environment (e.g. no
  iOS simulator on a Linux cloud box), say so in the commit, the PR, and the
  reply — never imply a verification happened when it didn't.
- **Respect declared boundaries.** `delivery.boundaries.never_touch` globs are
  off-limits — a change matching one fails the phase and goes back to the user; never
  edit a lockfile/migration/workflow to make a gate pass. `require_review` matches are
  allowed but MUST be called out explicitly in the PR body for human review.

## Phase 0 — Intake

Classify the request and restate it so a wrong interpretation surfaces now,
not after the diff. Produce, in a few lines:

- **Type**: bug / feature / design correction / feedback.
- **User goal**: what the user is trying to achieve, in their terms (not the
  mechanism they proposed).
- **Observable symptom or desired behavior**: what changes on screen.
- **Success criteria**: 1–3 checkable statements that define "done".
- **Affected surfaces**: screens/components/APIs you expect to touch.

If the request references specific values (colors, copy, counts), treat them
as the user's acceptance criteria — verify each one explicitly in Phase 7.

### Phase 0 — Validation handoff (when a Validation Report exists)

If a `/builderkit:validate` Validation Report with a **delivery-commitment block** is
present for this work, it is **binding Phase-0 input**:

- The FIRST shippable slice must satisfy the promise the validated page made (feature,
  price, the delivery window stated to payers) before any roadmap expansion — the build
  is scoped by what was *sold*, not re-discovered.
- Carry the **refund-runbook obligation**: if the committed first-access deadline
  (`validate.delivery.max_days_to_first_access`) cannot be met, emit the payer list + a
  refund runbook as a release-blocking owed step (never auto-move money).

#### Scope guard — deterministic, halts the pipeline (when `delivery.scope_guard.enabled`)

Don't let the validated plan rot during the build. Reconcile, then check by code — the
builder is not the judge of "did we stay on plan" (same discipline as Gate V):

1. **Reconcile** `delivery.scope_guard.build_plan` (the audit DAG) against
   `delivery.scope_guard.sold_scope` (the validate promise): for each sold-scope
   `deliverable`, set `scope_origin: sold` + `delivers: [<id>]` on the build-plan item(s)
   that fulfil it; leave the rest `expansion`/`backlog`. This mapping is the orchestrator's
   judgment call — make it explicit, write it back to the plan.
2. **Decide the slice** — the build-plan item ids you intend to ship in THIS run, plus an
   `estimated_build_days` for them.
3. **Check** by calling `evaluateScope({ plan, slice, estimated_build_days }, contract)`
   from `${CLAUDE_PLUGIN_ROOT}/templates/delivery/scope-check.mjs` (pure, unit-tested via
   `node --test`). Only **PASS** proceeds. Halt and resolve before any code on:
   `DRIFT` (non-sold work scheduled before sold P0), `UNDER-SCOPED` (a sold deliverable has
   no build item), `DECLINED-PLAY-SCHEDULED` (a brand-declined play in the slice — never
   build it), `INVALID-DAG` (cycle), `DEADLINE-RISK` (overruns the committed window → the
   refund-runbook obligation above fires). Record the verdict + reasons in the spec doc.

If no build plan / sold scope exists (e.g. a standalone bug fix), skip the guard and note
why — it gates validated-pipeline work, not every one-off.

### Phase 0.5 — Prioritize (defensible, written down)

Score every intake item before building, so the order of work and any
scope cuts are auditable — not vibes:

- **RICE** (default): `(Reach × Impact × Confidence) / Effort`. Reach = how
  many users/sessions hit this per cycle (estimate from the surface: every
  list view ≫ a settings corner). Impact: 3 massive / 2 high / 1 medium /
  0.5 low / 0.25 minimal. Confidence: 1.0 / 0.8 / 0.5 (drop to 0.5 when the
  root cause is still hypothesis). Effort in person-days (agent-days count).
- **Impact-Effort 2×2** (fast path for waves of ≤3 small items): classify
  each item quick-win / big-bet / fill-in / money-pit; quick-wins first,
  money-pits go back to the user before any work starts.
- **Overrides**: data-loss or blocking bugs jump the queue regardless of
  score; a user-stated order wins over the computed one (note the override).

The scores set the BUILD ORDER within a wave and decide what gets deferred
when scope must shrink. Record the table (item, R, I, C, E, score, one-line
rationale) in the spec doc and the Linear issue, and map the result to the
Linear priority field: top score or blocking bug → Urgent/High, middle →
Medium, fill-ins → Low.

## Phase 1 — Recon (fan out, then fan in)

Launch the independent recon tracks **in a single message** so they run in
parallel. Typical split:

1. **Behavior recon (device/browser)** — boot the app and capture the current
   behavior of every affected surface *before* changing anything.
   - Boot via `commands.dev` from `commands.workdir` and capture the current
     behavior of every affected surface before changing anything — the driver
     doc (`${CLAUDE_PLUGIN_ROOT}/skills/e2e-testing/drivers/<testing.driver>.md`)
     says how to capture (simulator screenshot vs browser screenshot). Send the
     captures to the user with `SendUserFile` — before/after pairs are the
     cheapest trust-builder we have.
   - **No-device fallback** (no simulator/browser in this environment): do
     *render-level* recon instead — render the affected components with the
     `commands.unit` framework and assert/inspect the props and styles that
     encode the current behavior, and trace the code paths by reading them.
     Record in the spec doc that the live pass is still owed and must run
     before the change ships.
2. **Code recon (Explore agent, read-only)** — map every definition and usage
   of the affected symbols: where the behavior lives, every duplicate of the
   logic, which screens consume it, and the exact current values
   (`file:line`). Duplicated mappings are regression traps — finding all of
   them IS the task.
3. **Design recon (Explore agent, read-only, when a design exists)** — check
   the project's `docs.design_dirs` and `docs.specs_dir` for the intended
   behavior, and extract the authoritative values (hex colors, copy, spacing).

Fan in: merge the tracks into a short **Findings** section — current behavior,
where it's defined, all duplicates, and any divergence between design, code,
and the user's description. If the user's premise turns out to be wrong
(e.g. "X is broken" but X works and Y is broken), stop and reconcile against
the user goal before writing any code.

## Phase 2 — Risk & regression analysis

Before deciding how to implement, enumerate what could break:

- **Blast radius table**: every surface that consumes the code you'll touch →
  what it currently shows → what it will show after → risk level.
- **Data considerations**: existing rows (old enum values, null fields),
  cached/offline data, seed data, migrations needed?
- **Contract considerations**: API request/response shapes, shared types in
  packages consumed by multiple apps, push payloads.
- **UX regressions**: does the change alter anything the user didn't ask to
  change (sort order, fallbacks, empty states, dark/light tokens)?
- **Test debt**: which existing tests encode the *old* behavior and will need
  updating deliberately (not deleted to make CI pass).

End the phase with an explicit go/no-go note: anything here that should go
back to the user before implementation? If yes, ask now (one consolidated
question), not after the diff.

## Phase 3 — Implementation decision

Make the call and record it in 3–6 sentences: the chosen approach, the
alternatives rejected and why, and the smallest change that is *correct* (not
merely the smallest diff — if the bug is a duplicated mapping, consolidating
to one source of truth is the correct fix; patching one copy is how the bug
comes back). If part of the request can't be implemented as described
(missing schema, missing design token), implement the closest correct version
and **document the divergence** in the spec, the commit message, and the PR —
never silently ship something different.

## Phase 4 — Requirements + QA test plan (one spec doc)

Write `<docs.specs_dir>/YYYY-MM-DD-<slug>.md` containing:

1. **Context** — one paragraph: the user request and the findings.
2. **Functional requirements** — numbered `R1…Rn`, each independently
   testable, each traceable to the user's words or an explicit decision.
3. **Non-functional requirements** — performance, accessibility, theming,
   offline, as applicable.
4. **Out of scope** — what you deliberately did not change.
5. **Divergences** — anything implemented differently from the literal
   request, and why.
6. **QA test plan** — a table: `ID | Requirement | Precondition | Steps |
   Expected | Automation`. Automation is one of `unit`, `component`, `e2e`,
   `manual` (`component` rows execute under `commands.unit` — same runner,
   component-level assertions). Every requirement gets at least one automated
   row; `manual` rows are allowed only for things automation genuinely can't
   see (haptics, feel, native transitions), and each one must say what the
   human should look at.

## Phase 5 — Build (waves, parallel where safe)

- **Wave order from the DAG.** When a build plan covers this work, ship the items in
  dependency order: topologically layer `build-plan.yaml` (the `waves` from
  `topoWaves(plan)` in `scope-check.mjs` give the exact layers) and complete each wave
  (merge + green) before the next. Within a wave, items with disjoint files run in
  parallel up to `delivery.waves.max_parallel`.
- **Route by complexity.** When `delivery.model_routing.enabled`, spawn each build agent
  with the model its build-plan `complexity` implies: `>= complexity_threshold` →
  `escalated_model`, else `default_model` (pass it as the Agent `model` param). P0 /
  multi-surface / architectural items earn the stronger model; trivial tweaks don't.
- Implement the change and the tests from the QA plan. Tests that encode the
  *new* behavior come from the plan's rows — name them so the mapping is
  obvious (test name ≈ requirement).
- Fan out only when workstreams have **disjoint file sets** (e.g. one agent
  on the shared lib + its unit tests, another on a screen + its component
  tests). Give each agent: the spec doc path, its file list, and the
  requirement IDs it owns. Use `isolation: "worktree"` when agents would
  otherwise contend.
- **Honor boundaries.** No agent edits a `delivery.boundaries.never_touch` path; if the
  change appears to need one, stop and surface it. Any `require_review` path touched gets
  flagged for the Phase 8 PR body.
- The orchestrator integrates all branches/diffs and owns the final state of
  every file. Read the merged result before verifying — agents drift.
- **Propagate findings across waves.** On each wave fan-in, capture the discoveries the
  next wave needs — new APIs/types created, patterns established, gotchas hit — in the
  spec doc, and hand them to the next wave's agents in their brief. A later agent should
  never re-discover what an earlier one already learned this run.
- Match the surrounding code's style; comments only for constraints the code
  can't express.

## Phase 6 — Update stale tests deliberately

Re-run any tests identified as encoding old behavior in Phase 2. Update each
one to assert the new behavior *because the spec says so* — with the spec ID
in reach (commit message or test name), so the change is traceable, and a
reviewer can distinguish "requirement changed" from "test weakened".

## Phase 7 — Verification gates (orchestrator only, all must pass)

1. `commands.typecheck` — clean.
2. Full `commands.unit` — every suite, not just the new ones.
3. **Acceptance check** — walk the Phase 0 success criteria and the user's
   specific values one by one; each must be observable in a test or a device/browser screenshot (per the driver doc).
4. **E2E gate (driver-first, per the builderkit e2e-testing skill):** every QA
   row marked `e2e` ships a committed flow in `testing.flows_dir` (tagged
   `features`, with named evidence screenshots `<R-id>-<step>` into
   `testing.evidence_dir`). Read
   `${CLAUDE_PLUGIN_ROOT}/skills/e2e-testing/SKILL.md` and
   `drivers/<testing.driver>.md` for the hard-won selector/flake rules BEFORE
   writing flows. The gate is `commands.e2e` (or at minimum `commands.e2e_smoke`
   + the new flows) green, run twice when a flow is new (suite context exposes
   flake that solo runs hide). The evidence PNGs are the verification evidence —
   attach them to the per-item Linear tickets and reference them in the PR.
   Manual screen-driving is reserved for what flows can't judge: look-and-feel
   vs design files, spacing, animation quality. On a no-device environment:
   trigger the project's e2e workflow remotely
   (`gh workflow run "<testing.ci.workflow_name>"` → `gh run download` the
   evidence artifact) when it exists; else do the render-level equivalent and
   flag the owed local pass in commit + PR + reply, listing exactly what to
   check.
5. **Regression sweep** — re-run the suites covering every blast-radius
   surface from Phase 2.

A failed gate loops back to Phase 5 — never ship around a failed gate.

## Phase 8 — Ship

- Commit per repo convention (scoped type, imperative summary, body with what
  & why + design references + divergences).
- Push with `git push -u origin <branch>`; open a **draft PR** whose body
  carries: the requirement list, test evidence (suite counts), screenshots
  when available, divergences, any owed manual gates, the scope-guard verdict,
  and an explicit **Requires review** list for every `delivery.boundaries.require_review`
  path the diff touched.
- Subscribe to PR activity / watch CI to green. Fix failures as Phase 5
  loops, but **bound the loop**: at most `delivery.review.max_revision_loops` fix
  attempts on the same failure; after `delivery.review.escalate_to_human_after` with no
  progress, stop and surface the diagnosis to the user rather than retrying forever
  (a stuck loop is a signal, not a thing to grind on).
- **Never** auto-trigger paid production builds, store submissions, or
  production deploys (for `stack: expo`: `eas build` / `eas submit`) — the
  user ships.

## Memory — findings → learnings (two tiers)

BuilderKit keeps two memory tiers so lessons compound instead of repeating:

- **Findings (per-run, ephemeral).** Discoveries made during THIS build — new
  APIs/types, established patterns, gotchas, the scope-guard verdict. They live in the
  run's spec doc and propagate across waves (Phase 5). Scoped to one ship run.
- **Learnings (permanent).** Rules that hold across builds, in `.builderkit/learnings.md`,
  read at Phase 0. **Promote a finding to a learning only once it recurs across
  `studio.promote_after_k` runs** (or when a single finding is clearly a standing rule,
  e.g. "the generated schema is never hand-edited"). On ship, if a gotcha you hit this run
  matches one already seen in a prior run's spec doc, propose promoting it: append a rule
  to `learnings.md` with its enforcement level and the runs it came from. Aggregate rules
  only — never raw user data.

Cross-product priors (GTM/landing tactics, panel-vs-outcome) stay in
`.builderkit/studio/playbook.md` via discover/validate; `learnings.md` is this project's
delivery rules.

## Linear historian (team `linear.team` — `linear.url`)

Mechanics (ticket model, MCP fallback, status discipline, native attachment
upload, completion-comment format) live in
`${CLAUDE_PLUGIN_ROOT}/skills/linear/SKILL.md` Part A — follow them for every
item. This section maps pipeline phases to journal content.

Every intake item gets its OWN Linear issue — one ticket per fix/feature, not
one per pipeline run. A multi-item wave additionally gets a parent issue;
per-item issues link to it (sub-issues or "part of").

Access + fallback rules: linear skill Part A item 2 — surface missing access
IMMEDIATELY at Phase 0.

Each per-item issue accumulates across phases:

1. **Create (Phase 0)** — title = one-line item summary; description = the
   **user story** ("As a <primary user>, … so that …", derived from the user's
   words), the intake block (type, observable symptom, success criteria,
   affected surfaces), and the item's RICE row. Priority field FROM the RICE
   table (top score / blocking bug → Urgent or High, middle → Medium,
   fill-in → Low). Status → **In Progress** when its build starts.
2. **Phase 1/2 fan-in** — comment: findings (root cause for bugs, file:line
   evidence), blast radius, and **concerns/risks** (data, contracts, UX
   regressions). Out-of-scope discoveries become their OWN backlog issues
   (linked) — never silently dropped.
3. **Phase 3/4** — comment: implementation decision, requirement IDs, spec
   doc path, and the item's **test cases** (its QA-plan rows verbatim — ID,
   steps, expected, automation level).
4. **Phase 7** — comment: **evidence of the fix** — gate results verbatim
   (typecheck output, unit-suite counts), divergences from the literal
   request, and any owed gates flagged loudly. **A screenshot proving the
   implemented behavior is MANDATORY on every ticket.** Evidence +
   native-upload mechanics per the linear skill Part A item 4.
5. **Phase 8** — comment: commit SHA(s) + **PR link** + the fix version (the release version if the project tracks one, else branch/PR); status → **In Review**. Only the
   user's merge/ship moves it to **Done** — never close it yourself.

Parent wave issue (when one exists): carries the Phase 0.5 prioritization table
and the spec link, plus rollup comments that span items — linear skill Part A
item 1.

**As context** — before recon, search Linear for prior issues touching the same
surface and feed relevant ones to the recon agents — linear skill Part A item 6.

## Multi-agent quick reference

| Work | Agent | Parallel? |
|---|---|---|
| Code/design recon | `Explore` (read-only) | Yes — always fan out with behavior recon |
| Behavior recon (device/browser) | orchestrator (needs device control) | Alongside Explore agents |
| Independent build workstreams | `general-purpose` / `claude`, disjoint files, worktree isolation | Yes, after the spec is written |
| Spec writing, risk call, integration, gates, ship | orchestrator | Never delegated |

Launch parallel agents in one message. Give every agent the spec path and its
requirement IDs. Fan in before every phase transition.
