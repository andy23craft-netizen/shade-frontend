# FEAT-03 performance baselines

Recorded 2026-08-11 for later regression checks in FEAT-12 (large-library responsiveness) and FEAT-14 (bundle-size
reporting in CI). These are practical local expectations, not hard product SLAs.

## Large-library list helper

- Full-list fixture: `BookList` with `total: 2000` and 2_000 `BookRead` items (unpaginated callers such as checkout,
  check-in, and loans)
- Paginated fixture: `BookList` with `total: 2000` and 50 `BookRead` items (`skip=0`, `take=50`) for collection browse
- Exercise: `createBooksApi(...).list()` in Vitest/jsdom
- Expectation: complete in under **250ms** on a typical developer machine
- Guard: `src/api/booksApi.largeLibrary.test.ts`

FEAT-12 should re-run comparable fixtures and treat material regressions (for example, sustained multiples of this
budget) as release blockers or tracked follow-ups. `BooksPage` uses paginated requests; unpaginated full-list callers
remain for checkout, check-in, and loan joins.

## Production bundle size

Measured with `yarn build` (Vite production client build):

| Artifact                  | Raw size  | Gzip size |
|---------------------------|-----------|-----------|
| `dist/assets/index-*.js`  | 323.51 kB | 101.37 kB |
| `dist/assets/index-*.css` | 8.90 kB   | 2.29 kB   |
| `dist/index.html`         | 0.43 kB   | 0.28 kB   |

Suggested FEAT-14 regression budgets (gzip, main JS entry):

- Soft warning: above **120 kB** gzip for the main JS entry
- Hard failure candidate: above **150 kB** gzip for the main JS entry

Re-measure after intentional dependency or bundling changes and update this document when the baseline moves for a known
reason.

## Contract smoke

- Checked-in OpenAPI path set is asserted by `scripts/contractSmoke.test.ts`
- Keep `yarn api:check` green for generated types
- Live comparison target when available: `http://127.0.0.1:8000/openapi.json`
- Live backend was unavailable when this baseline was recorded; drift must be fixed in the owning system or recorded as
  an explicit blocker rather than inventing frontend semantics
