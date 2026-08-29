import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import type {
    CollectionBookCreate,
    CollectionBookList,
    CollectionBookRead,
    CollectionBookReorder,
    CollectionCreate,
    CollectionList,
    CollectionRead,
    CollectionUpdate,
} from './apiTypes'
import {
    ApiError,
} from './apiErrors'
import {
    createApiClient,
} from './apiClient'
import {
    createCollectionsApi,
} from './collectionsApi'

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

const sampleCollection: CollectionRead = {
    collection_id: 'collection-1',
    name: 'Staff Picks',
    description: 'Favorites',
    created_date: '2026-08-01T00:00:00Z',
    last_updated_date: '2026-08-01T00:00:00Z',
}

const sampleMembership: CollectionBookRead = {
    collection_book_id: 'membership-1',
    collection_id: 'collection-1',
    book_id: 'book-1',
    book_title: 'The Dispossessed',
    book_status: 'available',
    order_num: 1,
    notes: null,
    shelf_name: 'a1',
    on_wishlist: false,
    created_date: '2026-08-01T00:00:00Z',
}

describe('createCollectionsApi', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('lists collections without pagination params when unused', async () => {
        const list: CollectionList = {
            items: [sampleCollection],
            total: 1,
        }

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(list)

        const api = createCollectionsApi(client)
        const result = await api.list()

        expect(client.getJson).toHaveBeenCalledWith(
            '/collections',
        )

        expect(result).toEqual(list)
    })

    it('lists collections with paired skip and take', async () => {
        const list: CollectionList = {
            items: [],
            total: 0,
        }

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(list)

        const api = createCollectionsApi(client)

        await api.list({
            skip: 10,
            take: 30,
        })

        expect(client.getJson).toHaveBeenCalledWith(
            '/collections?skip=10&take=30',
        )
    })

    it('creates a collection', async () => {
        const body: CollectionCreate = {
            name: 'Staff Picks',
            description: 'Favorites',
        }

        const client = createMockClient()

        vi.mocked(client.requestJson)
            .mockResolvedValue(sampleCollection)

        const api = createCollectionsApi(client)

        const result = await api.create(body)

        expect(client.requestJson).toHaveBeenCalledWith(
            '/collections',
            {
                method: 'POST',
                body,
            },
        )

        expect(result).toEqual(sampleCollection)
    })

    it('drops undocumented collection create keys', async () => {
        const client = createMockClient()

        vi.mocked(client.requestJson)
            .mockResolvedValue(sampleCollection)

        const api = createCollectionsApi(client)

        await api.create({
            name: 'Staff Picks',
            mystery: true,
        } as CollectionCreate & {
            mystery: boolean
        })

        expect(client.requestJson).toHaveBeenCalledWith(
            '/collections',
            {
                method: 'POST',
                body: {
                    name: 'Staff Picks',
                },
            },
        )
    })

    it('updates a collection and preserves explicit null description', async () => {
        const body: CollectionUpdate = {
            description: null,
        }

        const client = createMockClient()

        vi.mocked(client.requestJson)
            .mockResolvedValue({
                ...sampleCollection,
                description: null,
            })

        const api = createCollectionsApi(client)

        await api.update(
            'collection/1',
            body,
        )

        expect(client.requestJson).toHaveBeenCalledWith(
            '/collections/collection%2F1',
            {
                method: 'PATCH',
                body,
            },
        )
    })

    it('deletes a collection', async () => {
        const client = createMockClient()

        vi.mocked(client.request)
            .mockResolvedValue(
                new Response(null, {
                    status: 204,
                }),
            )

        const api = createCollectionsApi(client)

        await api.remove('collection/1')

        expect(client.request).toHaveBeenCalledWith(
            '/collections/collection%2F1',
            {
                method: 'DELETE',
            },
        )
    })

    it('lists collection memberships', async () => {
        const list: CollectionBookList = {
            items: [sampleMembership],
            total: 1,
        }

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(list)

        const api = createCollectionsApi(client)

        const result = await api.listBooks(
            'collection/1',
        )

        expect(client.getJson).toHaveBeenCalledWith(
            '/collections/collection%2F1/books',
        )

        expect(result).toEqual(list)
    })

    it('adds a book to a collection', async () => {
        const body: CollectionBookCreate = {
            book_id: 'book-1',
            notes: 'Feature this one',
        }

        const client = createMockClient()

        vi.mocked(client.requestJson)
            .mockResolvedValue(sampleMembership)

        const api = createCollectionsApi(client)

        await api.addBook(
            'collection-1',
            body,
        )

        expect(client.requestJson).toHaveBeenCalledWith(
            '/collections/collection-1/books',
            {
                method: 'POST',
                body,
            },
        )
    })

    it('reorders a collection membership', async () => {
        const body: CollectionBookReorder = {
            order_num: 2,
        }

        const client = createMockClient()

        vi.mocked(client.requestJson)
            .mockResolvedValue({
                ...sampleMembership,
                order_num: 2,
            })

        const api = createCollectionsApi(client)

        await api.reorderBook(
            'collection-1',
            'membership/1',
            body,
        )

        expect(client.requestJson).toHaveBeenCalledWith(
            '/collections/collection-1/books/membership%2F1',
            {
                method: 'PATCH',
                body,
            },
        )
    })

    it('removes a collection membership', async () => {
        const client = createMockClient()

        vi.mocked(client.request)
            .mockResolvedValue(
                new Response(null, {
                    status: 204,
                }),
            )

        const api = createCollectionsApi(client)

        await api.removeBook(
            'collection-1',
            'membership/1',
        )

        expect(client.request).toHaveBeenCalledWith(
            '/collections/collection-1/books/membership%2F1',
            {
                method: 'DELETE',
            },
        )
    })

    it('propagates duplicate-add 409 errors', async () => {
        const client = createMockClient()

        const error = new ApiError({
            kind: 'http',
            status: 409,
            message:
                'Book is already in this collection',
        })

        vi.mocked(client.requestJson)
            .mockRejectedValue(error)

        const api = createCollectionsApi(client)

        await expect(
            api.addBook(
                'collection-1',
                {
                    book_id: 'book-1',
                },
            ),
        ).rejects.toBe(error)
    })
})
