import type {
    CollectionBookCreate,
    CollectionBookList,
    CollectionBookRead,
    CollectionBookReorder,
    CollectionCreate,
    CollectionList,
    CollectionRead,
    CollectionUpdate,
} from './apiTypes'
import type {
    createApiClient,
} from './apiClient'
import type {
    ApiCallOptions,
} from './apiCallOptions'
import {
    pickCollectionBookCreate,
    pickCollectionBookReorder,
    pickCollectionCreate,
    pickCollectionUpdate,
} from './requestFields'

export interface ListCollectionsOptions
    extends ApiCallOptions {
    skip?: number
    take?: number
}

export interface ListCollectionBooksOptions
    extends ApiCallOptions {
    skip?: number
    take?: number
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

function withPagination(
    path: string,
    skip: number | undefined,
    take: number | undefined,
): string {
    const params = new URLSearchParams()

    if (skip !== undefined) {
        params.set('skip', String(skip))
    }

    if (take !== undefined) {
        params.set('take', String(take))
    }

    const query = params.toString()

    return query
        ? `${path}?${query}`
        : path
}

export function createCollectionsApi(
    client: ReturnType<typeof createApiClient>,
) {
    return {
        async list(
            options: ListCollectionsOptions = {},
        ): Promise<CollectionList> {
            const path = withPagination(
                '/collections',
                options.skip,
                options.take,
            )

            const signalOptions = withSignal(
                options.signal,
            )

            return signalOptions === undefined
                ? client.getJson<CollectionList>(path)
                : client.getJson<CollectionList>(
                    path,
                    signalOptions,
                )
        },

        async create(
            collection: CollectionCreate,
            options: ApiCallOptions = {},
        ): Promise<CollectionRead> {
            return client.requestJson<CollectionRead>(
                '/collections',
                {
                    method: 'POST',
                    body: pickCollectionCreate(
                        collection,
                    ),
                    ...withSignal(options.signal),
                },
            )
        },

        async update(
            collectionId: string,
            collection: CollectionUpdate,
            options: ApiCallOptions = {},
        ): Promise<CollectionRead> {
            return client.requestJson<CollectionRead>(
                `/collections/${encodeURIComponent(collectionId)}`,
                {
                    method: 'PATCH',
                    body: pickCollectionUpdate(
                        collection,
                    ),
                    ...withSignal(options.signal),
                },
            )
        },

        async remove(
            collectionId: string,
            options: ApiCallOptions = {},
        ): Promise<void> {
            await client.request(
                `/collections/${encodeURIComponent(collectionId)}`,
                {
                    method: 'DELETE',
                    ...withSignal(options.signal),
                },
            )
        },

        async listBooks(
            collectionId: string,
            options: ListCollectionBooksOptions = {},
        ): Promise<CollectionBookList> {
            const path = withPagination(
                `/collections/${encodeURIComponent(collectionId)}/books`,
                options.skip,
                options.take,
            )

            const signalOptions = withSignal(
                options.signal,
            )

            return signalOptions === undefined
                ? client.getJson<CollectionBookList>(
                    path,
                )
                : client.getJson<CollectionBookList>(
                    path,
                    signalOptions,
                )
        },

        async addBook(
            collectionId: string,
            collectionBook: CollectionBookCreate,
            options: ApiCallOptions = {},
        ): Promise<CollectionBookRead> {
            return client.requestJson<CollectionBookRead>(
                `/collections/${encodeURIComponent(collectionId)}/books`,
                {
                    method: 'POST',
                    body: pickCollectionBookCreate(
                        collectionBook,
                    ),
                    ...withSignal(options.signal),
                },
            )
        },

        async reorderBook(
            collectionId: string,
            collectionBookId: string,
            reorder: CollectionBookReorder,
            options: ApiCallOptions = {},
        ): Promise<CollectionBookRead> {
            return client.requestJson<CollectionBookRead>(
                `/collections/${encodeURIComponent(collectionId)}/books/${encodeURIComponent(collectionBookId)}`,
                {
                    method: 'PATCH',
                    body: pickCollectionBookReorder(
                        reorder,
                    ),
                    ...withSignal(options.signal),
                },
            )
        },

        async removeBook(
            collectionId: string,
            collectionBookId: string,
            options: ApiCallOptions = {},
        ): Promise<void> {
            await client.request(
                `/collections/${encodeURIComponent(collectionId)}/books/${encodeURIComponent(collectionBookId)}`,
                {
                    method: 'DELETE',
                    ...withSignal(options.signal),
                },
            )
        },
    }
}
