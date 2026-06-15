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
function r(o = {}) {
  return { ts: 1500, tier: "signup", cohort: "cold_public", email: null,
    session: "s", source: "reddit", amount: 0, live: false, is_founder: false, ...o };
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
  assert.equal(out.countedUsers, 2);
});

test("FAIL: friends-and-family funnel fails the cold-weight floor", () => {
  const out = evaluateGate({ rows: [...signups(14, "friend"), coldPayment], lands: 30 }, P);
  assert.equal(out.verdict, "FAIL");
  assert.match(out.reason, /cold weight fraction|friend share/);
});

test("non-conversion tiers (land) never count as users", () => {
  const lands = Array.from({ length: 30 }, (_, i) => r({ tier: "land", email: `l${i}@x.io` }));
  const out = evaluateGate({ rows: [...lands, ...signups(10), coldPayment], lands: 30 }, P);
  assert.equal(out.countedUsers, 11);
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
  assert.equal(out.countedUsers, 4);
  assert.equal(out.verdict, "FAIL");
});

test("verdict carries the counted rows (C6: no verdict without its rows)", () => {
  const out = evaluateGate({ rows: [...signups(10), coldPayment], lands: 30 }, P);
  assert.ok(Array.isArray(out.countedRows));
  assert.equal(out.countedRows.length, out.countedUsers);
});

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
