# Validate — Plan 2a: executable foundation (landing stack + tested Gate V evaluator)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the deployable conversion-asset templates and a **deterministic, unit-tested Gate V evaluator** that recomputes the sprint verdict (PASS / FAIL / INCONCLUSIVE / NOT-MEASURABLE) from raw captured rows against predicates frozen at V0 — the measurement-integrity core (spec C6: the builder is not the scorer).

**Architecture:** The evaluator is a pure ES-module function (`templates/landing/gate-eval.mjs`) with no I/O, no `Date`, no randomness — the caller passes the window and rows, so it is fully reproducible and TDD'd with Node's built-in test runner (`node --test`, no new dependencies). The landing stack (`templates/landing/`) is a provider-shaped scaffold: a static page, cookieless idempotent capture, an events schema with an upsert key, and a two-signal WTP probe (hard preauth + soft intent-click). The orchestration skill that *drives* these (validate V0–V4) is **Plan 2b**.

**Tech Stack:** JavaScript (ES modules, `node:test` + `node:assert`), HTML, SQL (Postgres/Supabase-flavored), Bash (`scripts/lint.sh`, new `scripts/test.sh`). Built-in primitives only; no external plugin deps (C1).

**Specs:** `docs/specs/2026-06-13-discover-validate-design.md` §4.1–§4.7 (validate phases, Gate V, WTP probe, cold ingestion, durable state) + `docs/specs/2026-06-13-frontend-reconciliation-design.md` §6–§7 (audit feeds validate). Config keys already exist in `templates/config.template.yaml` under `validate:` (added in the discover plan).

**Branch precondition:** validate builds on the *reconciled* front-end. If PR #2 is merged, create `feat/validate` off `main`; otherwise stack it: `git checkout feat/product-strategy && git checkout -b feat/validate`. Confirm `git rev-parse --abbrev-ref HEAD` is `feat/validate` before Task 1.

**Conventions for every task:**
- Code tasks follow TDD: write the test, run it red, implement, run it green, commit.
- `node --test templates/landing/` must pass before committing any evaluator change.
- `scripts/lint.sh` (or `--complete` once the manifest is updated) must print `lint OK`.
- No `{{` under `skills/` or `commands/` (this plan only touches `templates/` + `scripts/`, so braces are not a concern here).
- Commit per Conventional Commits; every message ends with:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

---

## File structure (responsibilities)

- `templates/landing/gate-eval.mjs` — **the pure Gate V evaluator** (`evaluateGate(input, predicates) → verdict`). The one piece that must be deterministic + tested.
- `templates/landing/gate-eval.test.mjs` — `node --test` suite covering every verdict path.
- `templates/landing/schema.sql` — the `events` table: append-only capture with a natural upsert key (idempotent), cohort + founder + live columns.
- `templates/landing/capture.js` — client: cookieless event capture, cohort from the tracked link (UTM), idempotent client-side de-dup; posts to the data store.
- `templates/landing/index.html` — the conversion asset: ICP headline → problem → value → single CTA + the two-signal WTP probe markup (hard pay button + soft intent-click).
- `templates/landing/payment-intent.mjs` — a documented Stripe **manual-capture preauth** stub (the hard signal), provider-shaped, "wire your key."
- `templates/landing/privacy.md` — fill-in privacy/consent stub.
- `templates/landing/README.md` — how to wire/deploy + the planner-mode fallback (constraint C2).
- `scripts/test.sh` — runs `node --test templates/landing/`.
- `scripts/lint.sh` — add the new template files + `scripts/test.sh` to the `--complete` manifest.

### Shared data shapes (used by the evaluator AND the capture schema — keep identical)

