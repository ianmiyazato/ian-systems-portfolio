#!/usr/bin/env bash
# Print the zones affected by the diff against a base ref. Shared code redeploys every zone.
# Production (--prod) deploys only the changed zones: the production shell already rewrites to
# the zones' production domains, so a zone change alone never redeploys the shell.
set -euo pipefail
base=${1:-origin/develop}
prod=false
[[ "${2:-}" == "--prod" || "$base" == "HEAD^" ]] && prod=true
files=$(git diff --name-only "$base"...HEAD)
apps=()
if grep -qE '^(packages/|decisions/|pnpm-lock.yaml|turbo.json|package.json)' <<<"$files"; then
  apps=(mare-ops mare-shop pulse shell)
else
  grep -qE '^(apps/mare-ops/|remotes/)' <<<"$files" && apps+=(mare-ops)
  grep -q '^apps/mare-shop/' <<<"$files" && apps+=(mare-shop)
  grep -q '^apps/pulse/' <<<"$files" && apps+=(pulse)
  if grep -q '^apps/shell/' <<<"$files" || { ! $prod && (( ${#apps[@]} )); }; then apps+=(shell); fi
fi
echo "${apps[*]}"
