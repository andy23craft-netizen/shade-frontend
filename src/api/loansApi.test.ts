import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import type {
    LoanList,
    LoanRead,
} from './apiTypes'
import {
    ApiError,
} from './apiErrors'
import {
    createApiClient,
} from './apiClient'
import {
    createLoansApi,
} from './loansApi'

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

describe('createLoansApi', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('lists loans using the typed LoanList response', async () => {
        const loans: LoanList = {
            items: [],
            total: 0,
        }

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(loans)

        const api = createLoansApi(client)

        const result = await api.list()

        expect(
            client.getJson,
        ).toHaveBeenCalledWith('/loans')

        expect(result).toEqual(loans)
    })

    it('lists loans filtered by bookId', async () => {
        const loans: LoanList = {
            items: [],
            total: 0,
        }

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(loans)

        const api = createLoansApi(client)

        await api.list({
            bookId: 'book/123',
        })

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/loans?book_id=book%2F123',
        )
    })

    it('omits book_id when bookId is undefined', async () => {
        const loans: LoanList = {
            items: [],
            total: 0,
        }

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(loans)

        const api = createLoansApi(client)

        await api.list({
            bookId: undefined,
        })

        expect(
            client.getJson,
        ).toHaveBeenCalledWith('/loans')
    })

    it('serializes skip and take when paginating', async () => {
        const loans: LoanList = {
            items: [],
            total: 100,
        }

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(loans)

        const api = createLoansApi(client)

        await api.list({
            skip: 30,
            take: 30,
        })

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/loans?skip=30&take=30',
        )
    })

    it('omits skip and take when not requested', async () => {
        const loans: LoanList = {
            items: [],
            total: 0,
        }

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(loans)

        const api = createLoansApi(client)

        await api.list()

        expect(
            client.getJson,
        ).toHaveBeenCalledWith('/loans')
    })

    it('combines bookId with pagination params', async () => {
        const loans: LoanList = {
            items: [],
            total: 10,
        }

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(loans)

        const api = createLoansApi(client)

        await api.list({
            bookId: 'book-1',
            skip: 0,
            take: 30,
        })

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/loans?book_id=book-1&skip=0&take=30',
        )
    })

    it('preserves an explicitly empty book filter for backend validation', async () => {
        const loans: LoanList = {
            items: [],
            total: 0,
        }

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(loans)

        const api = createLoansApi(client)

        await api.list({
            bookId: '',
        })

        expect(
            client.getJson,
        ).toHaveBeenCalledWith('/loans?book_id=')
    })

    it('forwards an abort signal when listing loans', async () => {
        const loans: LoanList = {
            items: [],
            total: 0,
        }

        const client = createMockClient()
        const signal =
            new AbortController().signal

        vi.mocked(client.getJson)
            .mockResolvedValue(loans)

        const api = createLoansApi(client)

        await api.list({
            bookId: 'book-1',
            signal,
        })

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/loans?book_id=book-1',
            {
                signal,
            },
        )
    })

    it('gets a loan by id', async () => {
        const loan = {} as LoanRead
        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(loan)

        const api = createLoansApi(client)

        const result = await api.get(
            'loan/123',
        )

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/loans/loan%2F123',
        )

        expect(result).toBe(loan)
    })

    it('forwards an abort signal when getting a loan', async () => {
        const loan = {} as LoanRead
        const client = createMockClient()
        const signal =
            new AbortController().signal

        vi.mocked(client.getJson)
            .mockResolvedValue(loan)

        const api = createLoansApi(client)

        await api.get('loan-1', {
            signal,
        })

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/loans/loan-1',
            {
                signal,
            },
        )
    })

    async function expectGetStatus(
        status: number,
        detail: unknown,
        kind: ApiError['kind'],
    ) {
        vi.spyOn(
            globalThis,
            'fetch',
        ).mockResolvedValue(
            new Response(
                JSON.stringify({
                    detail,
                }),
                {
                    status,
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

        const api = createLoansApi(client)

        await expect(
            api.get('loan-1'),
        ).rejects.toMatchObject({
            name: 'ApiError',
            kind,
            status,
        } satisfies Partial<ApiError>)
    }

    it('surfaces get 400 bodies as ApiError', async () => {
        await expectGetStatus(
            400,
            'Malformed or missing identifier',
            'http',
        )
    })

    it('surfaces get 403 bodies as ApiError', async () => {
        await expectGetStatus(
            403,
            'Not authenticated',
            'unauthorized',
        )
    })

    it('surfaces get 404 bodies as ApiError', async () => {
        await expectGetStatus(
            404,
            'Loan not found',
            'http',
        )
    })

    it('surfaces get 422 bodies as ApiError', async () => {
        await expectGetStatus(
            422,
            [
                {
                    loc: [
                        'path',
                        'id',
                    ],
                    msg: 'Invalid',
                    type: 'value_error',
                },
            ],
            'validation',
        )
    })
})


it('serializes typed catalog filters together with pagination', async () => {
    const client = createMockClient()
    await createLoansApi(client).list({
        bookId: 'shared-id',
        albumId: 'shared-id',
        mediaType: 'book',
        skip: 30,
        take: 30,
    })
    expect(client.getJson).toHaveBeenCalledWith(
        '/loans?book_id=shared-id&album_id=shared-id&media_type=book&skip=30&take=30',
    )
})
