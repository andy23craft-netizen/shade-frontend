import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
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
    LoanUpdate,
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
        albumId?: string
        mediaType?: 'book' | 'album'
        enabled?: boolean
    } = {},
) {
    const {
        apiClient,
    } = useConnection()

    const loansApi =
        createLoansApi(apiClient)

    const bookId = options.bookId
    const albumId = options.albumId
    const mediaType = options.mediaType
    const enabled = options.enabled ?? true

    return useQuery({
        queryKey: queryKeys.loans.list(bookId, { albumId, mediaType }),
        queryFn: ({
                      signal,
                  }) =>
            loansApi.list({
                bookId,
                albumId,
                mediaType,
                signal,
            }),
        enabled,
    })
}

export function useInfiniteLoans(
    options: {
        bookId?: string
        albumId?: string
        mediaType?: 'book' | 'album'
        enabled?: boolean
    } = {},
) {
    const {
        apiClient,
    } = useConnection()

    const loansApi =
        createLoansApi(apiClient)

    const bookId = options.bookId
    const albumId = options.albumId
    const mediaType = options.mediaType
    const enabled = options.enabled ?? true

    return useInfiniteQuery({
        queryKey: queryKeys.loans.infiniteList({
            bookId,
            albumId,
            mediaType,
            take: INFINITE_SCROLL_BATCH_SIZE,
        }),
        initialPageParam: 0,
        queryFn: ({
            pageParam,
            signal,
        }) =>
            loansApi.list({
                bookId,
                albumId,
                mediaType,
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

export function useUpdateLoan() {
    const {
        apiClient,
    } = useConnection()
    const queryClient = useQueryClient()
    const loansApi = createLoansApi(apiClient)

    return useMutation({
        mutationFn: ({
            id,
            update,
        }: {
            id: string
            update: LoanUpdate
        }) => loansApi.update(id, update),
        onSuccess: (loan) => {
            queryClient.setQueryData(
                queryKeys.loans.detail(loan.id),
                loan,
            )

            return queryClient.invalidateQueries({
                queryKey: queryKeys.loans.all,
            })
        },
    })
}
