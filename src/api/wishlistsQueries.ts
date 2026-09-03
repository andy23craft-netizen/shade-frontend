import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query'

import type {
    BookRead,
    WishlistBookCreate,
    WishlistBookList,
    WishlistBookRead,
    WishlistBookUpdate,
    WishlistCreate,
    WishlistUpdate,
} from './apiTypes'
import {
    INFINITE_SCROLL_BATCH_SIZE,
} from '../features/shared/infiniteScrollConfig'
import {
    createBooksApi,
} from './booksApi'
import {
    createWishlistsApi,
} from './wishlistsApi'
import { isApiError } from './apiErrors'
import {
    queryKeys,
} from './queryKeys'
import {
    useConnection,
} from '../features/connection/useConnection'

export class MoveWishlistBookToShelfError extends Error {
    readonly cause: unknown
    readonly membershipRemoved: boolean

    constructor({
                    cause,
                    membershipRemoved,
                }: {
        cause: unknown
        membershipRemoved: boolean
    }) {
        super(
            cause instanceof Error
                ? cause.message
                : 'Unable to move the book to a shelf.',
        )

        this.name = 'MoveWishlistBookToShelfError'
        this.cause = cause
        this.membershipRemoved = membershipRemoved
    }
}

export class MoveWishlistBookError extends Error {
    readonly cause: unknown
    readonly destinationMembershipCreated: boolean

    constructor({
                    cause,
                    destinationMembershipCreated,
                }: {
        cause: unknown
        destinationMembershipCreated: boolean
    }) {
        super(
            cause instanceof Error
                ? cause.message
                : 'Unable to move the book to another wishlist.',
        )

        this.name = 'MoveWishlistBookError'
        this.cause = cause
        this.destinationMembershipCreated =
            destinationMembershipCreated
    }
}

function getNextWishlistBooksPageParam(
    lastPage: WishlistBookList,
    allPages: WishlistBookList[],
): number | undefined {
    const loaded = allPages.reduce(
        (count, page) =>
            count + page.items.length,
        0,
    )

    return loaded < lastPage.total
        ? loaded
        : undefined
}

export function useInfiniteWishlistBooks(
    wishlistId: string,
    options: {
        enabled?: boolean
    } = {},
) {
    const {
        apiClient,
    } = useConnection()

    const wishlistsApi =
        createWishlistsApi(apiClient)

    const enabled =
        Boolean(wishlistId) &&
        (options.enabled ?? true)

    return useInfiniteQuery({
        queryKey: [
            ...queryKeys.wishlists.books(
                wishlistId,
            ),
            'infinite',
            INFINITE_SCROLL_BATCH_SIZE,
        ],
        initialPageParam: 0,
        queryFn: ({
                      pageParam,
                      signal,
                  }) =>
            wishlistsApi.listBooks(
                wishlistId,
                {
                    skip: pageParam,
                    take:
                    INFINITE_SCROLL_BATCH_SIZE,
                    signal,
                },
            ),
        getNextPageParam:
        getNextWishlistBooksPageParam,
        enabled,
    })
}

export function useWishlists(
    options: {
        enabled?: boolean
    } = {},
) {
    const {
        apiClient,
    } = useConnection()

    const wishlistsApi =
        createWishlistsApi(apiClient)

    const enabled = options.enabled ?? true

    return useQuery({
        queryKey: queryKeys.wishlists.list(),
        queryFn: ({
                      signal,
                  }) =>
            wishlistsApi.list({
                signal,
            }),
        enabled,
    })
}

export function useWishlistBooks(
    wishlistId: string,
    options: {
        enabled?: boolean
    } = {},
) {
    const {
        apiClient,
    } = useConnection()

    const wishlistsApi =
        createWishlistsApi(apiClient)

    const enabled =
        (options.enabled ?? true) &&
        wishlistId !== ''

    return useQuery({
        queryKey:
            queryKeys.wishlists.books(wishlistId),
        queryFn: ({
                      signal,
                  }) =>
            wishlistsApi.listBooks(
                wishlistId,
                {
                    signal,
                },
            ),
        enabled,
    })
}

