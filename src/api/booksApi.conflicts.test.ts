import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import {
    ApiError,
} from './apiErrors'
import {
    createApiClient,
} from './apiClient'
import {
    createBooksApi,
} from './booksApi'

describe('booksApi conflict responses', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    async function expectConflict(
        pathSuffix: string,
        run: (
            api: ReturnType<
                typeof createBooksApi
            >,
        ) => Promise<unknown>,
    ) {
        vi.spyOn(
            globalThis,
            'fetch',
        ).mockResolvedValue(
            new Response(
                JSON.stringify({
                    detail:
                        'Book state conflict.',
                }),
                {
                    status: 409,
                    headers: {
                        'Content-Type':
                            'application/json',
                    },
                },
            ),
        )

        const client = createApiClient({
            apiBaseUrl:
                'https://api.example.test',
            getToken: () => 'secret-token',
        })

        const api = createBooksApi(client)

        await expect(
            run(api),
        ).rejects.toMatchObject({
            name: 'ApiError',
            kind: 'http',
            status: 409,
            detail: 'Book state conflict.',
        } satisfies Partial<ApiError>)

        expect(
            vi.mocked(fetch).mock.calls[0]?.[0],
        ).toBe(
            `https://api.example.test${pathSuffix}`,
        )
    }

    it('surfaces checkout 409 bodies as ApiError', async () => {
        await expectConflict(
            '/books/book-1/checkout',
            (api) =>
                api.checkout('book-1', {
                    borrower: 'Pat',
                }),
        )
    })

    it('surfaces check-in 409 bodies as ApiError', async () => {
        await expectConflict(
            '/books/book-1/checkin',
            (api) => api.checkin('book-1', { rating: 5 }),
        )
    })

    it('surfaces checkout 412 display-only bodies as ApiError', async () => {
        vi.spyOn(
            globalThis,
            'fetch',
        ).mockResolvedValue(
            new Response(
                JSON.stringify({
                    detail:
                        'Book is display only',
                }),
                {
                    status: 412,
                    headers: {
                        'Content-Type':
                            'application/json',
                    },
                },
            ),
        )

        const client = createApiClient({
            apiBaseUrl:
                'https://api.example.test',
            getToken: () => 'secret-token',
        })

        const api = createBooksApi(client)

        await expect(
            api.checkout('book-1', {
                borrower: 'Pat',
            }),
        ).rejects.toMatchObject({
            name: 'ApiError',
            kind: 'http',
            status: 412,
            detail: 'Book is display only',
        } satisfies Partial<ApiError>)

        expect(
            vi.mocked(fetch).mock.calls[0]?.[0],
        ).toBe(
            'https://api.example.test/books/book-1/checkout',
        )
    })
})
