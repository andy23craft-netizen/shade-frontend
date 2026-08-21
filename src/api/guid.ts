const GUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Returns true when `value` looks like a dashed UUID/GUID.
 * Matches backend `_require_guid` acceptance for book path `{id}` and
 * loan/membership `book_id` values (legacy `SL-*` codes are rejected).
 */
export function isGuid(value: string): boolean {
    return GUID_PATTERN.test(value.trim())
}
