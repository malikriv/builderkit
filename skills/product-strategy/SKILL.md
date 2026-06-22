---
name: product-strategy
description: >
  LaunchThesis Strategy module: turn a pulse-confirmed Launch Thesis into the GTM +
  conversion strategy that ARMS the validation sprint, plus a brand-safety pass. The
  Strategy pass — weight the 12 strategy families, map product/growth plays onto the
  product's surfaces, flag the plays the brand should decline, and wire plays to metrics
  (Insight Loop). Runs AFTER /launchthesis:discover and BEFORE the /launchthesis:validate
  sprint, feeding that sprint's conversion asset + GTM. Reads .launchthesis/config.yaml
  (`product:` block); optional licensed deck via product.playbook_ref. Use via
  /launchthesis:strategy, or when the user asks "how do I take this to market", "what's my
  first-100 channel", or wants a strategy / brand-safety pass.
---

# /product-strategy — the Strategy pass (GTM + conversion plays)

`/launchthesis:discover` decides whether an idea has a real market pulse and names a
hardened wedge. This module decides *how that wedge goes to market* — which strategy
families matter, which conversion/growth plays go on which surfaces, and *which plays the
brand should decline* — then hands the conversion asset + GTM into `/launchthesis:validate`
so the cold-pay-proof sprint runs against an audited, high-converting asset. It is a GTM +
conversion strategist, **not** a build planner: it produces a strategy doc that arms the
sprint, not a ranked build list or a DAG. The build is the user's downstream concern.

It runs **after Gate D (a hardened, pulse-confirmed Launch Thesis) and before the real
validation sprint**, so the 48h sprint tests an audited, high-converting asset — not a
sandbagged one. It also runs standalone against an already-built product's surfaces.

**Config first.** Read `.launchthesis/config.yaml` before running. Reads the `product:`
block (`positioning`, `exit_strategy`, `sensitive_category`, `surfaces`, `playbook_ref`)
and writes to `docs.specs_dir`. If the `product:` block is missing, self-provision it (see
"Provisioning"). `CLAUDE.md` overrides this skill where they conflict.

**Engine.** Self-sufficient — ships the full pattern library, strategy/metric tables,
flagging rules, and method in
`${CLAUDE_PLUGIN_ROOT}/skills/product-strategy/reference/play-engine.md`. Read it first.
`product.playbook_ref` is an OPTIONAL override pointing at a deck the user licenses and
keeps OUTSIDE the plugin; the engine runs fully without it.

## Operating rules

- **Honest, on-brand.** Declining manipulation-adjacent / off-brand plays is a core
  deliverable; write down WHY — especially when `product.sensitive_category` is true. These
  declined plays become guardrails the validate sprint (and any later build) must respect.
- **Distribution drives priority.** The first-100-users channel (from the discover thesis's
  founder-access + the named wedge) determines which growth/sharing plays lead.
- **Exit-aligned.** Names, claims, and plays must be safe for `product.exit_strategy`.
- **Write it down.** The strategy lands as a doc in `docs.specs_dir`; `/launchthesis:validate`
  reads docs, not chat.
- **Communicate** per `${CLAUDE_PLUGIN_ROOT}/skills/shared/communication.md`: emit a
  `Strategy · B<n>` breadcrumb as you enter each step, gloss first-use jargon from
  `${CLAUDE_PLUGIN_ROOT}/skills/shared/glossary.md`, and end with the signpost footer (the
  strategy-doc path + the next command, `→ /launchthesis:validate`).

## Input

- The `/launchthesis:discover` **Launch Thesis** (its intended-surfaces sketch + the named,
  hardened wedge + stated exit) for a pulse-confirmed concept, OR
- an existing product's surfaces (standalone strategy pass).

## The Strategy pass — arm the sprint

### B1 — Weight the strategies
Score the 12 strategy families Critical / High / Medium / Later for THIS product using the
weighting rubric in the engine reference; one-line rationale each. Don't treat them equally.

### B2 — Map plays to surfaces
For each surface (`product.surfaces`, the thesis's surfaces sketch, or the repo) list which
plays apply and write a concrete "where it goes." Credit plays the product already implements
so they aren't re-proposed. The conversion/landing surface gets special attention — its plays
become the validate sprint's converting-page brief.

### B4 — Flag conflicts (brand safety, mandatory)
Walk the flagging rules against the wedge and `product.sensitive_category`. Each
manipulation-adjacent or off-brand play → **use as-is / constrain (how) / skip (why).**
Mandatory, even if short. A **skip** verdict is a brand-safety guardrail: it carries forward
as a declined play the validation sprint's copy must respect, and feeds the handoff's "do NOT
build / must respect" block on a PASS.

### B6 — Wire the Insight Loop
Fill the metric → play table (engine reference) so every play in the strategy is measurable —
this is the metric→play wiring the converting page and the eventual app instrument from day one.

### Priority (GTM/feature priority for the sprint — prose, not a DAG)
Close with a light ordered "do this first" sequence: which growth/landing plays the sprint
leads with, and which deepen the loop after the first signal. This is GTM/feature priority for
the validation sprint, **not** a ship DAG and **not** a binding scope contract — order plays by
what earns the first cold pay-proof fastest.

**Output (one strategy doc, prose):**
`docs.specs_dir/<slug>-strategy.md` — the Strategy pass for humans, in order: B1 weights →
B2 surface maps → B4 brand-safety flags → priority sequence → B6 metric wiring.

The strategy's growth/landing plays + the discover wedge feed `/launchthesis:validate`'s
conversion asset + GTM; the declined plays from B4 become the sprint's brand-safety guardrails.

**Close the run** (communication §2): print the signpost footer — echo the strategy-doc path
(`<docs.specs_dir>/<slug>-strategy.md`), note the declined plays carried forward as
guardrails, and name the single next command: `→ /launchthesis:validate`.

### Insight Loop (metric-first; the closing loop)
When a live loop isn't moving, or to make a strategy measurable: pick ONE metric → read that
family's analysis lens (engine reference) → match to the play that kills the friction → build +
ship that one play via your own build workflow, then re-measure — never batch. Outcomes write
back to the studio playbook so the next product starts smarter.

## Handoff

discover (named, hardened wedge) → **strategy (this)** → validate (cold-pay-proof on the
strategy-armed asset) → on PASS, validate emits the AI-builder handoff. The strategy's
conversion/growth plays arm the validate sprint's asset + GTM; the declined plays become its
brand-safety guardrails. The build itself is the user's downstream concern.

## Provisioning (`product:` config block)

If the block is missing/empty when strategy runs, capture it first (idempotent, like
`/launchthesis:setup`) — self-provision on the first `/launchthesis:strategy`. One
consolidated question for: `positioning` (one-line wedge), `exit_strategy` (or "none"),
`sensitive_category` (true/false), `surfaces` (optional), `playbook_ref` (optional — leave
empty; the engine is self-sufficient). Write under `product:` in `.launchthesis/config.yaml`
and set `modules.product: true`. Never overwrite an existing block without showing a diff first.
