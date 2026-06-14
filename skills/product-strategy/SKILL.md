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

### B3 — Tier P0 / P1 / P2 + complexity
P0 = the core loop doesn't work without it. P1 = deepens the loop / premium feel /
controlled growth. P2 = monetisation & growth after the loop is validated. Also rate each
item's **complexity 1–5** (1 = a copy/style tweak; 5 = multi-surface or architectural) —
ship routes items at/above `delivery.model_routing.complexity_threshold` to the stronger
model.

### B4 — Flag conflicts
Walk the flagging rules against the wedge and `product.sensitive_category`. Each
manipulation-adjacent or off-brand play → **use as-is / constrain (how) / skip (why).**
Mandatory, even if short. A **skip** verdict becomes a mechanical guardrail: that item
carries a non-empty `decline:` in the build plan, and the ship scope guard hard-blocks it
from ever entering a slice.

### B5 — Ranked build list + the DAG
The ordered "do this first" sequence (8–12 items). Then make the order *executable*: for
each item assign a short stable `id` and its `depends_on` edges (which items must merge
first). P0 core-loop items are the roots; P1/P2 hang off them. This DAG is what
`/builderkit:ship` waves through — a flat list forces ship to re-derive the graph.

### B6 — Wire the Insight Loop
Fill the metric → play table (engine reference) so every build-list item is measurable.

**Output (two files, kept in sync):**
1. `docs.specs_dir/<product>-play-audit.md` — the prose audit for humans (B1 weights →
   B2 maps → B4 flags → B5 build list → B6 metrics).
2. `docs.specs_dir/build-plan.yaml` — the machine-readable DAG from
   `${CLAUDE_PLUGIN_ROOT}/templates/audit/build-plan.template.yaml` (one item per
   build-list line: `id`, `tier`, `depends_on`, `complexity`, `surfaces`, `files_hint`,
   `metric`, and `decline` for B4 skips). Leave `scope_origin`/`delivers` for ship to
   reconcile after validate. This is the contract `/builderkit:ship` and the scope guard
   (`templates/delivery/scope-check.mjs`) read.

The build list's growth/landing plays feed `/builderkit:validate`'s conversion asset +
GTM; every item is ready to become a `/builderkit:ship <item>` run.

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
