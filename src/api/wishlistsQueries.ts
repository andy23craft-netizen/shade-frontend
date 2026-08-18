import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query'

import type {
    WishlistBookCreate,
    WishlistCreate,
    WishlistUpdate,
} from './apiTypes'
import {
    createWishlistsApi,
} from './wishlistsApi'
import {
    queryKeys,
} from './queryKeys'
import {
    useConnection,
} from '../features/connection/useConnection'

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
