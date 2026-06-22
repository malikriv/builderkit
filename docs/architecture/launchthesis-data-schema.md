# LaunchThesis — portable data schema

**Status:** authoritative reference (promoted from the refocus scope doc).
**Last reviewed:** 2026-06-17.
**Source of truth for:** the entity shapes, the persistence mapping, and the two
cross-cutting invariants that every distribution adapter must honor.

> Promoted from `docs/plans/2026-06-17-launchthesis-refocus-scope.md`
> (sections *"Distribution-agnostic architecture (SaaS or plugin)"* and
> *"The portable data schema (one shape, two stores)"*). That doc owns the
> *why* of the refocus; this doc owns the *contract*. Where the scope prose and
> the shipped templates differ, **the shipped templates win** and this doc
> follows them — see the field tables, each of which cites the file it mirrors.

---

## 1. Purpose

LaunchThesis is a demand-validation studio whose distribution is deliberately
undecided: the same **portable core** must power either the Claude Code plugin
(today) or a hosted SaaS (later). The promise that makes deferral cheap is
*"same schema, two stores"* — every entity below is persistence-agnostic. In the
plugin it maps to a file (YAML/Markdown under `.launchthesis/`); in SaaS it maps
to a table. Nothing in the core imports anything distribution-specific.

This reference exists so a future SaaS implementer or a plugin maintainer can
build against one written-down schema instead of reverse-engineering it from the
YAML/Markdown templates. It defines:

- the **nine entities**, their fields, and their plugin-file ↔ SaaS-table mapping;
- the **two hard invariants** (PII boundary, determinism boundary);
- the **relationships** between entities;
- the **connector capability interface** the adapters implement; and
- **why the schema shape is the distribution strategy** (the moat + the loop router).

### Three layers (context for where this schema sits)

The schema is the persistence contract for layer 2's output and layer 3's state:

1. **Methodology** — portable prose (gates, rubrics, red-team personas, the
   guerrilla playbook, the honesty floor, the wedge state machine). Runtime-agnostic.
2. **Deterministic core** — portable code: `gate-eval.mjs` / `gate-run.mjs`
   (predicate building, lands derivation, cohort weighting). Pure functions: data
   in, `verdict` out. Same code in plugin (node) and SaaS (scoring endpoint).
3. **Adapters** — everything that differs: orchestration, **persistence/state**
   (files vs. DB rows — *this schema*), connectors, identity/tenancy, and playbook
   scope (local vs. cross-user).

---

## 2. The two hard invariants

These two boundaries cut across **every** entity and hold identically in both
stores. They are the load-bearing rules; an adapter that violates either is wrong.

### 2.1 The PII boundary

> `event` rows carry contact PII and are **project-scoped**. They never flow to
> the cross-project playbook. Only PII-stripped aggregates are eligible to be shared.

- The `event` entity is the **only** entity that holds contact PII (`email`,
  `contact`). It lives in the project's own `validate.data` store under
  `.launchthesis/` (plugin) or a tenant-scoped `events` table (SaaS).
- `playbook_entry` is defined to carry **no PII** — only aggregate patterns
  (`cold_land_to_pay_rate`, `runs`, an `icp_type` bucket). This is enforced by the
  shipped `templates/studio/playbook.md` header: *"Never store raw emails or
  per-user rows here (PII lives in the project's validate.data store)."*
- Consequence: a `playbook_entry` with `scope: cross_user` is safe to share
  *because* the PII boundary keeps `event` rows out. There is no path by which one
  user's contacts reach another user. (See §5 for the k-anonymity gate that guards
  promotion to `cross_user`.)

### 2.2 The determinism boundary

> `verdict` is always **recomputed** from `event` rows by the deterministic core
> (`gate-eval` / `gate-run`). It is never authored, edited, or hand-written.

- The scorer is `templates/landing/gate-eval.mjs::evaluateGate(input, predicates)`
  — a pure function with no I/O, no `Date`, no randomness. The caller passes the
  window + rows; the function returns the verdict object.
- "**The builder is not the scorer.**" The same raw rows + frozen predicates must
  reproduce the same verdict for a human, a second agent, or the SaaS scoring
  endpoint. A `verdict` recorded without its counted rows is a defect.
