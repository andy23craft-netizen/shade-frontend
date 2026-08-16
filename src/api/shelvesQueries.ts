import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query'

import type {
    ShelfCreate,
    ShelfUpdate,
} from './apiTypes'
import {
    createShelvesApi,
} from './shelvesApi'
import {
    queryKeys,
} from './queryKeys'

import {
    useConnection,
} from '../features/connection/useConnection'

async function invalidateShelfCaches(
    queryClient: ReturnType<
        typeof useQueryClient
    >,
    options: {
        membershipDisplayChanged?: boolean
    } = {},
): Promise<void> {
    await queryClient.invalidateQueries({
        queryKey: queryKeys.shelves.all,
    })

    if (options.membershipDisplayChanged) {
        await queryClient.invalidateQueries({
            queryKey: queryKeys.books.all,
        })

        await queryClient.invalidateQueries({
            queryKey: queryKeys.dashboard.all,
        })
    }
}

export function useShelves(
    options: {
        enabled?: boolean
    } = {},
) {
    const {
        apiClient,
    } = useConnection()

    const shelvesApi =
        createShelvesApi(apiClient)

    const enabled = options.enabled ?? true

    return useQuery({
        queryKey: queryKeys.shelves.list(),
        queryFn: ({
            signal,
        }) =>
            shelvesApi.list({
                signal,
            }),
        enabled,
    })
}

export function useCreateShelf() {
    const {
        apiClient,
    } = useConnection()

    const queryClient =
        useQueryClient()

    const shelvesApi =
        createShelvesApi(apiClient)

    return useMutation({
        mutationFn: (
            shelf: ShelfCreate,
        ) =>
            shelvesApi.create(shelf),

        onSuccess: async () => {
            await invalidateShelfCaches(
                queryClient,
            )
        },
    })
}

export function useUpdateShelf() {
    const {
        apiClient,
    } = useConnection()

    const queryClient =
        useQueryClient()

    const shelvesApi =
        createShelvesApi(apiClient)

    return useMutation({
        mutationFn: ({
            shelfId,
            shelf,
        }: {
            shelfId: string
            shelf: ShelfUpdate
        }) =>
            shelvesApi.update(
                shelfId,
                shelf,
            ),

        onSuccess: async (
            _result,
            variables,
        ) => {
            await invalidateShelfCaches(
                queryClient,
                {
                    membershipDisplayChanged:
                        Object.hasOwn(
                            variables.shelf,
                            'common_name',
                        ),
                },
            )
        },
    })
}

export function useDeleteShelf() {
    const {
        apiClient,
    } = useConnection()

    const queryClient =
        useQueryClient()

    const shelvesApi =
        createShelvesApi(apiClient)

    return useMutation({
        mutationFn: (
            shelfId: string,
        ) =>
            shelvesApi.remove(shelfId),

        onSuccess: async () => {
            await invalidateShelfCaches(
                queryClient,
            )
        },
    })
}
