#!/usr/bin/env bash
# Fast check via Cloudflare API — no Wrangler install needed.
# Creates the Pages project only if it does not exist.
set -euo pipefail

PROJECT_NAME="${1:-uthini}"
BRANCH="${2:-main}"

: "${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN is required}"
: "${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID is required}"

API="https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects"
AUTH=(-H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" -H "Content-Type: application/json")

status="$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" "${API}/${PROJECT_NAME}")"

if [ "$status" = "200" ]; then
  echo "Pages project '${PROJECT_NAME}' already exists — skipping create."
  exit 0
fi

if [ "$status" != "404" ]; then
  echo "Unexpected API response (${status}) checking project '${PROJECT_NAME}'."
  curl -s "${AUTH[@]}" "${API}/${PROJECT_NAME}" || true
  exit 1
fi

echo "Pages project '${PROJECT_NAME}' not found — creating..."
response="$(curl -s -w "\n%{http_code}" "${AUTH[@]}" -X POST "${API}" \
  -d "{\"name\":\"${PROJECT_NAME}\",\"production_branch\":\"${BRANCH}\"}")"

http_code="$(echo "$response" | tail -n1)"
body="$(echo "$response" | sed '$d')"

if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
  echo "Pages project '${PROJECT_NAME}' created."
  exit 0
fi

if echo "$body" | grep -qi "already exists"; then
  echo "Pages project '${PROJECT_NAME}' already exists — continuing."
  exit 0
fi

echo "Failed to create Pages project (HTTP ${http_code}):"
echo "$body"
exit 1
