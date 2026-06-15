#!/usr/bin/env bash
# BuilderKit plugin tests — runs the Node unit tests shipped with templates.
set -uo pipefail
cd "$(dirname "$0")/.."
command -v node >/dev/null || { echo "TEST FAIL: node required"; exit 1; }
node --test templates/landing/*.test.mjs templates/delivery/*.test.mjs
node templates/landing/gate-run.mjs --export templates/landing/fixtures/rows.example.json \
  --gate templates/landing/fixtures/gate.example.json --price 20 \
  --window-start 1000 --window-end 2000 | grep -q "VERDICT: PASS" \
  && echo "gate-run smoke OK" || { echo "gate-run smoke FAIL"; exit 1; }
node templates/delivery/scope-run.mjs --plan templates/delivery/fixtures/plan.example.json \
  --contract templates/delivery/fixtures/contract.example.json --slice a | grep -q "VERDICT: PASS" \
  && echo "scope-run smoke OK" || { echo "scope-run smoke FAIL"; exit 1; }
