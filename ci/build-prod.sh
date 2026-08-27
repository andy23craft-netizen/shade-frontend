#!/bin/bash

set -euo pipefail

# Build the versioned production static tarball under ci/artifacts/. The deployment repository owns install, HTTPS, and
# rollback.
#
# PROJ_DIR may be set by the caller (e.g., Ansible).

PROJ_DIR="${PROJ_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
PACKAGE_JSON="$PROJ_DIR/package.json"
ARTIFACTS_DIR="$PROJ_DIR/ci/artifacts"

cd "$PROJ_DIR"

if [[ ! -f "$PACKAGE_JSON" ]]; then
    printf 'error: missing %s\n' "$PACKAGE_JSON" >&2
    exit 1
fi

APP_VERSION="$(node -p "JSON.parse(require('fs').readFileSync('$PACKAGE_JSON', 'utf8')).version")"

make build
yarn release:pack

TARBALL="$ARTIFACTS_DIR/shade-frontend-${APP_VERSION}.tar.gz"

printf '\nDone! Version: %s\n' "$APP_VERSION"
printf 'Artifact: %s\n' "$TARBALL"
