import {
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import type {
    createApiClient,
} from './apiClient'
import {
    createCategoriesApi,
} from './categoriesApi'

function createMockClient() {
    return {
        getJson: vi.fn(),
        requestJson: vi.fn(),
        request: vi.fn(),
    } as unknown as ReturnType<
        typeof createApiClient
    >
}

describe('createCategoriesApi', () => {
    it('lists categories without a signal', async () => {
        const client = createMockClient()
        const categories = [
            {
                category_id: 'cat-fiction',
                name: 'Fiction',
                slug: 'fiction',
                created_date: '2026-01-01T00:00:00Z',
                updated_date: '2026-01-01T00:00:00Z',
            },
        ]

        vi.mocked(client.getJson)
            .mockResolvedValue(categories)

        const api = createCategoriesApi(client)
        const result = await api.list()

        expect(result).toEqual(categories)
        expect(client.getJson).toHaveBeenCalledWith(
            '/categories',
        )
    })

    it('lists categories with an abort signal', async () => {
        const client = createMockClient()
        const controller = new AbortController()

        vi.mocked(client.getJson)
            .mockResolvedValue([])

        const api = createCategoriesApi(client)
        await api.list({
            signal: controller.signal,
        })

        expect(client.getJson).toHaveBeenCalledWith(
            '/categories',
            {
                signal: controller.signal,
            },
        )
    })
})
