import type {
    HealthResponse,
} from './apiTypes'
import type {
    createApiClient,
} from './apiClient'

export function createHealthApi(
    client: ReturnType<typeof createApiClient>,
) {
    return {
        async get(): Promise<HealthResponse> {
            return client.getJson<HealthResponse>(
                '/health',
                {
                    authenticated: false,
                },
            )
        },
    }
}