export function useMoveWishlistBookToShelf() {
    const {
        apiClient,
    } = useConnection()

    const queryClient =
        useQueryClient()

    const wishlistsApi =
        createWishlistsApi(apiClient)

    const booksApi =
        createBooksApi(apiClient)

    return useMutation({
        mutationFn: async ({
                               wishlistId,
                               wishlistItemId,
                               bookId,
                               shelfName,
                               membershipRemoved = false,
                           }: {
            wishlistId: string
            wishlistItemId: string
            bookId: string
            shelfName: string
            membershipRemoved?: boolean
        }): Promise<BookRead> => {
            let removed = membershipRemoved

            if (!removed) {
                try {
                    await wishlistsApi.removeBook(
                        wishlistId,
                        wishlistItemId,
                    )

                    removed = true
                } catch (error) {
                    throw new MoveWishlistBookToShelfError({
                        cause: error,
                        membershipRemoved: false,
                    })
                }
            }

            try {
                return await booksApi.update(
                    bookId,
                    {
                        shelf_name: shelfName,
                    },
                )
            } catch (error) {
                throw new MoveWishlistBookToShelfError({
                    cause: error,
                    membershipRemoved: removed,
                })
            }
        },

        onSuccess: async (
            book,
            variables,
        ) => {
            queryClient.setQueryData(
                queryKeys.books.detail(book.book_id),
                book,
            )

            await queryClient.invalidateQueries({
                queryKey:
                    queryKeys.wishlists.books(
                        variables.wishlistId,
                    ),
            })

            await queryClient.invalidateQueries({
                queryKey: queryKeys.books.all,
            })

            await queryClient.invalidateQueries({
                queryKey:
                    queryKeys.books.detail(
                        variables.bookId,
                    ),
            })

            await queryClient.invalidateQueries({
                queryKey: queryKeys.dashboard.all,
            })
        },
    })
}

export function useMoveWishlistBook() {
    const {
        apiClient,
    } = useConnection()

    const queryClient =
        useQueryClient()

    const wishlistsApi =
        createWishlistsApi(apiClient)

    return useMutation({
        mutationFn: async ({
                               sourceWishlistId,
                               sourceWishlistItemId,
                               destinationWishlistId,
                               wishlistBook,
                               destinationMembershipCreated = false,
                           }: {
            sourceWishlistId: string
            sourceWishlistItemId: string
            destinationWishlistId: string
            wishlistBook: WishlistBookCreate
            destinationMembershipCreated?: boolean
        }): Promise<WishlistBookRead> => {
            let destinationCreated =
                destinationMembershipCreated

            let destinationMembership:
                WishlistBookRead | null = null

            if (!destinationCreated) {
                try {
                    destinationMembership =
                        await wishlistsApi.addBook(
                            destinationWishlistId,
                            wishlistBook,
                        )

                    destinationCreated = true
                } catch (error) {
                    throw new MoveWishlistBookError({
                        cause: error,
                        destinationMembershipCreated:
                            false,
                    })
                }
            }

            try {
                await wishlistsApi.removeBook(
                    sourceWishlistId,
                    sourceWishlistItemId,
                )
            } catch (error) {
                throw new MoveWishlistBookError({
                    cause: error,
                    destinationMembershipCreated:
                    destinationCreated,
                })
            }

            if (destinationMembership !== null) {
                return destinationMembership
            }

            /*
             * A retry may skip destination creation because
             * that step succeeded previously. In that case,
             * refresh the destination list and recover the
             * moved membership from server state.
             */
            const destinationBooks =
                await wishlistsApi.listBooks(
                    destinationWishlistId,
                )

            const movedMembership =
                destinationBooks.items.find(
                    (membership) =>
                        membership.book_id ===
                        wishlistBook.book_id,
                )

            if (movedMembership === undefined) {
                throw new MoveWishlistBookError({
                    cause: new Error(
                        'The book was moved, but the destination membership could not be confirmed.',
                    ),
                    destinationMembershipCreated: true,
                })
            }

            return movedMembership
        },

        onSettled: async (
            _membership,
            _error,
            variables,
        ) => {
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey:
                        queryKeys.wishlists.books(
                            variables.sourceWishlistId,
                        ),
                }),
                queryClient.invalidateQueries({
                    queryKey:
                        queryKeys.wishlists.books(
                            variables.destinationWishlistId,
                        ),
                }),
            ])
        },
    })
}

