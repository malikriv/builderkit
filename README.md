# BuilderKit

BuilderKit is an app-studio delivery orchestrator for Claude Code. It bundles a production-grade **ship-feature pipeline**, a **4-phase end-to-end testing system** (Maestro for Expo/iOS, Playwright for web), and **Linear integration** into one plugin — born from a production app's battle-tested workflow and generalized so any project can adopt it. Everything is driven by a per-project config at `.builderkit/config.yaml`, so the same skills work across stacks without hard-coding a single project literal.

## Install

Add the marketplace and install the plugin:

```
/plugin marketplace add malikriv/builderkit
/plugin install builderkit@builderkit
```

To pin BuilderKit for a whole team, add it to the project's `.claude/settings.json` instead so every clone picks it up automatically:

```json
{
  "extraKnownMarketplaces": {
    "builderkit": { "source": { "source": "github", "repo": "malikriv/builderkit" } }
  },
  "enabledPlugins": { "builderkit@builderkit": true }
}
```

## Quickstart

1. Run `/builderkit:setup` once per project. It detects your stack, confirms the generated config, and walks the 4 testing phases one at a time — each scaffolded from plugin templates and verified live before moving on.
2. From then on, run `/builderkit:ship <request>` for delivery work — feature, bug fix, design correction, or user feedback.

## The product chain (discover → validate → ship)

BuilderKit now starts *before* the build. `/builderkit:discover` hardens a raw seed
into a validated hypothesis (symmetric need assessment, an evidence-bound red-team
panel, a cheap human reality probe, Gate D). `/builderkit:validate` (next module)
runs a 48-hour guerrilla GTM sprint and gates on real cold-stranger willingness to
pay before `/builderkit:ship` builds it. A cross-product studio playbook
(`.builderkit/studio/`) accumulates priors so each new product starts smarter.

## Commands

| Command | What it does |
| --- | --- |
| `/builderkit:setup` | Phased onboarding: detect stack, write `.builderkit/config.yaml`, walk the 4 e2e testing phases. |
| `/builderkit:discover <seed>` | Take a problem/idea/population to a red-team-hardened, reality-probed Hypothesis Brief (Gate D). Feeds `/builderkit:validate`. |
| `/builderkit:ship <request>` | 8-phase delivery pipeline (intake → recon → analysis → requirements → QA plan → implementation → verification → ship) with Linear journaling. |
| `/builderkit:linear-issue <id>` | Take one Linear issue end-to-end: read → implement → verify → deploy → close with proof. |
| `/builderkit:e2e [smoke\|full\|new <R-id>]` | Run or scaffold e2e flows per the 4-phase testing system. |

## Configuration

Written by `/builderkit:setup`, read by every skill at start, and overridden by the project's `CLAUDE.md` where they conflict.

```yaml
# BuilderKit per-project config — written by /builderkit:setup, read by every
# builderkit skill at start. Repo CLAUDE.md overrides this file where they conflict.
config_version: 1

project:
  name: {{PROJECT_NAME}}
  stack: {{STACK}}            # expo | web-pwa | web

commands:
  workdir: {{WORKDIR}}        # dir all commands run from ("." or e.g. apps/mobile)
  typecheck: {{TYPECHECK}}    # e.g. npx tsc --noEmit
  unit: {{UNIT}}              # e.g. npx jest | npx vitest run
  e2e: {{E2E}}                # e.g. npm run e2e | npx playwright test
  e2e_smoke: {{E2E_SMOKE}}    # fast pack, e.g. npm run e2e:smoke | npx playwright test --grep @smoke
  dev: {{DEV}}                # dev server w/ test auth, e.g. npm run start:devlogin | npm run dev
  dev_port: {{DEV_PORT}}    # port commands.dev serves on (web: used by the Playwright webServer block)

testing:
  driver: {{DRIVER}}          # maestro | playwright
  app_id: {{APP_ID}}          # maestro only: iOS bundle id
  boot_sentinel_testid: {{BOOT_SENTINEL_TESTID}}  # testID/data-testid that only renders signed-in — flows + auth setup assert it
  flows_dir: {{FLOWS_DIR}}    # e.g. apps/mobile/.maestro/ | e2e/
  evidence_dir: {{EVIDENCE_DIR}}  # screenshot evidence output (gitignored)
  phases_complete: []         # setup resume state, subset of [1,2,3,4]
  dev_login:
    mode: {{DEV_LOGIN_MODE}}  # env-creds (native dev client) | storage-state (web)
    env_file: {{ENV_FILE}}    # env-creds: gitignored file holding test creds
  seed:
    account: {{SEED_ACCOUNT}} # seeded test account identity (or "local-fixture")
    seed_file: {{SEED_FILE}}  # SQL/script/fixture that resets the test state
  ci:
    workflow: {{CI_WORKFLOW}}        # path, e.g. .github/workflows/e2e.yml
    workflow_name: {{CI_NAME}}       # display name for `gh workflow run`
    runner: {{CI_RUNNER}}            # ubuntu-latest | [self-hosted, macOS, maestro]
    app_paths: {{APP_PATHS}}      # YAML list of app-code globs that trigger PR e2e runs

linear:
  team: {{LINEAR_TEAM}}       # team key, e.g. ACME
  url: {{LINEAR_URL}}         # linear.app/<org>/team/<KEY>

docs:
  specs_dir: {{SPECS_DIR}}    # spec docs home, e.g. docs/specs/
  design_dirs: []             # optional: where design references live

modules:
  delivery: true
  testing: true
  linear: true
```

## The 4-phase testing system

- **Phase 1 — Real-auth dev-login.** Tests run against a REAL signed-in session, not a mocked one, so authed flows behave exactly as they do for a user.
- **Phase 2 — Seeded test state + stable selectors.** A deterministic seed resets known state and flows target stable `testID`/`data-testid` selectors instead of brittle text.
- **Phase 3 — Per-requirement flows + screenshot evidence.** Each requirement gets its own flow that produces screenshot evidence for review and ticket attachment.
- **Phase 4 — CI gate.** The packs run in CI and gate the PR when app code changes.

The driver-agnostic core lives in `skills/e2e-testing/`; platform specifics are in `skills/e2e-testing/drivers/maestro.md` (Expo/iOS) and `skills/e2e-testing/drivers/playwright.md` (web).

## Extending

BuilderKit is modular. A future module is just a new skill directory under `skills/`, a matching command under `commands/`, and its own section in the config. Each project also keeps a `.builderkit/learnings.md` — hard-won lessons captured per project that feed improvements back into this repo. That's the studio improvement loop: projects learn, the kit gets sharper.
