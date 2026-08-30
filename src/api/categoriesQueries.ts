import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query'

import type {
    CategoryCreate,
    CategoryUpdate,
} from './apiTypes'
import {
    createCategoriesApi,
} from './categoriesApi'
import {
    queryKeys,
} from './queryKeys'

import {
    useConnection,
} from '../features/connection/useConnection'

async function invalidateCategoryCaches(
    queryClient: ReturnType<
        typeof useQueryClient
    >,
): Promise<void> {
    await queryClient.invalidateQueries({
        queryKey: queryKeys.categories.all,
    })

    await queryClient.invalidateQueries({
        queryKey: queryKeys.books.all,
    })

    await queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.all,
    })
}

export function useCategories(
    options: {
        enabled?: boolean
        inUse?: boolean
    } = {},
) {
    const {
        apiClient,
    } = useConnection()

    const categoriesApi =
        createCategoriesApi(apiClient)

    const enabled = options.enabled ?? true

    return useQuery({
        queryKey: queryKeys.categories.list({
            inUse: options.inUse,
        }),
        queryFn: ({
                      signal,
                  }) =>
            categoriesApi.list({
                signal,
                inUse: options.inUse,
            }),
        enabled,
    })
}

export function useCategory(
    categoryId: string,
    options: {
        enabled?: boolean
    } = {},
) {
    const {
        apiClient,
    } = useConnection()

    const categoriesApi =
        createCategoriesApi(apiClient)

    const enabled =
        (options.enabled ?? true) &&
        categoryId !== ''

    return useQuery({
        queryKey:
            queryKeys.categories.detail(
                categoryId,
            ),
        queryFn: ({
                      signal,
                  }) =>
            categoriesApi.get(
                categoryId,
                {
                    signal,
                },
            ),
        enabled,
    })
}

export function useCreateCategory() {
    const {
        apiClient,
    } = useConnection()

    const queryClient =
        useQueryClient()

    const categoriesApi =
        createCategoriesApi(apiClient)

    return useMutation({
        mutationFn: (
            category: CategoryCreate,
        ) =>
            categoriesApi.create(category),

        onSuccess: async () => {
            await invalidateCategoryCaches(
                queryClient,
            )
        },
    })
}

export function useUpdateCategory() {
    const {
        apiClient,
    } = useConnection()

    const queryClient =
        useQueryClient()

    const categoriesApi =
        createCategoriesApi(apiClient)

    return useMutation({
        mutationFn: ({
                         categoryId,
                         category,
                     }: {
            categoryId: string
            category: CategoryUpdate
        }) =>
            categoriesApi.update(
                categoryId,
                category,
            ),

        onSuccess: async (
            category,
        ) => {
            queryClient.setQueryData(
                queryKeys.categories.detail(
                    category.category_id,
                ),
                category,
            )

            await invalidateCategoryCaches(
                queryClient,
            )
        },
    })
}

export function useDeleteCategory() {
    const {
        apiClient,
    } = useConnection()

    const queryClient =
        useQueryClient()

    const categoriesApi =
        createCategoriesApi(apiClient)

    return useMutation({
        mutationFn: (
            categoryId: string,
        ) =>
            categoriesApi.remove(
                categoryId,
            ),

        onSuccess: async (
            _result,
            categoryId,
        ) => {
            queryClient.removeQueries({
                queryKey:
                    queryKeys.categories.detail(
                        categoryId,
                    ),
            })

            await invalidateCategoryCaches(
                queryClient,
            )
        },
    })
}
