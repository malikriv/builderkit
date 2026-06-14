# Red-team personas (evidence-bound test-designers, not a kill-jury)

Six personas, run in parallel via the built-in `Workflow` orchestrator, then a
verify pass. Each is BOUND to a specific evidence slice from D1/D2. Their job is to
surface the assumptions most likely to be fatal and rank them — NOT to render a
verdict on the idea's worth (that is Gate V's job, with real users).

## The six lenses

| # | Persona | Bound to | Kills by asking |
|---|---------|----------|-----------------|
| 1 | Skeptical customer | D1 review/complaint corpus | "I wouldn't pay / wouldn't switch because…" |
| 2 | Demand realist | D1 frequency/recency data | vitamin vs painkiller? how often? how urgent? |
| 3 | Monetization hawk | D2 competitor pricing + existing spend | will anyone pay, and *enough*? |
| 4 | Moat / competitor critic | D1 competitor scan | why doesn't this exist already; why won't an incumbent crush it? |
| 5 | Founder-bias auditor | the D1 claims the seed leans on | which beloved assumption does the evidence not support? |
| 6 | Distribution realist | the concrete community list + founder-access map | can the founder cheaply reach these people *personally*? |

## Hard rules (these make the panel earn its keep)

1. **Evidence-bound.** Any kill OR defense that cites no external evidence is logged
   `unsupported` and CANNOT gate.
2. **No asymmetric verify.** An under-evidenced *customer-demand / WTP* kill is NOT
   "refuted" merely for being under-evidenced pre-sprint — it is promoted to the TOP
   of the riskiest-assumptions ledger as the thing the sprint must disconfirm first.
3. **Provenance tags.** Every surviving assumption is tagged
   `{model-opinion | cited-external-source | real-human-contact}`.
4. **Correlated-prior check.** If all six agree in either direction, flag
   "unanimous = possible correlated prior" and run ONE external tie-break check
   before the verdict counts (bounded by `discover.red_team.max_rounds`).

## Output: the riskiest-assumptions ledger
A single ranked list (not per-persona verdicts). The #1 item becomes the headline the
validation sprint is built to disconfirm first. Lower-ranked surviving assumptions
become sprint tests in the brief, never blockers.

## Gate D (`kill_threshold: evidence_gated`) fails ONLY on:
- (a) no plausible WTP path from real spend data, OR
- (b) no cheaply-reachable audience the founder can personally access (cannot name
  >= 2 communities with non-zero standing), OR
- (c) an unresolved TOP-ranked assumption whose provenance is `model-opinion` with no
  cheap test path, OR
- (d) a D3 intensity verdict of `nice-to-have`.

Everything else proceeds — Gate D is neutral triage ("no fatal flaw found on paper"),
and the $50 sprint is the real backstop.
