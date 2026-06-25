# Validation log — one row per discover/validate run

> Append-only. Row key = the run slug. Record LOSERS with the same tags as winners —
> `kill` / `refuted` rows are logged exactly like wins (recording only survivors bakes
> in survivorship bias). On EVERY run record `abandoned_at` (the honesty-floor drop-off
> — this is the #1 health metric) and the wedge outcome (`wedge_version` +
> `wedge_outcome`). Backfill the `outcome` column opportunistically when you next run any
> command — no scheduler.

| slug | date | seed | archetype | icp_type | primary_channel | channel_standing | gate_d | gate_v | funnel (lands/signup/activation/pay) | cold_weight_fraction | founder_hours | abandoned_at | wedge_version | wedge_outcome | fail_attribution | decision | outcome | outcome_date |
|------|------|------|-----------|----------|-----------------|------------------|--------|--------|--------------------------------------|----------------------|---------------|--------------|---------------|---------------|------------------|----------|---------|--------------|
| 2026-06-25-validation-page-builder | 2026-06-25 | turn the landing template into a standalone micro-SaaS | prosumer | builder | direct_outreach | member | ITERATE | — | —/—/—/— | — | ~0.5 (research) | pre_pulse | 1 | — | — | re-cut wedge to v2 + run D2 pulse | pending | 2026-06-25 |
<!-- abandoned_at ∈ none | pre_pulse | pre_page | pre_lands | pre_launch | mid_window (honesty floor = pre_page/pre_lands) -->
<!-- wedge_outcome ∈ validated | refuted | — -->
<!-- fail_attribution ∈ channel_thin | copy_weak | wedge_refuted | —  (why a non-PASS run failed; drives the re-cut vs re-channel vs variant decision) -->
<!-- outcome ∈ pending | shipped | retained | revenue | killed_in_market | abandoned -->
