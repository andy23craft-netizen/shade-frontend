import type {
    VersionResponse,
} from './apiTypes'
import type {
    createApiClient,
} from './apiClient'
import type {
    ApiCallOptions,
} from './apiCallOptions'

export function createVersionApi(
    client: ReturnType<typeof createApiClient>,
) {
    return {
        async get(
            options: ApiCallOptions = {},
        ): Promise<VersionResponse> {
            return client.getJson<VersionResponse>(
                '/version',
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
