---
name: studio-setup
description: >
  LaunchThesis slim onboarding for a project: detect a light project context,
  write .launchthesis/config.yaml from the slim template, and provision the
  studio store plus the product block. Idempotent — re-runs skip completed
  work and repair drift, never overwriting without a diff. Greenfield
  (idea-only, no app) is the normal case. Use via /launchthesis:setup or
  whenever .launchthesis/config.yaml is missing.
---

# LaunchThesis setup — slim onboarding

Detect a light project context, write `.launchthesis/config.yaml` from the slim
template, and provision the studio store + the `product:` block. The flow is
**idempotent**: a re-run skips work that's already done and repairs drift, and
**never overwrites an existing file without showing a diff first**.

Idea-stage is the normal case here — LaunchThesis forms and proves a launch
thesis *before* there's an app. Setup does not require a buildable project.

**Communicate** per `${CLAUDE_PLUGIN_ROOT}/skills/shared/communication.md` — one voice, a
`Setup · step n/3` breadcrumb as you enter each step, and a signpost footer that echoes
every path written plus the next command. Gloss any first-use jargon from
`${CLAUDE_PLUGIN_ROOT}/skills/shared/glossary.md`.

## Step 1 — Detect (light)

Read what's cheaply available to fill the slim config — no testing-driver,
maestro, playwright, or Linear detection.

- **Project name** — from `package.json` `name`, the repo directory, or ask.
- **Stack (optional)** — a light read of `package.json`/lockfiles/layout if an
  app exists (e.g. expo/react-native, vite/next, plain web). Purely
  informational; leave blank if there's no app.
- **Docs / specs dir** — where briefs and reports should land (e.g. `docs/specs`).

**Greenfield (idea-only) is the NORMAL case, not a detection failure.** When
there is no app — just an idea — that is the expected starting point. Write the
config and provision the studio exactly the same way; the stack field stays
blank and validate degrades any unconfigured infra step to planner-mode.

## Step 2 — Configure

Fill `${CLAUDE_PLUGIN_ROOT}/templates/config.template.yaml` from detection,
show the filled result, ask **one consolidated confirmation** question, then
write `.launchthesis/config.yaml`. Never overwrite an existing config without
showing a diff first.

The slim config carries only `project`, `docs`, `product`, `discover`,
`validate`, `studio`, and `modules` (`modules` is just
`discover / product / validate / studio`). There is no `commands:`, `testing:`,
`linear:`, or `delivery:` block.

## Step 3 — Provision studio + product

Stand up the cross-product studio store and capture the `product:` block.

- **Studio store.** Copy `${CLAUDE_PLUGIN_ROOT}/templates/studio/playbook.md`
  and `templates/studio/validation-log.md` into `.launchthesis/studio/` (the
  dir from `studio.dir`). Never overwrite an existing studio file without
  showing a diff. Do **not** copy any `learnings.md` (the two-tier memory tier
  was removed) and do **not** seed any delivery or testing artifacts.
- **Sprints dir.** Create `.launchthesis/studio/sprints/` (from
  `validate.sprints_dir`) and gitignore it — it holds ephemeral per-sprint state.
- **Product block.** In the same consolidated confirmation, capture the
  `product:` block:
  - `positioning` — the current wedge one-liner (a mirror of the in-play
    thesis wedge).
  - `exit_strategy` — the stated exit, or `none`.
  - `sensitive_category` — `true`/`false`.
  - `surfaces` — optional list of screens the strategy step maps plays onto.
  - `playbook_ref` — optional override path to a licensed play-deck reference
    kept outside the plugin (the engine is self-sufficient without it).

  These may be left blank — the `product-strategy` skill self-provisions them
  on the first `/launchthesis:strategy` run.
- **Validate infra tokens.** Fill the validate infra targets from
  detection/confirmation: `DEPLOY_PROVIDER`/`DEPLOY_PROJECT`,
  `DATA_PROVIDER`/`DATA_PROJECT`, and `PAY_PROVIDER`. Leave any unknown target
  blank — `validate` degrades that step to **planner-mode**.
  - When `DATA_PROVIDER` is non-blank, copy
    `${CLAUDE_PLUGIN_ROOT}/templates/landing/server/capture.route.mjs` into the
    project's capture endpoint and set its env (`SUPABASE_URL`,
    `SUPABASE_SERVICE_ROLE_KEY`).
  - When `PAY_PROVIDER` is non-blank, copy
    `${CLAUDE_PLUGIN_ROOT}/templates/landing/server/preauth.route.mjs` and set
    `STRIPE_SECRET_KEY` (LIVE), `LT_PRICE_CENTS`, `LT_CURRENCY`.
  - Adapt the handler signature to the project's framework if it isn't
    Vercel/Node.

## End — orient the founder

When the config is written and the studio store is provisioned:

1. **Render the loop orientation** from
   `${CLAUDE_PLUGIN_ROOT}/skills/shared/communication.md` §6 — the "you are here" map of
   Refine → Research → Strategy → Validate, what each pass produces, and that a cheap NO-GO
   is a win. This is the founder's first-run onboarding: show the full map on a fresh setup;
   on an idempotent re-run, skip the map and print only the footer.
2. **Print the signpost footer** (communication §2), echoing the real paths written:
   - `.launchthesis/config.yaml` (plus any infra routes copied, with their project paths)
   - `.launchthesis/studio/playbook.md` and `.launchthesis/studio/validation-log.md`
   - `Next: /launchthesis:discover <seed>`

End on the plain line: **setup is done — run `/launchthesis:discover <seed>` next.**

## Drift repair

On a re-run, before re-confirming anything:
- A studio file named in config (`studio.dir`) is missing → re-provision it from
  the template (show a diff if a partial file exists).
- `validate.sprints_dir` is missing → re-create it and re-confirm the gitignore.
- An infra provider is set in config but its corresponding server route was
  never copied → flag and copy it, then re-confirm its env vars.
- Never re-overwrite a file the founder has edited without showing the diff.
