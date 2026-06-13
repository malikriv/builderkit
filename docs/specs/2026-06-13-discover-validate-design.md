# BuilderKit — `discover` + `validate` modules (design spec)

Date: 2026-06-13
Status: approved design, hardened by adversarial review (rev 2), pre-implementation
Author: malikriv (with Claude Code)

> Rev 2 folds the critical + high findings from a 7-lens adversarial review
> (47/48 findings survived verification). Medium-tier findings are parked in
> §10 (second-pass backlog), not dropped.

## 0. Definition of success (the dependent variable)

The kit's headline goal — *"maximize the success rate of every product"* — is
uncomputable until "success" is named. So name it, as a config-driven target:

- `studio.success_criterion` — default *"≥ N retained paying users 30 days after
  first ship"*, overridable per founder/portfolio.

Every gate in this spec is an explicit **proxy** for that event. Gate D and Gate V
do **not** prove success; they buy the right to spend the next, more expensive
resource. The honest framing of the goal is therefore:

> **Maximize decision quality** — kill weak ideas cheaply (under the $50 and the
> founder-hour cap), **never false-kill a strong one**, and keep the founder taking
> shots. Most first sprints *should* land inconclusive; that is information, not
> failure.

The studio loop's job (§5) is to **shrink the gap between proxy verdicts and the
defined success event** — which is only meaningful once success is defined.

## 1. Context

BuilderKit today starts at *"you already have a feature to build"* —
`ship-feature` (8-phase build pipeline), `e2e-testing` (4-phase), and `linear`
(historian). This spec prepends the earlier product stages: from a raw seed
(problem / idea / population) through aggressive *but symmetric* need-finding,
adversarial hypothesis hardening, a cheap human reality probe, and a 48-hour live
validation sprint with guerrilla GTM — gated so weak ideas die before code is
written, and **strong-but-slow ideas are not false-killed**.

Two new modules chain into the existing pipeline:

```
/builderkit:discover ──Gate D──▶ /builderkit:validate ──Gate V──▶ /builderkit:ship ──▶ e2e + linear
 seed→hardened        no fatal     48h live sprint       cold WTP    (exists; now reads   (exist)
 hypothesis           flaw found   + guerrilla GTM        proof       a delivery contract)
        ▲                  │              ▲                  │
        │                  └─ D3.5 reality probe ─┘          │
        └──── kick back ONLY when qualified traffic landed and bounced ────┘
              (a global concept-cycle counter bounds the round-trips)
```

## 2. Hard constraints

- **C1 — Self-contained.** BuilderKit depends on **no other plugin**. A skill may
  use only (a) Claude Code built-in primitives (`Agent`, `Explore`, `Task`,
  `Bash`, the `Workflow` orchestrator, file tools) and (b) MCP connectors the
  *project* declares in `.builderkit/config.yaml`. No `superpowers:`,
  `anthropic-skills:`, `product-management:`, or other plugin skill is invoked
  from inside a BuilderKit skill. Red-team, reality-probe, GTM, conversion, and
  demand-rubric guidance ship **inside** this repo as the modules' own
  `references/*.md`.
- **C2 — Nothing bundled as a service.** The `validate` executor targets whatever
  infra the project *declares*; when a declared connector is absent, the phase
  **degrades to planner-mode** (artifact + runbook for the human). The gate's
  planner-mode evaluation path is specified in §10 (second pass) and must not be
  silently undefined.
- **C3 — Gates are real and un-gameable.** Each module ends in a hard gate that can
  send work back. Gate predicates are **pre-registered and frozen before the asset
  is built** (§4.1), the verdict is **recomputed from raw rows** by a reader that
  did not build the funnel (§6 measurement integrity), and the founder's own signal
  is **excluded at ingestion** (§4.4). A gate the builder can satisfy by choosing a
  lenient definition is not a gate.
