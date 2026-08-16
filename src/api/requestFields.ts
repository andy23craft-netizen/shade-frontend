/* requestFields.ts */

import type {
    BookCreate,
    BookUpdate,
    CheckinRequest,
    CheckoutRequest,
    MarkReadRequest,
    ShelfCreate,
    ShelfUpdate,
} from './apiTypes'

export const BOOK_CREATE_KEYS = [
    'acquisition_source',
    'authors',
    'category',
    'completion_date',
    'is_read',
    'isbn13',
    'notes',
    'pages',
    'publication_date',
    'publisher',
    'purchase_date',
    'purchase_price',
    'rating',
    'review',
    'shelf_name',
    'status',
    'tags',
    'title',
] as const satisfies readonly (keyof BookCreate)[]

export const BOOK_UPDATE_KEYS = [
    'acquisition_source',
    'authors',
    'category',
    'completion_date',
    'is_read',
    'isbn13',
    'notes',
    'pages',
    'publication_date',
    'publisher',
    'purchase_date',
    'purchase_price',
    'rating',
    'review',
    'shelf_name',
    'status',
    'tags',
    'title',
] as const satisfies readonly (keyof BookUpdate)[]

export const CHECKOUT_REQUEST_KEYS = [
    'borrower',
    'checked_out_at',
    'due_at',
    'notes',
] as const satisfies readonly (keyof CheckoutRequest)[]

export const CHECKIN_REQUEST_KEYS = [
    'returned_at',
] as const satisfies readonly (keyof CheckinRequest)[]

export const MARK_READ_REQUEST_KEYS = [
    'completion_date',
    'rating',
    'review',
] as const satisfies readonly (keyof MarkReadRequest)[]

export const SHELF_CREATE_KEYS = [
    'common_name',
    'description',
    'location',
] as const satisfies readonly (keyof ShelfCreate)[]

export const SHELF_UPDATE_KEYS = [
    'common_name',
    'description',
    'location',
] as const satisfies readonly (keyof ShelfUpdate)[]

export function pickDocumentedRequestFields<
    T extends object,
>(
    value: T,
    documentedKeys: readonly (keyof T & string)[],
): T {
    const result = {} as T

    for (const key of documentedKeys) {
        if (Object.hasOwn(value, key)) {
            result[key] = value[key]
        }
    }

    return result
}

export function pickBookCreate(
    book: BookCreate,
): BookCreate {
    return pickDocumentedRequestFields(
        book,
        BOOK_CREATE_KEYS,
    )
}

export function pickBookUpdate(
    book: BookUpdate,
): BookUpdate {
    return pickDocumentedRequestFields(
        book,
        BOOK_UPDATE_KEYS,
    )
}

export function pickCheckoutRequest(
    request: CheckoutRequest,
): CheckoutRequest {
    return pickDocumentedRequestFields(
        request,
        CHECKOUT_REQUEST_KEYS,
    )
}

export function pickCheckinRequest(
    request: CheckinRequest,
): CheckinRequest {
    return pickDocumentedRequestFields(
        request,
        CHECKIN_REQUEST_KEYS,
    )
}

export function pickMarkReadRequest(
    request: MarkReadRequest,
): MarkReadRequest {
    return pickDocumentedRequestFields(
        request,
        MARK_READ_REQUEST_KEYS,
    )
}

export function pickShelfCreate(
    shelf: ShelfCreate,
): ShelfCreate {
    return pickDocumentedRequestFields(
        shelf,
        SHELF_CREATE_KEYS,
    )
}

export function pickShelfUpdate(
    shelf: ShelfUpdate,
): ShelfUpdate {
    return pickDocumentedRequestFields(
        shelf,
        SHELF_UPDATE_KEYS,
    )
}
