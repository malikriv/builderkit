# LaunchThesis communication conventions (shared)

The single source of truth for *how every LaunchThesis skill talks to the founder* in the
terminal. `studio-setup`, `discover`, `product-strategy`, `validate`, and `status` all read
this file and apply it. The goal is a guided CLI experience: the founder always knows where
they are, what was just produced, where it landed, and the one command to run next.

This file governs **communication only** — never the gate logic, the honesty floor, or any
validation predicate. A scorecard *renders* a verdict; it never replaces the recompute.

---

## 1. Voice

Match `MANIFESTO.md`: the tool is the actor; the founder ships. Declarative, calm, honest.

- **The tool does the work, the founder gets the result.** "Wrote your Launch Thesis to …",
  not "We've created a document for you."
- **No soft-sell, no false cheer.** A NO-GO is the product working — say so plainly. Never
  inflate a thin result to make the founder feel good (Manifesto #6).
- **Concrete over vague.** Name the file, the count, the next command — not "your results
  are ready."
- **One voice across all skills.** Setup, discover, strategy, and validate should read like
  the same tool, not four different ones.

## 2. Signpost footer (every skill ends with one)

The last thing a skill prints is a compact footer so the founder is never left guessing.
Four parts, in order:

```
✓ <Stage> complete — <one-line outcome>
  Produced:  <artifact> → <relative/path/to/file>
             <artifact> → <relative/path/to/file>
  Verdict:   <VERDICT> (only if this stage gates; see §4 for the scorecard)
  Next:      <the single next command, e.g. /launchthesis:strategy>
```

Rules:
- **Always echo the real, relative path** of every file written or updated — config, brief,
  strategy, report, handoff, studio log. Never write a file silently.
- **Always name exactly one next command** (the recommended one). If the stage killed the
  idea, the next command is still explicit (e.g. "kill recorded → `/launchthesis:discover
  <new seed>`").
- Keep it to a handful of lines. The detail lives in the file; the footer is the map.

## 3. Phase breadcrumb (multi-phase skills)

Skills that move through phases print a one-line breadcrumb when they enter each phase, so a
long run shows progress instead of silence:

```
Discover · D2/4 — Demand smoke
Validate · V0/4 — Instrument + freeze the gate
```

Format: `<Skill> · <phase-id>/<total> — <phase name>`. Phase ids and totals:
- **Setup** — `step 1/3 … 3/3` (Detect · Configure · Provision).
- **Discover** — `D0/4 … D4/4` (Frame · Triage · Demand smoke · Deep hardening · Brief). (Gate
  D is the verdict on the D-funnel, reported via the scorecard, not a numbered phase.)
- **Strategy** — `B1 … B6` (Weight · Map · Flag · Wire · Priority).
- **Validate** — `V0/4 … V4/4` (Freeze · GTM · Conversion brief · Launch · Report).

A breadcrumb is a status line, not a wall of text — one line per phase entry.

## 4. Verdict scorecard (gate points)

At a gate, print a compact scorecard **in the terminal** in addition to writing the verdict
to its file. It is a faithful render of the computed verdict — for Gate V, of the verbatim
`gate-eval.mjs` output (the builder is not the scorer; never hand-author a Gate V verdict).

**Gate D** (discover):
```
┌ Gate D — <GO | NO-GO | ITERATE>
│ Wedge:        <statement>  (v<n>, <status>)
│ Intensity:    <burning | real-but-tolerable | nice-to-have>
│ Pulse:        <pulse | no-pulse>  ·  WTP path: <yes | no>
│ Reachable:    <yes | no>  (<communities the founder can access>)
└ Reason:       <one line>
```

**Gate V** (validate — fields mirror `## Gate V verdict` in
`templates/validate/validation-report.md`):
```
┌ Gate V — <PASS | FAIL | INCONCLUSIVE | NOT-MEASURABLE>   (from gate-eval.mjs)
│ Users:        <N> counted · <W> weighted · cold-weight <CWF> · friend share <FS>
│ Pay-proof:    cold hard pay-proof <YES | NO>
│ Attribution:  <channel_thin | copy_weak | wedge_refuted>   (FAIL only)
│ Drop-off:     abandoned_at = <none | pre_pulse | pre_page | pre_lands | pre_launch | mid_window>
└ Reason:       <one line>
```

Box-drawing is optional; a clean aligned block is the point. Always follow a scorecard with
the §2 footer (the scorecard says *what the verdict is*; the footer says *what to do next*).

## 5. Jargon gloss

LaunchThesis has its own vocabulary. The **first time** a term appears in a run, gloss it in
one clause, then use it freely after:

> …names the **wedge** (the differentiated position an incumbent would avoid copying)…

Terms that always get a first-use gloss: *wedge*, *pulse*, *Gate D*, *Gate V*,
*cold-weight fraction*, *pay-proof*, *abandoned_at / the honesty floor*, *the handoff*.
The full definitions live in `${CLAUDE_PLUGIN_ROOT}/skills/shared/glossary.md` — point the
founder there once per run rather than re-explaining.

## 6. The loop orientation (the "you are here" map)

The canonical map of the loop, rendered live by `studio-setup` on first run and by
`status` on demand. Keep it terse; it orients, it does not lecture. It must stay consistent
with `README.md` and the first-run walkthrough in
`docs/plans/2026-06-17-launchthesis-refocus-scope.md`.

```
LaunchThesis — prove real demand before you build.

  Refine ─→ Research ─→ Strategy ─→ Validate ─→ Handoff
  setup     discover    strategy    validate     (on PASS)
            └ a cheap NO-GO here is a win: it's the weeks you didn't lose ┘

  1. /launchthesis:setup            → writes .launchthesis/config.yaml + the studio store
  2. /launchthesis:discover <seed>  → frames + researches the idea → a named, versioned
                                       wedge in a Launch Thesis brief (or a cheap NO-GO)
  3. /launchthesis:strategy         → the GTM + conversion plan that arms the sprint
  4. /launchthesis:validate         → the 48h cold-pay-proof sprint; recomputes the verdict
                                       from raw receipts → on PASS, the AI-builder handoff

  Lost? /launchthesis:status        → where you are + the one command to run next
```

The tool does the research and the un-gameable scoring; the founder supplies the idea, the
audience, and a quick page. Every run — kills included — compounds the studio playbook, so
the next idea starts smarter.