export function useCreateWishlist() {
    const {
        apiClient,
    } = useConnection()

    const queryClient =
        useQueryClient()

    const wishlistsApi =
        createWishlistsApi(apiClient)

    return useMutation({
        mutationFn: (
            wishlist: WishlistCreate,
        ) =>
            wishlistsApi.create(wishlist),

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: queryKeys.wishlists.all,
            })
        },
    })
}

export function useUpdateWishlist() {
    const {
        apiClient,
    } = useConnection()

    const queryClient =
        useQueryClient()

    const wishlistsApi =
        createWishlistsApi(apiClient)

    return useMutation({
        mutationFn: ({
                         wishlistId,
                         wishlist,
                     }: {
            wishlistId: string
            wishlist: WishlistUpdate
        }) =>
            wishlistsApi.update(
                wishlistId,
                wishlist,
            ),

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: queryKeys.wishlists.all,
            })
        },
    })
}

export function useDeleteWishlist() {
    const {
        apiClient,
    } = useConnection()

    const queryClient =
        useQueryClient()

    const wishlistsApi =
        createWishlistsApi(apiClient)

    return useMutation({
        mutationFn: (
            wishlistId: string,
        ) =>
            wishlistsApi.remove(wishlistId),

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: queryKeys.wishlists.all,
            })
        },
    })
}

export function useAddWishlistBook() {
    const {
        apiClient,
    } = useConnection()

    const queryClient =
        useQueryClient()

    const wishlistsApi =
        createWishlistsApi(apiClient)

    return useMutation({
        mutationFn: ({
                         wishlistId,
                         wishlistBook,
                     }: {
            wishlistId: string
            wishlistBook: WishlistBookCreate
        }) =>
            wishlistsApi.addBook(
                wishlistId,
                wishlistBook,
            ),

        onSettled: async (
            _result,
            error,
            variables,
        ) => {
            if (error && !(isApiError(error) && error.status === 409)) return
            await queryClient.invalidateQueries({
                queryKey:
                    queryKeys.wishlists.books(
                        variables.wishlistId,
                    ),
            })
        },
    })
}

export function useRemoveWishlistBook() {
    const {
        apiClient,
    } = useConnection()

    const queryClient =
        useQueryClient()

    const wishlistsApi =
        createWishlistsApi(apiClient)

    return useMutation({
        mutationFn: ({
                         wishlistId,
                         wishlistItemId,
                     }: {
            wishlistId: string
            wishlistItemId: string
        }) =>
            wishlistsApi.removeBook(
                wishlistId,
                wishlistItemId,
            ),

        onSuccess: async (
            _result,
            variables,
        ) => {
            await queryClient.invalidateQueries({
                queryKey:
                    queryKeys.wishlists.books(
                        variables.wishlistId,
                    ),
            })
        },
    })
}

export function useUpdateWishlistBook() {
    const { apiClient } = useConnection()
    const queryClient = useQueryClient()
    const wishlistsApi = createWishlistsApi(apiClient)

    return useMutation({
        mutationFn: ({ wishlistId, wishlistItemId, update }: {
            wishlistId: string
            wishlistItemId: string
            update: WishlistBookUpdate
        }) => wishlistsApi.updateBook(wishlistId, wishlistItemId, update),
        onSuccess: async (_result, variables) => {
            await queryClient.invalidateQueries({
                queryKey: queryKeys.wishlists.books(variables.wishlistId),
            })
        },
    })
}
