---
description: BuilderKit phased onboarding — detect stack, write .builderkit/config.yaml, walk the 4 e2e testing phases
---
Invoke the builderkit `studio-setup` skill and follow it end-to-end. If the
user passed arguments, treat them as scoping (e.g. "phase 3" = jump to that
phase if prior phases are complete).

Setup does NOT require an existing app — an idea-stage founder can run it on an empty
repo and proceed straight to /builderkit:discover.
