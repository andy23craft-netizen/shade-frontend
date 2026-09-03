import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import type {
    WishlistBookCreate,
    WishlistBookList,
    WishlistBookRead,
    WishlistCreate,
    WishlistList,
    WishlistRead,
    WishlistUpdate,
} from './apiTypes'
import {
    ApiError,
} from './apiErrors'
import {
    createApiClient,
} from './apiClient'
import {
    createWishlistsApi,
} from './wishlistsApi'

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

const sampleWishlist: WishlistRead = {
    wishlist_id: 'wishlist-1',
    name: 'TBR',
    description: null,
    created_date: '2026-08-01T00:00:00Z',
    last_updated_date: '2026-08-01T00:00:00Z',
}

const sampleMembership: WishlistBookRead = {
    album_id: null,
    wishlist_item_id: 'membership-1',
    wishlist_id: 'wishlist-1',
    book_id: 'book-1',
    book_title: 'The Dispossessed',
    book_status: 'available',
    status: 'wanted',
    priority: null,
    notes: null,
    url: null,
    created_date: '2026-08-01T00:00:00Z',
}

describe('createWishlistsApi', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('lists wishlists without pagination params when unused', async () => {
        const list: WishlistList = {
            items: [sampleWishlist],
            total: 1,
        }

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(list)

        const api = createWishlistsApi(client)
        const result = await api.list()

        expect(client.getJson).toHaveBeenCalledWith(
            '/wishlists',
        )
        expect(result).toEqual(list)
    })

    it('lists wishlists with paired skip and take', async () => {
        const list: WishlistList = {
            items: [],
            total: 0,
        }

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(list)

        const api = createWishlistsApi(client)

        await api.list({
            skip: 10,
            take: 30,
        })

        expect(client.getJson).toHaveBeenCalledWith(
            '/wishlists?skip=10&take=30',
        )
    })

    it('forwards AbortSignal when provided', async () => {
        const client = createMockClient()
        const signal = new AbortController().signal

        vi.mocked(client.getJson).mockResolvedValue({
            items: [],
            total: 0,
        })

        const api = createWishlistsApi(client)

        await api.list({
            signal,
        })

        expect(client.getJson).toHaveBeenCalledWith(
            '/wishlists',
            {
                signal,
            },
        )
    })

    it('creates a wishlist via POST /wishlists', async () => {
        const body: WishlistCreate = {
            name: 'TBR',
            description: 'Later',
        }

        const client = createMockClient()

        vi.mocked(client.requestJson)
            .mockResolvedValue(sampleWishlist)

        const api = createWishlistsApi(client)
        const result = await api.create(body)

        expect(client.requestJson).toHaveBeenCalledWith(
            '/wishlists',
            {
                method: 'POST',
                body,
            },
        )
        expect(result).toEqual(sampleWishlist)
    })

    it('drops undocumented keys from create payloads', async () => {
        const client = createMockClient()

        vi.mocked(client.requestJson)
            .mockResolvedValue(sampleWishlist)

        const api = createWishlistsApi(client)

        await api.create({
            name: 'TBR',
            mystery: 'drop-me',
        } as WishlistCreate & {
            mystery: string
        })

        expect(client.requestJson).toHaveBeenCalledWith(
            '/wishlists',
            {
                method: 'POST',
                body: {
                    name: 'TBR',
                },
            },
        )
    })

    it('updates a wishlist via PATCH /wishlists/{wishlist_id}', async () => {
        const body: WishlistUpdate = {
            name: 'Later',
        }

        const updated: WishlistRead = {
            ...sampleWishlist,
            name: 'Later',
        }

        const client = createMockClient()

        vi.mocked(client.requestJson)
            .mockResolvedValue(updated)

        const api = createWishlistsApi(client)
        const result = await api.update(
            'wishlist/1',
            body,
        )

        expect(client.requestJson).toHaveBeenCalledWith(
            '/wishlists/wishlist%2F1',
            {
                method: 'PATCH',
                body,
            },
        )
        expect(result).toEqual(updated)
    })

    it('deletes a wishlist via DELETE /wishlists/{wishlist_id}', async () => {
        const client = createMockClient()

        vi.mocked(client.request).mockResolvedValue(
            new Response(null, {
                status: 204,
            }),
        )

        const api = createWishlistsApi(client)

        await api.remove('wishlist/1')

        expect(client.request).toHaveBeenCalledWith(
            '/wishlists/wishlist%2F1',
            {
                method: 'DELETE',
            },
        )
    })

    it('propagates a 400 error when removing a malformed membership', async () => {
        const client = createMockClient()

        const error = new ApiError({
            kind: 'http',
            status: 400,
            message: 'Bad request.',
        })

        vi.mocked(client.request)
            .mockRejectedValue(error)

        const api = createWishlistsApi(client)

        await expect(
            api.removeBook(
                'wishlist-1',
                'membership-1',
            ),
        ).rejects.toBe(error)
    })

    it('updates and clears wishlist membership notes', async () => {
        const client = createMockClient()
        vi.mocked(client.requestJson).mockResolvedValue(sampleMembership)
        const api = createWishlistsApi(client)
        await api.updateBook('wishlist-1', 'membership/1', { notes: null })
        expect(client.requestJson).toHaveBeenCalledWith(
            '/wishlists/wishlist-1/books/membership%2F1',
            { method: 'PATCH', body: { notes: null } },
        )
    })

    it('propagates a 404 error when removing an unknown membership', async () => {
        const client = createMockClient()

        const error = new ApiError({
            kind: 'http',
            status: 404,
            message: 'Membership not found.',
        })

        vi.mocked(client.request)
            .mockRejectedValue(error)

        const api = createWishlistsApi(client)

        await expect(
            api.removeBook(
                'wishlist-1',
                'missing-membership',
            ),
        ).rejects.toBe(error)
    })

    it('lists wishlist books with the membership path and pagination', async () => {
        const list: WishlistBookList = {
            items: [sampleMembership],
            total: 1,
        }

        const client = createMockClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(list)

        const api = createWishlistsApi(client)
        const result = await api.listBooks(
            'wishlist/1',
            {
                skip: 0,
                take: 30,
            },
        )

        expect(client.getJson).toHaveBeenCalledWith(
            '/wishlists/wishlist%2F1/books?skip=0&take=30',
        )
        expect(result).toEqual(list)
    })

    it('adds a membership via POST /wishlists/{wishlist_id}/books', async () => {
        const body: WishlistBookCreate = {
            book_id: 'book-1',
            status: 'wanted',
        }

        const client = createMockClient()

        vi.mocked(client.requestJson)
            .mockResolvedValue(sampleMembership)

        const api = createWishlistsApi(client)
        const result = await api.addBook(
            'wishlist-1',
            body,
        )

        expect(client.requestJson).toHaveBeenCalledWith(
            '/wishlists/wishlist-1/books',
            {
                method: 'POST',
                body,
            },
        )
        expect(result).toEqual(sampleMembership)
    })

    it('omits unused add-book keys from the request body', async () => {
        const client = createMockClient()

        vi.mocked(client.requestJson)
            .mockResolvedValue(sampleMembership)

        const api = createWishlistsApi(client)

        await api.addBook('wishlist-1', {
            book_id: 'book-1',
        } as WishlistBookCreate)

        expect(client.requestJson).toHaveBeenCalledWith(
            '/wishlists/wishlist-1/books',
            {
                method: 'POST',
                body: {
                    book_id: 'book-1',
                },
            },
        )
    })

    it('surfaces malformed wishlist ids as 400', async () => {
        const client = createMockClient()

        vi.mocked(client.requestJson)
            .mockRejectedValue(
                new ApiError({
                    kind: 'http',
                    message: 'Invalid wishlist id',
                    status: 400,
                    detail: 'Invalid wishlist id',
                }),
            )

        const api = createWishlistsApi(client)

        await expect(
            api.update('', {
                name: 'Later',
            }),
        ).rejects.toMatchObject({
            status: 400,
            detail: 'Invalid wishlist id',
        })
    })

    it('surfaces unknown wishlists as 404', async () => {
        const client = createMockClient()

        vi.mocked(client.getJson).mockRejectedValue(
            new ApiError({
                kind: 'http',
                message: 'Not found',
                status: 404,
            }),
        )

        const api = createWishlistsApi(client)

        await expect(
            api.listBooks('missing'),
        ).rejects.toMatchObject({
            status: 404,
        })
    })

    it('removes a wishlist book membership via DELETE', async () => {
        const client = createMockClient()

        vi.mocked(client.request)
            .mockResolvedValue(
                new Response(null, {
                    status: 204,
                }),
            )

        const api = createWishlistsApi(client)

        await api.removeBook(
            'wishlist-1',
            'membership-1',
        )

        expect(client.request).toHaveBeenCalledWith(
            '/wishlists/wishlist-1/books/membership-1',
            {
                method: 'DELETE',
            },
        )
    })

    it('encodes wishlist and membership ids when removing a membership', async () => {
        const client = createMockClient()

        vi.mocked(client.request)
            .mockResolvedValue(
                new Response(null, {
                    status: 204,
                }),
            )

        const api = createWishlistsApi(client)

        await api.removeBook(
            'wishlist/one',
            'membership/two',
        )

        expect(client.request).toHaveBeenCalledWith(
            '/wishlists/wishlist%2Fone/books/membership%2Ftwo',
            {
                method: 'DELETE',
            },
        )
    })

    it('forwards AbortSignal when removing a wishlist membership', async () => {
        const client = createMockClient()
        const signal = new AbortController().signal

        vi.mocked(client.request)
            .mockResolvedValue(
                new Response(null, {
                    status: 204,
                }),
            )

        const api = createWishlistsApi(client)

        await api.removeBook(
            'wishlist-1',
            'membership-1',
            {
                signal,
            },
        )

        expect(client.request).toHaveBeenCalledWith(
            '/wishlists/wishlist-1/books/membership-1',
            {
                method: 'DELETE',
                signal,
            },
        )
    })

    it('surfaces shelved-book add failures as 412 with detail', async () => {
        const client = createMockClient()

        vi.mocked(client.requestJson)
            .mockRejectedValue(
                new ApiError({
                    kind: 'http',
                    message:
                        'Existing books cannot be added to a wishlist',
                    status: 412,
                    detail:
                        'Existing books cannot be added to a wishlist',
                }),
            )

        const api = createWishlistsApi(client)

        await expect(
            api.addBook('wishlist-1', {
                book_id: 'book-1',
            } as WishlistBookCreate),
        ).rejects.toMatchObject({
            status: 412,
            detail:
                'Existing books cannot be added to a wishlist',
        })
    })

    it('surfaces unsupported membership status as 422', async () => {
        const client = createMockClient()

        vi.mocked(client.requestJson)
            .mockRejectedValue(
                new ApiError({
                    kind: 'validation',
                    message: 'Validation failed',
                    status: 422,
                    fieldErrors: [
                        {
                            field: 'status',
                            message:
                                'Input should be wanted, ordered, owned or dropped',
                        },
                    ],
                }),
            )

        const api = createWishlistsApi(client)

        await expect(
            api.addBook('wishlist-1', {
                book_id: 'book-1',
                status: 'wanted',
            }),
        ).rejects.toMatchObject({
            kind: 'validation',
            status: 422,
        })
    })
})
