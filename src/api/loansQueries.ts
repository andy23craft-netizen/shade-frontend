import {
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

export function useLoans(
    options: {
        bookId?: string
    } = {},
) {
    const {
        apiClient,
    } = useConnection()

    const loansApi =
        createLoansApi(apiClient)

    const bookId = options.bookId

    return useQuery({
        queryKey: queryKeys.loans.list(bookId),
        queryFn: ({
            signal,
        }) =>
            loansApi.list({
                bookId,
                signal,
            }),
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
