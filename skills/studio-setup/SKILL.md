---
name: studio-setup
description: >
  BuilderKit phased onboarding for a project: detect stack, write
  .builderkit/config.yaml, then walk the 4 e2e testing phases one at a time,
  each scaffolded from plugin templates and verified live before the next.
  Idempotent — re-runs skip completed phases and repair drift. Use via
  /builderkit:setup or whenever .builderkit/config.yaml is missing.
---

# BuilderKit setup — phased onboarding

## Step 1 — Detect

Read package.json(s), lockfiles, repo layout:
- deps `expo`/`react-native` → stack `expo`, driver `maestro`
- `vite`/`next` + web entry → stack `web-pwa`/`web`, driver `playwright`
- existing e2e dirs (`.maestro/`, `e2e/`, `playwright.config.*`), CI
  workflows, test runners, monorepo workdir.
- Monorepo with both (e.g. an Expo app plus a vite/next site): detect at the chosen `commands.workdir`; if that package has both, expo/RN wins (it's the shippable app). Surface the ambiguity in the Step 2 confirmation.
- Linear MCP reachability (`list_teams`); note the team key for this product.

## Step 2 — Configure

Fill `${CLAUDE_PLUGIN_ROOT}/templates/config.template.yaml` from detection,
show the result, get the user's confirmation (one consolidated question),
write `.builderkit/config.yaml`. Never overwrite an existing config without
showing a diff first.

## Step 2.5 — Provision discover / validate / studio

The config template now carries `discover:`, `validate:`, `studio:` sections and
`modules.discover/validate` (written in Step 2). Additionally:

- If `modules.discover` or `modules.validate` is true, create the studio store:
  copy `${CLAUDE_PLUGIN_ROOT}/templates/studio/playbook.md` and
  `templates/studio/validation-log.md` into `.builderkit/studio/` (the dir from
  `studio.dir`), and create `.builderkit/studio/sprints/` (from `validate.sprints_dir`).
  Never overwrite an existing studio file without showing a diff.
- Fill the new template tokens from detection/confirmation:
  `SPECS_DIR` (= `docs.specs_dir`), and the validate infra targets
  `DEPLOY_PROVIDER`/`DEPLOY_PROJECT`, `DATA_PROVIDER`/`DATA_PROJECT`,
  `PAY_PROVIDER`. Leave any unknown infra target blank — `validate` degrades that
  step to planner-mode (constraint C2).
- gitignore `.builderkit/studio/sprints/` (ephemeral per-sprint state).

## Step 3 — Walk the four phases

For each phase NOT in `testing.phases_complete` (in order 1→4): explain what
it gives, scaffold it, VERIFY it live, then append the phase number to
`phases_complete` and commit. Stop cleanly between phases if the user wants —
each is independently useful.

1. **Dev-login.** maestro/env-creds: a dev-only login mode wired to
   `commands.dev` (build-flag-gated, creds in a gitignored env file; confirm
   the release pipeline nulls the flag). playwright/storage-state: install
   the auth.setup template as a setup project and merge the Playwright config
   template (never overwrite an existing playwright config — merge); fill
   variant A (server auth) or B (local-first seed) and delete the other (the
   unused `expect` import is intentional until you pick). Variant B seeds a
   minimal inline fixture now; phase 2 promotes it to `testing.seed.seed_file`
   and proves idempotent reset. VERIFY:
   `commands.dev` boots to a signed-in/seeded session with zero typing.
2. **Seed + selectors.** Create/point at `testing.seed.seed_file`; add stable
   selectors (testID / data-testid) to every element the smoke flow will
   target, including `testing.boot_sentinel_testid`. VERIFY: seed applies
   cleanly twice (idempotent reset).
3. **Flows + evidence.** Scaffold boot + smoke from the driver's template
   directory, fill placeholders per the token map below, gitignore the
   evidence dir (and `.auth/` for playwright), add `commands.e2e` /
   `commands.e2e_smoke` scripts. VERIFY: smoke green twice, evidence PNG
   lands in `testing.evidence_dir`.
4. **CI gate.** Install the driver's ci-workflow template at
   `testing.ci.workflow`, set repo secrets (`gh secret set
   E2E_DEV_LOGIN_EMAIL` / `E2E_DEV_LOGIN_PASSWORD`), push, dispatch once.
   VERIFY: run green + evidence artifact downloads. Recommend branch
   protection once a few runs are green.

## Token map (template double-brace token → config key)

Templates live in `${CLAUDE_PLUGIN_ROOT}/templates/<driver>/`. When copying
one into the project, substitute every double-brace token from config:

| Token | Config key | Shape |
|---|---|---|
| `APP_ID` | `testing.app_id` | scalar (maestro only) |
| `BOOT_SENTINEL_TESTID` | `testing.boot_sentinel_testid` | scalar |
| `CI_NAME` | `testing.ci.workflow_name` | scalar |
| `CI_RUNNER` | `testing.ci.runner` | scalar or flow array |
| `APP_PATHS` | `testing.ci.app_paths` | YAML list — render one `- glob` item per entry, same indent |
| `WORKDIR` | `commands.workdir` | scalar |
| `DEV_COMMAND` | `commands.dev` | scalar |
| `DEV_PORT` | `commands.dev_port` | scalar (playwright only) |
| `DEV_LOGIN_ENV_FILE` | `testing.dev_login.env_file` | scalar |
| `FLOWS_DIR` | `testing.flows_dir` | scalar |
| `EVIDENCE_DIR` | `testing.evidence_dir` | scalar |
| `SPECS_DIR` | `docs.specs_dir` | scalar |
| `DEPLOY_PROVIDER` / `DEPLOY_PROJECT` | `validate.deploy.*` | scalar (blank → planner-mode) |
| `DATA_PROVIDER` / `DATA_PROJECT` | `validate.data.*` | scalar (blank → planner-mode) |
| `PAY_PROVIDER` | `validate.payments.provider` | scalar (blank → planner-mode) |

Hand-authored tokens (no config key — the agent writes project-specific
lines in their place): `TAB_SWEEP` (one tapOn per primary-nav testid),
`NAV_SWEEP` (one getByTestId click + assert per primary surface),
`SEED_MODULE` (the seed fixture import/inline in auth.setup),
`DEV_CLIENT_BUILD_COMMAND` (the project's one-time dev-client native build command (maestro only), e.g. an expo run:ios script wired to the dev-login env).

## Drift repair

On re-run, before phases: config says driver X but its flows dir/workflow is
missing → flag and re-scaffold; commands in config that no longer exist in
package.json → flag and re-confirm; double-brace tokens left unsubstituted in
scaffolded files (`grep -rn '[{][{]' <scaffolded paths>`) → fill from the
token map.
