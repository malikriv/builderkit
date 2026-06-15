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
