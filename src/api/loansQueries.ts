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

export function useLoans() {
    const {
        apiClient,
    } = useConnection()

    const loansApi =
        createLoansApi(apiClient)

    return useQuery({
        queryKey: queryKeys.loans.all,
        queryFn: ({
            signal,
        }) =>
            loansApi.list({
                signal,
            }),
    })
}
