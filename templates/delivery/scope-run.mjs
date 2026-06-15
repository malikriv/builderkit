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
