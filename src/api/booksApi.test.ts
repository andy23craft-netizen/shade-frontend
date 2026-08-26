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
    BulkShelfMoveRequest,
    BulkShelfMoveResponse,
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

    it('lists books filtered by isbn', async () => {
        const books: BookList = {
            items: [],
            total: 0,
        }

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(books)

        const api = createBooksApi(client)

        await api.list({
            isbn: '9780441',
        })

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/books?isbn=9780441',
        )
    })

    it('omits isbn when isbn is undefined', async () => {
        const books: BookList = {
            items: [],
            total: 0,
        }

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(books)

        const api = createBooksApi(client)

        await api.list({
            isbn: undefined,
        })

        expect(
            client.getJson,
        ).toHaveBeenCalledWith('/books')
    })

    it('omits isbn when isbn is an empty string', async () => {
        const books: BookList = {
            items: [],
            total: 0,
        }

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(books)

        const api = createBooksApi(client)

        await api.list({
            isbn: '',
        })

        expect(
            client.getJson,
        ).toHaveBeenCalledWith('/books')
    })

    it('omits isbn when isbn is whitespace-only', async () => {
        const books: BookList = {
            items: [],
            total: 0,
        }

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(books)

        const api = createBooksApi(client)

        await api.list({
            isbn: '   ',
        })

        expect(
            client.getJson,
        ).toHaveBeenCalledWith('/books')
    })

    it('gets a book cover as a blob', async () => {
        const coverBlob = new Blob(
            ['cover-image'],
            {
                type: 'image/jpeg',
            },
        )

        const response = {
            blob: vi.fn().mockResolvedValue(
                coverBlob,
            ),
        } as unknown as Response

        const client = createMockClient()

        vi.mocked(client.get)
            .mockResolvedValue(response)

        const api = createBooksApi(client)

        const result = await api.getCover(
            'book/123',
        )

        expect(
            client.get,
        ).toHaveBeenCalledWith(
            '/books/book%2F123/cover',
        )

        expect(
            response.blob,
        ).toHaveBeenCalledOnce()

        expect(result).toBe(coverBlob)
        expect(result.type).toBe('image/jpeg')
    })

    it('passes an abort signal when getting a book cover', async () => {
        const controller =
            new AbortController()

        const response = new Response(
            new Blob(['cover-image']),
            {
                status: 200,
            },
        )

        const client = createMockClient()

        vi.mocked(client.get)
            .mockResolvedValue(response)

        const api = createBooksApi(client)

        await api.getCover(
            'book-123',
            {
                signal: controller.signal,
            },
        )

        expect(
            client.get,
        ).toHaveBeenCalledWith(
            '/books/book-123/cover',
            {
                signal: controller.signal,
            },
        )
    })

    it('uploads a manual book cover with multipart form data', async () => {
        const book =
            {} as BookRead

        const response = new Response(
            JSON.stringify(book),
            {
                status: 200,
                headers: {
                    'Content-Type':
                        'application/json',
                },
            },
        )

        const client = createMockClient()

        vi.mocked(client.request)
            .mockResolvedValue(response)

        const api = createBooksApi(client)

        const file = new File(
            ['cover-image'],
            'cover.webp',
            {
                type: 'image/webp',
            },
        )

        const result = await api.uploadCover(
            'book/123',
            file,
        )

        expect(
            client.request,
        ).toHaveBeenCalledTimes(1)

        const [
            path,
            options,
        ] = vi.mocked(
            client.request,
        ).mock.calls[0]

        expect(path).toBe(
            '/books/book%2F123/cover',
        )

        expect(options).toMatchObject({
            method: 'PUT',
        })

        expect(options?.body).toBeInstanceOf(
            FormData,
        )

        const formData =
            options?.body as FormData

        expect(
            formData.get('file'),
        ).toBe(file)

        expect(result).toEqual(book)
    })

    it('removes a manual book cover', async () => {
        const client = createMockClient()

        vi.mocked(client.request)
            .mockResolvedValue(
                new Response(null, {
                    status: 204,
                }),
            )

        const api = createBooksApi(client)

        await api.removeCover('book/123')

        expect(
            client.request,
        ).toHaveBeenCalledWith(
            '/books/book%2F123/cover',
            {
                method: 'DELETE',
            },
        )
    })

    it('lists books filtered by author, title, and category', async () => {
        const books: BookList = {
            items: [],
            total: 0,
        }

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(books)

        const api = createBooksApi(client)

        await api.list({
            author: 'Le Guin',
            title: 'Darkness',
            categoryIds: ['cat-fiction'],
        })

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/books?author=Le+Guin&title=Darkness&category_id=cat-fiction',
        )
    })

    it('lists books filtered by shelf', async () => {
        const books: BookList = {
            items: [],
            total: 0,
        }

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(books)

        const api = createBooksApi(client)

        await api.list({
            shelfName: 'e4',
        })

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/books?shelf_name=e4',
        )
    })

    it('lists books filtered by read status', async () => {
        const books: BookList = {
            items: [],
            total: 0,
        }

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(books)

        const api = createBooksApi(client)

        await api.list({
            isRead: true,
        })

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/books?is_read=true',
        )
    })

    it('preserves false when filtering unread books', async () => {
        const books: BookList = {
            items: [],
            total: 0,
        }

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(books)

        const api = createBooksApi(client)

        await api.list({
            isRead: false,
        })

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/books?is_read=false',
        )
    })

    it('omits blank and whitespace author, title, and category filters', async () => {
        const books: BookList = {
            items: [],
            total: 0,
        }

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(books)

        const api = createBooksApi(client)

        await api.list({
            author: '  ',
            title: '',
            categoryIds: ['\t', ''],
            shelfName: '   ',
        })

        expect(
            client.getJson,
        ).toHaveBeenCalledWith('/books')
    })

    it('trims author, title, and category before sending', async () => {
        const books: BookList = {
            items: [],
            total: 0,
        }

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(books)

        const api = createBooksApi(client)

        await api.list({
            author: '  Le Guin  ',
            title: ' Darkness ',
            categoryIds: [' fiction '],
            shelfName: ' e4 ',
        })

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/books?author=Le+Guin&title=Darkness&category_id=fiction&shelf_name=e4',
        )
    })

    it('lists books with pagination params', async () => {
        const books: BookList = {
            items: [],
            total: 0,
        }

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(books)

        const api = createBooksApi(client)

        await api.list({
            skip: 0,
            take: 50,
        })

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/books?skip=0&take=50',
        )
    })

    it('lists books with sort params', async () => {
        const books: BookList = {
            items: [],
            total: 0,
        }

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(books)

        const api = createBooksApi(client)

        await api.list({
            sortBy: 'title',
            sortOrder: 'desc',
        })

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/books?sortBy=title&sortOrder=desc',
        )
    })

    it('combines isbn, pagination, and sort query params', async () => {
        const books: BookList = {
            items: [],
            total: 0,
        }

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(books)

        const api = createBooksApi(client)

        await api.list({
            isbn: '9780441',
            skip: 50,
            take: 50,
            sortBy: 'author',
            sortOrder: 'asc',
        })

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/books?isbn=9780441&skip=50&take=50&sortBy=author&sortOrder=asc',
        )
    })

    it('combines author, title, category, isbn, pagination, and sort', async () => {
        const books: BookList = {
            items: [],
            total: 0,
        }

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(books)

        const api = createBooksApi(client)

        await api.list({
            isbn: '9780441',
            author: 'Le Guin',
            title: 'Darkness',
            categoryIds: ['cat-fiction'],
            skip: 0,
            take: 30,
            sortBy: 'shelf',
            sortOrder: 'asc',
        })

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/books?isbn=9780441&author=Le+Guin&title=Darkness&category_id=cat-fiction&skip=0&take=30&sortBy=shelf&sortOrder=asc',
        )
    })

    it('omits pagination params when not requested', async () => {
        const books: BookList = {
            items: [],
            total: 0,
        }

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(books)

        const api = createBooksApi(client)

        await api.list({
            sortBy: 'title',
        })

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/books?sortBy=title',
        )
    })

    it('forwards an abort signal when listing books', async () => {
        const books: BookList = {
            items: [],
            total: 0,
        }

        const client = createMockClient()
        const signal =
            new AbortController().signal

        vi.mocked(client.getJson)
            .mockResolvedValue(books)

        const api = createBooksApi(client)

        await api.list({
            isbn: '9780441',
            signal,
        })

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/books?isbn=9780441',
            {
                signal,
            },
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

    it('treats lookup found: false as a successful response', async () => {
        const response: BookLookupResponse = {
            found: false,
            draft: null,
        }

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(response)

        const api = createBooksApi(client)

        const result = await api.lookup(
            '9780000000000',
        )

        expect(result).toEqual({
            found: false,
            draft: null,
        })
        expect(result.found).toBe(false)
    })

    it('strips undocumented fields from create requests', async () => {
        const client = createMockClient()

        vi.mocked(client.requestJson)
            .mockResolvedValue({} as BookRead)

        const api = createBooksApi(client)

        await api.create({
            title: 'Title',
            authors: 'Author',
            category_ids: [],
            shelf_name: 'unknown',
            is_read: false,
            status: 'available',
            updated_date: '2026-08-01T00:00:00Z',
        } as BookCreate & {
            updated_date: string
        })

        expect(
            client.requestJson,
        ).toHaveBeenCalledWith(
            '/books',
            {
                method: 'POST',
                body: {
                    title: 'Title',
                    authors: 'Author',
                    category_ids: [],
                    shelf_name: 'unknown',
                    is_read: false,
                    status: 'available',
                },
            },
        )
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

    it('omits the check-in body when the request is undefined', async () => {
        const response =
            {} as BookRead

        const client = createMockClient()

        vi.mocked(client.requestJson)
            .mockResolvedValue(response)

        const api = createBooksApi(client)

        const result = await api.checkin(
            'book/123',
        )

        expect(
            client.requestJson,
        ).toHaveBeenCalledWith(
            '/books/book%2F123/checkin',
            {
                method: 'POST',
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

    it('marks a book as read with an empty object body', async () => {
        const response =
            {} as BookRead

        const client = createMockClient()

        vi.mocked(client.requestJson)
            .mockResolvedValue(response)

        const api = createBooksApi(client)

        await api.markRead('book/123', {})

        expect(
            client.requestJson,
        ).toHaveBeenCalledWith(
            '/books/book%2F123/mark-read',
            {
                method: 'POST',
                body: {},
            },
        )
    })

    it(
        'moves selected books to a shelf with one bulk request',
        async () => {
            const request: BulkShelfMoveRequest = {
                book_ids: [
                    'book-1',
                    'book-2',
                ],
                shelf_name: 'a1',
            }

            const response: BulkShelfMoveResponse = {
                book_ids: [
                    'book-1',
                    'book-2',
                ],
                moved_count: 2,
                shelf_name: 'a1',
            }

            const client = createMockClient()

            vi.mocked(client.requestJson)
                .mockResolvedValue(response)

            const api = createBooksApi(client)

            const result =
                await api.moveToShelf(request)

            expect(
                client.requestJson,
            ).toHaveBeenCalledTimes(1)

            expect(
                client.requestJson,
            ).toHaveBeenCalledWith(
                '/books/bulk/move-to-shelf',
                {
                    method: 'POST',
                    body: request,
                },
            )

            expect(result).toBe(response)
        },
    )

    it(
        'strips undocumented fields from bulk shelf move requests',
        async () => {
            const response: BulkShelfMoveResponse = {
                book_ids: ['book-1'],
                moved_count: 1,
                shelf_name: 'a1',
            }

            const client = createMockClient()

            vi.mocked(client.requestJson)
                .mockResolvedValue(response)

            const api = createBooksApi(client)

            await api.moveToShelf({
                book_ids: ['book-1'],
                shelf_name: 'a1',
                unexpected_field: 'nope',
            } as BulkShelfMoveRequest & {
                unexpected_field: string
            })

            expect(
                client.requestJson,
            ).toHaveBeenCalledWith(
                '/books/bulk/move-to-shelf',
                {
                    method: 'POST',
                    body: {
                        book_ids: ['book-1'],
                        shelf_name: 'a1',
                    },
                },
            )
        },
    )
})
