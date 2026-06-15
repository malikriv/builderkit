# Validate hardening (pre-deployment NO-GO remediation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Rev 2 — reconciled with PR #5 ("Tier 1: plan-fidelity delivery").** PR #5 did not fix
> B1–B6 (they stand) but rewrote some edited files; the high-overlap regions (landing
> files, validate V0–V3/Gate-V, the funnel table) are intact so edits still anchor. This
> rev adds **Task 8 (B7: a `scope-run.mjs` driver)** so PR #5's scope guard is executed
> not eyeballed, and re-anchors `scripts/test.sh` (it now runs landing **+** delivery).

**Goal:** Clear the 6 first-run blockers + 3 winnability fixes from the pre-deployment review so a real first `validate` run is runnable and winnable — the gate scores correctly from a real export, the founder has an honest path to the one required signal, and setup routes an idea-stage founder to `/discover`.

**Architecture:** `gate-eval.mjs` gets crash-guards + timestamp normalization (TDD). A new `gate-run.mjs` is the canonical zero-dep driver (`buildPredicates` + `deriveLands` are pure + TDD'd; the CLU wrapper reads JSON). `payment-intent.mjs`/`capture.js` get honesty + visibility fixes (syntax-checked scaffolds). Reference server routes ship under `templates/landing/server/`. The validate skill, setup, references, report, and README get the matching docs/flow fixes.

**Tech Stack:** JavaScript (ES modules, `node:test`), Markdown, YAML, Bash. Zero runtime deps (the driver reads JSON, not YAML — the agent extracts `validate.gate` + the export to JSON first).

**Spec:** `docs/specs/2026-06-13-validate-hardening-design.md`.

**Branch precondition:** on `feat/validate-hardening`, **rebased onto post-#5 `main`**. Confirm `git rev-parse --abbrev-ref HEAD` is `feat/validate-hardening`, `node --test templates/landing/*.test.mjs` → `# pass 12` (landing only), and `scripts/test.sh` is green at baseline (`# pass 27`, landing + delivery).

**Conventions:** TDD for Tasks 1–2; `scripts/lint.sh`/`--complete` → `lint OK`; `node --test templates/landing/*.test.mjs` stays green; no `{{` under `skills/`/`commands/`; commits end with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

## Task 1: gate-eval crash-guard + timestamp normalization (B1, B5) — TDD

**Files:** Modify `templates/landing/gate-eval.test.mjs`, `templates/landing/gate-eval.mjs`

- [ ] **Step 1: Add two failing tests**

In `gate-eval.test.mjs`, append these two tests at the end of the file:
```js
test("does not throw on a flat/partial predicates object (crash-guard)", () => {
  const flat = { window_start: 1000, window_end: 2000, floor_users: 10,
    min_qualified_lands: 25, weights: P.weights, cohort_weights: P.cohort_weights,
    min_cold_weight_fraction: 0.6, max_friend_share: 0.4, require_pay_proof: false };
  // no `rate`, no `pay_proof` keys — must degrade, not TypeError
  assert.doesNotThrow(() => evaluateGate({ rows: signups(10), lands: 30 }, flat));
});

test("ISO-string timestamps are counted in-window (units normalized)", () => {
  const iso = (o) => r({ ts: "2026-06-14T12:00:00Z", ...o });
  const isoSignups = Array.from({ length: 10 }, (_, i) => iso({ tier: "signup", email: `u${i}@x.io` }));
  const isoPay = iso({ tier: "payment", cohort: "cold_public", email: "buyer@x.io", amount: 9, live: true });
  const Piso = { ...P, window_start: "2026-06-13T00:00:00Z", window_end: "2026-06-15T00:00:00Z" };
  const out = evaluateGate({ rows: [...isoSignups, isoPay], lands: 30 }, Piso);
  assert.equal(out.verdict, "PASS"); // would be INCONCLUSIVE (0 in-window) if ts weren't normalized
});
```

- [ ] **Step 2: Run — verify the ISO test fails (and flat test may throw)**

Run: `node --test templates/landing/*.test.mjs`
Expected: FAIL — the ISO test is not PASS (old numeric compare yields 0 in-window), and/or
the flat test throws a TypeError on `p.rate`. Report what you see.

- [ ] **Step 3: Implement the guards in `gate-eval.mjs`**

(3a) Add a `toMs` helper — directly below the `COUNT_TIERS` line near the top:
```js
const toMs = (v) => (typeof v === "number" ? v : Date.parse(v));
```

(3b) Replace the in-window filter line:
```js
  const inWindow = rows.filter((x) => x.ts >= p.window_start && x.ts <= p.window_end);
```
with:
```js
  const ws = toMs(p.window_start), we = toMs(p.window_end);
  const inWindow = rows.filter((x) => { const t = toMs(x.ts); return t >= ws && t <= we; });
```

(3c) Make the pay-proof reads nullish-safe — replace the `hasColdHardPayProof` block:
```js
  const hasColdHardPayProof = counted.some((x) =>
    HARD_TIERS.has(x.tier) &&
    (!p.pay_proof.cold_required || x.cohort === "cold_public") &&
    (!p.pay_proof.live_mode_only || x.live === true) &&
    (x.amount || 0) >= p.pay_proof.min_amount
  );
```
with:
```js
  const hasColdHardPayProof = counted.some((x) =>
    HARD_TIERS.has(x.tier) &&
    (!p.pay_proof?.cold_required || x.cohort === "cold_public") &&
    (!p.pay_proof?.live_mode_only || x.live === true) &&
    (x.amount || 0) >= (p.pay_proof?.min_amount ?? 0)
  );
```

(3d) Make the rate guard nullish-safe — replace:
```js
  if (lands >= p.rate.rate_min_sample_visits && countedUsers / lands < p.rate.min_lp_visit_to_signup_rate) {
```
with:
```js
  if (p.rate && lands >= p.rate.rate_min_sample_visits && countedUsers / lands < p.rate.min_lp_visit_to_signup_rate) {
```

- [ ] **Step 4: Run — verify green**

Run: `node --test templates/landing/*.test.mjs`
Expected: `# pass 14`, `# fail 0` (12 original + 2 new). No assertion weakened.

- [ ] **Step 5: Commit**

```bash
git add templates/landing/gate-eval.mjs templates/landing/gate-eval.test.mjs
git commit -m "fix(validate): gate-eval crash-guard + ISO-timestamp normalization (B1, B5)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: `gate-run.mjs` canonical driver (B1, B5) — TDD

**Files:** Create `templates/landing/gate-run.mjs`, `templates/landing/gate-run.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `templates/landing/gate-run.test.mjs`:
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPredicates, deriveLands } from "./gate-run.mjs";

