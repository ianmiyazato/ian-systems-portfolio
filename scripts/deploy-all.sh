#!/usr/bin/env bash
# Deploy zones from the monorepo root. Each Vercel project's Root Directory (apps/<app>)
# selects what to build, so the whole workspace is uploaded once per project.
#
#   scripts/deploy-all.sh                 # preview deploy of every zone
#   scripts/deploy-all.sh --prod          # production deploy of every zone
#   APPS="mare-ops pulse" scripts/deploy-all.sh   # only these zones (shell last)
#
# Preview shells rewrite to the preview URLs of zones deployed in the same run.
set -euo pipefail
cd "$(dirname "$0")/.."

ORG_ID="team_WN8OuyNJxohEUxt1IWdka5jW"
declare -A PROJECT_IDS=(
  [shell]="prj_xd3Dwp8fe0I1Wg8xanBYowVW4jBx"
  [mare-ops]="prj_ekKjdNGLbzG2RdsAIWRbdGcLBYWU"
  [mare-shop]="prj_6yqxgwfGgTxfjYUU1x5t9lBZ42t7"
  [pulse]="prj_ChQTxhn4dbJovUj6t5N1WaDQ0hPD"
)
declare -A ENV_KEYS=([mare-ops]=MARE_OPS_URL [mare-shop]=MARE_SHOP_URL [pulse]=PULSE_URL)

if ! command -v vercel >/dev/null 2>&1; then
  echo "Vercel CLI is required: npm i -g vercel" >&2
  exit 1
fi

PROD=false
[[ "${1:-}" == "--prod" ]] && PROD=true
APPS="${APPS:-mare-ops mare-shop pulse shell}"
TOKEN_ARGS=()
[[ -n "${VERCEL_TOKEN:-}" ]] && TOKEN_ARGS=(--token "$VERCEL_TOKEN")
BUILD_ENV=()
OUT="${DEPLOY_OUTPUT:-/dev/null}"

deploy() {
  local app=$1
  local args=(deploy --yes "${TOKEN_ARGS[@]}")
  $PROD && args+=(--prod)
  [[ "$app" == "shell" ]] && args+=("${BUILD_ENV[@]}")
  # Non-interactive CLI output is JSON; keep only the deployment URL.
  VERCEL_ORG_ID="$ORG_ID" VERCEL_PROJECT_ID="${PROJECT_IDS[$app]}" vercel "${args[@]}" 2>/dev/null \
    | node -e 'let s="";process.stdin.on("data",(d)=>(s+=d)).on("end",()=>{try{console.log(JSON.parse(s).deployment.url)}catch{console.log(s.trim().split("\n").pop())}})'
}

for app in $APPS; do
  [[ "$app" == "shell" ]] && continue
  url=$(deploy "$app")
  echo "$app=$url" | tee -a "$OUT"
  # Previews: point the shell at this run's zone preview instead of production.
  $PROD || BUILD_ENV+=(--build-env "${ENV_KEYS[$app]}=$url")
done

if [[ " $APPS " == *" shell "* ]]; then
  url=$(deploy shell)
  echo "shell=$url" | tee -a "$OUT"
fi
