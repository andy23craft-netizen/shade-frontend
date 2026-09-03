import type {
    WishlistBookCreate,
    WishlistBookList,
    WishlistBookRead,
    WishlistBookUpdate,
    WishlistCreate,
    WishlistList,
    WishlistRead,
    WishlistUpdate,
    WishlistAlbumCreate,
    WishlistItemList,
    WishlistItemRead,
} from './apiTypes'
import type {
    createApiClient,
} from './apiClient'
import type {
    ApiCallOptions,
} from './apiCallOptions'
import {
    pickWishlistBookCreate,
    pickWishlistBookUpdate,
    pickWishlistCreate,
    pickWishlistUpdate,
} from './requestFields'

export interface ListWishlistsOptions
    extends ApiCallOptions {
    skip?: number
    take?: number
}

export interface ListWishlistBooksOptions
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

export function createWishlistsApi(
    client: ReturnType<typeof createApiClient>,
) {
    return {
        async list(
            options: ListWishlistsOptions = {},
        ): Promise<WishlistList> {
            const path = withPagination(
                '/wishlists',
                options.skip,
                options.take,
            )
            const signalOptions = withSignal(
                options.signal,
            )

            return signalOptions === undefined
                ? client.getJson<WishlistList>(path)
                : client.getJson<WishlistList>(
                    path,
                    signalOptions,
                )
        },

        async create(
            wishlist: WishlistCreate,
            options: ApiCallOptions = {},
        ): Promise<WishlistRead> {
            return client.requestJson<WishlistRead>(
                '/wishlists',
                {
                    method: 'POST',
                    body: pickWishlistCreate(wishlist),
                    ...withSignal(options.signal),
                },
            )
        },

        async update(
            wishlistId: string,
            wishlist: WishlistUpdate,
            options: ApiCallOptions = {},
        ): Promise<WishlistRead> {
            return client.requestJson<WishlistRead>(
                `/wishlists/${encodeURIComponent(wishlistId)}`,
                {
                    method: 'PATCH',
                    body: pickWishlistUpdate(wishlist),
                    ...withSignal(options.signal),
                },
            )
        },

        async remove(
            wishlistId: string,
            options: ApiCallOptions = {},
        ): Promise<void> {
            await client.request(
                `/wishlists/${encodeURIComponent(wishlistId)}`,
                {
                    method: 'DELETE',
                    ...withSignal(options.signal),
                },
            )
        },

        async listBooks(
            wishlistId: string,
            options: ListWishlistBooksOptions = {},
        ): Promise<WishlistBookList> {
            const path = withPagination(
                `/wishlists/${encodeURIComponent(wishlistId)}/books`,
                options.skip,
                options.take,
            )
            const signalOptions = withSignal(
                options.signal,
            )

            return signalOptions === undefined
                ? client.getJson<WishlistBookList>(path)
                : client.getJson<WishlistBookList>(
                    path,
                    signalOptions,
                )
        },
        async listItems(wishlistId: string, options: ListWishlistBooksOptions = {}): Promise<WishlistItemList> {
            const path = withPagination(`/wishlists/${encodeURIComponent(wishlistId)}/items`, options.skip, options.take)
            return client.getJson<WishlistItemList>(path, withSignal(options.signal))
        },
        async addAlbum(wishlistId: string, album: WishlistAlbumCreate, options: ApiCallOptions = {}): Promise<WishlistItemRead> {
            return client.requestJson<WishlistItemRead>(`/wishlists/${encodeURIComponent(wishlistId)}/albums`, { method: 'POST', body: album, ...withSignal(options.signal) })
        },
        async removeAlbum(wishlistId: string, wishlistItemId: string, options: ApiCallOptions = {}): Promise<void> {
            await client.request(`/wishlists/${encodeURIComponent(wishlistId)}/albums/${encodeURIComponent(wishlistItemId)}`, { method: 'DELETE', ...withSignal(options.signal) })
        },

        async addBook(
            wishlistId: string,
            wishlistBook: WishlistBookCreate,
            options: ApiCallOptions = {},
        ): Promise<WishlistBookRead> {
            return client.requestJson<WishlistBookRead>(
                `/wishlists/${encodeURIComponent(wishlistId)}/books`,
                {
                    method: 'POST',
                    body: pickWishlistBookCreate(
                        wishlistBook,
                    ),
                    ...withSignal(options.signal),
                },
            )
        },

        async removeBook(
            wishlistId: string,
            wishlistItemId: string,
            options: ApiCallOptions = {},
        ): Promise<void> {
            await client.request(
                `/wishlists/${encodeURIComponent(wishlistId)}/books/${encodeURIComponent(wishlistItemId)}`,
                {
                    method: 'DELETE',
                    ...withSignal(options.signal),
                },
            )
        },

        async updateBook(
            wishlistId: string,
            wishlistItemId: string,
            wishlistBook: WishlistBookUpdate,
            options: ApiCallOptions = {},
        ): Promise<WishlistBookRead> {
            return client.requestJson<WishlistBookRead>(
                `/wishlists/${encodeURIComponent(wishlistId)}/books/${encodeURIComponent(wishlistItemId)}`,
                {
                    method: 'PATCH',
                    body: pickWishlistBookUpdate(wishlistBook),
                    ...withSignal(options.signal),
                },
            )
        },
    }
}
