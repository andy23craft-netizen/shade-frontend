import type {
    DashboardSummary,
} from './apiTypes'
import type {
    createApiClient,
} from './apiClient'

export function createDashboardApi(
    client: ReturnType<typeof createApiClient>,
) {
    return {
        async get(): Promise<DashboardSummary> {
            return client.getJson<DashboardSummary>(
                '/dashboard',
            )
        },
    }
}
