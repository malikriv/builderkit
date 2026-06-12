---
name: ship-feature
description: >
  Production-grade delivery pipeline for any feature request, bug report, design
  correction, or user feedback that changes app behavior. Runs intake → behavior
  recon (simulator screenshots) → regression/risk analysis → implementation
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

1. **Behavior recon (simulator)** — boot the app and capture the current
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
   `manual`. Every requirement gets at least one automated row; `manual` rows
   are allowed only for things automation genuinely can't see (haptics, feel,
   native transitions), and each one must say what the human should look at.

## Phase 5 — Build (parallel where safe)

- Implement the change and the tests from the QA plan. Tests that encode the
  *new* behavior come from the plan's rows — name them so the mapping is
  obvious (test name ≈ requirement).
- Fan out only when workstreams have **disjoint file sets** (e.g. one agent
  on the shared lib + its unit tests, another on a screen + its component
  tests). Give each agent: the spec doc path, its file list, and the
  requirement IDs it owns. Use `isolation: "worktree"` when agents would
  otherwise contend.
- The orchestrator integrates all branches/diffs and owns the final state of
  every file. Read the merged result before verifying — agents drift.
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
   specific values one by one; each must be observable in a test or a
   simulator screenshot.
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
  when available, divergences, and any owed manual gates.
- Subscribe to PR activity / watch CI to green. Fix failures as Phase 5
  loops.
- **Never** auto-trigger paid production builds, store submissions, or
  production deploys (for `stack: expo`: `eas build` / `eas submit`) — the
  user ships.

## Linear historian (team `linear.team` — `linear.url`)

Every intake item gets its OWN Linear issue — one ticket per fix/feature, not
one per pipeline run — so each unit of work is individually trackable and
future agents can use the tickets as context. A multi-item wave additionally
gets a parent issue; per-item issues link to it (sub-issues or "part of").
Use the Linear MCP tools when available; fall back to the Linear GraphQL API
with a personal API key. **If neither is reachable, surface that to the user
IMMEDIATELY at Phase 0** (the OAuth link or the missing-key fact, in the
first reply) — never defer it to the final summary. The pipeline itself still
proceeds — the spec doc stays the source of truth — and every ticket is
backfilled the moment access exists, in the same session when possible.

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
   implemented behavior is
   MANDATORY on every ticket** — not optional, not "when available": the
   driver's named evidence artifact for the item's flow (preferred —
   `<R-id>-<step>.png`, deterministic, regenerated every run), else a
   simulator capture of the after-state. Attach it natively
   (`prepare_attachment_upload` → PUT → `create_attachment_from_upload`), do
   not just link a file path. A ticket without an attached evidence
   screenshot is not done journaling. For non-visual changes (API-only,
   types), the screenshot shows the user-observable consequence (e.g. the
   screen that no longer misbehaves) — there is always a surface that proves
   the fix; if recon truly can't name one, say so explicitly on the ticket
   and attach the test output instead.
5. **Phase 8** — comment: commit SHA(s) + **PR link** + the fix version (app
   MAJOR.MINOR if known, else branch/PR); status → **In Review**. Only the
   user's merge/ship moves it to **Done** — never close it yourself.

The parent wave issue (when one exists) carries the Phase 0.5 prioritization
table, the spec link, and rollup comments that span items.

- **As context** — before recon, search Linear for prior issues touching the
  same surface and feed relevant ones to the recon agents.

## Multi-agent quick reference

| Work | Agent | Parallel? |
|---|---|---|
| Code/design recon | `Explore` (read-only) | Yes — always fan out with behavior recon |
| Behavior recon (sim) | orchestrator (needs device control) | Alongside Explore agents |
| Independent build workstreams | `general-purpose` / `claude`, disjoint files, worktree isolation | Yes, after the spec is written |
| Spec writing, risk call, integration, gates, ship | orchestrator | Never delegated |

Launch parallel agents in one message. Give every agent the spec path and its
requirement IDs. Fan in before every phase transition.
