# BuilderKit — front-end reconciliation (demand-first, tiered, looped)

Date: 2026-06-13
Status: approved design (rev 2 — demand-first), pre-implementation
Author: malikriv (with Claude Code)

> Rev 2 supersedes the rev-1 "discover-first" reconciliation after a devil's-advocate
> pass. The objective is **maximum successful launches** (plural), so the funnel is
> re-architected to optimize **speed-to-real-signal** and **portfolio throughput**:
> cheap kills first, the expensive machinery only on ideas the market already nodded
> at, the build audit *before* the real validation sprint, and a closing learning loop.

## 1. Context

BuilderKit grew two overlapping front-of-pipeline capabilities:

- **`product-strategy`** (PR #2, open): `/builderkit:evaluate` (idea → go/no-go) +
  `/builderkit:audit` (validated product → ranked, brand-safe build list of plays).
- **`discover`** (PR #1, merged) + **`validate`** (Plan 2, unbuilt): seed → hardened
  hypothesis (red-team, reality probe, Gate D) → 48h live cold-pay-proof sprint (Gate V).

`evaluate` and `discover` overlapped at the "should I build this" seam; `audit` is
unique. Rather than a single heavy front door, reconcile into a **cheap-to-expensive,
demand-first funnel** that gets to a real demand signal as early as possible.

## 2. Goals / non-goals

**Goals**
- Maximize successful *launches across many ideas*: kill losers cheap, reserve
  expensive analysis + spend for ideas with a real market pulse, throughput first.
- Get a real demand signal **before** the heavy multi-agent red-team.
- Audit the conversion asset + distribution **before** the real validation sprint, so
  the sprint is a fair test, not a sandbagged one.
- Close a post-launch learning loop (studio) — "launch" = retained/paying, not shipped.
- Preserve every distinct capability (red-team, reality probe, cold pay-proof gate,
  play engine + flagging) and the IP posture (engine-only; deck via `playbook_ref`).
- Land with `main` never seeing a redundant `evaluate` (PR #2 still open).

**Non-goals**
- Building `validate` (still Plan 2).
- Changing the play-engine, red-team personas, or Gate D/V *pass criteria* (only the
  *order* in which discover runs its phases changes).
- New top-level commands (triage + smoke are discover tiers).

## 3. The reconciled chain

```
ideas → /discover (tiered, demand-first) → /audit → /validate → /ship → e2e → Linear → Insight Loop ↺
        triage → smoke → [pulse?] → harden    conv +    real 48h    build               studio writeback;
        cheap    cheap    kill cheap  heavy     GTM plan  pay-proof                       next idea starts smarter
```

Each gate is **progressively more expensive**, so most ideas die before the costly
stages, and founder time/money concentrate on ideas the market already nodded at.

## 4. `discover` — re-architected as a cheap-to-expensive funnel

Re-order discover's internals so the cheapest, most decisive tests run first and the
expensive red-team runs last. The reality probe leaps ahead of the red-team.

### D0 — Frame (cheap)
Idea/seed, ICP/population, archetype, **stated exit** (`product.exit_strategy`,
default "none"), founder-access (communities + standing). Everything downstream is
judged against the exit.

### D1 — Triage gate (cheap; absorbs `evaluate`)
A fast desk go/no-go in minutes: plausible **wedge** (position vs. feature)? a
**cheaply-reachable audience** the founder can personally access? a **WTP path**?
**exit-safe** on the face of it? Obvious losers die here — no research spend yet.
This is `evaluate`'s lightweight value, now discover's first gate.

### D2 — Demand smoke (cheap real signal; the reality probe, pulled forward)
Before any heavy analysis, get a market **pulse** with the cheapest possible real
test: named-list pre-sell DMs (Mom-Test framed) + an optional **no-build fake-door**
(a form or single static page). Time-boxed (`discover.reality_probe.window_hours`,
default 24–48). **No landing/Supabase/Stripe stack here** — that is `validate`'s
executor; D2 stays cheap on purpose. Uses the existing
`references/reality-probe.md`, repurposed as the front-of-funnel smoke.

### Pulse gate (the false-negative guardrail)
- **Pulse** (≥1 real pre-sell/LOI/deposit, or a fake-door signal above a stated
  floor) → escalate to D3.
- **No pulse** → **re-frame the offer/audience ONCE and retest** (a weak first
  framing must not false-kill a real idea), then **kill/shelve** if still flat.
  Record the re-frame and the verdict. Cheap kill, before the expensive machinery.

### D3 — Deep hardening (expensive; only on a pulse)
Now spend the costly machinery: the multi-agent **red-team** (evidence-bound,
`references/red-team-personas.md`), the **symmetric calibrated need assessment**
(`references/demand-intensity-rubric.md`), **monetization/WTP**, **named wedge**
(recorded to `product.positioning`), and the **exit-safe framing check**
(names/claims/trademark vs. the exit).

### D4 — Hardened Hypothesis Brief → Gate D
Write the brief from `templates/discover/hypothesis-brief.md`, now including: stated
exit, named wedge, exit-safe framing check, the D2 pulse evidence, and a light
**intended-surfaces sketch** so `/audit` has something to map plays onto. **Gate D**
pass criteria unchanged (evidence-gated).

`discover` reads the shared `product:` config block (`exit_strategy`, `positioning`,
`sensitive_category`).

## 5. `evaluate` — folded in, removed as a command

- Delete `commands/evaluate.md`. Its triage value is now **D1**; its MVP-spec role is
  superseded by audit's build list (§6). No deprecation alias (PR #2 unmerged).
- Remove Part A from `skills/product-strategy/SKILL.md` and `evaluate` from the lint
  manifest, README command table, and manifest prose.

## 6. `audit` — retargeted and moved **before** `validate`

- **Single-purpose** build planner (drop Part A). Input = the discover Hardened
  Hypothesis Brief (its surfaces sketch) for a pulse-confirmed, hardened concept —
  **or** an existing product's surfaces.
- Runs **after Gate D, before the validation sprint.** Output: the **conversion-asset
  spec** + the **distribution/sharing plays** (P0 for cold traffic) + the **ranked
  build list**. These **feed `validate`'s GTM and landing asset**, so the real sprint
  tests an audited asset.
- `play-engine.md` (pattern library, strategy/metric tables, pairing graph, flagging
  rules, Insight Loop) **unchanged**. Standalone audit of a live product preserved.

## 7. `validate` — the real cold-pay-proof sprint (Plan 2, later slot)

Unchanged role and Gate V criteria (≥10 cold users, ≥1 hard pay-proof, recomputed
from frozen predicates). Now **consumes audit's conversion asset + GTM plan** as its
starting point instead of building blind. Implemented in Plan 2.

## 8. Closing stage — Insight Loop + studio (the loop)

After `ship`, the **Insight Loop** (audit's metric-first mode: pick one metric →
ship one play → re-measure, never batch) and the **studio playbook** are the explicit
terminal stage. Outcomes (including kills at every tier) write back to
`.builderkit/studio/` as cross-product priors so the next idea starts smarter. The
funnel is a loop, not a line.

## 9. Config

The `product:` block (from PR #2) stays and is now **shared**: discover reads
`exit_strategy`/`positioning`/`sensitive_category`; audit reads all incl.
`surfaces`/`playbook_ref`. **No new keys.** discover's existing `reality_probe`
config now governs the D2 smoke (same keys). `modules.product` stays true.

## 10. Handoff contracts (the seams)

- D2 smoke → pulse gate: pre-sell/fake-door signal vs. a stated floor; re-frame once
  before kill.
- discover → audit: the Hardened Hypothesis Brief (exit/wedge/framing/surfaces-aware).
- audit → validate: the conversion-asset spec + distribution plays + build list
  become validate's GTM + landing starting point (Plan 2 wires this).
- validate → ship: on Gate V pass, the ranked build list items each → `/builderkit:ship`.
- ship → Insight Loop/studio: post-launch metric loop + cross-product writeback.
- Standalone: audit can still run against an already-built product without discover.

## 11. Files touched

**Edit**
- `skills/discover/SKILL.md` — **re-order into tiers** (D0 frame → D1 triage →
  D2 demand smoke + pulse gate w/ re-frame-once guardrail → D3 deep hardening →
  D4 brief → Gate D); read `product:` block; note downstream audit.
- `skills/discover/references/reality-probe.md` — repurpose as the **D2 front-of-funnel
  smoke** + the re-frame-once-before-kill guardrail (was a late D3.5 probe).
- `templates/discover/hypothesis-brief.md` — add exit, wedge, exit-safe framing check,
  D2 pulse evidence, intended-surfaces fields.
- `skills/product-strategy/SKILL.md` — drop Part A; retarget Part B input; state it
  runs **before** validate and feeds its GTM; description frontmatter (no "evaluate").
- `commands/audit.md` — input wording + "feeds the validation sprint".
- `README.md` — the looped, tiered chain; drop `evaluate`; one coherent narrative +
  the closing loop.
- `templates/config.template.yaml` — comments only (product block now serves discover;
  reality_probe governs the smoke). No key changes.
- `scripts/lint.sh` — drop `commands/evaluate.md` from the `--complete` manifest.
- `.claude-plugin/plugin.json`, `marketplace.json` — descriptions reflect the
  tiered/looped chain; drop "evaluate" as a separate front-end.

**Delete**
- `commands/evaluate.md`

**Unchanged**
- `skills/product-strategy/reference/play-engine.md`
- `skills/discover/references/{red-team-personas,demand-intensity-rubric}.md`
- `templates/studio/*`, `.gitignore`

## 12. Where it lands (git)

Work on the existing **`feat/product-strategy` branch**; **update PR #2** from "add
product-strategy (evaluate + audit)" to "add audit + reconcile front-ends into a
demand-first tiered funnel." discover's re-tiering rides in PR #2 on top of merged
main. PR #1 already merged.

## 13. Verification

- `scripts/lint.sh --complete` → `lint OK` (manifest: no `evaluate`; has audit +
  product-strategy + discover files).
- `grep -rn '{{' skills/ commands/` → empty.
- IP scan clean (no `bartek`/`marzec`/handle/deck-title).
- No `evaluate` references remain anywhere (skills/commands/README/manifests/lint).
- discover SKILL phase order is D0→D1→D2→(pulse)→D3→D4→Gate D, with the reality probe
  as D2 (before the red-team), and the re-frame-once guardrail present.
- discover SKILL + brief cross-references resolve; the absorbed bits (exit, wedge,
  framing, surfaces) appear in both the SKILL and the brief template.
- audit SKILL/command state they precede validate and feed its GTM.

## 14. Out of scope / follow-ups

- Building `validate` (Plan 2) — its consumption of audit's asset/GTM is specified
  here, implemented later.
- Medium-tier discover/validate review findings (other spec §10) — unchanged.
- A standalone `/builderkit:smoke` or `/builderkit:triage` command — deliberately not
  added; both are discover tiers. Revisit only if users want to run them in isolation.
