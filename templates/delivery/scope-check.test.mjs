import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateScope, topoWaves } from "./scope-check.mjs";

// A clean validated plan: two sold P0 items deliver the two promised features; one
// expansion item is parked behind them. Contract promises both deliverables in 14 days.
const plan = [
  { id: "a", tier: "P0", scope_origin: "sold", delivers: ["d1"], depends_on: [], complexity: 4 },
  { id: "b", tier: "P0", scope_origin: "sold", delivers: ["d2"], depends_on: ["a"], complexity: 2 },
  { id: "c", tier: "P1", scope_origin: "expansion", depends_on: ["b"], complexity: 3 },
];
const contract = { deliverables: [{ id: "d1" }, { id: "d2" }], max_days_to_first_access: 14 };

test("PASS when the slice is exactly the sold scope", () => {
  const r = evaluateScope({ plan, slice: ["a", "b"], estimated_build_days: 10 }, contract);
  assert.equal(r.verdict, "PASS");
  assert.equal(r.warnings.length, 0);
  assert.deepEqual(r.waves, [["a"], ["b"], ["c"]]);
});

test("DRIFT when non-sold work is scheduled before sold P0 is built", () => {
  const r = evaluateScope({ plan, slice: ["a", "c"] }, contract);
  assert.equal(r.verdict, "DRIFT");
  assert.match(r.reasons[0], /non-sold work \(c\)/);
  assert.match(r.reasons[0], /unbuilt \(b\)/);
});

test("UNDER-SCOPED when a sold deliverable has no build item", () => {
  const r = evaluateScope({ plan, slice: ["a", "b"] }, { deliverables: [{ id: "d1" }, { id: "d2" }, { id: "d3" }] });
  assert.equal(r.verdict, "UNDER-SCOPED");
  assert.match(r.reasons[0], /d3/);
});

test("DECLINED-PLAY-SCHEDULED when a brand-declined play enters the slice", () => {
  const withDeclined = [...plan, { id: "x", tier: "P2", scope_origin: "expansion", depends_on: [], decline: "manipulative urgency" }];
  const r = evaluateScope({ plan: withDeclined, slice: ["a", "b", "x"] }, contract);
  assert.equal(r.verdict, "DECLINED-PLAY-SCHEDULED");
  assert.match(r.reasons[0], /x/);
});

test("INVALID-DAG on a dependency cycle", () => {
  const cyclic = [
    { id: "a", tier: "P0", scope_origin: "sold", delivers: ["d1"], depends_on: ["b"] },
    { id: "b", tier: "P0", scope_origin: "sold", delivers: ["d2"], depends_on: ["a"] },
  ];
  const r = evaluateScope({ plan: cyclic, slice: ["a", "b"] }, contract);
  assert.equal(r.verdict, "INVALID-DAG");
  assert.match(r.reasons[0], /cycle/);
});

test("DEADLINE-RISK when the build overruns the committed window", () => {
  const r = evaluateScope({ plan, slice: ["a", "b"], estimated_build_days: 30 }, contract);
  assert.equal(r.verdict, "DEADLINE-RISK");
  assert.match(r.reasons[0], /refund-runbook owed/);
});

test("PASS with a warning when sold P0 is partially sliced but nothing creeps in", () => {
  const r = evaluateScope({ plan, slice: ["a"] }, contract);
  assert.equal(r.verdict, "PASS");
  assert.match(r.warnings[0], /sold P0 not yet in this slice: b/);
});

test("warns on unresolved depends_on and unknown slice ids without failing a clean plan", () => {
  const p = [{ id: "a", tier: "P0", scope_origin: "sold", delivers: ["d1"], depends_on: ["ghost"] }];
  const r = evaluateScope({ plan: p, slice: ["a", "nope"] }, { deliverables: [{ id: "d1" }] });
  assert.equal(r.verdict, "PASS");
  assert.ok(r.warnings.some((w) => /unknown item: a -> ghost/.test(w)));
  assert.ok(r.warnings.some((w) => /slice references unknown item: nope/.test(w)));
});

test("topoWaves layers a diamond deterministically", () => {
  const diamond = [
    { id: "root", depends_on: [] },
    { id: "left", depends_on: ["root"] },
    { id: "right", depends_on: ["root"] },
    { id: "join", depends_on: ["left", "right"] },
  ];
  const { waves, cycle } = topoWaves(diamond);
  assert.equal(cycle, null);
  assert.deepEqual(waves, [["root"], ["left", "right"], ["join"]]);
});
