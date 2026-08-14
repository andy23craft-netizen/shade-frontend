/**
 * Shared infinite-scroll settings for paginated collection routes.
 *
 * INFINITE_SCROLL_BATCH_SIZE controls how many items each API request loads
 * (sent as the `take` query param together with `skip`).
 *
 * INFINITE_SCROLL_PREFETCH_ROWS controls how many rows from the bottom of the
 * currently loaded list trigger the next batch fetch via IntersectionObserver.
 */
export const INFINITE_SCROLL_BATCH_SIZE = 30

export const INFINITE_SCROLL_PREFETCH_ROWS = 5
