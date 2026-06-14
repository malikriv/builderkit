---
description: Take a seed (problem, idea, or population) to a red-team-hardened, reality-probed hypothesis brief
argument-hint: <a problem, an idea, or a population to serve>
---
Invoke the builderkit `discover` skill with the seed: $ARGUMENTS. Read
.builderkit/config.yaml first; if missing, run /builderkit:setup before the
pipeline. The funnel runs cheap-to-expensive (triage → demand smoke → deep
hardening) and ends by writing a Hardened Hypothesis Brief that /builderkit:audit
consumes (build plan), then /builderkit:validate (real cold-pay-proof sprint).