An **event row** (one per captured signal, from the store's raw export):
```
{ ts: number,            // epoch ms
  tier: "signup"|"activation"|"payment"|"loi"|"scarce_action"|"intent_click",
  cohort: "cold_public"|"warm_dm"|"friend"|"unverifiable",
  email: string|null,
  session: string,
  source: string,        // tracked-link / channel tag
  amount: number,        // payment: authorized/charged amount; else 0
  live: boolean,         // payment captured in live mode (not sandbox)
  is_founder: boolean }  // flagged at ingestion (founder/known-contact/agent)
```
**Predicates** (frozen at V0; mirrors `validate.gate` config, with `min_amount` precomputed = `min_pct_of_price` × the D2 price):
```
{ window_start, window_end, floor_users, min_qualified_lands,
  weights: {payment,loi,scarce_action,activation,signup,intent_click},
  cohort_weights: {cold_public,warm_dm,friend,unverifiable},
  min_cold_weight_fraction, max_friend_share, require_pay_proof,
  pay_proof: { cold_required, live_mode_only, min_amount },
  rate: { min_lp_visit_to_signup_rate, rate_min_sample_visits } }
```
**`evaluateGate({rows, lands, measurable}, predicates)`** returns:
```
{ verdict: "PASS"|"FAIL"|"INCONCLUSIVE"|"NOT-MEASURABLE", reason,
  countedUsers, weighted, coldWeightFraction, friendShare,
  hasColdHardPayProof, countedRows }
```

---

## Task 0: Prereqs

- [ ] **Step 1: Confirm Node and the branch**

```bash
node --version   # expect v18+ (node --test is built in)
git rev-parse --abbrev-ref HEAD   # expect feat/validate (see Branch precondition)
```
If not on `feat/validate`, create it per the Branch precondition above. If `node` is missing, stop and tell the user — the evaluator is TDD'd with Node.

---

## Task 1: Gate V evaluator (TDD)

**Files:**
- Create: `templates/landing/gate-eval.test.mjs`
- Create: `templates/landing/gate-eval.mjs`

- [ ] **Step 1: Write the failing test suite**

Create `templates/landing/gate-eval.test.mjs` with exactly:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateGate } from "./gate-eval.mjs";

const P = {
  window_start: 1000, window_end: 2000,
  floor_users: 10, min_qualified_lands: 25,
  weights: { payment: 5, loi: 5, scarce_action: 3, activation: 2, signup: 1, intent_click: 0 },
  cohort_weights: { cold_public: 1.0, warm_dm: 0.5, friend: 0.25, unverifiable: 0 },
  min_cold_weight_fraction: 0.6, max_friend_share: 0.4, require_pay_proof: true,
  pay_proof: { cold_required: true, live_mode_only: true, min_amount: 5 },
  rate: { min_lp_visit_to_signup_rate: 0.05, rate_min_sample_visits: 40 },
};
// row factory
function r(o = {}) {
  return { ts: 1500, tier: "signup", cohort: "cold_public", email: null,
    session: Math.random ? "s" : "s", source: "reddit", amount: 0, live: false,
    is_founder: false, ...o };
}
function signups(n, cohort = "cold_public") {
  return Array.from({ length: n }, (_, i) => r({ tier: "signup", cohort, email: `u${i}@x.io` }));
}
const coldPayment = r({ tier: "payment", cohort: "cold_public", email: "buyer@x.io", amount: 9, live: true });

test("PASS: floor met, cold-weighted, cold live pay-proof, lands over floor", () => {
  const out = evaluateGate({ rows: [...signups(10), coldPayment], lands: 30 }, P);
  assert.equal(out.verdict, "PASS");
  assert.equal(out.hasColdHardPayProof, true);
});

test("FAIL: no pay-proof (signups only)", () => {
  const out = evaluateGate({ rows: signups(12), lands: 30 }, P);
  assert.equal(out.verdict, "FAIL");
  assert.match(out.reason, /no cold hard pay-proof/);
});

test("INCONCLUSIVE: lands below the exposure floor", () => {
  const out = evaluateGate({ rows: [...signups(12), coldPayment], lands: 10 }, P);
  assert.equal(out.verdict, "INCONCLUSIVE");
});

test("NOT-MEASURABLE: analytics never fired (lands null)", () => {
  const out = evaluateGate({ rows: [...signups(12), coldPayment], lands: null }, P);
  assert.equal(out.verdict, "NOT-MEASURABLE");
});

test("NOT-MEASURABLE: pay-proof only in sandbox (no live hard signal)", () => {
  const sandbox = r({ tier: "payment", cohort: "cold_public", email: "b@x.io", amount: 9, live: false });
  const out = evaluateGate({ rows: [...signups(12), sandbox], lands: 30 }, P);
  assert.equal(out.verdict, "NOT-MEASURABLE");
});

test("founder-controlled pay-proof does NOT satisfy the gate", () => {
  const founderPay = r({ tier: "payment", cohort: "cold_public", email: "me@x.io", amount: 9, live: true, is_founder: true });
  const out = evaluateGate({ rows: [...signups(10), founderPay], lands: 30 }, P);
  assert.equal(out.verdict, "FAIL");
  assert.match(out.reason, /no cold hard pay-proof/);
});

