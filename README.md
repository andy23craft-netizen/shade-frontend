# shade-frontend

The React frontend for the Shade library application.

## Prerequisites

- [Node.js 26.7.0](https://nodejs.org/)
- [Corepack](https://nodejs.org/api/corepack.html)
- Yarn 4.18.0 (provided through Corepack)
- [Make](https://www.gnu.org/software/make/)

## Setup

Activate the Node.js version recorded in `.nvmrc`, then enable Corepack and
install the locked dependencies:

```sh
nvm use
corepack enable
make install
```

## Development

Start the local Vite development server:

```sh
make run
```

Run the complete lint, type-check, test, and build quality gate:

```sh
make check
```

Create an optimized production build:

```sh
make build
```

Production output is written to `dist/`.
