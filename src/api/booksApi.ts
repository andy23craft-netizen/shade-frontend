import type {
    BookCreate,
    BookList,
    BookLookupResponse,
    BookRead,
    BookUpdate,
    CheckinRequest,
    CheckoutRequest,
    MarkReadRequest,
} from './apiTypes'
import type {
    createApiClient,
} from './apiClient'
import type {
    ApiCallOptions,
} from './apiCallOptions'
import {
    pickBookCreate,
    pickBookUpdate,
    pickCheckinRequest,
    pickCheckoutRequest,
    pickMarkReadRequest,
} from './requestFields'

export interface ListBooksOptions
    extends ApiCallOptions {
    includeDeleted?: boolean
    isbn?: string
    author?: string
    title?: string
    categoryIds?: readonly string[]
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

            if (
                options.includeDeleted !==
                undefined
            ) {
                params.set(
                    'include_deleted',
                    String(
                        options.includeDeleted,
                    ),
                )
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

        async restore(
            id: string,
            options: ApiCallOptions = {},
        ): Promise<BookRead> {
            return client.requestJson<BookRead>(
                `/books/${encodeURIComponent(id)}/restore`,
                {
                    method: 'POST',
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
            request?: CheckinRequest,
            options: ApiCallOptions = {},
        ): Promise<BookRead> {
            const path =
                `/books/${encodeURIComponent(id)}/checkin`

            if (request === undefined) {
                return client.requestJson<BookRead>(
                    path,
                    {
                        method: 'POST',
                        ...withSignal(
                            options.signal,
                        ),
                    },
                )
            }

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