- **C4 — Match existing DNA.** Phased pipeline, single-owner orchestrator owns every
  judgment/gate, parallel subagent fan-out only for disjoint fact-gathering,
  everything written to a spec/report doc, honest reporting of skipped/owed steps.
- **C5 — Config-driven, no project literals.** All thresholds, windows, infra
  targets, and toggles live in `.builderkit/config.yaml`; repo `CLAUDE.md` overrides.
- **C6 — Measurement integrity (new).** The component that **builds** the funnel may
  not be the sole authority that **scores** the gate. Pass/fail is recomputed from
  frozen predicates over the raw event/evidence export by a read-only verify step,
  and a verdict without its raw counted rows is itself a defect. This is the
  structural substitute for the external oracle that `/ship` gets from
  typecheck/test/screenshot but `validate` otherwise lacks.

## 3. Module 1 — `discover` (seed → hardened hypothesis)

Command: `/builderkit:discover <seed>`. Seed is **a problem, an idea, OR a
population**. Skill: `skills/discover/SKILL.md`.

### Phases

| ID | Name | Output |
|----|------|--------|
| D0 | Frame the seed | Canonical **Concept Brief**: ICP/population, problem, current alternatives, why-now, **archetype** (acute-B2B / prosumer / consumer / marketplace — sets the Gate V window + default signal), and a required **Founder access** field (the specific communities/audiences the founder *already* has for THIS seed, with standing per community). |
| D1 | Need assessment (symmetric, calibrated) | **Evidence dossier** that gathers the strongest *confirming AND disconfirming* evidence (problem already solved / low-frequency / tolerated / nobody pays). Output is ONE calibrated intensity verdict — **burning / real-but-tolerable / nice-to-have** — not a highlight reel of the loudest complaints, plus a falsification register ("what would have made us conclude *no burning need*, and did we find it"). Rubric: `references/demand-intensity-rubric.md`. |
| D2 | Monetization & WTP | **Monetization hypothesis.** Existing-workaround spend is carried as a **labeled assumption to test in validate**, never as established WTP. No plausible WTP path → Gate D red flag. |
| D3 | Red-team panel (evidence-bound) | A ranked **riskiest-assumptions ledger** (not "kill verdicts"). Six personas, each bound to a specific D1/D2 evidence slice, surface the assumptions most likely to be fatal. See §3.2. |
| D3.5 | Reality probe (cheap, human, soft-gated) | Talk to / pre-sell **real ICP humans** before spending a deployed asset. See §3.3. |
| D4 | Hardened Hypothesis Brief | The handoff artifact (§3.4). |

### 3.2 Red-team panel (D3) — evidence-bound test-designer, not kill-jury

Six personas from one model share one prior; left unbound they harden *internal
rhetoric*, not demand reality. So:

- Each persona is **bound to a specific evidence slice** (skeptical customer = review
  corpus; demand realist = frequency/recency; monetization hawk = competitor pricing
  + existing spend; moat critic = competitor scan; founder-bias auditor = the D1
  claims the seed leans on; distribution realist = the concrete community list).
- **Any kill OR defense that cites no external evidence is logged `unsupported` and
  cannot gate.** Fix the asymmetric-verify bug explicitly: an under-evidenced
  *customer-demand / WTP* kill is **not** "refuted" for being under-evidenced
  pre-sprint — it is promoted to the **top** of the ledger as the thing the sprint
  must disconfirm first.
- Every surviving assumption is tagged `{model-opinion | cited-external-source |
  real-human-contact}`.
- When all six agree in either direction, flag **"unanimous = possible correlated
  prior"** and run ONE external tie-break check before the verdict counts (bounded
  by `red_team.max_rounds`).
- Personas run on built-in primitives only (C1): `Workflow` fans them out, then a
  verify pass refutes weak kills *and* weak defenses. Prompts:
  `references/red-team-personas.md`.

