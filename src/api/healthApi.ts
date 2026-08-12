import type {
    HealthResponse,
} from './apiTypes'
import type {
    createApiClient,
} from './apiClient'
import type {
    ApiCallOptions,
} from './apiCallOptions'

export function createHealthApi(
    client: ReturnType<typeof createApiClient>,
) {
    return {
        async get(
            options: ApiCallOptions = {},
        ): Promise<HealthResponse> {
            return client.getJson<HealthResponse>(
                '/health',
                {
                    authenticated: false,
                    ...(options.signal === undefined
                        ? {}
                        : {
                            signal: options.signal,
                        }),
                },
            )
        },
    }
}
