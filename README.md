# LaunchThesis

**The validation tool that won't lie to you.** A real cold stranger must pay
before you build, the verdict is recomputed from your raw receipts, and an honest
**NO** is a first-class outcome. LaunchThesis gives you confidence on *what to
build* — and the cheaper, rarer confidence on *what **not** to build* — before you
sink weeks into the wrong app.

It runs one loop, in loops: **Refine → Research → Strategy → Validate**, with a
studio playbook that compounds across every idea you put through it. It stops at the
PASS boundary and hands off a validated thesis — it does **not** own your build,
your tests, or your tickets.

> **Why this exists:** read [the LaunchThesis manifesto](MANIFESTO.md).

## Who it's for

Burned indie builders — vibe coders who ship fast with AI builders (Claude Code,
Cursor, Lovable, v0, Bolt, Replit) and have already launched something that got no
users. The trigger isn't optimism, it's **a past loss**: you've felt the weeks
disappear into an app nobody wanted, and you don't want to do it again.

You're strong at *building* and rarely run disciplined validation. LaunchThesis does
the part you skip — the research and the un-gameable scoring — and asks you for only
the parts you're good at: the idea, the audience, and a quick landing page. Killing a
dead idea in a day *is* the product working.

What it will **not** do is soften the signal to make you feel good. Confidence is
worth nothing if the gate isn't real, so the honesty floor and "the builder is not
the scorer" stay non-negotiable.

## The loop: Refine → Research → Strategy → Validate

```
   Refine ──→ Research ──→ Strategy(GTM) ──→ Validate
  (idea       (market       (guerrilla       (cold
  refinement)  research)     plan + page)    pay-proof)
        │                                       │
        └──── ITERATE (re-frame / re-channel / ─┘
                       re-cut the wedge)
                          │
              PASS → Validated Launch Thesis (hand off)
              NO-GO → recorded, cheap
                          │
                 Studio playbook compounds
```

The thesis is one sentence — *"this ICP will pay this much for this wedge"* — and the
loop's job is to make that sentence true or kill it cheap. Each pass ends in a verdict:
**GO / NO-GO / ITERATE**.

- **`/launchthesis:discover <seed>`** — Refine + Research. Frames the concept, sharpens
  the ICP and candidate wedge (D0–D1 triage, which can NO-GO in minutes), then on a
  demand pulse fans out the symmetric need assessment, demand-intensity, WTP, and
  red-team research *itself* and **names the wedge**. Output: a versioned **Launch
  Thesis** + the named wedge.
- **`/launchthesis:strategy [scope]`** — the GTM + conversion step that **arms the
  sprint**. Weights strategy families, maps and tiers the plays onto your surfaces,
  flags the plays the brand should decline (brand safety), and briefs the conversion
  page. It is a GTM/conversion planner, **not** a build planner.
- **`/launchthesis:validate [brief|poll|report]`** — the 48-hour guerrilla sprint that
  gates on real cold-stranger pay-proof. The kit ships the measurement plumbing + the
  page brief; **you vibe-code the actual page** (your strength) and post from your own
  accounts. It polls and recomputes the verdict from the raw rows with `gate-eval.mjs`
  — so the builder is not the scorer.
- **`/launchthesis:setup`** — run once per project. Detects your stack and writes
  `.launchthesis/config.yaml`. **No app required** — if you only have an idea, setup
  writes an app-free config and points you at `/launchthesis:discover <seed>`.

## The named, versioned wedge

The wedge is the subject of the thesis, so it's a **versioned, first-class object**,
not a flat string. `discover` emits a `candidate` wedge at triage and promotes it to
`named` when it states the wedge explicitly; `validate` sets it to `validated` on a
cold pay-proof (or `refuted` when a FAIL is attributable to the *position* itself —
which bumps the version and returns the loop to Research to harden a new cut). The full
versioned object and its history live in the Launch Thesis brief; the current one-liner
mirrors into `product.positioning`.

## Strategy: GTM + conversion, not a build plan

`/launchthesis:strategy` runs after a concept clears discover and **before** the
validation sprint. It weights the strategy families for the product, maps
product-design plays onto its surfaces, tiers them, **flags the plays the brand should
decline** (manipulation-adjacent or off-brand — mandatory, especially when
`product.sensitive_category` is true), and wires the plays to metrics. The output is a
**GTM + conversion strategy doc that arms the validate sprint** — there is no build
plan and no build DAG.

The module is **self-sufficient**: it ships a complete built-in pattern library, the
strategy/metric tables, the flagging rules, and the method in
`skills/product-strategy/reference/play-engine.md` (general product-design practice,
stack-agnostic). `product.playbook_ref` is an **optional override** pointing at a deck
you license and keep *outside* the plugin; leave it empty and the built-in engine runs
the full strategy on its own.

## What a validate sprint actually costs

The honesty floor is non-negotiable, so a PASS-capable run is real work. The `≤ $50`
is the ad/outreach cap only. A run also needs your unpriced founder-hours (build the
page, the prospect list, the posts) and a **LIVE-mode** Stripe account — sandbox
pay-proofs are rejected as NOT-MEASURABLE — plus a data store + deploy host. Most
honest first sprints land INCONCLUSIVE / no-PASS: that means the channel under-delivered
audience, not that the idea failed. The advertised "25 lands" is the INCONCLUSIVE floor;
aim for ~100–200 cold lands.

## The payoff on PASS: an AI-builder handoff

