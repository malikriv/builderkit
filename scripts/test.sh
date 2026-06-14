#!/usr/bin/env bash
# BuilderKit plugin tests — runs the Node unit tests shipped with templates.
set -uo pipefail
cd "$(dirname "$0")/.."
command -v node >/dev/null || { echo "TEST FAIL: node required"; exit 1; }
node --test templates/landing/*.test.mjs
