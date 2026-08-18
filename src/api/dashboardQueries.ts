import {
    useInfiniteQuery,
    useQuery,
} from '@tanstack/react-query'

import {
    createDashboardApi,
} from './dashboardApi'
import {
    queryKeys,
} from './queryKeys'

import {
    useConnection,
} from '../features/connection/useConnection'
import {
    INFINITE_SCROLL_BATCH_SIZE,
} from '../features/shared/infiniteScrollConfig'

export function useDashboard() {
    const {
        apiClient,
    } = useConnection()

    const dashboardApi =
        createDashboardApi(apiClient)

    return useQuery({
        queryKey: queryKeys.dashboard.all,
        queryFn: ({
                      signal,
                  }) =>
            dashboardApi.get({
                signal,
            }),
    })
}

export function useDashboardBreakdowns() {
    const {
        apiClient,
    } = useConnection()

    const dashboardApi =
        createDashboardApi(apiClient)

    return useQuery({
        queryKey:
            queryKeys.dashboard.breakdowns(),
        queryFn: ({
                      signal,
                  }) =>
            dashboardApi.getBreakdowns({
                signal,
            }),
    })
}

export function useDashboardIncompleteMetadata() {
    const {
        apiClient,
    } = useConnection()

    const dashboardApi =
        createDashboardApi(apiClient)

    return useQuery({
        queryKey:
            queryKeys.dashboard.incompleteMetadata(),
        queryFn: ({
                      signal,
                  }) =>
            dashboardApi.getIncompleteMetadata({
                signal,
            }),
    })
}

export function useInfiniteIncompleteMetadataBooks(
    options: {
        field?: string
        enabled?: boolean
    } = {},
) {
    const {
        apiClient,
    } = useConnection()

    const dashboardApi =
        createDashboardApi(apiClient)

    return useInfiniteQuery({
        queryKey:
            queryKeys.dashboard.incompleteMetadataBooks({
                field: options.field,
                take: INFINITE_SCROLL_BATCH_SIZE,
            }),
        queryFn: ({
                      pageParam,
                      signal,
                  }) =>
            dashboardApi.listIncompleteMetadataBooks(
                {
                    field: options.field,
                    skip: pageParam,
                    take: INFINITE_SCROLL_BATCH_SIZE,
                },
                {
                    signal,
                },
            ),
        initialPageParam: 0,
        getNextPageParam: (
            lastPage,
            allPages,
        ) => {
            const loadedCount =
                allPages.reduce(
                    (
                        total,
                        page,
                    ) =>
                        total +
                        page.items.length,
                    0,
                )

            return loadedCount <
            lastPage.total
                ? loadedCount
                : undefined
        },
        enabled: options.enabled ?? true,
    })
}
