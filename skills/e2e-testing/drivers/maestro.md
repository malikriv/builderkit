# Maestro E2E flows

End-to-end flows that drive the iOS simulator against a **real signed-in session**
(the dev-login mode — phase 1 of the BuilderKit testing system), so authed behavior — the bug class the stub bypass
can't reach (401s on every authed call) — is actually exercised.

## One-time setup

1. **Install Maestro + a JDK** (Maestro is a JVM app and needs Java on PATH):
   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash   # installs to ~/.maestro
   brew install openjdk                                 # Maestro 2.x does NOT bundle a JRE
   # add both to ~/.zshrc (new shell after), then verify:
   echo 'export PATH="$HOME/.maestro/bin:/opt/homebrew/opt/openjdk/bin:$PATH"' >> ~/.zshrc
   maestro --version    # if "Unable to locate a Java Runtime": the openjdk PATH/JAVA_HOME isn't set
   ```
   (Maestro reads `JAVA_HOME` first, else `java` on PATH — `export JAVA_HOME=/opt/homebrew/opt/openjdk` also works.)

2. **Seed the test state** — apply `testing.seed.seed_file` so `testing.seed.account` has a known state (one-time / whenever you want a clean reset). Document the seeded fixtures in a README inside `testing.flows_dir`.

3. **`testing.dev_login.env_file`** must hold the dev-login creds (env-creds mode):
   ```
   EXPO_PUBLIC_DEV_LOGIN_EMAIL=<test-account-email>
   EXPO_PUBLIC_DEV_LOGIN_PASSWORD=<the sandbox password>
   ```

## Running

Every flow YAML declares `appId: <testing.app_id>` at the top — the iOS bundle id from config.

In one terminal, run `commands.dev` from `commands.workdir` and keep it running — it bakes the dev-login flag + creds into the bundle.
The Expo **dev client** must already be installed on the booted simulator
(one-time manual prerequisite: build + install the Expo dev client with the dev-login env baked in — e.g. `expo run:ios` wired to the same env as `commands.dev`; native config changes require this rebuild). Then in another terminal:
`maestro test <testing.flows_dir>` for the whole suite, a single flow path for one flow, or the project's `commands.e2e` / `commands.e2e_smoke`.

Flows `takeScreenshot` named evidence per requirement into `testing.evidence_dir`
(gitignored) — those PNGs are what gets attached to the per-item Linear ticket
per `/builderkit:ship`.

## Flows

Keep a flows table in `<testing.flows_dir>/README.md` per project: flow, tags, what it proves.

`common/boot.yaml` is the shared boot preamble (runFlow target only — the root
`*.yaml` glob never runs it standalone).

## CI — self-hosted runner

`testing.ci.workflow` runs on the **self-hosted Mac runner**
(labels `testing.ci.runner`; register the runner as a LaunchAgent so it survives
reboots while the user is logged in). The self-hosted Mac reuses the installed
dev client + a Metro started from the CI checkout (JS-only coverage; rebuild
the client manually after native changes).

- **Triggers**: PRs touching app paths run the smoke pack; nightly cron +
  `workflow_dispatch` (suite input) run the full pack. One run at a time
  (shared simulator, queued).
- **Guards**: fails fast if port 8081 is owned by an interactive Metro, or if
  `testing.app_id` is not installed on the sim.
- **Secrets**: `E2E_DEV_LOGIN_EMAIL` / `E2E_DEV_LOGIN_PASSWORD` — CI writes them into `testing.dev_login.env_file` as the `EXPO_PUBLIC_DEV_LOGIN_*` vars at build time.
- **Artifacts**: `testing.evidence_dir` evidence PNGs + Maestro debug output
  upload as the evidence artifact (14-day retention).
- Flows that WRITE to the seeded account are fine for a single-runner queue,
  but add a seed-reset step before adding more writers.

### Remote sessions (no Mac, e.g. cloud Claude Code)

```bash
gh workflow run "<testing.ci.workflow_name>" --ref <branch> -f suite=full
gh run watch
gh run download -n maestro-artifacts   # evidence PNGs → attach to Linear
```

The runner Mac must be awake; offline runs queue until it returns.

**To enforce:** require the `e2e` check under branch protection once a few PR
runs are green.

## Notes (hard-won)

- **No `clearState`.** On a dev client it wipes the saved Metro URL and strands the
  app on the server-picker launcher. Use a plain `launchApp`; it still tears down +
  re-fetches from Metro. Onboarding is gated server-side (the seeded account lands
  straight in the tabs).
- **testID-only selectors.** RN `<Text>` is matchable via `maestro hierarchy` but
  flaky to match in-test through XCUITest (the greeting, loved-one rows, etc. fail);
  `testID` (accessibilityIdentifier) matches reliably. Add a testID to anything a
  flow targets.
- **`extendedWaitUntil { id: <your boot-sentinel testID (an element that only mounts in the authenticated layout)> }`** rides out the cold dev-client reload +
  async dev-login before asserting.
- **Submit text inputs via the keyboard Return** (`pressKey: Enter` → `onSubmitEditing`)
  when the submit button sits below the keyboard — a tap on an occluded button lands
  on the keyboard instead.
- **Dev-login skips the biometric lock** — otherwise Face ID
  blocks every flow at launch and Maestro can't satisfy the host-menu match.
- **Fixture refresh token:** the seeded Google connection can't refresh against
  Google, so the 15-min live sync fails by design — inbox/assign read flows use the
  seeded cache. For live sync, do a one-time real Google connect on the seeded account.
- **Never `retry`-wrap a toggle tap.** Retrying `tapOn: Edit` after a
  successful first attempt lands the second tap on the button that REPLACED
  it (Save, same spot) — and a no-change Save exits edit mode, un-doing the
  state the retry waits for. Use a `runFlow` + `when: notVisible` gated
  second tap instead (see the gated re-tap pattern below): idempotent, can't mis-tap.
- **`hideKeyboard` before tapping anything below the fold.** A focused input
  leaves the keyboard up; a tap on an element underneath lands on the keys.
- **Suite-context taps occasionally drop** (warm XCUITest session: a flow can
  pass solo and fail mid-suite). The gated re-tap pattern above absorbs it.
- **Date-pinned seed data ages.** Flows that page back through time looking for
  seeded records eventually fall out of their search window; re-applying the seed
  restores the canonical dates.

## Gated re-tap pattern

```yaml
# Idempotent second tap — replaces retry-wrapping a toggle tap:
- tapOn: { id: "edit-button" }
- runFlow:
    when: { notVisible: { id: "save-button" } }
    commands:
      - tapOn: { id: "edit-button" }
```
