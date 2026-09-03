import {
    isApiError,
} from './apiErrors'
import {
    isGuid,
} from './guid'

/**
 * Catalog books use `BookRead.book_id` (UUID). Child resources (loans, wishlist
 * memberships) reference the same UUID as `book_id` -- never a second book
 * identity field on `BookRead`.
 */
export function isBookIdentityError(
    error: unknown,
): boolean {
    return (
        isApiError(error) &&
        (error.status === 400 ||
            error.status === 404)
    )
}

/**
 * True when a route/query book id is present but not a GUID. Empty strings are
 * not identity errors (callers disable queries for blank ids).
 */
export function isMalformedBookId(
    bookId: string,
): boolean {
    const trimmed = bookId.trim()

    return (
        trimmed.length > 0 &&
        !isGuid(trimmed)
    )
}
