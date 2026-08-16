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


## FEAT-12 re-check — 2026-08-16

### Large-library list helper

Re-ran `src/api/booksApi.largeLibrary.test.ts` with the FEAT-03 fixtures:

- Full 2,000-book payload: **6 ms**
- Paginated 50-book slice from a 2,000-book library: **2 ms**
- Budget: **250 ms**

No material large-library regression was observed.

### Production bundle size

Measured with `yarn build`:

| Artifact                            | Raw size  | Gzip size |
|-------------------------------------|-----------|-----------|
| `dist/assets/index-*.js`            | 429.15 kB | 124.98 kB |
| `dist/assets/index-*.css`           | 30.56 kB  | 5.61 kB   |
| `dist/index.html`                   | 0.49 kB   | 0.30 kB   |
| `dist/assets/IsbnCameraScanner-*.js`| 481.64 kB | 126.53 kB |

The main JS entry increased from **101.37 kB gzip** at the FEAT-03 baseline to **124.98 kB gzip**. This exceeds the suggested **120 kB soft-warning** threshold but remains below the **150 kB hard-failure candidate**.

The increase is accepted for FEAT-12 because the application has accumulated substantial implemented product functionality since the original baseline. The camera-scanner dependency remains isolated in its lazy-loaded chunk rather than being included in the main entry.

Treat further sustained growth of the main entry as a candidate for FEAT-14 bundle-budget enforcement or a dedicated optimization follow-up.

### Contract smoke

Compared the representative running backend at `http://127.0.0.1:8000/openapi.json` with the checked-in `docs/technical-reference/openapi.json` after canonical JSON key sorting.

- Path sets matched.
- Schema sets matched.
- Canonical documents had no diff.
- No backend request/correlation ID header was observed.

No contract drift blocker was found.