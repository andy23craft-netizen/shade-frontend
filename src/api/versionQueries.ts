import {
    useQuery,
} from '@tanstack/react-query'

import {
    createVersionApi,
} from './versionApi'
import {
    queryKeys,
} from './queryKeys'

import {
    useConnection,
} from '../features/connection/useConnection'

export function useVersion() {
    const {
        apiClient,
    } = useConnection()

    const versionApi =
        createVersionApi(apiClient)

    return useQuery({
        queryKey: queryKeys.version.all,
        queryFn: ({
            signal,
        }) =>
            versionApi.get({
                signal,
            }),
    })
}