const GATE = {
  floor_users: 10, min_qualified_lands: 25,
  weights: { payment: 5, loi: 5, scarce_action: 3, activation: 2, signup: 1, intent_click: 0 },
  cohort_weights: { cold_public: 1.0, warm_dm: 0.5, friend: 0.25, unverifiable: 0 },
  min_cold_weight_fraction: 0.6, max_friend_share: 0.4, require_pay_proof: true,
  min_lp_visit_to_signup_rate: 0.05, rate_min_sample_visits: 40,
  pay_proof: { cold_required: true, live_mode_only: true, min_pct_of_price: 25 },
  max_extensions: 1,
};

test("buildPredicates requires a numeric price", () => {
  assert.throws(() => buildPredicates(GATE, { windowStart: 0, windowEnd: 1, price: undefined }), /price/);
});

test("buildPredicates computes min_amount and nests rate", () => {
  const p = buildPredicates(GATE, { windowStart: 1000, windowEnd: 2000, price: 20 });
  assert.equal(p.pay_proof.min_amount, 5);            // ceil(25% of 20)
  assert.equal(p.rate.rate_min_sample_visits, 40);    // re-nested from flat config
  assert.equal(p.rate.min_lp_visit_to_signup_rate, 0.05);
  assert.equal(p.window_start, 1000);
});

test("deriveLands counts in-window, non-founder land rows, deduped by session", () => {
  const rows = [
    { ts: 1500, tier: "land", session: "a", is_founder: false },
    { ts: 1500, tier: "land", session: "a", is_founder: false }, // dup session -> once
    { ts: 1500, tier: "land", session: "b", is_founder: false },
    { ts: 1500, tier: "land", session: "c", is_founder: true },  // founder -> excluded
    { ts: 9999, tier: "land", session: "d", is_founder: false }, // out of window
    { ts: 1500, tier: "signup", session: "e", is_founder: false }, // not a land
  ];
  assert.equal(deriveLands(rows, { windowStart: 1000, windowEnd: 2000 }), 2);
});

