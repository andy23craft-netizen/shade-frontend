import type {
    ShelfCreate,
    ShelfRead,
    ShelfUpdate,
} from './apiTypes'
import type {
    createApiClient,
} from './apiClient'
import type {
    ApiCallOptions,
} from './apiCallOptions'
import {
    pickShelfCreate,
    pickShelfUpdate,
} from './requestFields'

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

        async create(
            shelf: ShelfCreate,
            options: ApiCallOptions = {},
        ): Promise<ShelfRead> {
            return client.requestJson<ShelfRead>(
                '/shelves',
                {
                    method: 'POST',
                    body: pickShelfCreate(shelf),
                    ...withSignal(options.signal),
                },
            )
        },

        async update(
            shelfId: string,
            shelf: ShelfUpdate,
            options: ApiCallOptions = {},
        ): Promise<ShelfRead> {
            return client.requestJson<ShelfRead>(
                `/shelves/${encodeURIComponent(shelfId)}`,
                {
                    method: 'PATCH',
                    body: pickShelfUpdate(shelf),
                    ...withSignal(options.signal),
                },
            )
        },

        async remove(
            shelfId: string,
            options: ApiCallOptions = {},
        ): Promise<void> {
            await client.request(
                `/shelves/${encodeURIComponent(shelfId)}`,
                {
                    method: 'DELETE',
                    ...withSignal(options.signal),
                },
            )
        },
    }
}
