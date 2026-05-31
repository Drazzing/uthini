#!/usr/bin/env bash
# Build dist/ with only the files published to Cloudflare Pages.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"

rm -rf "$DIST"
mkdir -p "$DIST/functions"

for dir in css js images; do
  if [ ! -d "$ROOT/$dir" ]; then
    echo "::error::Missing required directory: $dir"
    exit 1
  fi
  cp -r "$ROOT/$dir" "$DIST/"
done

if ! compgen -G "$ROOT/functions/"*.js > /dev/null; then
  echo "::error::No Pages Functions found in functions/"
  exit 1
fi
cp "$ROOT/functions/"*.js "$DIST/functions/"

for file in _redirects _headers robots.txt sitemap.xml; do
  if [ ! -f "$ROOT/$file" ]; then
    echo "::error::Missing required file: $file"
    exit 1
  fi
  cp "$ROOT/$file" "$DIST/"
done

if ! compgen -G "$ROOT/"*.html > /dev/null; then
  echo "::error::No HTML pages found"
  exit 1
fi
cp "$ROOT"/*.html "$DIST/"

file_count="$(find "$DIST" -type f | wc -l | tr -d ' ')"
echo "Deploy folder ready: $DIST ($file_count files)"
