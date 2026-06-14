# Project learnings — permanent rules

> The PERMANENT tier of BuilderKit's two-tier memory. **Findings** are per-run
> discoveries (they live in the run's spec doc and propagate across waves within a build).
> **Learnings** are rules promoted here once a finding recurs across >= `studio.promote_after_k`
> runs — they persist across all future builds. Every ship run reads this file at Phase 0,
> before building.
>
> Promote a finding to a learning only when it has bitten more than once. Each rule states
> its enforcement level so the orchestrator knows whether it's a hard stop or a nudge.

## How to read this file
Each rule carries an `enforcement`:
- `critical` — a hard stop; ship must not violate it (e.g. "never edit the generated
  schema by hand").
- `guideline` — a strong default; deviate only with a written reason in the spec doc.
- `info` — context worth knowing; non-blocking.

## Rules
<!-- | rule | enforcement | promoted_from (runs/slugs) | date | note | -->

## Anti-patterns (don't do this again)
<!-- | anti-pattern | why it bit | enforcement | runs seen | -->
