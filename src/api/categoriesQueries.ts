import {
    useQuery,
} from '@tanstack/react-query'

import {
    createCategoriesApi,
} from './categoriesApi'
import {
    queryKeys,
} from './queryKeys'

import {
    useConnection,
} from '../features/connection/useConnection'

export function useCategories(
    options: {
        enabled?: boolean
    } = {},
) {
    const {
        apiClient,
    } = useConnection()

    const categoriesApi =
        createCategoriesApi(apiClient)

    const enabled = options.enabled ?? true

    return useQuery({
        queryKey: queryKeys.categories.list(),
        queryFn: ({
            signal,
        }) =>
            categoriesApi.list({
                signal,
            }),
        enabled,
    })
}
