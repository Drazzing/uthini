#!/usr/bin/env bash
# Build dist/ with only the files published to Cloudflare Pages.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"

rm -rf "$DIST"
mkdir -p "$DIST/functions"

cp -r "$ROOT/css" "$ROOT/js" "$ROOT/images" "$DIST/"
cp "$ROOT/functions/"*.js "$DIST/functions/"
cp "$ROOT/_redirects" "$ROOT/_headers" "$DIST/"
cp "$ROOT"/*.html "$ROOT/robots.txt" "$ROOT/sitemap.xml" "$DIST/"

echo "Deploy folder ready: $DIST"
find "$DIST" -type f | sort
