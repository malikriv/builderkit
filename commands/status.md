---
description: Show where you are in the LaunchThesis loop — completed stages, the current wedge, your latest artifacts, any open sprint, and the one command to run next
argument-hint: "[slug]"
---
Invoke the launchthesis `status` skill for: $ARGUMENTS. Read-only — it never writes. It
reads `.launchthesis/config.yaml`, the artifacts in `docs.specs_dir`
(`*-launch-thesis.md` / `*-strategy.md` / `*-validation.md` / `*-handoff.md`), the current
wedge (version + status) from the Launch Thesis brief, and any open sprint state in
`.launchthesis/studio/sprints/`, then prints a "you are here" board: which stages are done,
the current wedge, the latest files with their paths, any open sprint (window remaining,
last cursor, honesty-floor drop-off), and the single recommended next command. No args →
the most recent/active thesis; `<slug>` → that thesis.
