import {
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import type {
    BookList,
    BookRead,
} from './apiTypes'
import type {
    createApiClient,
} from './apiClient'
import {
    createBooksApi,
} from './booksApi'

function createBook(
    index: number,
): BookRead {
    return {
        id: `book-${index}`,
        title: `Title ${index}`,
        authors: [
            {
                author_id: `author-${index}`,
                first_name: 'Author',
                surname: `${index}`,
            },
        ],
        categories: [],
        shelf_name: 'unknown',
        placement_state: 'shelved',
        status: 'available',
        is_read: false,
        creation_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
        times_borrowed: 0,
        last_borrowed_at: null,
        average_loan_days: null,
    }
}

describe('large-library list baseline fixture', () => {
    it('handles a 2_000-book list payload through the typed helper', async () => {
        const largeList: BookList = {
            items: Array.from(
                {
                    length: 2_000,
                },
                (_, index) =>
                    createBook(index),
            ),
            total: 2_000,
        }

        const client = {
            request: vi.fn(),
            requestJson: vi.fn(),
            get: vi.fn(),
            getJson: vi.fn()
                .mockResolvedValue(largeList),
        } as unknown as ReturnType<
            typeof createApiClient
        >

        const api = createBooksApi(client)

        const startedAt = performance.now()
        const result = await api.list()
        const elapsedMs =
            performance.now() - startedAt

        expect(result.total).toBe(2_000)
        expect(result.items).toHaveLength(2_000)
        expect(elapsedMs).toBeLessThan(250)

        // Practical responsiveness baseline for regressions:
        // typed list helper over a 2_000-item fixture should stay under 250ms
        // in local Vitest/jsdom. BooksPage uses paginated requests; this guard
        // covers unpaginated callers.
    })

    it('handles a paginated 2_000-book library slice through the typed helper', async () => {
        const paginatedList: BookList = {
            items: Array.from(
                {
                    length: 50,
                },
                (_, index) =>
                    createBook(index),
            ),
            total: 2_000,
        }

        const client = {
            request: vi.fn(),
            requestJson: vi.fn(),
            get: vi.fn(),
            getJson: vi.fn()
                .mockResolvedValue(paginatedList),
        } as unknown as ReturnType<
            typeof createApiClient
        >

        const api = createBooksApi(client)

        const startedAt = performance.now()
        const result = await api.list({
            skip: 0,
            take: 50,
            sortBy: 'author',
            sortOrder: 'asc',
        })
        const elapsedMs =
            performance.now() - startedAt

        expect(result.total).toBe(2_000)
        expect(result.items).toHaveLength(50)
        expect(elapsedMs).toBeLessThan(250)

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/books?skip=0&take=50&sortBy=author&sortOrder=asc',
        )
    })
})
