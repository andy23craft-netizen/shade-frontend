/* requestFields.ts */

import type {
    BookCreate,
    BookUpdate,
    BulkShelfMoveRequest,
    CheckinRequest,
    CheckoutRequest,
    MarkReadRequest,
    ShelfCreate,
    ShelfUpdate,
    WishlistBookCreate,
    WishlistCreate,
    WishlistUpdate,
    CollectionBookCreate,
    CollectionBookReorder,
    CollectionCreate,
    CollectionUpdate,
} from './apiTypes'

export const BOOK_CREATE_KEYS = [
    'acquisition_source',
    'authors',
    'category_ids',
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
    'category_ids',
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

export const BULK_SHELF_MOVE_REQUEST_KEYS = [
    'book_ids',
    'shelf_name',
] as const satisfies readonly (keyof BulkShelfMoveRequest)[]

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

export const WISHLIST_CREATE_KEYS = [
    'name',
    'description',
] as const satisfies readonly (keyof WishlistCreate)[]

export const WISHLIST_UPDATE_KEYS = [
    'name',
    'description',
] as const satisfies readonly (keyof WishlistUpdate)[]

export const WISHLIST_BOOK_CREATE_KEYS = [
    'book_id',
    'status',
    'priority',
    'notes',
    'url',
] as const satisfies readonly (keyof WishlistBookCreate)[]

export const COLLECTION_CREATE_KEYS = [
    'name',
    'description',
] as const satisfies readonly (keyof CollectionCreate)[]

export const COLLECTION_UPDATE_KEYS = [
    'name',
    'description',
] as const satisfies readonly (keyof CollectionUpdate)[]

export const COLLECTION_BOOK_CREATE_KEYS = [
    'book_id',
    'order_num',
    'notes',
] as const satisfies readonly (keyof CollectionBookCreate)[]

export const COLLECTION_BOOK_REORDER_KEYS = [
    'order_num',
] as const satisfies readonly (keyof CollectionBookReorder)[]

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

export function pickBulkShelfMoveRequest(
    request: BulkShelfMoveRequest,
): BulkShelfMoveRequest {
    return pickDocumentedRequestFields(
        request,
        BULK_SHELF_MOVE_REQUEST_KEYS,
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

export function pickWishlistCreate(
    wishlist: WishlistCreate,
): WishlistCreate {
    return pickDocumentedRequestFields(
        wishlist,
        WISHLIST_CREATE_KEYS,
    )
}

export function pickWishlistUpdate(
    wishlist: WishlistUpdate,
): WishlistUpdate {
    return pickDocumentedRequestFields(
        wishlist,
        WISHLIST_UPDATE_KEYS,
    )
}

export function pickWishlistBookCreate(
    wishlistBook: WishlistBookCreate,
): WishlistBookCreate {
    return pickDocumentedRequestFields(
        wishlistBook,
        WISHLIST_BOOK_CREATE_KEYS,
    )
}

export function pickCollectionCreate(
    collection: CollectionCreate,
): CollectionCreate {
    return pickDocumentedRequestFields(
        collection,
        COLLECTION_CREATE_KEYS,
    )
}

export function pickCollectionUpdate(
    collection: CollectionUpdate,
): CollectionUpdate {
    return pickDocumentedRequestFields(
        collection,
        COLLECTION_UPDATE_KEYS,
    )
}

export function pickCollectionBookCreate(
    collectionBook: CollectionBookCreate,
): CollectionBookCreate {
    return pickDocumentedRequestFields(
        collectionBook,
        COLLECTION_BOOK_CREATE_KEYS,
    )
}

export function pickCollectionBookReorder(
    reorder: CollectionBookReorder,
): CollectionBookReorder {
    return pickDocumentedRequestFields(
        reorder,
        COLLECTION_BOOK_REORDER_KEYS,
    )
}


