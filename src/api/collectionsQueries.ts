import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query'

import type {
    CollectionBookCreate,
    CollectionBookReorder,
    CollectionCreate,
    CollectionUpdate,
} from './apiTypes'
import {
    createCollectionsApi,
} from './collectionsApi'
import {
    queryKeys,
} from './queryKeys'
import {
    useConnection,
} from '../features/connection/useConnection'

export function useCollections(
    options: {
        enabled?: boolean
    } = {},
) {
    const {
        apiClient,
    } = useConnection()

    const collectionsApi =
        createCollectionsApi(apiClient)

    const enabled = options.enabled ?? true

    return useQuery({
        queryKey: queryKeys.collections.list(),
        queryFn: ({
                      signal,
                  }) =>
            collectionsApi.list({
                signal,
            }),
        enabled,
    })
}

export function useCollectionBooks(
    collectionId: string,
    options: {
        enabled?: boolean
    } = {},
) {
    const {
        apiClient,
    } = useConnection()

    const collectionsApi =
        createCollectionsApi(apiClient)

    const enabled =
        (options.enabled ?? true) &&
        collectionId !== ''

    return useQuery({
        queryKey:
            queryKeys.collections.books(
                collectionId,
            ),
        queryFn: ({
                      signal,
                  }) =>
            collectionsApi.listBooks(
                collectionId,
                {
                    signal,
                },
            ),
        enabled,
    })
}

export function useCreateCollection() {
    const {
        apiClient,
    } = useConnection()

    const queryClient =
        useQueryClient()

    const collectionsApi =
        createCollectionsApi(apiClient)

    return useMutation({
        mutationFn: (
            collection: CollectionCreate,
        ) =>
            collectionsApi.create(
                collection,
            ),

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey:
                queryKeys.collections.all,
            })
        },
    })
}

export function useUpdateCollection() {
    const {
        apiClient,
    } = useConnection()

    const queryClient =
        useQueryClient()

    const collectionsApi =
        createCollectionsApi(apiClient)

    return useMutation({
        mutationFn: ({
                         collectionId,
                         collection,
                     }: {
            collectionId: string
            collection: CollectionUpdate
        }) =>
            collectionsApi.update(
                collectionId,
                collection,
            ),

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey:
                queryKeys.collections.all,
            })
        },
    })
}

export function useDeleteCollection() {
    const {
        apiClient,
    } = useConnection()

    const queryClient =
        useQueryClient()

    const collectionsApi =
        createCollectionsApi(apiClient)

    return useMutation({
        mutationFn: (
            collectionId: string,
        ) =>
            collectionsApi.remove(
                collectionId,
            ),

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey:
                queryKeys.collections.all,
            })
        },
    })
}

export function useAddCollectionBook() {
    const {
        apiClient,
    } = useConnection()

    const queryClient =
        useQueryClient()

    const collectionsApi =
        createCollectionsApi(apiClient)

    return useMutation({
        mutationFn: ({
                         collectionId,
                         collectionBook,
                     }: {
            collectionId: string
            collectionBook: CollectionBookCreate
        }) =>
            collectionsApi.addBook(
                collectionId,
                collectionBook,
            ),

        onSuccess: async (
            _result,
            variables,
        ) => {
            await queryClient.invalidateQueries({
                queryKey:
                    queryKeys.collections.books(
                        variables.collectionId,
                    ),
            })
        },
    })
}

export function useReorderCollectionBook() {
    const {
        apiClient,
    } = useConnection()

    const queryClient =
        useQueryClient()

    const collectionsApi =
        createCollectionsApi(apiClient)

    return useMutation({
        mutationFn: ({
                         collectionId,
                         collectionBookId,
                         orderNum,
                     }: {
            collectionId: string
            collectionBookId: string
            orderNum: number
        }) =>
            collectionsApi.reorderBook(
                collectionId,
                collectionBookId,
                {
                    order_num: orderNum,
                } satisfies CollectionBookReorder,
            ),

        onSuccess: async (
            _result,
            variables,
        ) => {
            await queryClient.invalidateQueries({
                queryKey:
                    queryKeys.collections.books(
                        variables.collectionId,
                    ),
            })
        },
    })
}

export function useRemoveCollectionBook() {
    const {
        apiClient,
    } = useConnection()

    const queryClient =
        useQueryClient()

    const collectionsApi =
        createCollectionsApi(apiClient)

    return useMutation({
        mutationFn: ({
                         collectionId,
                         collectionBookId,
                     }: {
            collectionId: string
            collectionBookId: string
        }) =>
            collectionsApi.removeBook(
                collectionId,
                collectionBookId,
            ),

        onSuccess: async (
            _result,
            variables,
        ) => {
            await queryClient.invalidateQueries({
                queryKey:
                    queryKeys.collections.books(
                        variables.collectionId,
                    ),
            })
        },
    })
}
