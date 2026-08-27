#!/bin/bash

set -euo pipefail

# Build the local Podman image for Compose-oriented development. Production is the versioned static tarball, not this
# image.
#
# PROJ_DIR may be set by the caller (e.g., Ansible). IMAGE_NAME / IMAGE_TAG_LATEST / IMAGE_TAG_VERSION may override
# image tags.

PROJ_DIR="${PROJ_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
CI_DIR="$PROJ_DIR/ci"
PACKAGE_JSON="$PROJ_DIR/package.json"
CONTAINERFILE="$CI_DIR/Containerfile"

cd "$PROJ_DIR"

if [[ ! -f "$PACKAGE_JSON" ]]; then
    printf 'error: missing %s\n' "$PACKAGE_JSON" >&2
    exit 1
fi
if [[ ! -f "$CONTAINERFILE" ]]; then
    printf 'error: missing %s\n' "$CONTAINERFILE" >&2
    exit 1
fi

APP_VERSION="$(node -p "JSON.parse(require('fs').readFileSync('$PACKAGE_JSON', 'utf8')).version")"
IMAGE_NAME="${IMAGE_NAME:-shade-frontend}"
IMAGE_TAG_LATEST="${IMAGE_TAG_LATEST:-${IMAGE_NAME}:latest}"
IMAGE_TAG_VERSION="${IMAGE_TAG_VERSION:-${IMAGE_NAME}:${APP_VERSION}}"

make build

podman build \
    --format docker \
    --file "$CONTAINERFILE" \
    --tag "${IMAGE_TAG_LATEST}" \
    --tag "${IMAGE_TAG_VERSION}" \
    "$PROJ_DIR"

printf '\nDone! Version: %s\n' "$APP_VERSION"
printf 'Images: %s  %s\n' "${IMAGE_TAG_LATEST}" "${IMAGE_TAG_VERSION}"
printf 'Run:    podman run --rm --name shade-frontend-dev -p 8080:8080 %s\n' "${IMAGE_TAG_LATEST}"
