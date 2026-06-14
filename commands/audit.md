---
description: Run a BuilderKit Play Audit — turn a demand-validated concept (or live product) into a prioritised, brand-safe build list
argument-hint: [product-or-surface | metric:<name>]
---
Invoke the builderkit `product-strategy` skill (Play Audit) for: $ARGUMENTS. Read
.builderkit/config.yaml and the engine reference first; load the licensed deck from
product.playbook_ref if set. Input is the /builderkit:discover Hardened Hypothesis
Brief (its surfaces sketch) for a pulse-confirmed concept, or an existing product's
surfaces. Runs after Gate D and before the /builderkit:validate sprint — its
conversion/growth plays feed that sprint's asset + GTM. No args → audit the whole
product from its brief/spec/surfaces. `metric:<name>` → run the Insight Loop. Output a
ranked build list in docs.specs_dir; each item is ready for /builderkit:ship.
