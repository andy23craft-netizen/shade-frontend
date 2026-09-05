import type {
    BookCreate,
    BookList,
    BookLookupResponse,
    BookRead,
    BookUpdate,
    BulkBookImportRequest,
    BulkBookImportResponse,
    BulkBookLookupRequest,
    BulkBookLookupResponse,
    BulkBookStashRequest,
    BulkBookStashResponse,
    BulkShelfMoveRequest,
    BulkShelfMoveResponse,
    BulkStashApplyRequest,
    BulkStashApplyResponse,
    CheckinRequest,
    CheckoutRequest,
    MarkReadRequest,
    PlacementState,
    SetBookAvailabilityRequest,
} from './apiTypes'
import type {
    createApiClient,
} from './apiClient'
import type {
    ApiCallOptions,
} from './apiCallOptions'
import {
    withCoverRequestSlot,
} from './coverRequestLimiter'
import {
    pickBookCreate,
    pickBookUpdate,
    pickBulkShelfMoveRequest,
    pickCheckinRequest,
    pickCheckoutRequest,
    pickMarkReadRequest,
} from './requestFields'

export interface ListBooksOptions
    extends ApiCallOptions {
    bookId?: string
    isbn?: string
    author?: string
    title?: string
    categoryIds?: readonly string[]
    shelfName?: string
    placementState?: PlacementState
    isRead?: boolean
    skip?: number
    take?: number
    sortBy?: string
    sortOrder?: string
}

function withSignal(
    signal: AbortSignal | undefined,
): ApiCallOptions | undefined {
    return signal === undefined
        ? undefined
        : {
            signal,
        }
}

/** Omit undefined / blank / whitespace-only filters (backend returns 400 for empty isbn/author/title). */
function setOptionalStringParam(
    params: URLSearchParams,
    name: string,
    value: string | undefined,
): void {
    if (value === undefined) {
        return
    }

    const trimmed = value.trim()

    if (trimmed === '') {
        return
    }

    params.set(name, trimmed)
}

function setRepeatedCategoryIdParams(
    params: URLSearchParams,
    categoryIds: readonly string[] | undefined,
): void {
    if (categoryIds === undefined) {
        return
    }

    for (const categoryId of categoryIds) {
        const trimmed = categoryId.trim()

        if (trimmed === '') {
            continue
        }

        params.append('category_id', trimmed)
    }
}

