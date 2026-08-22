import type {
    CategoryRead,
} from './apiTypes'
import type {
    createApiClient,
} from './apiClient'
import type {
    ApiCallOptions,
} from './apiCallOptions'

export type ListCategoriesOptions = ApiCallOptions

function withSignal(
    signal: AbortSignal | undefined,
): ApiCallOptions | undefined {
    return signal === undefined
        ? undefined
        : {
            signal,
        }
}

export function createCategoriesApi(
    client: ReturnType<typeof createApiClient>,
) {
    return {
        async list(
            options: ListCategoriesOptions = {},
        ): Promise<CategoryRead[]> {
            const signalOptions = withSignal(
                options.signal,
            )

            return signalOptions === undefined
                ? client.getJson<CategoryRead[]>(
                    '/categories',
                )
                : client.getJson<CategoryRead[]>(
                    '/categories',
                    signalOptions,
                )
        },
    }
}
