import type {
    ShelfRead,
} from './apiTypes'
import type {
    createApiClient,
} from './apiClient'
import type {
    ApiCallOptions,
} from './apiCallOptions'

export type ListShelvesOptions = ApiCallOptions

function withSignal(
    signal: AbortSignal | undefined,
): ApiCallOptions | undefined {
    return signal === undefined
        ? undefined
        : {
            signal,
        }
}

export function createShelvesApi(
    client: ReturnType<typeof createApiClient>,
) {
    return {
        async list(
            options: ListShelvesOptions = {},
        ): Promise<ShelfRead[]> {
            const signalOptions = withSignal(
                options.signal,
            )

            return signalOptions === undefined
                ? client.getJson<ShelfRead[]>(
                    '/shelves',
                )
                : client.getJson<ShelfRead[]>(
                    '/shelves',
                    signalOptions,
                )
        },
    }
}
