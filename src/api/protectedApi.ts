import type {
    ProtectedResponse,
} from './apiTypes'
import type {
    createApiClient,
} from './apiClient'

export function createProtectedApi(
    client: ReturnType<typeof createApiClient>,
) {
    return {
        async get(): Promise<ProtectedResponse> {
            return client.getJson<ProtectedResponse>(
                '/protected',
            )
        },
    }
}
