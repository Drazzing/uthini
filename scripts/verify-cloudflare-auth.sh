#!/usr/bin/env bash
# Verify CLOUDFLARE_API_TOKEN works for this account before Wrangler deploy.
set -euo pipefail

: "${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN is required}"
: "${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID is required}"

AUTH=(-H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" -H "Content-Type: application/json")
API="https://api.cloudflare.com/client/v4"

echo "Checking API token..."
verify="$(curl -s "${AUTH[@]}" "${API}/accounts/${CLOUDFLARE_ACCOUNT_ID}/tokens/verify")"
if ! echo "$verify" | grep -q '"success"[[:space:]]*:[[:space:]]*true'; then
  echo "::error::CLOUDFLARE_API_TOKEN is invalid or expired."
  echo "$verify"
  exit 1
fi
echo "Token is valid."

echo "Checking account access..."
account="$(curl -s -o /tmp/cf-account.json -w "%{http_code}" "${AUTH[@]}" "${API}/accounts/${CLOUDFLARE_ACCOUNT_ID}")"
if [ "$account" != "200" ]; then
  echo "::error::CLOUDFLARE_ACCOUNT_ID does not match this token (HTTP ${account})."
  echo "Copy Account ID from Workers & Pages sidebar and ensure the token is scoped to that account."
  cat /tmp/cf-account.json || true
  exit 1
fi
echo "Account access OK."

echo "Checking Workers deploy permission (uthini-contact-email)..."
workers="$(curl -s -o /tmp/cf-workers.json -w "%{http_code}" "${AUTH[@]}" \
  "${API}/accounts/${CLOUDFLARE_ACCOUNT_ID}/workers/services/uthini-contact-email")"

case "$workers" in
  200|404)
    echo "Workers API access OK (HTTP ${workers})."
    ;;
  403|401)
    echo "::error::Token cannot deploy Workers. Add Account permission: Workers Scripts → Edit."
    echo "Optional: use dashboard template 'Edit Cloudflare Workers', then add Cloudflare Pages → Edit."
    echo "See README → Publish → Create a Cloudflare API token."
    cat /tmp/cf-workers.json || true
    exit 1
    ;;
  *)
    echo "::error::Unexpected Workers API response (HTTP ${workers})."
    cat /tmp/cf-workers.json || true
    exit 1
    ;;
esac

echo "Checking Pages access..."
pages="$(curl -s -o /tmp/cf-pages.json -w "%{http_code}" "${AUTH[@]}" \
  "${API}/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/uthini")"
if [ "$pages" != "200" ] && [ "$pages" != "404" ]; then
  echo "::error::Token cannot access Cloudflare Pages (HTTP ${pages}). Add Account permission: Cloudflare Pages → Edit."
  cat /tmp/cf-pages.json || true
  exit 1
fi
echo "Pages API access OK (HTTP ${pages})."

echo "Cloudflare auth checks passed."