test("deriveLands handles ISO-string timestamps", () => {
  const rows = [{ ts: "2026-06-14T12:00:00Z", tier: "land", session: "a", is_founder: false }];
  const n = deriveLands(rows, { windowStart: "2026-06-13T00:00:00Z", windowEnd: "2026-06-15T00:00:00Z" });
  assert.equal(n, 1);
});
```

- [ ] **Step 2: Run — verify it fails (module missing)**

Run: `node --test templates/landing/*.test.mjs`
Expected: FAIL — cannot find `./gate-run.mjs`.

- [ ] **Step 3: Implement `gate-run.mjs`**

Create `templates/landing/gate-run.mjs`:
```js
#!/usr/bin/env node
// Canonical Gate V driver. Zero-dep: reads JSON (the validate agent extracts
// validate.gate -> gate.json and the store export -> rows.json first, which avoids a
// YAML dependency). Prints the verdict + counted rows so a human/second agent can
// reproduce it. buildPredicates + deriveLands are pure and unit-tested.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { evaluateGate } from "./gate-eval.mjs";

const toMs = (v) => (typeof v === "number" ? v : Date.parse(v));

export function buildPredicates(gate, { windowStart, windowEnd, price }) {
  const n = Number(price);
  if (price == null || Number.isNaN(n)) {
    throw new Error("buildPredicates: a numeric D2 price is required (pass --price)");
  }
  const minPct = gate.pay_proof?.min_pct_of_price ?? gate.min_pct_of_price ?? 25;
  return {
    window_start: windowStart, window_end: windowEnd,
    floor_users: gate.floor_users,
    min_qualified_lands: gate.min_qualified_lands,
    weights: gate.weights,
    cohort_weights: gate.cohort_weights,
    min_cold_weight_fraction: gate.min_cold_weight_fraction,
    max_friend_share: gate.max_friend_share,
    require_pay_proof: gate.require_pay_proof,
    pay_proof: {
      cold_required: gate.pay_proof?.cold_required ?? true,
      live_mode_only: gate.pay_proof?.live_mode_only ?? true,
      min_amount: Math.ceil((minPct / 100) * n),
    },
    rate: {
      min_lp_visit_to_signup_rate: gate.rate?.min_lp_visit_to_signup_rate ?? gate.min_lp_visit_to_signup_rate,
      rate_min_sample_visits: gate.rate?.rate_min_sample_visits ?? gate.rate_min_sample_visits,
    },
    max_extensions: gate.max_extensions ?? 0,
  };
}

export function deriveLands(rows, { windowStart, windowEnd }) {
  const ws = toMs(windowStart), we = toMs(windowEnd);
  const seen = new Set();
  for (const x of rows) {
    if (x.is_founder || x.tier !== "land") continue;
    const t = toMs(x.ts);
    if (t < ws || t > we) continue;
    seen.add(x.session);
  }
  return seen.size;
}

function arg(name) { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : undefined; }
function numOr(v) { const n = Number(v); return Number.isFinite(n) ? n : v; } // pass ISO strings through

function main() {
  const exportPath = arg("--export"), gatePath = arg("--gate"), price = arg("--price");
  const ws = numOr(arg("--window-start")), we = numOr(arg("--window-end")), landsOverride = arg("--lands");
  if (!exportPath || !gatePath) {
    console.error("usage: node gate-run.mjs --export rows.json --gate gate.json --price N --window-start <iso|ms> --window-end <iso|ms> [--lands N]");
    process.exit(2);
  }
  const rows = JSON.parse(readFileSync(exportPath, "utf8"));
  const gate = JSON.parse(readFileSync(gatePath, "utf8"));
  const predicates = buildPredicates(gate, { windowStart: ws, windowEnd: we, price });
  const lands = landsOverride != null ? Number(landsOverride)
    : deriveLands(rows, { windowStart: predicates.window_start, windowEnd: predicates.window_end });
  const inWindow = rows.filter((x) => { const t = toMs(x.ts); return t >= toMs(predicates.window_start) && t <= toMs(predicates.window_end); }).length;
  if (inWindow === 0 && rows.length > 0) {
    console.warn("WARNING: 0 of " + rows.length + " rows fall in-window — check timestamp units / window bounds before trusting this verdict.");
  }
  const out = evaluateGate({ rows, lands, measurable: true }, predicates);
  console.log(`VERDICT: ${out.verdict}`);
  console.log(`reason: ${out.reason}`);
  console.log(`counted users: ${out.countedUsers} | lands: ${lands} | in-window rows: ${inWindow}`);
  console.log(`cold-weight fraction: ${out.coldWeightFraction} | cold hard pay-proof: ${out.hasColdHardPayProof}`);
  console.log(`counted rows: ${JSON.stringify(out.countedRows)}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
```

- [ ] **Step 4: Run — verify green**

Run: `node --test templates/landing/*.test.mjs`
Expected: `# pass 18`, `# fail 0` (14 from Task 1 + 4 new).

- [ ] **Step 5: CLI smoke (fixtures) + commit**

Create `templates/landing/fixtures/rows.example.json`:
```json
[
  {"ts":1500,"tier":"land","cohort":"cold_public","session":"s1","is_founder":false},
  {"ts":1500,"tier":"signup","cohort":"cold_public","email":"a@x.io","session":"s1","is_founder":false},
  {"ts":1500,"tier":"payment","cohort":"cold_public","email":"b@x.io","session":"s2","amount":9,"live":true,"is_founder":false}
]
```
Create `templates/landing/fixtures/gate.example.json`:
```json
{ "floor_users": 1, "min_qualified_lands": 1,
  "weights": { "payment": 5, "loi": 5, "scarce_action": 3, "activation": 2, "signup": 1, "intent_click": 0 },
  "cohort_weights": { "cold_public": 1.0, "warm_dm": 0.5, "friend": 0.25, "unverifiable": 0 },
  "min_cold_weight_fraction": 0.6, "max_friend_share": 0.4, "require_pay_proof": true,
  "min_lp_visit_to_signup_rate": 0.05, "rate_min_sample_visits": 40,
  "pay_proof": { "cold_required": true, "live_mode_only": true, "min_pct_of_price": 25 } }
```
Run the smoke:
```bash
node templates/landing/gate-run.mjs --export templates/landing/fixtures/rows.example.json --gate templates/landing/fixtures/gate.example.json --price 20 --window-start 1000 --window-end 2000
```
Expected: prints `VERDICT: PASS` (2 cold users incl. a cold live pay-proof ≥ 5, lands 1 ≥ 1).

Commit:
```bash
git add templates/landing/gate-run.mjs templates/landing/gate-run.test.mjs templates/landing/fixtures/
git commit -m "feat(validate): gate-run.mjs driver (buildPredicates, deriveLands) + fixtures (B5)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: honest payment-intent + visible capture failures (B2, B3 client)

**Files:** Modify `templates/landing/payment-intent.mjs`, `templates/landing/capture.js`

- [ ] **Step 1: Rewrite `templates/landing/payment-intent.mjs`** (entire file)

```js
// BuilderKit validate — the HARD willingness-to-pay signal: a real card PRE-AUTH
// (Stripe manual-capture), never settled, auto-voided at sprint end. live:true is
// recorded ONLY after a confirmed authorization — never on a bare fetch — so a
// mis-wired page degrades to an honest SOFT signal instead of a fabricated PASS.
// Wire STRIPE_PUBLISHABLE_KEY + a /api/preauth route (see server/preauth.route.mjs)
// that creates a manual-capture PaymentIntent and returns { client_secret, amount }.
const STRIPE_PUBLISHABLE_KEY = ""; // set from validate.payments.*; empty => planner-mode (soft only)

export async function startPreauth(capture) {
  if (!STRIPE_PUBLISHABLE_KEY || typeof window === "undefined" || !window.Stripe) {
    // planner-mode or Stripe.js not loaded: record a SOFT intent only — never live:true.
    await capture("intent_click");
    return { ok: false, mode: "soft" };
  }
  try {
    const res = await fetch("/api/preauth", { method: "POST" });
    if (!res.ok) throw new Error("preauth route " + res.status);
    const { client_secret, amount } = await res.json();
    const stripe = window.Stripe(STRIPE_PUBLISHABLE_KEY);
    // The page must have mounted a Stripe card Element as `window.bkCardElement`.
    const { paymentIntent, error } = await stripe.confirmCardPayment(client_secret, {
      payment_method: { card: window.bkCardElement },
    });
    if (error || !paymentIntent || !["requires_capture", "succeeded"].includes(paymentIntent.status)) {
      await capture("intent_click"); // declined / not authorized -> honest soft signal
      return { ok: false, mode: "soft", error: error?.message };
    }
    // Confirmed live authorization (a hold; capture/void happens server-side at sprint end).
    await capture("payment", { amount, live: true });
    return { ok: true, mode: "preauth" };
  } catch (e) {
    console.error("[builderkit] preauth failed:", e);
    if (typeof document !== "undefined") showWarning("Payment hold could not be set up — recorded as interest only.");
    await capture("intent_click");
    return { ok: false, mode: "soft", error: String(e) };
  }
}

function showWarning(msg) {
  let el = document.getElementById("bk-warn");
  if (!el) { el = document.createElement("div"); el.id = "bk-warn"; el.style.cssText = "background:#fee;color:#900;padding:8px;font:14px sans-serif"; document.body.prepend(el); }
  el.textContent = msg;
}
export { showWarning };
```

- [ ] **Step 2: Update `templates/landing/capture.js`** — make failures visible

Replace the `capture` function body's try/catch:
```js
  try {
    await fetch(STORE_ENDPOINT, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  } catch (_) { /* planner-mode / offline: the founder reconciles from the store export */ }
