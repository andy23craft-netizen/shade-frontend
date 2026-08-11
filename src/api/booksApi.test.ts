import {
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import type {
    BookList,
} from './apiTypes'

import type {
    createApiClient,
} from './apiClient'

import {
    createBooksApi,
} from './booksApi'

describe('createBooksApi', () => {
    it('lists books using the typed BookList response', async () => {
        const books: BookList = {
            items: [],
            total: 0,
        }

        const client: ReturnType<typeof createApiClient> = {
            request: vi.fn(),
            requestJson: vi.fn(),
            get: vi.fn(),
            getJson: vi.fn()
                .mockResolvedValue(books),
        }

        const api = createBooksApi(client)

        const result = await api.list()

        expect(
            client.getJson,
        ).toHaveBeenCalledWith('/books')

        expect(result).toEqual(books)
    })
})