- The predicates are **frozen at sprint V0** (`predicates_hash` on the `sprint`
  entity); changing them after the window opens invalidates the run. `buildPredicates`
  (`gate-run.mjs`) derives them deterministically from the gate config + the D2 price.
- Consequence: validation is un-gameable in *both* distributions, for free —
  the `.mjs` evaluators are already pure libraries, so the honesty floor ports to
  SaaS with zero changes.

---

## 3. The nine entities

Each entity below lists a one-line purpose, its field list (grounded in the
shipped template it mirrors), its **plugin file**, and its **SaaS table**.

> **Vocabulary note — field names.** The shipped capture/store templates are
> canonical. Where the scope doc abstracted a field name, the shipped name is used
> here and the scope alias is noted:
> - `event.tier` (shipped) = the scope doc's `type`.
> - `event.source` (shipped) = the scope doc's `src`.
>
> **Vocabulary note — verdict outcomes.** The deterministic core
> (`gate-eval.mjs`) emits the engine vocabulary `PASS | FAIL | INCONCLUSIVE |
> NOT-MEASURABLE`. The product/loop vocabulary in the scope doc and handoff is
> `GO | NO-GO | ITERATE | NOT-MEASURABLE`. They map 1:1 — `PASS→GO`, `FAIL→NO-GO`,
> `INCONCLUSIVE→ITERATE` — and `validation-report.md` is where the engine verdict
> is rendered into the product verdict. Both are documented on the `verdict` entity.

### 3.1 `project`

One-line purpose: the top-level container for everything about one product/concept
the user is validating; carries the safety/positioning framing the whole loop reads.

| Field | Notes |
|---|---|
| `id` | project identity |
| `name` | product/project name |
| `positioning` | **current** wedge one-liner — a mirror of the in-play `wedge.statement`; kept a plain string for back-compat |
| `exit_strategy` | stated exit (or `"none"`); keeps framing/claims safe |
| `sensitive_category` | bool; `true` → strategy flags manipulative plays harder |
| `surfaces[]` | optional screens the strategy step maps plays onto |
| `playbook_ref` | optional override pointer to a playbook |

- **Plugin file:** `.launchthesis/config.yaml` (the `product:` block).
- **SaaS table:** `projects` (+ a `user_id` tenancy column).

### 3.2 `thesis`

One-line purpose: the falsifiable Launch Thesis for one concept slug —
*"this ICP will pay this much for this wedge"*; the living source-of-truth doc.

| Field | Notes |
|---|---|
| `id` | thesis identity |
| `project_id` | FK → `project` |
| `slug` | concept slug; the run/row key |
| `statement` | the one-sentence thesis |
| `icp` | sharp ICP / population (not "everyone") |
| `archetype` | `acute-B2B \| prosumer \| consumer \| marketplace` |
| `why_now` | timing/intensity rationale |
| `alternatives[]` | existing workarounds / competitors |
| `status` | thesis lifecycle (drafted → validated/refuted via Gate V) |

- **Plugin file:** `<docs.specs_dir>/YYYY-MM-DD-<slug>-launch-thesis.md`
  (template: `templates/discover/launch-thesis.md`).
- **SaaS table:** `theses`.

### 3.3 `wedge` (versioned)

One-line purpose: the differentiated position that is the *subject* of the thesis —
a first-class, **versioned** object with an explicit refinement path, not a flat string.

Canonical object shape ships in `templates/discover/launch-thesis.md` (the `## Wedge`
section, a fenced `wedge:` YAML block + history table):

| Field | Notes |
|---|---|
| `thesis_id` | FK → `thesis` (the wedge belongs to a thesis) |
| `version` | integer; bumped on each re-cut |
| `statement` | one-line differentiated position an incumbent would avoid copying |
| `status` | `candidate → named → validated \| refuted` (state machine below) |
| `refuted_by` | set only on a refuted version; the attributable reason |
| `history[]` | prior `{version, statement, status, refuted_by?, date}` entries |

**Status state machine:**

- **candidate** — drafted at Refine (discover D1 triage). Differentiated enough to
  pass D1, not yet hardened.
- **named** — Research/D3 states it explicitly and writes it (brief + the
  `project.positioning` mirror). This is the wedge that arms Strategy + Validate.