test("dedupe by email: the same person counts once", () => {
  const dup = r({ tier: "signup", cohort: "cold_public", email: "same@x.io" });
  const out = evaluateGate({ rows: [dup, { ...dup }, coldPayment], lands: 30 }, P);
  assert.equal(out.countedUsers, 2); // same@x.io once + buyer@x.io
});

test("FAIL: friends-and-family funnel fails the cold-weight floor", () => {
  // 14 friend signups (weight 3.5) vs 1 cold payment (weight 5): cold fraction
  // 5/8.5 = 0.59 < 0.6 and friend share 3.5/8.5 = 0.41 > 0.4 -> FAIL.
  const out = evaluateGate({ rows: [...signups(14, "friend"), coldPayment], lands: 30 }, P);
  assert.equal(out.verdict, "FAIL");
  assert.match(out.reason, /cold weight fraction|friend share/);
});

test("non-conversion tiers (land) never count as users", () => {
  const lands = Array.from({ length: 30 }, (_, i) => r({ tier: "land", email: `l${i}@x.io` }));
  const out = evaluateGate({ rows: [...lands, ...signups(10), coldPayment], lands: 30 }, P);
  assert.equal(out.countedUsers, 11); // 10 signups + 1 payment; land rows excluded
  assert.equal(out.verdict, "PASS");
});

test("FAIL: land-and-bounce (rate below floor with enough sample)", () => {
  const out = evaluateGate({ rows: [...signups(11), coldPayment], lands: 300 }, P);
  assert.equal(out.verdict, "FAIL");
  assert.match(out.reason, /landed-and-bounced/);
});

test("intent_click never counts toward the floor", () => {
  const clicks = Array.from({ length: 20 }, (_, i) => r({ tier: "intent_click", email: `c${i}@x.io` }));
  const out = evaluateGate({ rows: [...clicks, ...signups(3), coldPayment], lands: 30 }, P);
  assert.equal(out.countedUsers, 4); // 3 signups + 1 payment; clicks excluded
  assert.equal(out.verdict, "FAIL"); // only 4 < floor 10
});

test("verdict carries the counted rows (C6: no verdict without its rows)", () => {
  const out = evaluateGate({ rows: [...signups(10), coldPayment], lands: 30 }, P);
  assert.ok(Array.isArray(out.countedRows));
  assert.equal(out.countedRows.length, out.countedUsers);
});
```

- [ ] **Step 2: Run the suite — verify it fails (module missing)**

Run: `node --test templates/landing/`
Expected: FAIL — `Cannot find module '.../gate-eval.mjs'` (the implementation does not exist yet).

- [ ] **Step 3: Implement the evaluator**

Create `templates/landing/gate-eval.mjs` with exactly:

```js
// Gate V evaluator — pure & deterministic. Recompute the sprint verdict from the raw
// captured rows against the predicates frozen at V0. The builder is NOT the scorer:
// this runs read-only over the raw export so a human or a separate agent can reproduce
// the verdict. No I/O, no Date, no randomness — the caller passes the window and rows.

const HARD_TIERS = new Set(["payment", "loi", "scarce_action"]);
const COUNT_TIERS = new Set(["signup", "activation", "payment", "loi", "scarce_action"]);

