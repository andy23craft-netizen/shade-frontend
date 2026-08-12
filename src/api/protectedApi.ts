import type {
    ProtectedResponse,
} from './apiTypes'
import type {
    createApiClient,
} from './apiClient'
import type {
    ApiCallOptions,
} from './apiCallOptions'

export function createProtectedApi(
    client: ReturnType<typeof createApiClient>,
) {
    return {
        async get(
            options: ApiCallOptions = {},
        ): Promise<ProtectedResponse> {
            if (options.signal === undefined) {
                return client.getJson<ProtectedResponse>(
                    '/protected',
                )
            }

            return client.getJson<ProtectedResponse>(
                '/protected',
                {
                    signal: options.signal,
                },
            )
        },
    }
}
