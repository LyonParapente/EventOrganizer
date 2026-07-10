#!/bin/sh
set -e

# node_modules lives in a named volume (native binaries must match the
# container, not the host). Reinstall only when package-lock.json changes.
STAMP=node_modules/.package-lock.md5
if [ ! -f "$STAMP" ] || ! md5sum --check --status "$STAMP"; then
  npm ci
  md5sum package-lock.json > "$STAMP"
  # The FuseBox cache references node_modules content: stale after a reinstall
  rm -rf .cache
fi

exec npx ts-node fuse.ts
