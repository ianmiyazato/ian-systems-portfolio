#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "Deployment pending: add VERCEL_TOKEN and run pnpm deploy:all"
  exit 1
fi

if ! command -v vercel >/dev/null 2>&1; then
  echo "Vercel CLI is required. Install it with: npm i -g vercel"
  exit 1
fi

for app in shell mare-ops mare-shop pulse; do
  if [[ -d "apps/${app}" ]]; then
    vercel deploy "apps/${app}" --token "$VERCEL_TOKEN" --yes
  fi
done