**Gate D (`kill_threshold: evidence_gated`)** sends the seed back ONLY on:
(a) no plausible WTP path from real spend data, OR
(b) no cheaply-reachable audience **the founder can personally access** (cannot name
    ≥ 2 communities with non-zero standing), OR
(c) an unresolved **top-ranked** assumption whose provenance is `model-opinion` with
    no cheap test path, OR
(d) a D1 intensity verdict of **nice-to-have**.
Surviving lower-ranked assumptions become **sprint tests** in the brief, never
blockers. Loop bounded by `red_team.max_rounds`; on exhaustion, stop and ask the
human to pivot or shelve. Gate D is **neutral triage** — *"no fatal flaw found on
paper, proceed to spend real signal"* — not a verdict on the idea's worth. The real
backstop is the $50 sprint.

### 3.3 D3.5 — Reality probe (the cheapest disconfirmer)

A soft-gated, time-boxed, **human-executed** phase between the red-team and the
deployed asset. The pipeline currently spends its most expensive resource (a
deployed page measured by the founder's nonexistent distribution) *before* running
the cheapest, most diagnostic test in the Lean/Mom-Test canon.

The agent drafts, cheapest-first: (a) 5–10 **Mom Test** interview scripts about
*past behavior and current spend* (never "would you use this?", never a pitch),
(b) a concierge/manual **pre-sale or LOI DM** to specific named ICP members, (c) a
no-build fake-door DM/post as the floor option. The founder runs what the time-box
allows (`auto_post: false`); the agent records replies into the brief.

Three deterministic outcomes (work always keeps moving; only real human signal
stops it):

- **STRONG DISCONFIRM** (people don't have the problem / won't pay / past behavior
  contradicts it) → route to discover sharpen-or-pivot; counts against
  `red_team.max_rounds`.
- **HARD CONFIRM** (≥ 1 real commitment: verbal pre-sale / LOI / deposit) → proceed
  to V2 with that human already in the captured-user list (warm-starts V3, partially
  de-risks Gate V).
- **SILENCE / INCONCLUSIVE** within the window → **not** disconfirmation; record
  *"probe inconclusive: reach = N, replies = M"* as an owed step and **proceed**.

Where a real human contradicts a simulated persona, **the human wins** and it is
logged to the studio playbook. Config:
`discover.reality_probe: { enabled, window_hours: 24, min_contacts_drafted: 10 }`.
Reference: `references/reality-probe.md`.

### 3.4 Handoff artifact — Hardened Hypothesis Brief

`<docs.specs_dir>/YYYY-MM-DD-<slug>-hypothesis.md` from
`templates/discover/hypothesis-brief.md`:

- ICP / population (sharp), archetype, founder-access map
- Problem + **calibrated** intensity verdict + disconfirming evidence (from D1)
- Value proposition
- Monetization + WTP hypothesis (workaround-spend labeled "assumption to test")
- Riskiest assumptions, ranked, each provenance-tagged
- **The falsifiable validation hypothesis**, naming ONE mandatory `hard_signal` —
  the hardest credible costly commitment natural to THIS concept (payment by
  default; `LOI-or-signed-pilot` for procurement buyers; `scarce-costly-action` such
  as inviting a named colleague who also signs up, a held live call, or a real
  proprietary-data upload). A non-paid signal requires a one-line written
  justification of why it's the hardest credible one here; absent that, default to
  paid.
- The **pre-registered Gate V predicates** (§4.1) and the explicit **kill criteria**,
  stated *before* the sprint runs.

## 4. Module 2 — `validate` (48h live sprint + guerrilla GTM)

Command: `/builderkit:validate [hypothesis-brief-path]`. Skill:
`skills/validate/SKILL.md`. Input: the Hardened Hypothesis Brief.

### Phases

| ID | Name | Output / behavior |
|----|------|-------------------|
| V0 | Instrument + freeze the gate | Classify archetype → set window. **Write the machine-checkable Gate V predicates into the brief and HASH them before any build** (§4.1). Create the durable sprint-state file (§4.5). |
| V1 | Fastest-path GTM (guerrilla, ≤ budget) | Channel-**standing** assessment + a required **named-prospect list** + per-channel tracked links. See §4.2. |
| V2 | Build the conversion asset (executor; idempotent; C2 degrade) | One optimized landing page + waitlist/activation capture + tiered analytics + a **two-signal WTP probe** (hard money vs. soft intent-click) + honesty/disclosure floor. **Idempotent get-or-create** (§4.5). Conversion + integrity guidance in `references/landing-conversion.md`. |
| V3 | Launch the sprint (human posts; cold-tagged ingestion) | Founder posts from own accounts; kit ingests events **tagged by source cohort and with founder/agent signal dropped at ingestion** (§4.4). Pull-based polling (§4.5). |
| V4 | Validation Report + delivery commitment | Handoff artifact with raw counted rows and the binding delivery block (§4.6). |

### 4.1 Pre-registration & freezing (C3, C6)

V0 writes — and hashes, before V2 builds anything — the exact predicates: what
counts as signup / activation / hard pay-proof, the window bounds, the
self/contact exclusion set, the cohort definitions, and the exposure denominator.
Predicates are **immutable for the run**; any post-launch edit invalidates the gate
and is logged. The verdict is later **recomputed from the raw export** by a
read-only verify step (a human or a separate read-only agent), so pass/fail is
reproducible and not the builder's say-so.

### 4.2 V1 — GTM: standing, a named list, and outreach-first

- **Channel-standing assessment.** Score each candidate channel on public standing
  (account age, history, karma, whether it auto-removes link-first/low-karma posts,
  mod-DM requirements) → label **WARM** (can post credibly now) vs **NOT-WARM**.
  **Only WARM channels feed the 48h clock.** If zero WARM channels exist, GTM
  defaults to direct 1:1 outreach. Config `validate.gtm.min_warm_channels: 1`.
- **Named-prospect list (required-to-attempt artifact).** Specific, individually
  reachable ICP members (handles, threads, profiles) sourced from the **D1 dossier**
  (complainers, competitor reviewers, question-askers, workaround-buyers). Target
  `validate.gtm.named_list_target: 30`. If unreachable, write *why* and proceed (a
  distribution-realist signal, not a stall).
- **Default channel order** (a prior for true cold-start, overridable per ICP,
  rationale logged): `[direct_outreach, intent_venues, borrowed_distribution,
  broadcast]`. Direct 1:1 outreach converts ~an order of magnitude better than cold
  posting and is ToS-safe.
- **Per-channel tracked links** (UTM) — zero cost, the human already pastes
  per-channel posts; this is what makes the cohort-tagging in §4.4 and the exposure
  denominator in §4.7 possible.
- Budget model `"$50 → first 5 / 10 / 20 / 50"`. Pick 2–3 WARM channels; **draft
  every post/DM**. Scripts (1:1 cold-DM/email, value-first "borrow distribution"
  ask) in `references/guerrilla-playbook.md`.

### 4.3 V2 — the conversion asset and the WTP probe

- One landing page: ICP headline → problem agitate → value prop → **single CTA**.
- **Two distinct signals, never conflated:** a **HARD money commitment** vs. a
  **SOFT intent-click**. A bare price-button click is *soft only* — tracked for
  funnel diagnosis, weight `0`, and it can never satisfy `require_pay_proof` or
  inflate the floor.
- **Hard pay-proof default = `preauth_hold`** (a real card authorization that is
  never settled, auto-voided at sprint end). This preserves the WTP signal while
  removing the money, the fulfillment obligation, the refund surface, and the
  chargeback/account-freeze risk. A **real captured charge** (`payments.mode:
  real_charge`) is the strongest tier but is **opt-in only**, and only then must the
  page render, before the card field, a minimal pre-contract disclosure (*"this
  product does not exist yet; expected delivery <date>; full refund any time before
  delivery; 14-day cancellation"*) and a named legal entity. To count, the proof
  must be **live-mode** (not test/sandbox), **at real D2 price** (never a discounted
  teaser, ≥ `min_pct_of_price` of the hypothesized first payment), and from a
  **cold, non-founder, non-known-contact** source.
- **Honesty floor** (`references/landing-conversion.md` + a shared honesty
  reference). Five HARD STOPS the copy must clear before V3 posts or any
  payment/PII capture goes live: (1) fabricated social proof/metrics/press, (2)
  claiming a non-existent product is live, (3) taking real money with no disclosed
  refund/cancellation path, (4) collecting PII with no visible notice, (5) storing
  raw PII in `studio/`. Enforced as a **single pre-launch orchestrator verify** (a
  normal verify-fail regenerates copy — no new loop).
- **PII:** `templates/landing/` ships a default consent line + a `privacy.md`
  fill-in stub auto-populated from config; analytics default to first-party,
  cookieless, no-identifier event capture (measures the gate without tripping
  cookie-consent).
- **Disclosure posture** (anti-leak): the page reveals the **problem + WTP framing**
  but keeps any genuinely novel **mechanism** vague — you're testing demand, not
  teaching the build. Concepts the founder flags as easily-cloned bias toward
  1:1/DM validation over a fully public broadcast page.

### 4.4 V3 — cold-provenance ingestion (exclude founder signal at counting time)

- Every signup/activation/payment is stamped with a **source cohort** from its
  tracked link: `cold-public | warm-dm | friend | unverifiable`.
- The founder, friends/family, any account the founder controls
  (`gate.founder_identifiers`, `exclude_self: true`), and the **agent itself** are
  **tag-and-dropped at ingestion** — contamination can never trip the gate
  mid-sprint. (The agent is prohibited from generating any signup/activation/payment.)
- Dedupe counted users by email; drop obvious bot/preview/crawler user-agents; skip
  IP/fingerprint dedup at N≈10 (NAT/VPN collisions). Clustered timing /
  disposable-email are **advisory flags** in the report, not auto-reject.
- **Clock starts at first qualified impression** (`clock_start:
  first_qualified_impression` / first confirmed human post), not at command
  invocation — moderation/timezone delay can't eat the window.

### 4.5 V0/V2/V3 — durable async sprint state (survives a closed laptop)

Claude Code has no self-wake scheduler and the session ends when the turn or the
laptop does — but a 48h window means the founder *will* close the laptop. So:

- V0 writes `.builderkit/studio/sprints/<slug>.yaml`:
  `window_start_iso, window_end_iso, deploy/data/payments resource IDs,
  channels_posted[], last_event_cursor, tier_counts, gate_status
  (open|passed|failed|not-measurable)`. Updated on every check.
- Every `/validate` invocation **loads the file first and branches**: no file →
  fresh V0; `open` and `now < end` → **RESUME from `last_event_cursor`, never re-run
  V2** (recreating the deploy/table/link re-seeds the store and corrupts the count);
  `now ≥ end` → skip to V4 gate eval; `passed|failed` → report the prior verdict.
- **V2 is idempotent** (get-or-create with a stable dedupe key — email or session
  id; upsert) so re-runs/refreshes can't inflate the count. This lives in the
  landing/capture template.
- Two re-entry modes, recorded in the doc: **GTM-only relaunch** keeps
  slug/table/window/counters; **kick-back-to-discover** starts a NEW
  slug/resources/window.
- Monitoring is honestly **pull-based** — the founder re-runs `/validate` to poll,
  each poll advancing the cursor idempotently. An **optional** GitHub Actions cron is
  offered for hands-off polling but never required.

### 4.6 Gate V — exposure-aware, cold, three-way, recomputed

Computed from raw rows by the read-only verify step (C6), against the frozen
predicates (§4.1):

- **PASS** = qualified lands ≥ `min_qualified_lands` (exposure denominator, default
  ~25–30) **AND** a **cold stranger hard pay-proof** **AND** the weighted floor met
  with `min_cold_weight_fraction` (default 0.6) of weighted users cold and
  `max_friend_share` (0.4) respected. Cohort weights `{cold-public 1.0, warm-dm 0.5,
  friend 0.25, unverifiable 0}`; tier weights `{payment/loi 5, scarce_action 3,
  activation 2, signup 1, intent_click 0}`.
- **INCONCLUSIVE** = lands < `min_qualified_lands` at window end (the channel never
  delivered audience — **NOT a product fail**). Route to extend-once / re-channel.
  **Explicitly forbidden** to kick back to discover on thin traffic.
- **FAIL** = lands ≥ denominator **AND** (no pay-proof OR landed-and-bounced). This
  is the **only** path to discover. A rate fail (`min_lp_visit_to_signup_rate`
  ~0.05) is evaluated only when visits ≥ `rate_min_sample_visits` (~40) so a tiny-N
  high-intent DM funnel isn't punished.
- **GATE-NOT-MEASURABLE** (new) = analytics never fired, or payments stuck in
  test/sandbox. Neither pass nor fail — an instrumentation defect that blocks until
  fixed, bounded by `gate.max_repair_attempts`; on exhaustion, degrade to a
  human-judged manual count from raw evidence rather than stalling.
- **Access-failure branch** in fail-diagnosis: when ~zero top-of-funnel AND the run
  log shows posts removed/blocked/shadowbanned → diagnose **ACCESS FAILURE**, stay
  in validate, switch to direct outreach or another WARM channel, and **do not** write
  a value-prop-failure row to the studio (mark *"no-distribution / inconclusive"* —
  prevents poisoning the learning loop with the wrong lesson).

**Kick-back attribution & loop bounds (#7):** a *"problem/value-prop failure → back
to discover"* verdict may fire ONLY when qualified lands ≥
`kill_attribution.min_qualified_lands` (~30) AND the drop is at the land→signup step.
Require ONE **free cross-channel re-test** of the SAME asset before any kick-back
(if it converts elsewhere, it was an execution miss → stay in GTM-iterate). Stage
the bounce route: landed-no-signup first triggers a cheap headline/offer/price
variation pass (`message_variants_before_kickback`, default 2). Bound everything:
`validate.max_rounds` (3) for GTM/variation loops, `gate.max_extensions` (1), and a
**global `studio.max_concept_cycles`** (3) covering discover↔validate round-trips per
seed — on exhaustion, stop and force a human pivot/shelve, logging one row to
`validation-log.md`. On kick-back, hand the structured funnel evidence into the
discover re-entry as priors.

### 4.7 V4 — Validation Report (with raw rows + delivery commitment)

`<docs.specs_dir>/YYYY-MM-DD-<slug>-validation.md` from
`templates/validate/validation-report.md`:

- Funnel numbers per tier **and per cohort**, quoting the **raw counted rows**
  (timestamp, tier, which predicate each satisfied, exclusions applied) — a verdict
  without raw rows is a defect.
- The recomputed Gate V verdict (PASS / FAIL / INCONCLUSIVE / NOT-MEASURABLE).
- The captured real-user list (the **cold** waitlist) — the strongest reason to keep
  going. Stored in `validate.data.*` (PII), never in `studio/`.
- Reframed wording: a pass is a *"credible cold-demand signal worth a real build,"*
  anchored on the cold pay-proof — not "validated."
- **Delivery commitment block** (binding Phase-0 input for `/ship`): the exact
  promise the winning landing copy made (feature, price, **delivery window stated to
  payers**), the paid-cohort list, and a hard first-access deadline derived from the
  landing microcopy and `validate.delivery.max_days_to_first_access` (default ~30,
  aligned to the FTC window).
- Recommendation: proceed to `/ship` / iterate-GTM / back-to-discover / kill.

### 4.8 The validate→ship contract (#11)

Once Gate V requires real WTP, the kit has manufactured a delivery obligation to
named humans. The handoff is therefore a **first-class artifact**, not a sentence:

1. `/ship` reads the delivery-commitment block as binding Phase-0 input.
2. `ship-feature` intake gains a rule: the **first shippable slice must satisfy the
   validated promise** before any roadmap expansion — the build is scoped by what was
   *sold*, not re-discovered.
3. The **refund-runbook obligation transfers** with the handoff: if `ship-feature`
   cannot deliver usable access within the committed window, it emits the payer-list
   + refund runbook as a **release-blocking owed step** (the agent never auto-moves
   money). The same runbook is emitted by the kill/shelve handler if a paid concept
   is abandoned.
4. `validate.delivery.max_days_to_first_access` is carried into the brief at V0 so
   the landing copy can never promise faster than the build can plausibly deliver.

## 5. The "improving" loop — studio playbook (rebuilt)

`.builderkit/studio/` (cross-product). The naive version learns from survivors of a
noisy n≈10 gate and never records the counterfactual — over a few dozen runs it
overfits and *degrades* hit-rate via cargo-cult tactics. Rebuilt so it learns from
**corroboration and real outcomes**:

- **Decouple** the founder's go/no-go (Gate V) from what the playbook is allowed to
  *learn*.
- **Tag every `validation-log.md` row** with run context: `icp_type, archetype,
  primary_channel, channel_standing (cold|warm), audience_borrowed,
  founder_effort_hours, signal_strength (cold-weight, pay-proof count, cold
  land→pay rate)`.
- **Promotion by corroboration:** every `playbook.md` entry carries `status` +
  sample count — `hypothesis (n=1)` until a tactic converts across ≥
  `studio.promote_after_k` (2–3) runs AND ≥ 2 distinct ICPs, then `supported`. A
  `hypothesis` entry surfaces at read time only as an *"untested guess,"* never as
  established. Priors are advisory and can **never** auto-fail a gate.
- **Record LOSERS** with the same tags (kills survivorship bias).
- **Drop "kill patterns that proved right"** as a category — a panel kill is opinion
  until the market rules. Replace with a **panel-vs-outcome ledger**: a kill pattern
  is logged predictive only when a Gate-D-passing concept later failed for the named
  reason, or a panel-doubted concept then passed Gate V (a disconfirmation). Bias
  writeback toward disconfirmations.
- **Backfill outcome fields** (`outcome ∈ {pending|shipped|retained|revenue|
  killed_in_market|abandoned}`, `outcome_date`) updated opportunistically when the
  founder next runs any command — no scheduler.
- **PII boundary:** `studio/` stores ONLY aggregate patterns + per-tier
  counts/decisions — never raw emails or per-user rows. Down-weight stale (> ~90d)
  channel entries.

## 6. Config additions (`.builderkit/config.yaml`)

Appended to `templates/config.template.yaml`:

```yaml
discover:
  red_team:
    personas: 6
    max_rounds: 3
    kill_threshold: evidence_gated   # evidence_gated | majority | any | unanimous
  reality_probe: { enabled: true, window_hours: 24, min_contacts_drafted: 10 }
  specs_dir: {{SPECS_DIR}}

validate:
  window_hours: 48
  max_window_hours: 96               # marketplace/considered-purchase only
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
  max_rounds: 3                       # GTM/relaunch + message-variation loops

studio:
  enabled: true
  dir: .builderkit/studio
  success_criterion: ">=N retained paying users 30 days after first ship"
  promote_after_k: 2
  max_concept_cycles: 3              # global discover<->validate round-trips per seed
```

When a `deploy`/`data`/`payments` provider is blank or its MCP is absent, the
relevant V2 step runs in planner-mode (C2); the planner-mode gate-evaluation path is
§10.

## 7. File manifest

New:

- `commands/discover.md`, `commands/validate.md`
- `skills/discover/SKILL.md`
  - `references/red-team-personas.md`
  - `references/demand-intensity-rubric.md`
  - `references/reality-probe.md`
- `skills/validate/SKILL.md`
  - `references/guerrilla-playbook.md`
  - `references/landing-conversion.md`  (includes the honesty floor + fake-door integrity)
  - `references/honesty-floor.md`  (shared, loaded by both modules)
- `templates/discover/hypothesis-brief.md`
- `templates/validate/validation-report.md`
- `templates/landing/` — page + waitlist/activation + cookieless analytics +
  two-signal WTP probe (idempotent capture) + `privacy.md` stub + consent line
- `.builderkit/studio/` — `playbook.md`, `validation-log.md` scaffolds;
  `sprints/` dir

Edited:

- `templates/config.template.yaml` — add `discover`, `validate`, `studio` (§6)
- `skills/studio-setup/SKILL.md` — provision the new config + studio scaffold
- `skills/ship-feature/SKILL.md` — accept the **delivery-commitment block** as
  binding Phase-0 input; first slice scoped to the validated promise; carry the
  refund-runbook obligation (§4.8)
- `README.md`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` —
  document the discover→validate→ship chain

## 8. Out of scope

- Auto-posting to social channels (`validate.auto_post` default off; future opt-in,
  ToS-gated).
- Changes to `e2e-testing` and `linear` mechanics.
- Building the product (remains `ship-feature`'s job).
- Paid-acquisition / ad tooling (the sprint is deliberately guerrilla, ≤ $50).
- Throwaway posting identities (explicitly out — protects the founder's standing).

## 9. Build order

Implement `discover` first (ship + test it), then `validate` — discover is the
upstream artifact `validate` consumes, with smaller blast radius. The studio loop
(§5) and the `ship-feature` intake edit (§4.8) land with `validate`.

## 10. Second-pass backlog (medium-tier review findings, deferred not dropped)

To be folded after the critical+high rev-2 build is working:

- **#13 — Fake-door integrity detail.** The honesty floor is in §4.3; the fuller
  red-line subsection + shared `honesty-floor.md` content lands here.
- **#15 — `EXTEND` verdict + founder-hour budget.** A third Gate-V action when the
  floor is met but no hard pay-proof in 48h (one bounded extension OR a cheaper
  pay-probe), plus `validate.max_human_hours` and per-channel human-hour estimates.
- **#17 — Planner-mode (connector-absent) gate path.** Skeptical-adjudicator
  evaluation from human-submitted CSV/screenshot/receipt evidence with anti-self-
  dealing checks and an `evidence_provenance` field. Closes the C2-vs-§4.6 gap (this
  is the *most likely* real config, so promote early if the broke-founder default
  turns out to be planner-mode).
- **#18 — Multi-seed triage front-door.** Optional pre-D0 phase (≥ 2 seeds): cheap
  read-only scan per seed, promote top-1, park the rest in `seed-backlog.md`.
- **#19 — Community-standing ledger + anti-burn relaunch defaults.** Per-ICP ledger
  of spent venues/angles, read as a prior so product #2 doesn't re-burn product #1's
  wells; relaunch must change venue or angle.
- **#20 — Provenance/freshness discipline + portfolio founder-cadence.**
  Source-URL + retrieval-timestamp on kill-clearing claims; citation spot-check in
  the D3 verify pass; `studio.attempts_before_strategy_review` stop-loss; a
  "what to carry forward" note on every kill so a kill feels like progress.

## 11. Open items (defaulted, flagged)

1. Red-team + community-finding run via the built-in `Workflow` orchestrator. **Yes.**
2. Studio playbook is cross-product. **Yes.**
3. Gate V defaults (§6) are config-overridable; archetype sets the window.
4. Hard pay-proof defaults to `preauth_hold`; `real_charge` is opt-in (§4.3).
