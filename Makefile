.PHONY: install preview lint run typecheck test build check

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

check:
	yarn check