- **validated** — Gate V `PASS`/`GO`: a cold payer bought the offer expressing this wedge.
- **refuted** — Gate V `FAIL`/`NO-GO` attributable to the *position* (not thin
  traffic, not weak copy → `fail_attribution: wedge_refuted`). Bumps `version`, sets
  the prior to `refuted` with a `refuted_by`, and returns the loop to Research (D3)
  to harden a new cut. Bounded by `studio.max_concept_cycles`.

- **Plugin file:** the `## Wedge` table/block inside the thesis doc
  (`…-launch-thesis.md`), plus the `product.positioning` mirror in config.
- **SaaS table:** `wedge_versions`.

### 3.4 `strategy`

One-line purpose: the GTM + conversion strategy that arms the validate sprint —
weighted play families, plays mapped to surfaces, declined plays, and metric wiring.
(This is the reframed ex-`audit`; it is **not** a build planner.)

| Field | Notes |
|---|---|
| `id` | strategy identity |
| `thesis_id` | FK → `thesis` |
| `plays[]` | each: `{name, surface, tier, metric, decline?}` |
| `primary_channel` | the first-100 / primary acquisition channel |

- A `play` with `decline: true` (or in a declined list) is a brand-safety guardrail
  that the handoff's "Do NOT build / must respect" block carries forward.
- **Plugin file:** `<docs.specs_dir>/…-strategy.md`.
- **SaaS table:** `strategies` (+ a `plays` child table).

### 3.5 `sprint`

One-line purpose: one guerrilla validation run against a specific wedge version —
the window, the wired connectors, the channels posted, and the frozen predicates.

| Field | Notes |
|---|---|
| `id` | sprint identity |
| `thesis_id` | FK → `thesis` |
| `wedge_version` | which `wedge.version` this sprint tests |
| `window_start` / `window_end` | sprint clock (starts at first qualified impression) |
| `connectors{}` | the deploy/data/payments connectors wired for this run (see §6) |
| `channels_posted[]` | where the tracked links were posted |
| `last_event_cursor` | polling cursor into the event store |
| `tier_counts{}` | running per-tier tallies |
| `predicates_hash` | hash of the predicates **frozen at V0** (determinism anchor) |
| `status` | sprint lifecycle (open → closed) |

- **Plugin file:** `studio/sprints/<slug>.yaml`.
- **SaaS table:** `sprints`.

### 3.6 `event` *(PII — the only PII entity)*

One-line purpose: one captured signal from a real person during a sprint — the raw
material the deterministic core scores. **Project-scoped; never leaves the project.**

Canonical shape ships in `templates/landing/capture.js` (client body) +
`templates/landing/schema.sql` (`launchthesis_events`) and is consumed verbatim by
`gate-eval.mjs`:

| Field | Notes |
|---|---|
| `id` | event identity |
| `sprint_id` | FK → `sprint` (project/sprint scope) |
| `ts` | timestamp (`timestamptz`, default now) |
| `tier` *(scope alias `type`)* | `land \| signup \| activation \| payment \| loi \| scarce_action \| intent_click` |
| `cohort` | `cold_public \| warm_dm \| friend \| unverifiable` (derived from the tracked link `?src=`) |
| `live` | bool; `true` **only** after a confirmed live authorization — a mis-wired page degrades to a soft signal, never a fabricated `live:true` |
| `amount` | numeric; payment authorized/charged amount, else `0` |
| `session` | per-tab `sessionStorage` id (cookieless) |
| `source` *(scope alias `src`)* | tracked-link / channel tag (UTM) |
| `email` / `contact` | **PII** — contact (nullable) |
| `is_founder` | bool; founder/known-contact rows are re-flagged at ingestion (V3) and excluded from scoring |
| `dedupe_key` | derived `coalesce(lower(email),'session:'||session)||':'||tier`; `unique` → idempotency (first signal wins) |

Scoring rules the core applies to these rows (for implementer context):

- `land` and `intent_click` **never** count as conversions. `land` rows feed the
  exposure denominator (`deriveLands`); conversion tiers are
  `signup \| activation \| payment \| loi \| scarce_action`.
