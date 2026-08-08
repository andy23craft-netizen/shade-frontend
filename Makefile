.PHONY: install dev preview lint typecheck test build check

install:
	yarn install --immutable

dev:
	yarn dev

preview:
	yarn preview

lint:
	yarn lint

typecheck:
	yarn typecheck

test:
	yarn test

build:
	yarn build

check:
	yarn check
