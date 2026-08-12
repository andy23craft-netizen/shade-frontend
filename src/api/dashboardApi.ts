import type {
    DashboardSummary,
} from './apiTypes'
import type {
    createApiClient,
} from './apiClient'
import type {
    ApiCallOptions,
} from './apiCallOptions'

export function createDashboardApi(
    client: ReturnType<typeof createApiClient>,
) {
    return {
        async get(
            options: ApiCallOptions = {},
        ): Promise<DashboardSummary> {
            if (options.signal === undefined) {
                return client.getJson<DashboardSummary>(
                    '/dashboard',
                )
            }

            return client.getJson<DashboardSummary>(
                '/dashboard',
                {
                    signal: options.signal,
                },
            )
        },
    }
}
