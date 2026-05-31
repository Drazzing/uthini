#!/usr/bin/env bash
# Shared helpers for Cloudflare API scripts (sourced, not executed directly).

cf_require_env() {
  : "${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN is required}"
  : "${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID is required}"
}

CF_API_BASE="${CF_API_BASE:-https://api.cloudflare.com/client/v4}"
CF_ACCOUNT_API="${CF_API_BASE}/accounts/${CLOUDFLARE_ACCOUNT_ID}"

cf_curl() {
  curl -s -S \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json" \
    "$@"
}

cf_get_status() {
  local url="$1"
  local body_file="$2"
  cf_curl -o "$body_file" -w "%{http_code}" "$url"
}

cf_response_success() {
  grep -q '"success"[[:space:]]*:[[:space:]]*true'
}

cf_github_error() {
  echo "::error::$*"
}
