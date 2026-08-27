#!/bin/bash

set -euo pipefail

# Build the local Podman image that approximates bare-metal Raspberry Pi OS. Prod on the Pi is not containerized; this
# script is for local development only.
#
# PROJ_DIR may be set by the caller (e.g., Ansible). IMAGE_NAME / IMAGE_TAG_LATEST / IMAGE_TAG_VERSION may override
# image tags.

SCRIPTS_DIR="${PROJ_DIR:-$(cd "$(dirname "$0")" && pwd)}"
PROJ_DIR="${PROJ_DIR:-$(cd "$SCRIPTS_DIR/.." && pwd)}"
CI_DIR="${PROJ_DIR:-$(cd "$SCRIPTS_DIR/ci" && pwd)}"
ARTIFACTS_DIR="$CI_DIR/artifacts"
IMAGE_NAME := shade-frontend
CONTAINER_NAME := shade-frontend-dev
APP_VERSION := $(shell node -p "JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version")

build
	podman build \
		--format docker \
		--file "$CI_DIR/Containerfile" \
		--tag $(IMAGE_NAME):latest \
		--tag $(IMAGE_NAME):$(APP_VERSION) \
		"$PROJ_DIR"
