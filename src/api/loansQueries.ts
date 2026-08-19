import {
    useInfiniteQuery,
    useQuery,
} from '@tanstack/react-query'

import {
    createLoansApi,
} from './loansApi'
import {
    queryKeys,
} from './queryKeys'

import {
    useConnection,
} from '../features/connection/useConnection'

import {
    INFINITE_SCROLL_BATCH_SIZE,
} from '../features/shared/infiniteScrollConfig'

import type {
    LoanList,
} from './apiTypes'

function getNextListPageParam(
    lastPage: LoanList,
    allPages: LoanList[],
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

export function useLoans(
    options: {
        bookId?: string
        enabled?: boolean
    } = {},
) {
    const {
        apiClient,
    } = useConnection()

    const loansApi =
        createLoansApi(apiClient)

    const bookId = options.bookId
    const enabled = options.enabled ?? true

    return useQuery({
        queryKey: queryKeys.loans.list(bookId),
        queryFn: ({
                      signal,
                  }) =>
            loansApi.list({
                bookId,
                signal,
            }),
        enabled,
    })
}

export function useInfiniteLoans(
    options: {
        bookId?: string
        enabled?: boolean
    } = {},
) {
    const {
        apiClient,
    } = useConnection()

    const loansApi =
        createLoansApi(apiClient)

    const bookId = options.bookId
    const enabled = options.enabled ?? true

    return useInfiniteQuery({
        queryKey: queryKeys.loans.infiniteList({
            bookId,
            take: INFINITE_SCROLL_BATCH_SIZE,
        }),
        initialPageParam: 0,
        queryFn: ({
            pageParam,
            signal,
        }) =>
            loansApi.list({
                bookId,
                skip: pageParam,
                take: INFINITE_SCROLL_BATCH_SIZE,
                signal,
            }),
        getNextPageParam: getNextListPageParam,
        enabled,
    })
}

export function useLoan(
    id: string,
) {
    const {
        apiClient,
    } = useConnection()

    const loansApi =
        createLoansApi(apiClient)

    return useQuery({
        queryKey: queryKeys.loans.detail(id),
        queryFn: ({
            signal,
        }) =>
            loansApi.get(id, {
                signal,
            }),
        enabled: Boolean(id),
    })
}
