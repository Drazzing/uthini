#!/usr/bin/env bash
# Validate API token, permissions, and Pages project before deploy.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib/cloudflare-api.sh
source "${SCRIPT_DIR}/lib/cloudflare-api.sh"

PAGES_PROJECT="${PAGES_PROJECT:-uthini}"
WORKER_NAME="${WORKER_NAME:-uthini-contact-email}"
PAGES_BRANCH="${PAGES_BRANCH:-main}"

cf_require_env

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

# --- Token ---
echo "Checking API token..."
user_body="${tmpdir}/user-verify.json"
user_code="$(cf_get_status "${CF_API_BASE}/user/tokens/verify" "$user_body")"

if [ "$user_code" = "200" ] && cf_response_success <"$user_body"; then
  echo "User API token is valid."
else
  account_body="${tmpdir}/account-verify.json"
  account_code="$(cf_get_status "${CF_ACCOUNT_API}/tokens/verify" "$account_body")"
  if [ "$account_code" = "200" ] && cf_response_success <"$account_body"; then
    echo "Account API token is valid."
  else
    cf_github_error "CLOUDFLARE_API_TOKEN is invalid or not saved correctly in GitHub Secrets."
    echo "Create under My Profile → API Tokens, copy once, update CLOUDFLARE_API_TOKEN."
    echo "User (HTTP ${user_code}): $(cat "$user_body")"
    echo "Account (HTTP ${account_code}): $(cat "$account_body")"
    exit 1
  fi
fi

# --- Account ---
echo "Checking account access..."
account_body="${tmpdir}/account.json"
account_code="$(cf_get_status "${CF_ACCOUNT_API}" "$account_body")"
if [ "$account_code" != "200" ]; then
  cf_github_error "CLOUDFLARE_ACCOUNT_ID does not match this token (HTTP ${account_code})."
  cat "$account_body"
  exit 1
fi

# --- Workers ---
workers_body="${tmpdir}/workers.json"
workers_code="$(cf_get_status "${CF_ACCOUNT_API}/workers/scripts/${WORKER_NAME}" "$workers_body")"
case "$workers_code" in
  200|404) ;;
  403|401)
    cf_github_error "Add Workers Scripts → Edit to your API token."
    cat "$workers_body"
    exit 1
    ;;
  *)
    cf_github_error "Unexpected Workers API response (HTTP ${workers_code})."
    cat "$workers_body"
    exit 1
    ;;
esac

# --- Pages project ---
pages_api="${CF_ACCOUNT_API}/pages/projects"
check_body="${tmpdir}/pages-check.json"
pages_code="$(cf_get_status "${pages_api}/${PAGES_PROJECT}" "$check_body")"

if [ "$pages_code" = "200" ]; then
  echo "Preflight OK (project '${PAGES_PROJECT}' exists)."
  exit 0
fi

if [ "$pages_code" != "404" ]; then
  cf_github_error "Cannot access Pages project '${PAGES_PROJECT}' (HTTP ${pages_code}). Add Cloudflare Pages → Edit."
  cat "$check_body"
  exit 1
fi

echo "Creating Pages project '${PAGES_PROJECT}'..."
create_body="${tmpdir}/pages-create.json"
create_code="$(cf_curl -o "$create_body" -w "%{http_code}" -X POST "$pages_api" \
  -d "{\"name\":\"${PAGES_PROJECT}\",\"production_branch\":\"${PAGES_BRANCH}\"}")"

if [ "$create_code" = "200" ] || [ "$create_code" = "201" ] || grep -qi "already exists" "$create_body" 2>/dev/null; then
  echo "Preflight OK (project '${PAGES_PROJECT}' ready)."
  exit 0
fi

cf_github_error "Failed to create Pages project (HTTP ${create_code})."
cat "$create_body"
exit 1
