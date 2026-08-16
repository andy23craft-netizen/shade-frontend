import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import type {
    ShelfRead,
} from './apiTypes'
import {
    ApiError,
} from './apiErrors'
import {
    createApiClient,
} from './apiClient'
import {
    createShelvesApi,
} from './shelvesApi'

function createMockClient(): ReturnType<
    typeof createApiClient
> {
    return {
        request: vi.fn(),
        requestJson: vi.fn(),
        get: vi.fn(),
        getJson: vi.fn(),
    }
}

describe('createShelvesApi', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('lists shelves as a plain array without pagination params', async () => {
        const shelves: ShelfRead[] = [
            {
                shelf_id: 'shelf-unknown',
                common_name: 'unknown',
                location: null,
                description: null,
                created_date:
                    '2026-01-01T00:00:00Z',
                updated_date:
                    '2026-01-01T00:00:00Z',
            },
            {
                shelf_id: 'shelf-a1',
                common_name: 'a1',
                location: 'Living room',
                description: null,
                created_date:
                    '2026-01-02T00:00:00Z',
                updated_date:
                    '2026-01-02T00:00:00Z',
            },
        ]

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(shelves)

        const api = createShelvesApi(client)

        const result = await api.list()

        expect(
            client.getJson,
        ).toHaveBeenCalledWith('/shelves')

        expect(result).toEqual(shelves)
    })

    it('forwards AbortSignal when provided', async () => {
        const shelves: ShelfRead[] = []
        const client = createMockClient()
        const signal = new AbortController()
            .signal

        vi.mocked(client.getJson)
            .mockResolvedValue(shelves)

        const api = createShelvesApi(client)

        await api.list({
            signal,
        })

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/shelves',
            {
                signal,
            },
        )
    })

    it('surfaces auth failures from GET /shelves', async () => {
        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockRejectedValue(
                new ApiError({
                    kind: 'unauthorized',
                    message:
                        'API access was rejected',
                    status: 403,
                }),
            )

        const api = createShelvesApi(client)

        await expect(api.list()).rejects.toMatchObject({
            kind: 'unauthorized',
            status: 403,
        })
    })

    it('surfaces network failures from GET /shelves', async () => {
        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockRejectedValue(
                new ApiError({
                    kind: 'unreachable',
                    message:
                        'The API could not be reached',
                }),
            )

        const api = createShelvesApi(client)

        await expect(api.list()).rejects.toMatchObject({
            kind: 'unreachable',
        })
    })

    it('surfaces timeout failures from GET /shelves', async () => {
        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockRejectedValue(
                new ApiError({
                    kind: 'timeout',
                    message:
                        'The request timed out',
                }),
            )

        const api = createShelvesApi(client)

        await expect(api.list()).rejects.toMatchObject({
            kind: 'timeout',
        })
    })
})
