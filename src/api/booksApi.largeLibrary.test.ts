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
        authors: `Author ${index}`,
        category: 'unknown',
        shelf: 'unknown',
        status: 'available',
        is_read: false,
        creation_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
        deletion_date: null,
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

        // Practical responsiveness baseline for FEAT-12 regressions:
        // typed list helper over a 2_000-item fixture should stay under 250ms
        // in local Vitest/jsdom (see docs/baselines/FEAT-03_performance.md).
    })
})