- Hard pay-proof tiers are `payment \| loi \| scarce_action`. A hard pay-proof
  counts only with `live: true` and `amount ≥ min_amount`
  (= `min_pct_of_price%` × the D2 price).
- Founder rows (`is_founder: true`) are excluded from all counts.

- **Plugin file:** the project's `validate.data` store (e.g. the
  `launchthesis_events` table behind the capture connector under `.launchthesis/`).
- **SaaS table:** `events` (tenant-scoped).

### 3.7 `verdict` *(never authored — always recomputed)*

One-line purpose: the deterministic outcome of a sprint, recomputed from `event`
rows by `gate-eval.mjs`; the single object that routes the whole loop.

Canonical shape is the return of `evaluateGate` in `templates/landing/gate-eval.mjs`,
rendered into `templates/validate/validation-report.md`:

| Field | Notes |
|---|---|
| `sprint_id` | FK → `sprint` (1:1) |
| `outcome` | **engine:** `PASS \| FAIL \| INCONCLUSIVE \| NOT-MEASURABLE`; **product:** `GO \| NO-GO \| ITERATE \| NOT-MEASURABLE` (1:1 map, see vocab note) |
| `reason` | human-readable explanation of the outcome |
| `lands` | in-window, non-founder, deduped qualified lands (exposure denominator) |
| `cold_weight_fraction` | weighted share of counted signal from `cold_public` |
| `friend_share` | weighted share from `friend` cohort (guarded by `max_friend_share`) |
| `hard_pay_proofs` / `has_cold_hard_pay_proof` | whether a cold, live, ≥min_amount hard pay-proof exists |
| `counted_users` | deduped non-founder conversion-tier users |
| `confidence` | `low \| medium \| high` — derived from sample size + cohort quality + measurability |
| `recommended_action` | the **loop router** — see §5.2: `handoff \| re-channel \| copy-variant \| wedge-recut \| kill` |
| `counted_rows[]` | the exact rows that produced the verdict (reproducibility — required) |

Outcome semantics:

- `NOT-MEASURABLE` — instrumentation defect (analytics not firing, or a pay-proof
  present only in test/sandbox mode). Neither a pass nor a normal fail; fix and re-run.
- `INCONCLUSIVE` / `ITERATE` — qualified lands below the exposure floor: the
  *channel*, not the product, failed (`fail_attribution: channel_thin`).
- `FAIL` / `NO-GO` — a real fail. The `fail_attribution`
  (`copy_weak` vs `wedge_refuted`) decides copy-variant vs wedge-recut.
- `PASS` / `GO` — exposure met, floor met, cold-weighted, with a cold hard pay-proof.

- **Plugin file:** captured in `<docs.specs_dir>/…-validation.md`
  (`templates/validate/validation-report.md`).
- **SaaS table:** `verdicts`.

### 3.8 `handoff` *(GO-only)*

One-line purpose: the AI-builder-ready build brief — the product's payoff, emitted
**only on a `GO`**; the artifact the vibe coder pastes into their builder.

Canonical shape ships in `templates/validate/handoff.md` (six blocks + a paste-ready
build prompt):

| Field | Notes |
|---|---|
| `thesis_id` | FK → `thesis` |
| `sprint_id` | FK → `sprint` (the GO sprint) |
| `validated_wedge` | the wedge `{version, statement, status: validated}` |
| `sold_scope{}` | one entry per deliverable the converting page promised payers, each with acceptance criteria; + `price`, `paid_cohort_count`, `first_access_deadline` (retained "what was sold" shape — **guidance, not a scope-guard contract**) |
| `icp` | who the build is for |
| `winning_channels[]` | the channels that actually converted |
| `declined_plays[]` | brand-safety guardrails the build must respect |
| `metrics[]` | the metric→play wiring (measurable from day one) |
| `out_of_scope[]` | unvalidated extras the market did **not** pay for |
| `build_prompt` | a single paste-ready block generated from the blocks above |

- **Plugin file:** `<docs.specs_dir>/…-handoff.md` (prose + a fenced data block).
- **SaaS table:** `handoffs` (served via an export / "send to builder" endpoint).

### 3.9 `playbook_entry` *(no PII)*

One-line purpose: a cross-product, **aggregate-only** prior (a pattern → conversion
rate) that compounds across runs; the compounding memory of the studio.