export function evaluateGate(input, predicates) {
  const { rows = [], lands = null, measurable = true } = input;
  const p = predicates;

  // 1. Instrumentation defects -> NOT-MEASURABLE (neither pass nor normal fail).
  if (measurable === false || lands === null || lands === undefined) {
    return mk("NOT-MEASURABLE", "analytics/instrumentation not firing");
  }
  const inWindow = rows.filter((x) => x.ts >= p.window_start && x.ts <= p.window_end);
  const hard = inWindow.filter((x) => HARD_TIERS.has(x.tier) && !x.is_founder);
  if (p.require_pay_proof && hard.length > 0 && hard.every((x) => x.live !== true)) {
    return mk("NOT-MEASURABLE", "pay-proof present only in test/sandbox mode");
  }

  // 2. Count: in-window, non-founder, conversion tiers only (land + intent_click never count).
  const counted = dedupeByUser(inWindow.filter((x) => !x.is_founder && COUNT_TIERS.has(x.tier)));
  const countedUsers = counted.length;

  // 3. Weights.
  const w = (x) => (p.weights[x.tier] || 0) * (p.cohort_weights[x.cohort] || 0);
  const weighted = counted.reduce((s, x) => s + w(x), 0);
  const coldWeight = counted.filter((x) => x.cohort === "cold_public").reduce((s, x) => s + w(x), 0);
  const friendWeight = counted.filter((x) => x.cohort === "friend").reduce((s, x) => s + w(x), 0);
  const coldWeightFraction = weighted > 0 ? coldWeight / weighted : 0;
  const friendShare = weighted > 0 ? friendWeight / weighted : 0;

  // 4. Cold hard pay-proof.
  const hasColdHardPayProof = counted.some((x) =>
    HARD_TIERS.has(x.tier) &&
    (!p.pay_proof.cold_required || x.cohort === "cold_public") &&
    (!p.pay_proof.live_mode_only || x.live === true) &&
    (x.amount || 0) >= p.pay_proof.min_amount
  );

  const m = { countedUsers, weighted, coldWeightFraction, friendShare, hasColdHardPayProof, countedRows: counted };

  // 5. Exposure denominator -> INCONCLUSIVE (channel, not product, failed).
  if (lands < p.min_qualified_lands) {
    return mk("INCONCLUSIVE", "qualified lands below the exposure floor — the channel did not deliver audience", m);
  }

  // 6. Rate guard (only above the sample floor) -> land-and-bounce FAIL.
  if (lands >= p.rate.rate_min_sample_visits && countedUsers / lands < p.rate.min_lp_visit_to_signup_rate) {
    return mk("FAIL", "landed-and-bounced — visit->signup rate below floor", m);
  }

  // 7. PASS conditions (all must hold).
  const reasons = [];
  if (countedUsers < p.floor_users) reasons.push(`only ${countedUsers}/${p.floor_users} counted users`);
  if (coldWeightFraction < p.min_cold_weight_fraction) reasons.push(`cold weight fraction ${round(coldWeightFraction)} < ${p.min_cold_weight_fraction}`);
  if (friendShare > p.max_friend_share) reasons.push(`friend share ${round(friendShare)} > ${p.max_friend_share}`);
  if (p.require_pay_proof && !hasColdHardPayProof) reasons.push("no cold hard pay-proof");
  if (reasons.length === 0) {
    return mk("PASS", "exposure met, floor met, cold-weighted, with a cold hard pay-proof", m);
  }
  return mk("FAIL", reasons.join("; "), m);
}

