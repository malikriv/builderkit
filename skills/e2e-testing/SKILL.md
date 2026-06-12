---
name: e2e-testing
description: >
  BuilderKit 4-phase e2e testing system: (1) real-auth dev-login, (2) seeded
  test state + stable selectors, (3) per-requirement flows with screenshot
  evidence, (4) CI gate. Driver-agnostic core; dispatches to
  drivers/maestro.md (Expo/iOS) or drivers/playwright.md (web) per
  .builderkit/config.yaml. Use when writing, running, or scaffolding e2e
  flows, or when a verification gate needs e2e evidence.
---

# BuilderKit e2e testing system

Read `.builderkit/config.yaml` first. No config → stop and point the user at
`/builderkit:setup`. Then read `drivers/<testing.driver>.md` in this skill's
directory — it holds the platform-specific rules. This file holds the rules
that are true on every platform.

## The four phases (each independently useful)

1. **Real-auth dev-login.** Tests must run against a REAL signed-in session,
   not a stub bypass — authed API calls are the bug class stubs can't reach.
   The mechanism is driver-specific (env-creds baked into a dev build vs a
   saved storage state); the invariant is: `commands.dev` boots straight into
   a signed-in session with zero manual typing, and the mechanism is
   dev-only (never ships: build-flag gated and/or gitignored).
2. **Seeded test state + stable selectors.** A dedicated test account/fixture
   (`testing.seed`) with a KNOWN state the flows assert against, re-appliable
   for a clean reset. Every element a flow targets gets a stable selector
   (testID / data-testid) — never match on display text.
3. **Per-requirement flows + evidence.** One smoke flow (boot + primary-nav
   sweep) plus one flow per shipped requirement, named after the requirement
   ID. Every flow captures named screenshots (`<R-id>-<step>`) into
   `testing.evidence_dir`. Those PNGs are the verification evidence attached
   to Linear tickets and PRs.
4. **CI gate.** The suite runs in CI (`testing.ci.workflow`) on every PR
   touching app code; evidence uploads as an artifact; the check becomes
   required once stable.

## Conventions (all drivers)

- **Run twice when new.** A brand-new flow runs green twice before it counts —
  suite context exposes flake that solo runs hide.
- **Evidence naming**: `<R-id>-<step>.png` (e.g. `R3-after-save.png`),
  deterministic, regenerated every run, gitignored.
- **Smoke pack vs feature pack**: tag flows (`smoke` / `features`) so PRs run
  fast smoke and nightly/dispatch runs the full pack.
- **Remote runs** (no local device/browser): trigger CI remotely and pull
  evidence — `gh workflow run "<testing.ci.workflow_name>" --ref <branch>`,
  `gh run watch`, `gh run download` the evidence artifact.
- **Flake handling**: a failed step is a finding, not a retry target — read
  the driver doc's flake notes before adding waits or retries.

## Scaffolding

Templates live in the plugin's `templates/<driver>/` directory. Use
`/builderkit:setup` (phased) to scaffold; `/builderkit:e2e` to run packs or
add a new flow from the conventions above.
