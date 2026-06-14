// Scope guard — pure & deterministic. Protect the VALIDATED plan from drifting during
// the build. Recompute, from data only, whether a proposed shippable slice still honours
// the sold scope contract and the audited build plan — so the builder is NOT the judge of
// "did we stay on plan". No I/O, no Date, no randomness — the caller passes the plan, the
// slice, and the contract; this returns a reproducible verdict (mirrors gate-eval.mjs).
//
// Consumed by /builderkit:ship before it builds. Inputs:
//   contract  — the sold-scope.yaml emitted by /builderkit:validate (what was PROMISED).
//   plan      — the build-plan.yaml items emitted by /builderkit:audit (the DAG).
//   slice     — the ids the orchestrator intends to ship FIRST.
//
// Verdicts (only PASS proceeds; everything else halts the pipeline):
//   PASS                      — slice covers the sold scope, no drift, DAG sane.
//   DRIFT                     — slice schedules non-sold work while sold P0 is unbuilt.
//   UNDER-SCOPED              — a sold deliverable has no build item (you'd ship less than sold).
//   DECLINED-PLAY-SCHEDULED   — a play the brand audit flagged to decline is in the slice.
//   INVALID-DAG               — depends_on contains a cycle (cannot be waved).
//   DEADLINE-RISK             — estimated build exceeds the committed first-access window.

const SOLD = "sold";

function mk(verdict, reasons, extra = {}) {
  return { verdict, reasons: reasons.filter(Boolean), warnings: [], ...extra };
}

// Layered topological sort (Kahn). Deterministic: frontiers are id-sorted. Returns the
// wave layers, any dependency cycle, and any depends_on that reference unknown items.
export function topoWaves(plan = []) {
  const byId = new Map(plan.map((i) => [i.id, i]));
  const missing = [];
  for (const i of plan) {
    for (const d of i.depends_on || []) {
      if (!byId.has(d)) missing.push({ id: i.id, dep: d });
    }
  }
  const depsOf = (i) => (i.depends_on || []).filter((d) => byId.has(d));
  const remaining = new Set(plan.map((i) => i.id));
  const waves = [];
  let frontier = plan
    .filter((i) => depsOf(i).length === 0)
    .map((i) => i.id)
    .sort();
  while (frontier.length) {
    waves.push([...frontier]);
    for (const id of frontier) remaining.delete(id);
    frontier = [...remaining]
      .sort()
      .filter((id) => depsOf(byId.get(id)).every((d) => !remaining.has(d)));
  }
  const cycle = remaining.size > 0 ? [...remaining].sort() : null;
  return { waves, cycle, missing };
}

export function evaluateScope(input, contract) {
  const { plan = [], slice = [], estimated_build_days = null } = input;
  const c = contract || {};
  const byId = new Map(plan.map((i) => [i.id, i]));
  const warnings = [];

  // 1. DAG must be acyclic before anything can be waved.
  const topo = topoWaves(plan);
  for (const m of topo.missing) warnings.push(`depends_on references unknown item: ${m.id} -> ${m.dep}`);
  if (topo.cycle) {
    return { ...mk("INVALID-DAG", [`dependency cycle: ${topo.cycle.join(", ")}`]), warnings, waves: topo.waves };
  }

  // Slice ids must resolve to plan items.
  const sliceItems = slice.map((id) => byId.get(id)).filter(Boolean);
  for (const id of slice) if (!byId.has(id)) warnings.push(`slice references unknown item: ${id}`);

  // 2. A play the brand audit told us to decline must never enter a slice.
  const declined = sliceItems.filter((i) => i.decline);
  if (declined.length) {
    return { ...mk("DECLINED-PLAY-SCHEDULED", [`declined plays scheduled: ${declined.map((i) => i.id).join(", ")}`]), warnings, waves: topo.waves };
  }

  // 3. Coverage — every sold deliverable must map to a 'sold' build item via `delivers`.
  const soldItems = plan.filter((i) => i.scope_origin === SOLD);
  const covered = new Set(soldItems.flatMap((i) => i.delivers || []));
  const uncovered = (c.deliverables || []).map((d) => d.id).filter((id) => !covered.has(id));
  if (uncovered.length) {
    return { ...mk("UNDER-SCOPED", [`sold deliverables with no build item: ${uncovered.join(", ")}`]), warnings, waves: topo.waves };
  }

  // 4. First-slice fidelity — ship what was SOLD before anything that was not.
  const soldP0 = plan.filter((i) => i.scope_origin === SOLD && i.tier === "P0").map((i) => i.id);
  const missingSoldP0 = soldP0.filter((id) => !slice.includes(id));
  const nonSold = sliceItems.filter((i) => i.scope_origin && i.scope_origin !== SOLD).map((i) => i.id);
  if (missingSoldP0.length && nonSold.length) {
    return {
      ...mk("DRIFT", [
        `slice schedules non-sold work (${nonSold.join(", ")}) while sold P0 items are unbuilt (${missingSoldP0.join(", ")})`,
      ]),
      warnings,
      waves: topo.waves,
    };
  }
  if (missingSoldP0.length) warnings.push(`sold P0 not yet in this slice: ${missingSoldP0.join(", ")}`);

  // 5. Deadline — the committed first-access window is a promise to payers.
  if (estimated_build_days != null && c.max_days_to_first_access != null && estimated_build_days > c.max_days_to_first_access) {
    return {
      ...mk("DEADLINE-RISK", [
        `estimated ${estimated_build_days}d exceeds committed ${c.max_days_to_first_access}d to first access — refund-runbook owed`,
      ]),
      warnings,
      waves: topo.waves,
    };
  }

  return { ...mk("PASS", ["slice covers the sold scope; no drift detected"]), warnings, waves: topo.waves };
}
