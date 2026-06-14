# Validation Report — {{SLUG}}

> Written by /builderkit:validate (V4). The verdict is recomputed by gate-eval.mjs from
> the raw rows; a verdict without its counted rows is a defect (spec C6).

## Sprint
- Window: {{WINDOW_START}} -> {{WINDOW_END}} (clock from first qualified impression)
- WARM channels: {{CHANNELS}} · budget spent: {{SPEND}} / {{BUDGET_CAP}}
- Frozen-predicates hash: {{PREDICATES_HASH}}

## Funnel (per tier x cohort)
| tier | cold_public | warm_dm | friend | unverifiable |
|------|-------------|---------|--------|--------------|
| lands | | | | |
| signups | | | | |
| activations | | | | |
| pay-proof | | | | |

## Gate V verdict (from gate-eval.mjs)
- Verdict: {{PASS | FAIL | INCONCLUSIVE | NOT-MEASURABLE}}
- Reason: {{REASON}}
- Counted users: {{N}} · weighted: {{W}} · cold-weight fraction: {{CWF}} · friend share: {{FS}}
- Cold hard pay-proof: {{YES | NO}}
- Raw counted rows (ts · tier · cohort · predicate satisfied · exclusions applied):
  {{ROWS}}

## Captured cold-user list (the waitlist — GOLD; PII lives in validate.data.*, never studio/)
{{...}}

## Delivery commitment (binding Phase-0 input for /builderkit:ship)
- The promise the winning page made (feature, price, delivery window stated to payers): {{...}}
- Paid cohort: {{...}}
- First-access deadline ({{MAX_DAYS}} days, from validate.delivery.max_days_to_first_access): {{...}}
- Machine-readable contract emitted: `docs.specs_dir/sold-scope.yaml` (the ship scope
  guard checks every shippable slice against it — see scope-check.mjs).

## Recommendation
{{proceed to /builderkit:ship | iterate-GTM (variant before kill) | back to /builderkit:discover | kill}}
