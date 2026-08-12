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

    it('surfaces restore 409 bodies as ApiError', async () => {
        await expectConflict(
            '/books/book-1/restore',
            (api) => api.restore('book-1'),
        )
    })

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
            (api) => api.checkin('book-1'),
        )
    })
})