A GO emits a **Validated Launch Thesis handoff** — the artifact you paste straight into
your AI builder. Not a ship handoff: LaunchThesis stops at proven demand. The handoff
carries the verdict + confidence (the gate counts that earned the GO), the validated
thesis and wedge, **build this** (one entry per deliverable the converting page actually
sold payers, each with acceptance criteria, the price, and the first-access deadline),
**do NOT build this** (unvalidated extras + the declined plays the build must respect),
who converted and the channels that worked, and the metric→play wiring so the app is
measurable from day one. A paste-ready **build prompt** is generated from it:

```
Build a [stack] app for [ICP] that [validated wedge].
Scope (the market paid for exactly this):
  - <deliverable> — acceptance: <criteria>
  …
Do NOT build: <unvalidated extras>. Must respect: <declined plays>.
Reach users via: <winning channels>. Wire analytics for: <metrics>.
First access promised by: <deadline>.
```

A NO-GO returns the disconfirming evidence + the cheapest adjacent wedge to try.

## The studio playbook compounds

Every run — kills included — appends to a cross-product studio playbook
(`.launchthesis/studio/`): wedge-patterns → conversion, channel and panel priors,
aggregate only, no PII. So each new idea you put through the loop starts smarter than
the last.

## How it's distributed

**Plugin today.** LaunchThesis is a Claude Code plugin and runs entirely from your
terminal. A managed **SaaS** is a future, evidence-gated path: it isn't built until a
real cold pay-proof on a SaaS-shaped offer clears Gate V — exactly what LaunchThesis
would tell any founder to do, so it is what LaunchThesis does to itself.

See **[LaunchThesis run on itself](docs/plans/2026-06-17-launchthesis-self-application.md)**
— the recursive dogfood: we pointed the validation tool at the validation tool.

## Install

Add the marketplace and install the plugin:

```
/plugin marketplace add malikriv/Launch_Thesis
/plugin install launchthesis@launchthesis
```

To pin LaunchThesis for a whole team, add it to the project's `.claude/settings.json`
instead so every clone picks it up automatically:

```json
{
  "extraKnownMarketplaces": {
    "launchthesis": { "source": { "source": "github", "repo": "malikriv/Launch_Thesis" } }
  },
  "enabledPlugins": { "launchthesis@launchthesis": true }
}
```

## Quickstart

1. Run `/launchthesis:setup` once per project. It detects your stack and writes
   `.launchthesis/config.yaml`. No app required — point it at an idea and it writes an
   app-free config.
2. Run `/launchthesis:discover <seed>` to refine + research the idea into a versioned
   **Launch Thesis** with a named wedge (or a cheap NO-GO).
3. Run `/launchthesis:strategy` to arm the sprint with a GTM + conversion plan.
4. Run `/launchthesis:validate` to run the 48h guerrilla sprint and recompute the
   verdict from raw cold-pay receipts. On a GO, paste the handoff's build prompt into
   your AI builder.

Lost at any point? Run `/launchthesis:status` for a read-only "you are here" — the stages
you've finished, your current wedge, where every file landed, and the one command to run
next.

## Commands

| Command | What it does |
| --- | --- |
| `/launchthesis:setup` | Detect stack, write `.launchthesis/config.yaml`. No app required — an idea is enough. |
| `/launchthesis:discover <seed>` | Refine + Research: frame → triage (can NO-GO fast) → demand pulse → red-team hardening → versioned **Launch Thesis** + named wedge. |
| `/launchthesis:strategy [scope]` | GTM + conversion strategy that arms the sprint: weight families → map/tier plays → flag declined plays → wire metrics. Not a build planner. |
| `/launchthesis:validate [brief\|poll\|report]` | 48h guerrilla sprint: freeze Gate V → GTM → conversion brief (you build the page) → launch → recompute the verdict from raw rows. On GO, emit the AI-builder handoff. |
| `/launchthesis:status [slug]` | Read-only "you are here": completed stages, the current wedge, your latest artifacts + their paths, any open sprint, and the one command to run next. |

New to the vocabulary — *wedge, pulse, Gate D/V, cold-weight fraction, pay-proof*? See the
[glossary](skills/shared/glossary.md).

## Configuration

Written by `/launchthesis:setup`, read by every skill at start, and overridden by the
project's `CLAUDE.md` where they conflict.

```yaml
# LaunchThesis per-project config — written by /launchthesis:setup, read by every
# launchthesis skill at start. Repo CLAUDE.md overrides this file where they conflict.
config_version: 1

project:
  name: {{PROJECT_NAME}}
  stack: {{STACK}}            # the AI builder / runtime the validated app will ship on (or "")

docs:
  specs_dir: {{SPECS_DIR}}    # spec docs home, e.g. docs/specs/
  design_dirs: []             # optional: where design references live

product:                      # read by discover (frame/exit/positioning) + strategy
  positioning: {{POSITIONING}}        # CURRENT wedge one-liner (mirror of thesis wedge in play)
  exit_strategy: {{EXIT_STRATEGY}}    # stated exit, keeps framing/claims safe (or "none")
  sensitive_category: {{SENSITIVE}}   # true → strategy flags manipulative plays harder
  surfaces: []                        # optional: screens the strategy step maps plays onto
  playbook_ref: {{PLAYBOOK_REF}}      # OPTIONAL override only — engine is self-sufficient; leave empty

modules:
  discover: true              # refine + research (idea → named, hardened wedge)
  product: true               # strategy: GTM + conversion plays that arm the sprint
  validate: true              # 48h cold-pay-proof guerrilla sprint
  studio: true                # cross-product playbook
# (the discover:, validate:, and studio: sections follow in the generated config — see templates/config.template.yaml)
```

## Extending

LaunchThesis is modular. A future module is just a new skill directory under `skills/`,
a matching command under `commands/`, and its own section in the config. The studio
playbook is the improvement loop: projects learn, the kit gets sharper.