Canonical shape ships in `templates/studio/playbook.md` (the ledger tables):

| Field | Notes |
|---|---|
| `scope` | `local \| cross_user` — local per-user priors, or anonymized shared priors (SaaS) |
| `kind` | which ledger: wedge-pattern / GTM-tactic / landing-pattern / panel-vs-outcome / community-standing |
| `pattern` | the cross-product shape (NOT a product's wording, NOT any PII) |
| `icp_type` | ICP bucket |
| `status` | `hypothesis (n=1)` → `supported (n ≥ studio.promote_after_k, ≥2 distinct ICPs)` |
| `runs` | sample count |
| `cold_land_to_pay_rate` | the aggregate conversion metric |

- Priors are **advisory** and can NEVER auto-fail a gate; down-weight entries older
  than ~90 days. Losers (`refuted` patterns) are logged exactly like winners — a
  consistently-failing pattern is as valuable a prior as a winning one.
- **Plugin file:** `studio/playbook.md`.
- **SaaS table:** `playbook_entries`.

---

## 4. Relationships

```
                         ┌────────────┐
                         │  project   │  .launchthesis/config.yaml  |  projects
                         └─────┬──────┘
                               │ 1
                               │
                               * (one per concept slug)
                         ┌─────┴──────┐
                         │   thesis   │  …-launch-thesis.md         |  theses
                         └──┬───┬───┬─┘
              1 *  ┌────────┘   │   └────────┐ 1 *
                  │            │ 1            │
       ┌──────────┴──┐        │              ├──────────────┐
       │    wedge    │        │ 1            │              │
       │ (versioned) │        │              │              │
       │ wedge_versions       │              │              │
       └─────────────┘  ┌─────┴────┐    ┌────┴─────┐        │ 1 (per thesis)
                        │ strategy │    │  sprint  │   ┌────┴───────────┐
                        │strategies│    │ sprints  │   │  playbook_entry │
                        │ + plays  │    └──┬────┬──┘   │ (aggregate)     │
                        └──────────┘     1 │    │ 1    │ playbook_entries│
                                          │    │       └────────────────┘
                                  ┌───────┘    └────────┐        ▲
                                  * (PII)               1        │ aggregates across
                            ┌─────┴─────┐         ┌─────┴────┐   │ theses + projects
                            │   event   │ ──────▶ │ verdict  │   │ (no PII; §5)
                            │  events   │ recompute│ verdicts │  │
                            │  (PII)    │ (core)  └─────┬────┘   │
                            └───────────┘               │ 1      │
                                                        │ (GO only)
                                                  ┌─────┴────┐    │
                                                  │ handoff  │────┘
                                                  │ handoffs │
                                                  └──────────┘
```

In words:

- `project 1—* thesis 1—* wedge` — a project holds many theses; a thesis owns a
  versioned wedge lineage.
- `thesis 1—* sprint 1—* event` — a thesis runs many sprints; each sprint captures
  many events.
- `thesis 1—1 strategy` — each thesis has one GTM/conversion strategy arming its sprints.
- `sprint 1—1 verdict` — each sprint produces exactly one verdict, **recomputed** from
  its events by the deterministic core (never authored).
- GO `verdict 1—1 handoff` — a `GO`/`PASS` verdict produces exactly one handoff;
  non-GO verdicts produce none.
- `playbook_entry` **aggregates across** theses and projects — it is fed by outcomes
  but holds no FK to any single thesis/event (that is what keeps it PII-free and
  shareable).

---

## 5. Why the schema shape is the distribution strategy

The schema is not incidental to the SaaS-vs-plugin question — two of its properties
*are* the strategy.

### 5.1 The `cross_user` playbook is the SaaS moat

- The moat is exactly the `playbook_entry` rows with `scope: cross_user` — every
  user's validation outcomes compounding into shared priors (a real network effect).
- It is **safe to share** only because of the PII boundary (§2.1): `event` rows never
  leave the project, so a cross-user prior can carry a pattern + a rate but never a
  person.
- Promotion to `cross_user` is gated by **k-anonymity**: a pattern is promoted only
  after it clears a threshold of **≥ K distinct projects**, so no single user's data
  is identifiable in the shared prior.
- This is a pure **adapter-level** upgrade: the core loop does not change to gain it.
  The plugin runs `scope: local` priors; SaaS adds the `cross_user` tier on top of the
  identical schema. This is the one feature that genuinely *wants* SaaS — and it costs
  the plugin nothing to leave the door open.

### 5.2 `verdict.recommended_action` is the loop router

One field on `verdict` drives the entire loop in either runtime:

| `recommended_action` | Trigger | Loop move |
|---|---|---|
| `handoff` | `GO` / `PASS` | emit the handoff; stop at proven demand |
| `re-channel` | `INCONCLUSIVE` / `ITERATE` (lands below exposure floor, `channel_thin`) | re-post on a stronger channel; same wedge, same copy |
| `copy-variant` | `FAIL` attributable to copy (`copy_weak`) | run an offer/copy variant; same wedge |
| `wedge-recut` | `FAIL` attributable to the position (`wedge_refuted`), traffic floor met | bump `wedge.version`, mark prior `refuted`, return to Research (D3) |
| `kill` | exhausted iterations / structural NO-GO | record the cheap kill as a win ("what not to build") |

Every loop ends in a verdict, never a vibe. Because the verdict is recomputed
deterministically (§2.2) and routes via this one field, the loop behaves identically
whether driven by Claude Code skills (plugin) or an agent loop on the Anthropic API (SaaS).

---

## 6. The connector capability interface

Persistence is "same schema, two stores"; the *side-effecting* operations (publish a
page, store/read events, take a payment hold) are abstracted behind a small
**capability interface**. The plugin satisfies it with the user's declared MCP
connectors (user-owned keys); SaaS satisfies it with managed infra / OAuth
(platform-owned). Both must satisfy the **same contract**, so the core never knows
which it is talking to.

| Capability | Method | Returns | Plugin adapter | SaaS adapter |
|---|---|---|---|---|
| **deploy** | `deploy.publish(html) → url` | a public URL for the landing page | the user's deploy MCP connector (e.g. Vercel/Netlify), user keys | managed deploy |
| **data** | `data.insert(row)` / `data.query(window) → rows` | insert an `event` row / read in-window rows | the user's data MCP connector (e.g. a Supabase RPC/REST insert, see `capture.js` `STORE_ENDPOINT`) | managed DB / tenant store |
| **payments** | `payments.createHold(amount) → proof` | a live authorization proof (a Stripe manual-capture pre-auth hold, never settled, auto-voided at sprint end) | the user's payments MCP connector, user Stripe keys (`payment-intent.mjs`) | managed Stripe (a managed hold) |

Contract notes that the implementations must honor:

- **`data.query(window)` returns raw `event` rows** for the deterministic core to
  score — it must not pre-aggregate or pre-filter in a way that changes the verdict.
  The window is the sprint's frozen `[window_start, window_end]`.
- **`payments.createHold` returns a *live* proof.** The `event` row it produces is
  recorded with `live: true` **only** after a confirmed authorization. If payments is
  unwired or the hold is not authorized, the signal degrades to a SOFT
  `intent_click` (`live` stays `false`) — an honest soft signal, never a fabricated
  pass. This is the on-ramp for the determinism invariant: the core can trust `live`.
- **Planner-mode** is a first-class state: if a connector is missing
  (`STORE_ENDPOINT === ""`, no `STRIPE_PUBLISHABLE_KEY`), the capability is an
  intentional no-op / soft-only path so the loop keeps moving without fabricating signal.

Because all three capabilities are tiny and value-typed (`html → url`, `row → void`,
`amount → proof`), a managed SaaS provider can satisfy exactly the same contract the
MCP connectors do today — which is the second half (after the schema) of what keeps
the SaaS-vs-plugin decision forkless.

---

## 7. Scope guardrails (what this schema is NOT)

Accurate to the implemented refocus — the schema deliberately stops at proven demand:

- No `ship` / delivery / build-DAG / scope-guard entities. `handoff.sold_scope` is the
  retained "what was sold" shape, but it is **guidance**, not a binding build contract.
- No test-orchestration entities.
- No ticketing / journaling entities.
- No auto-posting or auto-launching state — the founder still posts the links and builds
  the page; the schema records what happened, it does not act.
