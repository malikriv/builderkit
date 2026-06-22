---
name: status
description: >
  LaunchThesis "you are here" board: a read-only snapshot of where a project sits in the
  Refine → Research → Strategy → Validate loop. Reads .launchthesis/config.yaml, the
  artifacts in docs.specs_dir, the current wedge (version + status) from the Launch Thesis
  brief, and any open sprint state in .launchthesis/studio/sprints/, then prints the
  completed stages, the current wedge, the latest files with their paths, any open sprint
  (window remaining, last cursor, honesty-floor drop-off), and the single recommended next
  command. NEVER writes. Use via /launchthesis:status or when the user asks "where am I",
  "what's next", or "what's the state of this idea".
---

# /status — where you are in the loop

A read-only orientation board. It answers three questions a CLI founder loses track of:
*what have I finished, what's the state of my idea right now, and what's the one command to
run next.* **This skill never writes a file, mutates config, or advances any cursor** — it
only reads and reports.

Communicate per `${CLAUDE_PLUGIN_ROOT}/skills/shared/communication.md` (voice, the loop
orientation in §6, the breadcrumb/footer conventions, and first-use glossary glosses from
`${CLAUDE_PLUGIN_ROOT}/skills/shared/glossary.md`).

## Read (never write)

1. **Config.** Read `.launchthesis/config.yaml`. Missing → there is no project yet; print
   the loop orientation (communication §6) and stop with `Next: /launchthesis:setup`.
2. **Stage artifacts.** In `docs.specs_dir`, detect which stages have produced output:
   - Refine + Research → `<docs.specs_dir>/*-launch-thesis.md`
   - Strategy → `<docs.specs_dir>/*-strategy.md`
   - Validate → `<docs.specs_dir>/*-validation.md` and, on a PASS,
     `<docs.specs_dir>/*-handoff.md`
   With a `<slug>` argument, scope to that thesis; with no argument, pick the most recently
   modified Launch Thesis brief (the active idea).
3. **Current wedge.** From the selected Launch Thesis brief, read the versioned wedge object
   — its `statement`, `version`, and `status` (candidate | named | validated | refuted).
4. **Open sprint.** If `<validate.sprints_dir>/<slug>.yaml` exists, read (do not modify) its
   window bounds, `gate_status`, `last_event_cursor`, `tier_counts`, and `abandoned_at`.
5. **Studio.** Optionally note the last few rows of `.launchthesis/studio/validation-log.md`
   for prior outcomes on this project (aggregate only — no PII).

## Print — the "you are here" board

A single compact board, in this order:

- **The loop map** with the current stage marked (render communication §6, marking where
  this idea sits).
- **Stages** — a checklist of Refine / Research / Strategy / Validate showing done · in
  progress · not started, each done stage naming its artifact path.
- **Current wedge** — `statement` (v`<n>`, `<status>`), glossed on first mention.
- **Open sprint** (only if one exists) — phase breadcrumb (`Validate · V3/4`), window time
  remaining, last cursor, and `abandoned_at` if past `none` (surface honesty-floor drop-off
  `pre_page`/`pre_lands` plainly — it is the #1 health metric, not a failure to hide).
- **Footer** (communication §2) — the single recommended **Next** command, chosen from state:
  - no config → `/launchthesis:setup`
  - config but no brief → `/launchthesis:discover <seed>`
  - brief, no strategy → `/launchthesis:strategy`
  - strategy, no/closed sprint → `/launchthesis:validate`
  - open sprint mid-window → `/launchthesis:validate poll`
  - wedge `refuted` → `/launchthesis:discover` (re-cut the wedge)
  - wedge `validated` + handoff written → paste the handoff's build prompt into your builder

Report honestly: if a stage is half-done or an artifact is missing where config implies it
should exist, say so — never imply progress that isn't on disk.
