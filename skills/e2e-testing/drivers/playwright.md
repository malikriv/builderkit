# Playwright driver (web / PWA)

Web translation of the 4-phase system. Same invariants as the Maestro driver,
different mechanics. Config: `testing.driver: playwright`.

## Phase 1 — Real-auth dev-login → `storageState`

`${CLAUDE_PLUGIN_ROOT}/templates/playwright/auth.setup.ts` scaffolds a setup
project that produces `e2e/.auth/state.json` (gitignored). Two variants —
pick per app:

- **Server-auth app**: the setup signs in once with creds from env
  (`E2E_DEV_LOGIN_EMAIL` / `E2E_DEV_LOGIN_PASSWORD`, local source =
  `testing.dev_login.env_file`) and saves cookies + localStorage.
- **Local-first app (no server auth)**: the setup seeds
  localStorage/IndexedDB directly with the fixture state (Phase 2's seed) and
  saves it. `storageState` covers both cases — that IS the dev-login
  equivalent for local-first PWAs.

All test projects depend on the setup project and load the saved state, so
every spec starts signed-in/seeded with zero UI typing.

## Phase 2 — Seed + selectors

- Seed: a fixture module the setup project applies (`testing.seed.seed_file`).
  Re-running the setup project = clean reset.
- Selectors: `data-testid` ONLY (`page.getByTestId(...)`). Never match
  display copy — same rule (and same reason) as the Maestro testID rule.

## Phase 3 — Flows + evidence

- One `smoke.spec.ts` (boot → primary-nav sweep, tagged `@smoke`), then one
  spec per requirement tagged `@features`, test names carrying the
  requirement ID, in `testing.flows_dir`.
- Evidence via the `evidence()` helper
  (`${CLAUDE_PLUGIN_ROOT}/templates/playwright/evidence.ts`):
  `await evidence(page, 'R3-after-save')` → PNG into `testing.evidence_dir`.
- `trace: 'on-first-retry'` in the Playwright config; traces are the debug
  artifact, evidence PNGs are the proof artifact — keep them separate.

## Phase 4 — CI gate

Hosted runner (`testing.ci.runner`, usually `ubuntu-latest`):
`npx playwright install --with-deps chromium`, run `@smoke` on PRs, full pack
on dispatch/nightly. Upload `testing.evidence_dir` always; upload
`playwright-report/` + traces on failure only. Same remote-session commands
as every driver (`gh workflow run` → `gh run download`).

## Notes (hard-won, web)

- **Polling, not sleeps.** `await expect(locator).toBeVisible()` auto-retries —
  the `extendedWaitUntil` equivalent. A bare `waitForTimeout` is a flake
  factory; lint flows for it.
- **Boot sentinel**: assert one testid that only renders signed-in/seeded
  (the web equivalent of the Maestro boot-sentinel testID) before any flow
  step.
- **Service workers** (PWA): a stale SW can serve old bundles in CI — use a
  fresh browser context per run (default) and don't persist the SW cache
  into storageState.
- **One worker for stateful suites.** If specs mutate the seeded state, run
  `workers: 1` (the web version of the one-simulator queue) or isolate state
  per worker.
- **Evidence determinism**: fixed viewport in config; full-page screenshots
  only when layout length is the assertion.
