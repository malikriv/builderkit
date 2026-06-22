#!/usr/bin/env bash
# LaunchThesis plugin lint — structural checks + portability guards.
# Usage: scripts/lint.sh [--complete]   (--complete also enforces the full file manifest)
set -uo pipefail
cd "$(dirname "$0")/.."
FAIL=0
err() { printf 'LINT FAIL: %b\n' "$*"; FAIL=1; }

# 1. Valid JSON
command -v python3 >/dev/null || err "python3 required for JSON validation"
for f in .claude-plugin/plugin.json .claude-plugin/marketplace.json; do
  [ -f "$f" ] && { python3 -m json.tool "$f" >/dev/null 2>&1 || err "$f is not valid JSON"; }
done

# 2. Portability: no project literals may leak into skills/ or commands/.
#    (Templates use {{PLACEHOLDERS}}; skills/commands must read config instead.)
BANNED='meetcorda|corda|simtest|appletest@|yedgztzicmwmapwxldmp|malikcasey|glowproof|api-nine-xi|com\.meetcorda|\bGLOW-[0-9]'
if [ -d skills ] || [ -d commands ]; then
  HITS=$(grep -rinE "$BANNED" skills/ commands/ 2>/dev/null || true)
  [ -n "$HITS" ] && err "project literal leaked:\n$HITS"
fi

# 3. Placeholders only in templates/: '{{' must not appear in skills/ or commands/
if [ -d skills ] || [ -d commands ]; then
  PH=$(grep -rn '{{' skills/ commands/ 2>/dev/null || true)
  [ -n "$PH" ] && err "unresolved placeholder outside templates/:\n$PH"
fi

# 4. Frontmatter: every SKILL.md and command starts with '---'
while IFS= read -r -d '' f; do
  [ "$(head -c 3 "$f")" = "---" ] || err "$f missing frontmatter"
done < <(find skills -name 'SKILL.md' -print0 2>/dev/null; find commands -name '*.md' -print0 2>/dev/null)

# 5. Full manifest (only with --complete)
if [ "${1:-}" = "--complete" ]; then
  for f in \
    .claude-plugin/plugin.json \
    .claude-plugin/marketplace.json \
    README.md \
    templates/config.template.yaml \
    commands/setup.md \
    commands/discover.md \
    commands/strategy.md \
    commands/validate.md \
    commands/status.md \
    skills/shared/communication.md \
    skills/shared/glossary.md \
    skills/status/SKILL.md \
    skills/studio-setup/SKILL.md \
    skills/discover/SKILL.md \
    skills/discover/references/red-team-personas.md \
    skills/discover/references/demand-intensity-rubric.md \
    skills/discover/references/reality-probe.md \
    templates/discover/launch-thesis.md \
    skills/product-strategy/SKILL.md \
    skills/product-strategy/reference/play-engine.md \
    skills/validate/SKILL.md \
    skills/validate/references/landing-conversion.md \
    skills/validate/references/honesty-floor.md \
    skills/validate/references/guerrilla-playbook.md \
    templates/validate/validation-report.md \
    templates/validate/handoff.md \
    templates/landing/gate-eval.mjs \
    templates/landing/gate-eval.test.mjs \
    templates/landing/schema.sql \
    templates/landing/capture.js \
    templates/landing/wiring-reference.html \
    templates/landing/payment-intent.mjs \
    templates/landing/gate-run.mjs \
    templates/landing/gate-run.test.mjs \
    templates/landing/server/capture.route.mjs \
    templates/landing/server/preauth.route.mjs \
    templates/landing/privacy.md \
    templates/landing/README.md \
    templates/studio/playbook.md \
    templates/studio/validation-log.md \
    scripts/test.sh; do
    [ -f "$f" ] || err "missing required file: $f"
  done
fi

[ $FAIL -eq 0 ] && echo "lint OK" || exit 1