function dedupeByUser(rows) {
  const seen = new Set();
  const out = [];
  for (const x of rows) {
    const key = (x.email && x.email.toLowerCase()) || `session:${x.session}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(x);
  }
  return out;
}
function round(x) { return Math.round(x * 100) / 100; }
function mk(verdict, reason, m = {}) {
  return {
    verdict, reason,
    countedUsers: m.countedUsers ?? 0,
    weighted: m.weighted ?? 0,
    coldWeightFraction: m.coldWeightFraction ?? 0,
    friendShare: m.friendShare ?? 0,
    hasColdHardPayProof: m.hasColdHardPayProof ?? false,
    countedRows: m.countedRows ?? [],
  };
}
```

- [ ] **Step 4: Run the suite — verify green**

Run: `node --test templates/landing/`
Expected: all tests pass (`# pass 12`, `# fail 0`).

- [ ] **Step 5: Commit**

```bash
git add templates/landing/gate-eval.mjs templates/landing/gate-eval.test.mjs
git commit -m "feat(validate): deterministic, tested Gate V evaluator

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Events schema + idempotent cookieless capture

**Files:**
- Create: `templates/landing/schema.sql`
- Create: `templates/landing/capture.js`

- [ ] **Step 1: Write `templates/landing/schema.sql`**

```sql
-- BuilderKit validate — capture store (Postgres / Supabase flavored).
-- Idempotent: the unique key collapses refreshes/retries so counts can't inflate.
-- Columns mirror the gate-eval.mjs event shape exactly.
create table if not exists builderkit_events (
  id           bigint generated always as identity primary key,
  ts           timestamptz not null default now(),
  tier         text not null check (tier in
                 ('land','signup','activation','payment','loi','scarce_action','intent_click')),
  cohort       text not null default 'unverifiable' check (cohort in
                 ('cold_public','warm_dm','friend','unverifiable')),
  email        text,
  session      text not null,
  source       text,                       -- tracked-link / channel tag (UTM)
  amount       numeric not null default 0, -- payment: authorized/charged; else 0
  live         boolean not null default false,
  is_founder   boolean not null default false,
  -- natural key for idempotency: one row per (person-or-session, tier)
  dedupe_key   text generated always as (coalesce(lower(email), 'session:' || session) || ':' || tier) stored,
  unique (dedupe_key)
);
-- Upsert pattern (client/edge uses ON CONFLICT DO NOTHING so the FIRST signal wins):
--   insert into builderkit_events (tier,cohort,email,session,source,amount,live,is_founder)
--   values (...) on conflict (dedupe_key) do nothing;
```

- [ ] **Step 2: Write `templates/landing/capture.js`**

```js
// BuilderKit validate — client capture. Cookieless (a per-tab sessionStorage id only,
// no tracking cookies), idempotent (the store's dedupe_key collapses repeats), and
// cohort-aware (the tracked link's ?src= tag classifies the cohort). Replace
// STORE_ENDPOINT with your data connector (e.g. a Supabase RPC/REST insert).
const STORE_ENDPOINT = "/api/capture"; // wire to validate.data.* (blank => planner-mode)

function sessionId() {
  let s = sessionStorage.getItem("bk_sid");
  if (!s) { s = "s_" + Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem("bk_sid", s); }
  return s;
}
function cohortFromSource(src) {
  // The tracked link carries ?src=cold_public|warm_dm|friend. Default unverifiable.
  const allowed = ["cold_public", "warm_dm", "friend"];
  return allowed.includes(src) ? src : "unverifiable";
}
export async function capture(tier, { email = null, amount = 0, live = false } = {}) {
  const params = new URLSearchParams(location.search);
  const body = {
    tier, email, amount, live,
    session: sessionId(),
    source: params.get("src") || "",
    cohort: cohortFromSource(params.get("src")),
    is_founder: false, // ingestion (validate V3) re-flags founder/known-contact rows
  };
  try {
    await fetch(STORE_ENDPOINT, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  } catch (_) { /* planner-mode / offline: the founder reconciles from the store export */ }
}
// A "qualified land" = first view of the page from a tracked link. Recorded as its own
// `land` tier (NOT a conversion) so the orchestration can count lands for the exposure
// denominator; gate-eval excludes land rows from the user count.
export function recordLand() { if (new URLSearchParams(location.search).get("src")) capture("land"); }
```

- [ ] **Step 3: Verify syntax + lint**

```bash
node --check templates/landing/capture.js && echo "capture.js OK"
node --test templates/landing/   # evaluator still green
scripts/lint.sh
```
Expected: `capture.js OK`; tests pass; `lint OK`.
(`node --check` on an ES module that uses browser globals only parses syntax — it does
not execute, so `document`/`fetch`/`location` are fine.)

- [ ] **Step 4: Commit**

```bash
git add templates/landing/schema.sql templates/landing/capture.js
git commit -m "feat(validate): idempotent cookieless capture + events schema

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Landing page + two-signal WTP probe

**Files:**
- Create: `templates/landing/index.html`
- Create: `templates/landing/payment-intent.mjs`

- [ ] **Step 1: Write `templates/landing/index.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{{HEADLINE}}</title>
</head>
<body>
  <!-- One ICP-matched headline -> problem agitate -> value -> ONE primary CTA. -->
  <main>
    <h1>{{HEADLINE}}</h1>           <!-- the ICP's problem in their words -->
    <p>{{PROBLEM_AGITATE}}</p>
    <p>{{VALUE_PROP}}</p>

    <!-- Waitlist / activation (soft tier). -->
    <form id="waitlist">
      <input id="email" type="email" required placeholder="you@email.com" />
      <button type="submit">{{CTA}}</button>
    </form>

    <!-- Two-signal WTP probe. HARD = real card pre-auth (counts). SOFT = intent click (weight 0). -->
    <section id="wtp">
      <button id="reserve">Reserve at {{PRICE}} — refundable hold</button> <!-- HARD: preauth -->
      <button id="interested">I'd pay for this</button>                    <!-- SOFT: intent only -->
    </section>

    <p><small>Early access — not built yet. {{REFUND_LINE}} See <a href="privacy.md">privacy</a>.</small></p>
  </main>

  <script type="module">
    import { capture, recordLand } from "./capture.js";
    import { startPreauth } from "./payment-intent.mjs";
    recordLand();
    document.getElementById("waitlist").addEventListener("submit", (e) => {
      e.preventDefault();
      capture("signup", { email: document.getElementById("email").value });
    });
    document.getElementById("interested").addEventListener("click", () => capture("intent_click"));
    document.getElementById("reserve").addEventListener("click", () => startPreauth(capture));
  </script>
</body>
</html>
```

- [ ] **Step 2: Write `templates/landing/payment-intent.mjs`**

```js
// BuilderKit validate — the HARD willingness-to-pay signal: a real card PRE-AUTH
// (Stripe manual-capture), never settled, auto-voided at sprint end. A successful
// pre-auth from a cold stranger at real price is a valid Gate V pay-proof while
// removing the money, fulfillment, refund, and chargeback risk (spec 4.3).
// Wire STRIPE_PUBLISHABLE_KEY + a server route that creates a manual-capture
// PaymentIntent for validate.payments.* (blank provider => planner-mode: collect a
// pre-sell/LOI by hand instead).
const STRIPE_PUBLISHABLE_KEY = ""; // wire from validate.payments.*; empty => planner-mode

export async function startPreauth(capture) {
  if (!STRIPE_PUBLISHABLE_KEY) {
    // planner-mode: no payments connector. Record the intent as SOFT only.
    await capture("intent_click");
    return { ok: false, mode: "planner" };
  }
  // Server route must create a PaymentIntent with capture_method:"manual" at the real
  // D2 price, in LIVE mode, and return {amount, currency}. On client confirmation:
  const res = await fetch("/api/preauth", { method: "POST" });
  const { amount } = await res.json();
  // amount is the authorized (not captured) figure; live:true marks it gate-eligible.
  await capture("payment", { amount, live: true });
  return { ok: true, mode: "preauth" };
}
```

- [ ] **Step 3: Verify syntax + lint**

```bash
node --check templates/landing/payment-intent.mjs && echo "payment-intent OK"
test -f templates/landing/index.html && echo "index.html OK"
node --test templates/landing/   # evaluator still green
scripts/lint.sh
```
Expected: `payment-intent OK`; `index.html OK`; tests pass; `lint OK`.

- [ ] **Step 4: Commit**

```bash
git add templates/landing/index.html templates/landing/payment-intent.mjs
git commit -m "feat(validate): landing page + two-signal WTP probe (preauth + intent)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Privacy stub, README, test runner, lint manifest

**Files:**
- Create: `templates/landing/privacy.md`
- Create: `templates/landing/README.md`
- Create: `scripts/test.sh`
- Modify: `scripts/lint.sh` (add the new files to the `--complete` manifest)

- [ ] **Step 1: Write `templates/landing/privacy.md`**

```markdown
# Privacy & data — {{PROJECT_NAME}} early access

This page collects the minimum to run a short validation test. Review and edit before
launch (founder must confirm).

- **What we collect:** the email you submit, an anonymous per-tab session id, the
  channel tag from the link you arrived on, and (if you reserve) a payment
  authorization handled by {{PAY_PROVIDER}}. No tracking cookies.
- **Why:** to gauge interest before building, and to email you when early access opens.
- **Payments:** a reserve is a refundable card *hold* (pre-authorization), not a
  charge, unless stated otherwise; it is released if the product does not ship.
- **Retention / deletion:** stored in {{DATA_PROVIDER}}. Email {{CONTACT_EMAIL}} to
  access or delete your data.
- **Processors:** {{DATA_PROVIDER}}, {{PAY_PROVIDER}}.
```

- [ ] **Step 2: Write `templates/landing/README.md`**

```markdown
# templates/landing — the validate conversion asset

A provider-shaped scaffold for the 48-hour validation sprint. Copy into your project,
fill the `{{TOKENS}}` from `.builderkit/config.yaml` + the discover brief, wire the two
connectors, deploy.

## Pieces
- `index.html` — one ICP headline → problem → value → single CTA + the two-signal WTP probe.
- `capture.js` — cookieless, idempotent client capture; cohort from the link's `?src=`.
- `schema.sql` — the `builderkit_events` table (unique `dedupe_key` = idempotency).
- `payment-intent.mjs` — the HARD signal: a Stripe manual-capture **pre-auth** (no money moves).
- `gate-eval.mjs` — recomputes the Gate V verdict from the raw rows (see below).
- `privacy.md` — fill-in privacy/consent.

## Wiring (from config)
- `validate.deploy.*` → where `index.html` is hosted (e.g. Vercel static).
- `validate.data.*` → `STORE_ENDPOINT` in `capture.js` + apply `schema.sql`.
- `validate.payments.*` → `STRIPE_PUBLISHABLE_KEY` + the `/api/preauth` route.

## Planner-mode (constraint C2)
Any connector left blank degrades gracefully: with no payments connector, the reserve
button records a SOFT intent only and the founder collects a pre-sell/LOI by hand; with
no data connector, the founder reconciles signups from a form/CSV export. The Gate V
verdict is then computed by running `gate-eval.mjs` over the hand-collected rows.

## Scoring the gate
`gate-eval.mjs` is the **single source of truth** for PASS / FAIL / INCONCLUSIVE /
NOT-MEASURABLE. Export the raw rows, build the frozen predicates from
`validate.gate` (with `min_amount = min_pct_of_price × price`), and call
`evaluateGate({rows, lands, measurable}, predicates)`. The verdict carries the exact
counted rows so a human or a separate agent can reproduce it — the builder is never the
sole scorer (spec C6).
```

- [ ] **Step 3: Write `scripts/test.sh`**

```bash
#!/usr/bin/env bash
# BuilderKit plugin tests — runs the Node unit tests shipped with templates.
set -uo pipefail
cd "$(dirname "$0")/.."
command -v node >/dev/null || { echo "TEST FAIL: node required"; exit 1; }
node --test templates/landing/
```

Then: `chmod +x scripts/test.sh`

- [ ] **Step 4: Add the new files to the lint `--complete` manifest**

In `scripts/lint.sh`, inside the `--complete` `for f in \` list, add these lines right
before the `templates/maestro/boot.yaml ...` line:
```
    templates/landing/gate-eval.mjs templates/landing/gate-eval.test.mjs \
    templates/landing/schema.sql templates/landing/capture.js \
    templates/landing/index.html templates/landing/payment-intent.mjs \
    templates/landing/privacy.md templates/landing/README.md \
    scripts/test.sh \
```

- [ ] **Step 5: Verify everything**

```bash
chmod +x scripts/test.sh
scripts/test.sh           # node tests green
scripts/lint.sh --complete
```
Expected: the test runner prints the passing Node test summary; then `lint OK`.

- [ ] **Step 6: Commit**

```bash
git add templates/landing/privacy.md templates/landing/README.md scripts/test.sh scripts/lint.sh
git commit -m "feat(validate): landing privacy/README, node test runner, lint manifest

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Final verification

- [ ] **Step 1: Gates green**

```bash
scripts/test.sh           # node --test: all evaluator tests pass
scripts/lint.sh --complete # lint OK
node --check templates/landing/capture.js && node --check templates/landing/payment-intent.mjs && echo "js syntax OK"
```

- [ ] **Step 2: Self-containment + hygiene**

```bash
grep -rinE 'meetcorda|malikcasey|glowproof|bartek|marzec' templates/landing/ scripts/test.sh || echo "clean"
grep -rn '{{' skills/ commands/ || echo "no-braces-in-skills"
```
Expected: `clean`; `no-braces-in-skills`. (The `{{TOKENS}}` in `templates/landing/*`
are intentional and legal — they are under `templates/`.)

- [ ] **Step 3: Shape check**

Confirm `gate-eval.mjs`'s event fields (tier/cohort/email/session/source/amount/live/
is_founder) exactly match `schema.sql`'s columns and `capture.js`'s POST body. A
mismatch here is a silent gate bug. Fix and re-run `scripts/test.sh` if drifted.

Do NOT push or open a PR yet — Plan 2b (the validate orchestration skill, studio
rebuild, and ship handoff) lands on the same `feat/validate` branch; push once 2b is in
and open one PR for the whole validate module.

---

## What this plan deliberately does NOT cover (→ Plan 2b)

- `skills/validate/SKILL.md` (V0–V4 orchestration: freeze predicates, GTM, launch, pull-based polling, gate eval call) + `commands/validate.md`.
- `skills/validate/references/{guerrilla-playbook,landing-conversion,honesty-floor}.md`.
- `templates/validate/validation-report.md`.
- The studio-rebuild logic (promotion-by-corroboration, panel-vs-outcome ledger).
- The `skills/ship-feature/SKILL.md` delivery-commitment intake edit (spec §4.8).
- README/manifest mentions of `/builderkit:validate` as a live command.
