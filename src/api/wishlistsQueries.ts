import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query'

import type {
    BookRead,
    WishlistBookCreate,
    WishlistCreate,
    WishlistUpdate,
} from './apiTypes'
import {
    createBooksApi,
} from './booksApi'
import {
    createWishlistsApi,
} from './wishlistsApi'
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
                               wishlistBookId,
                               bookId,
                               shelfName,
                               membershipRemoved = false,
                           }: {
            wishlistId: string
            wishlistBookId: string
            bookId: string
            shelfName: string
            membershipRemoved?: boolean
        }): Promise<BookRead> => {
            let removed = membershipRemoved

            if (!removed) {
                try {
                    await wishlistsApi.removeBook(
                        wishlistId,
                        wishlistBookId,
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
                queryKeys.books.detail(book.id),
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
                         wishlistBookId,
                     }: {
            wishlistId: string
            wishlistBookId: string
        }) =>
            wishlistsApi.removeBook(
                wishlistId,
                wishlistBookId,
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

