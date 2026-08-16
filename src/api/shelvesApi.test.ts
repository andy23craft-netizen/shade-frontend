import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import type {
    ShelfCreate,
    ShelfRead,
    ShelfUpdate,
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

const sampleShelf: ShelfRead = {
    shelf_id: 'shelf-a1',
    common_name: 'a1',
    location: 'Living room',
    description: null,
    created_date: '2026-01-02T00:00:00Z',
    updated_date: '2026-01-02T00:00:00Z',
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
            sampleShelf,
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

    it('creates a shelf via POST /shelves', async () => {
        const body: ShelfCreate = {
            common_name: 'a1',
            location: 'Living room',
        }

        const client = createMockClient()

        vi.mocked(client.requestJson)
            .mockResolvedValue(sampleShelf)

        const api = createShelvesApi(client)

        const result = await api.create(body)

        expect(
            client.requestJson,
        ).toHaveBeenCalledWith(
            '/shelves',
            {
                method: 'POST',
                body,
            },
        )

        expect(result).toEqual(sampleShelf)
    })

    it('drops undocumented keys from create payloads', async () => {
        const client = createMockClient()

        vi.mocked(client.requestJson)
            .mockResolvedValue(sampleShelf)

        const api = createShelvesApi(client)

        await api.create({
            common_name: 'a1',
            mystery: 'drop-me',
        } as ShelfCreate & {
            mystery: string
        })

        expect(
            client.requestJson,
        ).toHaveBeenCalledWith(
            '/shelves',
            {
                method: 'POST',
                body: {
                    common_name: 'a1',
                },
            },
        )
    })

    it('updates a shelf via PATCH /shelves/{shelf_id}', async () => {
        const body: ShelfUpdate = {
            location: 'Office',
        }

        const updated: ShelfRead = {
            ...sampleShelf,
            location: 'Office',
        }

        const client = createMockClient()

        vi.mocked(client.requestJson)
            .mockResolvedValue(updated)

        const api = createShelvesApi(client)

        const result = await api.update(
            'shelf/a1',
            body,
        )

        expect(
            client.requestJson,
        ).toHaveBeenCalledWith(
            '/shelves/shelf%2Fa1',
            {
                method: 'PATCH',
                body,
            },
        )

        expect(result).toEqual(updated)
    })

    it('deletes a shelf via DELETE /shelves/{shelf_id}', async () => {
        const client = createMockClient()

        vi.mocked(client.request)
            .mockResolvedValue(
                new Response(null, {
                    status: 204,
                }),
            )

        const api = createShelvesApi(client)

        await api.remove('shelf/a1')

        expect(
            client.request,
        ).toHaveBeenCalledWith(
            '/shelves/shelf%2Fa1',
            {
                method: 'DELETE',
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

    it('surfaces reserved-name create failures as 400', async () => {
        const client = createMockClient()

        vi.mocked(client.requestJson)
            .mockRejectedValue(
                new ApiError({
                    kind: 'http',
                    message:
                        'Reserved shelf name',
                    status: 400,
                    detail:
                        'Reserved shelf name',
                }),
            )

        const api = createShelvesApi(client)

        await expect(
            api.create({
                common_name: 'unknown',
            }),
        ).rejects.toMatchObject({
            status: 400,
            detail: 'Reserved shelf name',
        })
    })

    it('surfaces duplicate create failures as 409', async () => {
        const client = createMockClient()

        vi.mocked(client.requestJson)
            .mockRejectedValue(
                new ApiError({
                    kind: 'http',
                    message:
                        'Shelf already exists',
                    status: 409,
                    detail:
                        'Shelf already exists',
                }),
            )

        const api = createShelvesApi(client)

        await expect(
            api.create({
                common_name: 'a1',
            }),
        ).rejects.toMatchObject({
            status: 409,
        })
    })

    it('surfaces validation create failures as 422', async () => {
        const client = createMockClient()

        vi.mocked(client.requestJson)
            .mockRejectedValue(
                new ApiError({
                    kind: 'validation',
                    message:
                        'Validation failed',
                    status: 422,
                    fieldErrors: [
                        {
                            field: 'common_name',
                            message:
                                'Field required',
                        },
                    ],
                }),
            )

        const api = createShelvesApi(client)

        await expect(
            api.create({
                common_name: '',
            }),
        ).rejects.toMatchObject({
            kind: 'validation',
            status: 422,
        })
    })

    it('surfaces missing update targets as 404', async () => {
        const client = createMockClient()

        vi.mocked(client.requestJson)
            .mockRejectedValue(
                new ApiError({
                    kind: 'http',
                    message: 'Not found',
                    status: 404,
                }),
            )

        const api = createShelvesApi(client)

        await expect(
            api.update('missing', {
                location: 'Office',
            }),
        ).rejects.toMatchObject({
            status: 404,
        })
    })

    it('surfaces delete conflicts when books remain as 409', async () => {
        const client = createMockClient()

        vi.mocked(client.request)
            .mockRejectedValue(
                new ApiError({
                    kind: 'http',
                    message:
                        'Shelf still has books',
                    status: 409,
                    detail:
                        'Shelf still has books',
                }),
            )

        const api = createShelvesApi(client)

        await expect(
            api.remove('shelf-a1'),
        ).rejects.toMatchObject({
            status: 409,
            detail: 'Shelf still has books',
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
