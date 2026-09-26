#!/usr/bin/env bash
# Print the zones affected by the diff against a base ref. Shared code redeploys every zone;
# any zone change also redeploys the shell so its preview rewrites to the new zone previews.
set -euo pipefail
base=${1:-origin/develop}
files=$(git diff --name-only "$base"...HEAD)
apps=()
if grep -qE '^(packages/|decisions/|pnpm-lock.yaml|turbo.json|package.json|scripts/deploy-all.sh)' <<<"$files"; then
  apps=(mare-ops mare-shop pulse shell)
else
  grep -qE '^(apps/mare-ops/|remotes/)' <<<"$files" && apps+=(mare-ops)
  grep -q '^apps/mare-shop/' <<<"$files" && apps+=(mare-shop)
  grep -q '^apps/pulse/' <<<"$files" && apps+=(pulse)
  if (( ${#apps[@]} )) || grep -q '^apps/shell/' <<<"$files"; then apps+=(shell); fi
fi
echo "${apps[*]}"
