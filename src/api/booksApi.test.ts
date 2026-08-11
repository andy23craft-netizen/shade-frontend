import {
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import type {
    BookCreate,
    BookList,
    BookLookupResponse,
    BookRead,
    BookUpdate,
    CheckinRequest,
    CheckoutRequest,
    MarkReadRequest,
} from './apiTypes'

import type {
    createApiClient,
} from './apiClient'

import {
    createBooksApi,
} from './booksApi'

function createMockClient() {
    return {
        request: vi.fn(),
        requestJson: vi.fn(),
        get: vi.fn(),
        getJson: vi.fn(),
    } as unknown as ReturnType<
        typeof createApiClient
    >
}

describe('createBooksApi', () => {
    it('lists books', async () => {
        const books: BookList = {
            items: [],
            total: 0,
        }

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(books)

        const api = createBooksApi(client)

        const result = await api.list()

        expect(
            client.getJson,
        ).toHaveBeenCalledWith('/books')

        expect(result).toEqual(books)
    })

    it('lists deleted books when requested', async () => {
        const books: BookList = {
            items: [],
            total: 0,
        }

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(books)

        const api = createBooksApi(client)

        await api.list({
            includeDeleted: true,
        })

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/books?include_deleted=true',
        )
    })

    it('creates a book', async () => {
        const book =
            {} as BookCreate
        const response =
            {} as BookRead

        const client = createMockClient()

        vi.mocked(client.requestJson)
            .mockResolvedValue(response)

        const api = createBooksApi(client)

        const result = await api.create(book)

        expect(
            client.requestJson,
        ).toHaveBeenCalledWith(
            '/books',
            {
                method: 'POST',
                body: book,
            },
        )

        expect(result).toBe(response)
    })

    it('looks up a book by ISBN', async () => {
        const response =
            {} as BookLookupResponse

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(response)

        const api = createBooksApi(client)

        const result = await api.lookup(
            '9781234567890',
        )

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/books/lookup?isbn=9781234567890',
        )

        expect(result).toBe(response)
    })

    it('gets a book by id', async () => {
        const response =
            {} as BookRead

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(response)

        const api = createBooksApi(client)

        const result = await api.get(
            'book/123',
        )

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/books/book%2F123',
        )

        expect(result).toBe(response)
    })

    it('updates a book', async () => {
        const book =
            {} as BookUpdate
        const response =
            {} as BookRead

        const client = createMockClient()

        vi.mocked(client.requestJson)
            .mockResolvedValue(response)

        const api = createBooksApi(client)

        const result = await api.update(
            'book/123',
            book,
        )

        expect(
            client.requestJson,
        ).toHaveBeenCalledWith(
            '/books/book%2F123',
            {
                method: 'PATCH',
                body: book,
            },
        )

        expect(result).toBe(response)
    })

    it('removes a book', async () => {
        const client = createMockClient()

        vi.mocked(client.request)
            .mockResolvedValue(
                new Response(null, {
                    status: 204,
                }),
            )

        const api = createBooksApi(client)

        await api.remove('book/123')

        expect(
            client.request,
        ).toHaveBeenCalledWith(
            '/books/book%2F123',
            {
                method: 'DELETE',
            },
        )
    })

    it('restores a book', async () => {
        const response =
            {} as BookRead

        const client = createMockClient()

        vi.mocked(client.requestJson)
            .mockResolvedValue(response)

        const api = createBooksApi(client)

        const result = await api.restore(
            'book/123',
        )

        expect(
            client.requestJson,
        ).toHaveBeenCalledWith(
            '/books/book%2F123/restore',
            {
                method: 'POST',
            },
        )

        expect(result).toBe(response)
    })

    it('checks out a book', async () => {
        const request =
            {} as CheckoutRequest
        const response =
            {} as BookRead

        const client = createMockClient()

        vi.mocked(client.requestJson)
            .mockResolvedValue(response)

        const api = createBooksApi(client)

        const result = await api.checkout(
            'book/123',
            request,
        )

        expect(
            client.requestJson,
        ).toHaveBeenCalledWith(
            '/books/book%2F123/checkout',
            {
                method: 'POST',
                body: request,
            },
        )

        expect(result).toBe(response)
    })

    it('checks in a book', async () => {
        const request =
            {} as CheckinRequest
        const response =
            {} as BookRead

        const client = createMockClient()

        vi.mocked(client.requestJson)
            .mockResolvedValue(response)

        const api = createBooksApi(client)

        const result = await api.checkin(
            'book/123',
            request,
        )

        expect(
            client.requestJson,
        ).toHaveBeenCalledWith(
            '/books/book%2F123/checkin',
            {
                method: 'POST',
                body: request,
            },
        )

        expect(result).toBe(response)
    })

    it('marks a book as read', async () => {
        const request =
            {} as MarkReadRequest
        const response =
            {} as BookRead

        const client = createMockClient()

        vi.mocked(client.requestJson)
            .mockResolvedValue(response)

        const api = createBooksApi(client)

        const result = await api.markRead(
            'book/123',
            request,
        )

        expect(
            client.requestJson,
        ).toHaveBeenCalledWith(
            '/books/book%2F123/mark-read',
            {
                method: 'POST',
                body: request,
            },
        )

        expect(result).toBe(response)
    })
})