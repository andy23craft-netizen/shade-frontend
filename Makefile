.PHONY: build bundle-check check ci install lint publish run test typecheck

build:
	yarn build

bundle-check:
	yarn bundle:check

check:
	yarn check

ci:
	bash ci/build-local.sh

install:
	yarn install --immutable

lint:
	yarn lint

publish:
	bash ci/build-prod.sh

run:
	yarn dev

test:
	yarn test

typecheck:
	yarn typecheck
