import {
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
