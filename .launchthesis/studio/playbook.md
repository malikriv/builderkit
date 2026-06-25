# Studio playbook — cross-product priors

> Aggregate patterns ONLY. Never store raw emails or per-user rows here (PII lives
> in the project's validate.data store, under `.launchthesis/`). Priors are advisory
> and can NEVER auto-fail a gate. Down-weight entries older than ~90 days.

## How to read this file
Every entry carries a `status` and a sample count:
- `hypothesis (n=1)` — an untested guess from a single run. Surface as "untested guess".
- `supported (n>=k)` — corroborated across >= studio.promote_after_k runs AND >= 2 distinct ICPs.

## Wedge patterns → conversion
<!-- The versioned wedge is the subject of the thesis. Track which wedge PATTERNS
     (the cross-product shape of the position, NOT a specific product's wording or
     any PII) convert cold strangers. A row is `hypothesis` until corroborated;
     promote to `supported` per the rules above. A refuted wedge is recorded too —
     a pattern that consistently fails to convert is as valuable a prior as one that
     wins. Aggregate only; no PII. -->
<!-- | wedge pattern | icp_type | status (hypothesis|supported) | runs | cold land→pay rate | note | -->

## GTM tactics that converted (by ICP type)
<!-- | tactic | icp_type | channel | status | runs | cold land→pay rate | note | -->

## Landing patterns that converted
<!-- | pattern | icp_type | status | runs | note | -->

## Panel-vs-outcome ledger (does a red-team verdict predict the market?)
<!-- A red-team kill is OPINION until the market rules. Log a kill pattern as
     predictive ONLY when: a Gate-D-passing concept later failed for the named
     reason, OR a panel-doubted concept then passed Gate V (a disconfirmation).
     Bias writeback toward disconfirmations. -->
<!-- | predicted_failure | concept_slug | market_outcome | predictive? | -->

## Community standing spent (don't re-burn wells across products)
<!-- | venue | icp_type | pitch_angle | date | outcome | -->