```
with:
```js
  if (STORE_ENDPOINT === "") return; // true planner-mode: nothing wired, intentional no-op
  try {
    const res = await fetch(STORE_ENDPOINT, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error("capture route " + res.status);
  } catch (e) {
    console.error("[builderkit] capture failed:", e);
    if (typeof document !== "undefined") {
      let el = document.getElementById("bk-warn");
      if (!el) { el = document.createElement("div"); el.id = "bk-warn"; el.style.cssText = "background:#fee;color:#900;padding:8px;font:14px sans-serif"; document.body.prepend(el); }
      el.textContent = "Event capture failed — your store is not recording. Fix before launch.";
    }
  }
```

- [ ] **Step 3: Verify + commit**

```bash
node --check templates/landing/payment-intent.mjs && node --check templates/landing/capture.js && echo "syntax OK"
node --test templates/landing/*.test.mjs 2>&1 | grep -E '# (pass|fail)'
scripts/lint.sh
git add templates/landing/payment-intent.mjs templates/landing/capture.js
git commit -m "fix(validate): honest preauth (live only after auth) + visible capture failures (B2, B3)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
Expected: `syntax OK`; `# pass 18`; `lint OK`.

---

## Task 4: reference server routes (B3)

**Files:** Create `templates/landing/server/capture.route.mjs`, `templates/landing/server/preauth.route.mjs`; modify `skills/studio-setup/SKILL.md`

- [ ] **Step 1: Write `templates/landing/server/capture.route.mjs`**

```js
// BuilderKit validate — reference capture route (Supabase flavored, Vercel/Node handler).
// Copy into your app's /api/capture. Inserts one row, idempotent via the schema's
// dedupe_key (on conflict do nothing). Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const allowedTiers = ["land", "signup", "activation", "payment", "loi", "scarce_action", "intent_click"];
  if (!allowedTiers.includes(body?.tier) || !body?.session) return res.status(400).json({ error: "bad event" });
  const row = {
    tier: body.tier, cohort: body.cohort || "unverifiable", email: body.email || null,
    session: body.session, source: body.source || "", amount: body.amount || 0,
    live: !!body.live, is_founder: !!body.is_founder,
  };
  const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/builderkit_events`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: "resolution=ignore-duplicates,return=minimal", // idempotent on dedupe_key
    },
    body: JSON.stringify(row),
  });
  if (!r.ok && r.status !== 409) return res.status(502).json({ error: "store insert failed", status: r.status });
  return res.status(204).end();
}
```

- [ ] **Step 2: Write `templates/landing/server/preauth.route.mjs`**

```js
// BuilderKit validate — reference preauth route (Stripe manual-capture, Vercel/Node).
// Copy into your app's /api/preauth. Creates a LIVE manual-capture PaymentIntent (a
// hold, not a charge) at the D2 price and returns its client_secret for the client to
// confirm. Capture or cancel (void) it server-side at sprint end. Env:
// STRIPE_SECRET_KEY (LIVE), BK_PRICE_CENTS, BK_CURRENCY (default usd).
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const amountCents = Number(process.env.BK_PRICE_CENTS);
  if (!Number.isFinite(amountCents) || amountCents <= 0) return res.status(500).json({ error: "BK_PRICE_CENTS not set" });
  const params = new URLSearchParams({
    amount: String(amountCents),
    currency: process.env.BK_CURRENCY || "usd",
    capture_method: "manual",                  // a hold — never auto-settles
    "automatic_payment_methods[enabled]": "true",
  });
  const r = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "content-type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const pi = await r.json();
  if (!r.ok) return res.status(502).json({ error: "stripe error", detail: pi?.error?.message });
  return res.status(200).json({ client_secret: pi.client_secret, amount: amountCents / 100 });
}
```

- [ ] **Step 3: Have setup copy the matching route**

In `skills/studio-setup/SKILL.md`, in the Step 2.5 provisioning bullet about validate
infra targets (the `DEPLOY_PROVIDER`/`DATA_PROVIDER`/`PAY_PROVIDER` bullet), append:
```markdown
  When `DATA_PROVIDER` is non-blank, copy `${CLAUDE_PLUGIN_ROOT}/templates/landing/server/capture.route.mjs`
  into the project's capture endpoint and set its env (`SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`); when `PAY_PROVIDER` is non-blank, copy
  `server/preauth.route.mjs` and set `STRIPE_SECRET_KEY` (LIVE), `BK_PRICE_CENTS`,
  `BK_CURRENCY`. Adapt the handler signature to the project's framework if it isn't
  Vercel/Node.
```

- [ ] **Step 4: Verify + commit**

```bash
node --check templates/landing/server/capture.route.mjs && node --check templates/landing/server/preauth.route.mjs && echo "routes OK"
scripts/lint.sh
git add templates/landing/server/ skills/studio-setup/SKILL.md
git commit -m "feat(validate): reference capture + preauth server routes; setup copies them (B3)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
Expected: `routes OK`; `lint OK`.

---

## Task 5: validate skill, references, report — flow fixes (B1, B2, B3, B4, B5, W1, W3)

**Files:** Modify `skills/validate/SKILL.md`, `skills/validate/references/landing-conversion.md`, `skills/validate/references/guerrilla-playbook.md`, `templates/validate/validation-report.md`

- [ ] **Step 1: `validate` SKILL — V0 payment hard-stop + lands target + gate driver**

In `skills/validate/SKILL.md`, at the END of the `## V0 — Instrument + freeze the gate`
section, append:
```markdown

**Scoring shape (B1/B5):** the frozen predicates are the *nested* shape `gate-eval.mjs`
expects — build them with `gate-run.mjs`'s `buildPredicates(validate.gate, {windowStart,
windowEnd, price})` (it re-nests `rate.*`, computes `pay_proof.min_amount = ceil(
min_pct_of_price% × the D2 price)`, and takes the window from sprint-state). The window
bounds and event `ts` must share units; `gate-eval.mjs` normalizes ISO strings, but pass
the window as the same form your export uses.

**Compute + show the PASS target (W2):** `min_qualified_lands` (25) is the INCONCLUSIVE
floor, NOT the goal. At V0 compute and tell the founder a lands-to-PASS target ≈
`ceil(floor_users / expected_cold_signup_rate)` (≈ 100–200 cold lands at a 5–10% signup
rate). Aim there.

**Payment hard-stop (B4):** if `validate.payments.provider` is blank AND
`require_pay_proof` is true, STOP before any GTM and force a choice — **Path A:** wire a
Stripe manual-capture pre-auth / Payment Link at ≥ `min_pct_of_price`% of the D2 price in
LIVE mode (a hold; no money settles); **Path B:** the gate-eligible hand-LOI recipe — a
real signed LOI/deposit recorded as a row `{tier:"loi", cohort:"cold_public", live:true,
amount: ceil(min_pct_of_price% × price)}`. A planner-mode run with neither path CANNOT
reach PASS (an `amount:0` or warm LOI fails the pay-proof) — say so plainly.
```

- [ ] **Step 2: `validate` SKILL — Gate V step uses the driver; lands formula (B5/W3)**

In the `## Gate V` section, replace the sentence beginning "Export the raw rows + the
qualified-lands count and call `evaluateGate(...)`" with:
```markdown
Export the raw rows to JSON and `validate.gate` to JSON, then run the canonical driver:
`node ${CLAUDE_PLUGIN_ROOT}/templates/landing/gate-run.mjs --export rows.json --gate
gate.json --price <D2 price> --window-start <start> --window-end <end>` (add `--lands N`
in planner-mode). It builds the nested predicates, derives **`lands` = count of
in-window, non-founder `land` rows (deduped by session)**, calls `evaluateGate`, prints
the verdict + counted rows, and WARNS if 0 rows fall in-window. Report its output
verbatim — never declare a verdict from memory. (Planner-mode: set `--lands` to your
hand-counted distinct qualified impressions; if you can't count them, treat the run as
NOT-MEASURABLE rather than guessing.)
```

- [ ] **Step 3: `validate` SKILL — V2 pre-launch gate "event LANDS" (B3)**

In `## V2`, in the pre-launch gate sentence, change "(c) actually fires the capture
events (a test land/signup/probe is recorded)" to:
```markdown
(c) a test land/signup/probe event actually **LANDS in the store** (confirm the row
exists by querying the table, or a CSV/manual row in planner-mode) — not merely that the
browser "fired" it; a wired-but-broken backend swallows nothing visibly otherwise
```

- [ ] **Step 4: landing-conversion.md — Stripe recipe (B2)**

In `skills/validate/references/landing-conversion.md`, under the "## Honesty floor"
heading (before it), insert a new section:
```markdown
## Hard pay-proof recipe (Stripe manual-capture pre-auth)
The page's "reserve" button must collect a real card and confirm an authorization — a
hold, not a charge — before anything counts as a hard pay-proof:
1. Load Stripe.js; mount a card Element as `window.bkCardElement`.
2. POST `/api/preauth` (see `${CLAUDE_PLUGIN_ROOT}/templates/landing/server/preauth.route.mjs`)
   to create a LIVE `capture_method:"manual"` PaymentIntent at the D2 price; it returns a
   `client_secret`.
3. `stripe.confirmCardPayment(client_secret, { payment_method: { card: window.bkCardElement }})`.
4. ONLY on `requires_capture`/`succeeded` does `payment-intent.mjs` record
   `capture("payment", {amount, live:true})`. Any other outcome records a SOFT
   `intent_click`. `live:true` is valid ONLY after a confirmed authorization.
5. Void the holds at sprint end (no money settles). This is a hold, not a checkout — do
   NOT build a full Elements purchase flow.
```

- [ ] **Step 5: guerrilla-playbook.md — PASS-anchor (W1)**

In `skills/validate/references/guerrilla-playbook.md`, immediately under the top heading,
insert:
```markdown
> **PASS-anchor (read first):** Gate V requires ≥ 1 **cold_public** hard pay-proof and
> ≥ 60% cold weight. DMs to your warm list build the floor but are weighted 0.5 and a
> warm buyer does NOT clear the gate. So this playbook has TWO jobs: (1) DMs build the
> named list; (2) at least one channel must drive **strangers** to the public
> `?src=cold_public` tracked link. Plan for the cold buyer from the start.
```

- [ ] **Step 6: validation-report.md — live/amount columns (B4)**

In `templates/validate/validation-report.md`, replace the funnel table block:
```markdown
| tier | cold_public | warm_dm | friend | unverifiable |
|------|-------------|---------|--------|--------------|
| lands | | | | |
| signups | | | | |
| activations | | | | |
| pay-proof | | | | |
```
with:
```markdown
| tier | cold_public | warm_dm | friend | unverifiable |
|------|-------------|---------|--------|--------------|
| lands | | | | |
| signups | | | | |
| activations | | | | |
| pay-proof (live=true, amount>0) | | | | |

> A pay-proof row counts ONLY with `live: true` and `amount` ≥ the gate's `min_amount`
> (= `min_pct_of_price%` × the D2 price). An `amount: 0` or `live: false` pay-proof does
> not count — record each pay-proof's `live` and `amount` explicitly.
```

- [ ] **Step 7: Verify + commit**

```bash
grep -rn '{{' skills/validate/ commands/ || echo "no-braces"
grep -n 'gate-run.mjs' skills/validate/SKILL.md
scripts/lint.sh
git add skills/validate/SKILL.md skills/validate/references/landing-conversion.md skills/validate/references/guerrilla-playbook.md templates/validate/validation-report.md
git commit -m "fix(validate): driver-based scoring, payment hard-stop, cold PASS-anchor, lands target (B1/B2/B4/B5/W1/W3)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
Expected: `no-braces`; the gate-run.mjs reference prints; `lint OK`.

---

## Task 6: greenfield setup branch + README (B6, W2 cost note)

**Files:** Modify `skills/studio-setup/SKILL.md`, `commands/setup.md`, `README.md`

- [ ] **Step 1: studio-setup greenfield branch**

In `skills/studio-setup/SKILL.md`, at the END of `## Step 1 — Detect`, append:
```markdown

**Greenfield (idea-stage) branch.** Empty stack/driver/dev is EXPECTED, not a detection
failure — the founder may have only an idea. When detection finds no buildable app, take
the greenfield path: in Step 2 write ONLY the app-free sections (`project.name`, `docs`,
`product`, `discover`, `validate`, `studio`, `modules`) with `modules.testing: false`
and leave `testing.*` blank; in Step 3 SKIP the four-phase e2e walk and tell the founder
"setup is done — run `/builderkit:discover <seed>` next." Do not flag blank `testing.*`
as drift while `modules.testing` is false; the testing phases come online later, after
`/builderkit:ship` produces an app.
```

- [ ] **Step 2: setup command hint**

In `commands/setup.md`, append to the body:
```markdown
Setup does NOT require an existing app — an idea-stage founder can run it on an empty
repo and proceed straight to /builderkit:discover.
```

- [ ] **Step 3: README — quickstart + cost honesty**

In `README.md` `## Quickstart`, replace step 1 with:
```markdown
1. Run `/builderkit:setup` once per project. It detects your stack and writes
   `.builderkit/config.yaml`. **No app required** — if you only have an idea, setup
   writes an app-free config and points you straight to `/builderkit:discover <seed>`
   (the 4 e2e testing phases come online later, after `/builderkit:ship`).
```
And add this block at the end of the `## The pipeline ...` section:
```markdown
**What a validate sprint actually costs.** The `≤ $50` is the ad/outreach cap only.
A PASS-capable run also needs your unpriced founder-hours (build the page, the prospect
list, the posts) and a LIVE-mode Stripe account (sandbox pay-proofs are rejected as
NOT-MEASURABLE), plus a data store + deploy host. Most honest first sprints land
INCONCLUSIVE/no-PASS — that means the channel under-delivered audience, not that the idea
failed. The advertised "25 lands" is the INCONCLUSIVE floor; aim for ~100–200 cold lands.
```

- [ ] **Step 4: Verify + commit**

```bash
grep -rn '{{' skills/ commands/ || echo "no-braces"
grep -n 'Greenfield' skills/studio-setup/SKILL.md
scripts/lint.sh
git add skills/studio-setup/SKILL.md commands/setup.md README.md
git commit -m "fix(validate): greenfield setup branch + honest cost/expectation docs (B6, W2)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
Expected: `no-braces`; the Greenfield heading prints; `lint OK`.

---

## Task 7: landing README wiring + lint manifest + test smoke

**Files:** Modify `templates/landing/README.md`, `scripts/lint.sh`, `scripts/test.sh`

- [ ] **Step 1: landing README — document the driver + routes + recipe**

In `templates/landing/README.md`, in the "## Pieces" list, add:
```markdown
- `gate-run.mjs` — the canonical Gate V scorer CLI (`node gate-run.mjs --export rows.json
  --gate gate.json --price N --window-start <s> --window-end <e> [--lands N]`).
- `server/capture.route.mjs`, `server/preauth.route.mjs` — copy-paste reference backends
  for `/api/capture` (Supabase insert) and `/api/preauth` (Stripe manual-capture hold).
```
In "## Scoring the gate", replace the paragraph with:
```markdown
Run `gate-run.mjs` (above) — it builds the nested predicates from `validate.gate`
(computing `min_amount` from the D2 price), derives `lands` from in-window `land` rows,
calls `gate-eval.mjs`, and prints the verdict + counted rows so a human or a separate
agent can reproduce it. It WARNS if 0 rows fall in-window (a timestamp-units mistake).
The builder is never the sole scorer (spec C6).
```

- [ ] **Step 2: lint manifest + test smoke**

In `scripts/lint.sh` `--complete` list, add after the
`templates/landing/wiring-reference.html ...` line:
```
    templates/landing/gate-run.mjs templates/landing/gate-run.test.mjs \
    templates/landing/server/capture.route.mjs templates/landing/server/preauth.route.mjs \
```
In `scripts/test.sh`, append (on a new line after the existing test line — which on
post-#5 main is `node --test templates/landing/*.test.mjs templates/delivery/*.test.mjs`)
a CLI smoke:
```bash
node templates/landing/gate-run.mjs --export templates/landing/fixtures/rows.example.json \
  --gate templates/landing/fixtures/gate.example.json --price 20 \
  --window-start 1000 --window-end 2000 | grep -q "VERDICT: PASS" \
  && echo "gate-run smoke OK" || { echo "gate-run smoke FAIL"; exit 1; }
```

- [ ] **Step 3: Verify + commit**

```bash
scripts/test.sh 2>&1 | tail -5
scripts/lint.sh --complete
git add templates/landing/README.md scripts/lint.sh scripts/test.sh
git commit -m "docs(validate): landing README driver/routes; lint manifest + gate-run smoke

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
Expected: all suites green (the landing portion is now **18**; the delivery suites from
PR #5 are unchanged), then `gate-run smoke OK`; `lint OK`. (`node --test
templates/landing/*.test.mjs` alone is 18; `scripts/test.sh` runs landing + delivery.)

---

## Task 8: scope-check driver — `scope-run.mjs` (B7, PR #5 reconciliation)

**Files:** Create `templates/delivery/scope-run.mjs`, `templates/delivery/fixtures/{plan.example.json,contract.example.json}`; modify `skills/ship-feature/SKILL.md`, `scripts/lint.sh`, `scripts/test.sh`

PR #5's `scope-check.mjs` is pure + unit-tested but has no driver — ship "uses the rules"
by eye, re-opening the builder-is-the-judge hole. Give it the same CLI treatment
`gate-run.mjs` gave the gate. (Do NOT modify `scope-check.mjs` — it's tested; only wrap it.)

- [ ] **Step 1: Read `scope-check.mjs` first**

Read `templates/delivery/scope-check.mjs` fully so the fixture (Step 2) is built to a
guaranteed PASS against the real `evaluateScope` coverage/DRIFT/DEADLINE logic.

- [ ] **Step 2: Write `templates/delivery/scope-run.mjs`**

```js
#!/usr/bin/env node
// Canonical scope-guard driver (mirrors gate-run.mjs). Zero-dep: reads JSON (the ship
// agent extracts build-plan.yaml -> plan.json and sold-scope.yaml -> contract.json
// first, avoiding a YAML dependency). Calls the pure, unit-tested evaluateScope so the
// builder is NOT the judge of "did we stay on plan". Exits non-zero on any non-PASS so
// the ship pipeline halts mechanically.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { evaluateScope, topoWaves } from "./scope-check.mjs";

function arg(name) { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : undefined; }

function main() {
  const planPath = arg("--plan"), contractPath = arg("--contract");
  const slice = (arg("--slice") || "").split(",").map((s) => s.trim()).filter(Boolean);
  const estDays = arg("--est-days");
  if (!planPath || !contractPath) {
    console.error("usage: node scope-run.mjs --plan plan.json --contract contract.json [--slice id,id] [--est-days N]");
    process.exit(2);
  }
  const plan = JSON.parse(readFileSync(planPath, "utf8"));
  const contract = JSON.parse(readFileSync(contractPath, "utf8"));
  const out = evaluateScope({ plan, slice, estimated_build_days: estDays != null ? Number(estDays) : null }, contract);
  const { waves } = topoWaves(plan);
  console.log(`VERDICT: ${out.verdict}`);
  if (out.reasons?.length) console.log(`reasons: ${out.reasons.join("; ")}`);
  if (out.warnings?.length) console.log(`warnings: ${out.warnings.join("; ")}`);
  console.log(`waves: ${JSON.stringify(waves)}`);
  if (out.verdict !== "PASS") process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
```

- [ ] **Step 3: PASS fixtures (tune to the real evaluateScope from Step 1)**

Create `templates/delivery/fixtures/plan.example.json`:
```json
[
  {"id":"a","tier":"P0","scope_origin":"sold","delivers":["d1"],"depends_on":[],"complexity":3},
  {"id":"b","tier":"P1","scope_origin":"audit","delivers":[],"depends_on":["a"],"complexity":2}
]
```
Create `templates/delivery/fixtures/contract.example.json`:
```json
{ "scope_version": 1, "slug": "demo", "deliverables": [ { "id": "d1", "title": "the sold thing" } ],
  "price": 20, "paid_cohort_count": 3, "max_days_to_first_access": 30 }
```
(Sold item `a` delivers the only sold deliverable `d1`; the slice includes `a`. If Step 1
shows `evaluateScope` needs more for PASS, adjust the FIXTURE — never `scope-check.mjs`.)

- [ ] **Step 4: Smoke the driver**

```bash
node --check templates/delivery/scope-run.mjs && echo "scope-run syntax OK"
node templates/delivery/scope-run.mjs --plan templates/delivery/fixtures/plan.example.json --contract templates/delivery/fixtures/contract.example.json --slice a
```
Expected: `scope-run syntax OK`; then `VERDICT: PASS`.

- [ ] **Step 5: Wire it into `ship-feature` SKILL**

In `skills/ship-feature/SKILL.md`, in the "#### Scope guard" subsection (where it reads
the rules from `scope-check.mjs`), add the concrete driver step:
```markdown
   Get the verdict from the driver (don't eyeball it): extract `build-plan.yaml` ->
   `plan.json` and `sold-scope.yaml` -> `contract.json`, then `node
   ${CLAUDE_PLUGIN_ROOT}/templates/delivery/scope-run.mjs --plan plan.json --contract
   contract.json --slice <first-slice ids> [--est-days N]`. Report its verdict verbatim;
   any non-PASS exits non-zero and HALTS ship — the builder is never the judge of plan
   fidelity (same C6 principle as Gate V).
```

- [ ] **Step 6: lint manifest + test smoke + commit**

In `scripts/lint.sh` `--complete` list, add after the
`templates/delivery/scope-check.integration.test.mjs \` line:
```
    templates/delivery/scope-run.mjs \
```
In `scripts/test.sh`, append (after the gate-run smoke) a scope-run smoke:
```bash
node templates/delivery/scope-run.mjs --plan templates/delivery/fixtures/plan.example.json \
  --contract templates/delivery/fixtures/contract.example.json --slice a | grep -q "VERDICT: PASS" \
  && echo "scope-run smoke OK" || { echo "scope-run smoke FAIL"; exit 1; }
```
Commit:
```bash
git add templates/delivery/scope-run.mjs templates/delivery/fixtures/ skills/ship-feature/SKILL.md scripts/lint.sh scripts/test.sh
git commit -m "feat(delivery): scope-run.mjs driver so ship runs the scope guard, not eyeballs it (B7)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
Expected: `scope-run smoke OK`; `lint OK`.

---

## Final verification & PR

- [ ] **Step 1: Gates**

```bash
scripts/test.sh                          # all suites green (landing 18 + delivery) + gate-run + scope-run smokes OK
scripts/lint.sh --complete               # lint OK
for f in templates/landing/capture.js templates/landing/payment-intent.mjs templates/landing/gate-run.mjs templates/landing/server/capture.route.mjs templates/landing/server/preauth.route.mjs templates/delivery/scope-run.mjs; do node --check "$f" && echo "ok $f"; done
grep -rn '{{' skills/ commands/ || echo "no-braces"
grep -rinE 'bartek|marzec|@bartek|product design playbook' skills/ commands/ templates/ README.md .claude-plugin/ || echo "ip-clean"
```

- [ ] **Step 2: Blocker spot-checks**

Confirm: (B1) `buildPredicates` on the flat `validate.gate` shape returns a nested
predicates object and `gate-eval` no longer reads `p.rate.*`/`p.pay_proof.*` without
`?.`; (B2) `payment-intent.mjs` sets `live:true` ONLY inside the `requires_capture/
succeeded` branch; (B3) `capture.js` only silently no-ops when `STORE_ENDPOINT===''`;
(B4) the V0 payment hard-stop + the report's live/amount columns are present; (B6) the
greenfield branch sets `modules.testing:false` and routes to `/discover`; (B7)
`scope-run.mjs` exits non-zero on a non-PASS and the ship scope-guard step runs it
(doesn't eyeball).

- [ ] **Step 3: Push + PR (base main)**

```bash
git push -u origin feat/validate-hardening
gh pr create --base main --head feat/validate-hardening --title "fix: validate hardening — clear the 6 pre-deployment blockers + winnability + scope-run driver (B7)" --body "<summarize the 6 blockers + W1-W3 + B7 scope-run driver; test plan: landing suite 18 + gate-run + scope-run smokes + lint OK; ends with the Claude Code footer>"
```

- [ ] **Step 4: Dry-read pass**

Read `gate-eval.mjs`, `gate-run.mjs`, `payment-intent.mjs`, and `skills/validate/SKILL.md`
fresh. Confirm: no `live:true` without a confirmed auth; the driver is the documented
scoring path; the V0 hard-stop prevents an unwinnable planner-mode run; greenfield setup
routes to `/discover`. Fix drift, re-run `scripts/test.sh` + `scripts/lint.sh --complete`,
amend.

---

## Out of scope (stay parked)
- `feat/validate-enhancements`: EXTEND verdict, standing ledger, founder-hour budget.
- spec §10: #13 fake-door detail, #18 multi-seed triage, #20 provenance + portfolio cadence.
