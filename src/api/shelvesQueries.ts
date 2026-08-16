import {
    useQuery,
} from '@tanstack/react-query'

import {
    createShelvesApi,
} from './shelvesApi'
import {
    queryKeys,
} from './queryKeys'

import {
    useConnection,
} from '../features/connection/useConnection'

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
