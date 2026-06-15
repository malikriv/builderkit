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
function numOr(v) { const n = Number(v); return Number.isFinite(n) ? n : v; }

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
