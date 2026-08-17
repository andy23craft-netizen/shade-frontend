IMAGE_NAME := shade-frontend
CONTAINER_NAME := shade-frontend-dev
APP_VERSION := $(shell node -p "JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version")
.PHONY: install preview lint run typecheck test build bundle-check check container-build container-run container-stop container-clean

install:
	yarn install --immutable

preview:
	yarn preview

lint:
	yarn lint

run:
	yarn dev

typecheck:
	yarn typecheck

test:
	yarn test

build:
	yarn build

container-build: build
	podman build \
		--format docker \
		--file ci/Containerfile \
		--tag $(IMAGE_NAME):latest \
		--tag $(IMAGE_NAME):$(APP_VERSION) \
		.

container-run:
	podman run --rm \
		--name $(CONTAINER_NAME) \
		-p 8080:8080 \
		-e SHADE_API_BASE_URL=$${SHADE_API_BASE_URL:-http://127.0.0.1:8000} \
		-e SHADE_DIAGNOSTICS_ENABLED=$${SHADE_DIAGNOSTICS_ENABLED:-false} \
		-e SHADE_DIAGNOSTICS_ENDPOINT=$${SHADE_DIAGNOSTICS_ENDPOINT:-} \
		$(IMAGE_NAME):latest

container-stop:
	-podman stop $(CONTAINER_NAME)

container-clean:
	-podman rm -f $(CONTAINER_NAME)
	-podman rmi $(IMAGE_NAME):latest $(IMAGE_NAME):$(APP_VERSION)

bundle-check:
	yarn bundle:check

check:
	yarn check