export function createBooksApi(
    client: ReturnType<typeof createApiClient>,
) {
    return {

        async list(
            options: ListBooksOptions = {},
        ): Promise<BookList> {
            const params = new URLSearchParams()

            if (options.bookId !== undefined) {
                params.set('book_id', options.bookId)
            }

            setOptionalStringParam(
                params,
                'isbn',
                options.isbn,
            )
            setOptionalStringParam(
                params,
                'author',
                options.author,
            )
            setOptionalStringParam(
                params,
                'title',
                options.title,
            )
            setRepeatedCategoryIdParams(
                params,
                options.categoryIds,
            )

            setOptionalStringParam(
                params,
                'shelf_name',
                options.shelfName,
            )
            setOptionalStringParam(
                params,
                'placement_state',
                options.placementState,
            )

            if (options.isRead !== undefined) {
                params.set(
                    'is_read',
                    String(options.isRead),
                )
            }

            if (options.skip !== undefined) {
                params.set(
                    'skip',
                    String(options.skip),
                )
            }

            if (options.take !== undefined) {
                params.set(
                    'take',
                    String(options.take),
                )
            }

            if (options.sortBy !== undefined) {
                params.set(
                    'sortBy',
                    options.sortBy,
                )
            }

            if (options.sortOrder !== undefined) {
                params.set(
                    'sortOrder',
                    options.sortOrder,
                )
            }

            const query = params.toString()
            const signalOptions = withSignal(
                options.signal,
            )

            if (query) {
                return signalOptions === undefined
                    ? client.getJson<BookList>(
                        `/books?${query}`,
                    )
                    : client.getJson<BookList>(
                        `/books?${query}`,
                        signalOptions,
                    )
            }

            return signalOptions === undefined
                ? client.getJson<BookList>(
                    '/books',
                )
                : client.getJson<BookList>(
                    '/books',
                    signalOptions,
                )
        },

        async create(
            book: BookCreate,
            options: ApiCallOptions = {},
        ): Promise<BookRead> {
            return client.requestJson<BookRead>(
                '/books',
                {
                    method: 'POST',
                    body: pickBookCreate(book),
                    ...withSignal(options.signal),
                },
            )
        },

        async bulkLookup(
            request: BulkBookLookupRequest,
            options: ApiCallOptions = {},
        ): Promise<BulkBookLookupResponse> {
            return client.requestJson<BulkBookLookupResponse>(
                '/books/bulk/lookup',
                {
                    method: 'POST',
                    body: {
                        items: request.items.map((item) => ({
                            client_item_id:
                            item.client_item_id,
                            isbn: item.isbn,
                        })),
                    },
                    ...withSignal(options.signal),
                },
            )
        },

        async bulkImport(
            request: BulkBookImportRequest,
            options: ApiCallOptions = {},
        ): Promise<BulkBookImportResponse> {
            const body: BulkBookImportRequest = {
                shelf_name: request.shelf_name,
                items: request.items.map((item) => {
                    const picked = {
                        action: item.action,
                        client_item_id:
                        item.client_item_id,
                    } as BulkBookImportRequest['items'][number]

                    if (
                        Object.hasOwn(
                            item,
                            'book',
                        )
                    ) {
                        picked.book = item.book
                    }

                    if (
                        Object.hasOwn(
                            item,
                            'existing_book_id',
                        )
                    ) {
                        picked.existing_book_id =
                            item.existing_book_id
                    }

                    return picked
                }),
            }

            if (
                Object.hasOwn(
                    request,
                    'acquisition_source',
                )
            ) {
                body.acquisition_source =
                    request.acquisition_source
            }

            return client.requestJson<BulkBookImportResponse>(
                '/books/bulk/import',
                {
                    method: 'POST',
                    body,
                    ...withSignal(options.signal),
                },
            )
        },

        async moveToShelf(
            request: BulkShelfMoveRequest,
        ): Promise<BulkShelfMoveResponse> {
            return client.requestJson<BulkShelfMoveResponse>(
                '/books/bulk/move-to-shelf',
                {
                    method: 'POST',
                    body: pickBulkShelfMoveRequest(request),
                },
            )
        },

        async stash(
            request: BulkBookStashRequest,
        ): Promise<BulkBookStashResponse> {
            return client.requestJson<BulkBookStashResponse>(
                '/books/bulk/stash',
                {
                    method: 'POST',
                    body: {
                        book_ids: [...request.book_ids],
                    },
                },
            )
        },

        async applyStash(
            request: BulkStashApplyRequest,
        ): Promise<BulkStashApplyResponse> {
            return client.requestJson<BulkStashApplyResponse>(
                '/books/bulk/apply-stash',
                {
                    method: 'POST',
                    body: {
                        book_ids: [...request.book_ids],
                        shelf_name: request.shelf_name,
                    },
                },
            )
        },

        async lookup(
            isbn: string,
            options: ApiCallOptions = {},
        ): Promise<BookLookupResponse> {
            const params = new URLSearchParams({
                isbn,
            })

            const path =
                `/books/lookup?${params.toString()}`

            const signalOptions = withSignal(
                options.signal,
            )

            return signalOptions === undefined
                ? client.getJson<BookLookupResponse>(
                    path,
                )
                : client.getJson<BookLookupResponse>(
                    path,
                    signalOptions,
                )
        },

        async get(
            id: string,
            options: ApiCallOptions = {},
        ): Promise<BookRead> {
            const path =
                `/books/${encodeURIComponent(id)}`

            const signalOptions = withSignal(
                options.signal,
            )

            return signalOptions === undefined
                ? client.getJson<BookRead>(path)
                : client.getJson<BookRead>(
                    path,
                    signalOptions,
                )
        },

        async getCover(
            id: string,
            options: ApiCallOptions = {},
        ): Promise<Blob> {
            const path =
                `/books/${encodeURIComponent(id)}/cover`

            const signalOptions = withSignal(
                options.signal,
            )

            const response =
                await withCoverRequestSlot(
                    options.signal,
                    () =>
                        signalOptions === undefined
                            ? client.get(path)
                            : client.get(
                                path,
                                signalOptions,
                            ),
                )

            return response.blob()
        },

        async uploadCover(
            id: string,
            file: File,
            options: ApiCallOptions = {},
        ): Promise<BookRead> {
            const formData = new FormData()

            formData.append('file', file)

            const response = await client.request(
                `/books/${encodeURIComponent(id)}/cover`,
                {
                    method: 'PUT',
                    body: formData,
                    ...withSignal(options.signal),
                },
            )

            return response.json() as Promise<BookRead>
        },

        async removeCover(
            id: string,
            options: ApiCallOptions = {},
        ): Promise<void> {
            await client.request(
                `/books/${encodeURIComponent(id)}/cover`,
                {
                    method: 'DELETE',
                    ...withSignal(options.signal),
                },
            )
        },

        async update(
            id: string,
            book: BookUpdate,
            options: ApiCallOptions = {},
        ): Promise<BookRead> {
            return client.requestJson<BookRead>(
                `/books/${encodeURIComponent(id)}`,
                {
                    method: 'PATCH',
                    body: pickBookUpdate(book),
                    ...withSignal(options.signal),
                },
            )
        },

        async remove(
            id: string,
            options: ApiCallOptions = {},
        ): Promise<void> {
            await client.request(
                `/books/${encodeURIComponent(id)}`,
                {
                    method: 'DELETE',
                    ...withSignal(options.signal),
                },
            )
        },

        async checkout(
            id: string,
            request: CheckoutRequest,
            options: ApiCallOptions = {},
        ): Promise<BookRead> {
            return client.requestJson<BookRead>(
                `/books/${encodeURIComponent(id)}/checkout`,
                {
                    method: 'POST',
                    body: pickCheckoutRequest(
                        request,
                    ),
                    ...withSignal(options.signal),
                },
            )
        },

        async checkin(
            id: string,
            request: CheckinRequest,
            options: ApiCallOptions = {},
        ): Promise<BookRead> {
            const path =
                `/books/${encodeURIComponent(id)}/checkin`

            return client.requestJson<BookRead>(
                path,
                {
                    method: 'POST',
                    body: pickCheckinRequest(
                        request,
                    ),
                    ...withSignal(options.signal),
                },
            )
        },

        setAvailability(
            id: string,
            request: SetBookAvailabilityRequest,
        ): Promise<BookRead> {
            return client.requestJson<BookRead>(
                `/books/${encodeURIComponent(id)}/availability`,
                { method: 'POST', body: request },
            )
        },

        async markRead(
            id: string,
            request: MarkReadRequest = {},
            options: ApiCallOptions = {},
        ): Promise<BookRead> {
            return client.requestJson<BookRead>(
                `/books/${encodeURIComponent(id)}/mark-read`,
                {
                    method: 'POST',
                    body: pickMarkReadRequest(
                        request,
                    ),
                    ...withSignal(options.signal),
                },
            )
        },
    }
}
