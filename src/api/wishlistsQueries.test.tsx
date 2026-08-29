import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query'
import {
    renderHook,
    waitFor,
} from '@testing-library/react'
import {
    type ReactNode,
} from 'react'
import {
    describe,
    expect,
    it,
    vi,
    beforeEach,
} from 'vitest'

import type {
    BookRead,
    WishlistBookCreate,
    WishlistBookList,
    WishlistBookRead,
    WishlistCreate,
    WishlistList,
    WishlistRead,
} from './apiTypes'
import {
    MoveWishlistBookError,
    MoveWishlistBookToShelfError,
    useAddWishlistBook,
    useCreateWishlist,
    useDeleteWishlist,
    useMoveWishlistBook,
    useMoveWishlistBookToShelf,
    useRemoveWishlistBook,
    useUpdateWishlist,
    useWishlistBooks,
    useWishlists,
    useInfiniteWishlistBooks,
} from './wishlistsQueries'
import {
    queryKeys,
} from './queryKeys'

const mockListWishlists = vi.fn()
const mockCreateWishlist = vi.fn()
const mockUpdateWishlist = vi.fn()
const mockRemoveWishlist = vi.fn()
const mockListBooks = vi.fn()
const mockAddBook = vi.fn()
const mockRemoveBook = vi.fn()
const mockUpdateBook = vi.fn()

vi.mock('./wishlistsApi', () => ({
    createWishlistsApi: () => ({
        list: mockListWishlists,
        create: mockCreateWishlist,
        update: mockUpdateWishlist,
        remove: mockRemoveWishlist,
        listBooks: mockListBooks,
        addBook: mockAddBook,
        removeBook: mockRemoveBook,
    }),
}))

vi.mock(
    '../features/connection/useConnection',
    () => ({
        useConnection: () => ({
            apiClient: {},
        }),
    }),
)

vi.mock('./booksApi', () => ({
    createBooksApi: () => ({
        update: mockUpdateBook,
    }),
}))

beforeEach(() => {
    vi.clearAllMocks()
})

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
            mutations: {
                retry: false,
            },
        },
    })

    function Wrapper({
        children,
    }: {
        children: ReactNode
    }) {
        return (
            <QueryClientProvider
                client={queryClient}
            >
                {children}
            </QueryClientProvider>
        )
    }

    return {
        Wrapper,
        queryClient,
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
    wishlist_book_id: 'membership-1',
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

describe('useWishlists', () => {
    it('loads the unpaginated wishlists list', async () => {
        const list: WishlistList = {
            items: [sampleWishlist],
            total: 1,
        }

        mockListWishlists.mockResolvedValue(list)

        const {
            Wrapper,
        } = createWrapper()

        const {
            result,
        } = renderHook(
            () => useWishlists(),
            {
                wrapper: Wrapper,
            },
        )

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(mockListWishlists).toHaveBeenCalled()
        expect(result.current.data).toEqual(list)
        expect(queryKeys.wishlists.list()).toEqual([
            'wishlists',
            {
                list: true,
            },
        ])
    })

    it('does not fetch when enabled is false', () => {
        mockListWishlists.mockClear()

        const {
            Wrapper,
        } = createWrapper()

        const {
            result,
        } = renderHook(
            () =>
                useWishlists({
                    enabled: false,
                }),
            {
                wrapper: Wrapper,
            },
        )

        expect(result.current.fetchStatus).toBe('idle')
        expect(mockListWishlists).not.toHaveBeenCalled()
    })
})

describe('useWishlistBooks', () => {
    it('loads memberships for a wishlist id', async () => {
        const list: WishlistBookList = {
            items: [sampleMembership],
            total: 1,
        }

        mockListBooks.mockResolvedValue(list)

        const {
            Wrapper,
        } = createWrapper()

        const {
            result,
        } = renderHook(
            () => useWishlistBooks('wishlist-1'),
            {
                wrapper: Wrapper,
            },
        )

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(mockListBooks).toHaveBeenCalledWith(
            'wishlist-1',
            expect.objectContaining({
                signal: expect.any(AbortSignal),
            }),
        )
        expect(result.current.data).toEqual(list)
        expect(
            queryKeys.wishlists.books('wishlist-1'),
        ).toEqual([
            'wishlists',
            'wishlist-1',
            'books',
        ])
    })

    it('does not fetch when the wishlist id is empty', () => {
        mockListBooks.mockClear()

        const {
            Wrapper,
        } = createWrapper()

        const {
            result,
        } = renderHook(
            () => useWishlistBooks(''),
            {
                wrapper: Wrapper,
            },
        )

        expect(result.current.fetchStatus).toBe('idle')
        expect(mockListBooks).not.toHaveBeenCalled()
    })
})

describe('wishlist write mutations', () => {
    it('creates a wishlist and invalidates wishlists', async () => {
        const body: WishlistCreate = {
            name: 'TBR',
        }

        mockCreateWishlist.mockResolvedValueOnce(
            sampleWishlist,
        )

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const invalidateQueries = vi.spyOn(
            queryClient,
            'invalidateQueries',
        )

        const {
            result,
        } = renderHook(
            () => useCreateWishlist(),
            {
                wrapper: Wrapper,
            },
        )

        await result.current.mutateAsync(body)

        expect(mockCreateWishlist).toHaveBeenCalledWith(
            body,
        )
        expect(invalidateQueries).toHaveBeenCalledWith({
            queryKey: queryKeys.wishlists.all,
        })

        queryClient.clear()
    })

    it('adds a membership and invalidates that wishlist books query', async () => {
        const body: WishlistBookCreate = {
            book_id: 'book-1',
            status: 'wanted',
        }

        mockAddBook.mockResolvedValueOnce(
            sampleMembership,
        )

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const invalidateQueries = vi.spyOn(
            queryClient,
            'invalidateQueries',
        )

        const {
            result,
        } = renderHook(
            () => useAddWishlistBook(),
            {
                wrapper: Wrapper,
            },
        )

        await result.current.mutateAsync({
            wishlistId: 'wishlist-1',
            wishlistBook: body,
        })

        expect(mockAddBook).toHaveBeenCalledWith(
            'wishlist-1',
            body,
        )
        expect(invalidateQueries).toHaveBeenCalledWith({
            queryKey: queryKeys.wishlists.books(
                'wishlist-1',
            ),
        })
        expect(
            invalidateQueries,
        ).not.toHaveBeenCalledWith({
            queryKey: queryKeys.wishlists.all,
        })

        queryClient.clear()
    })

    it('updates a wishlist and invalidates wishlists', async () => {
        mockUpdateWishlist.mockResolvedValueOnce({
            ...sampleWishlist,
            name: 'Later',
        })

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const invalidateQueries = vi.spyOn(
            queryClient,
            'invalidateQueries',
        )

        const {
            result,
        } = renderHook(
            () => useUpdateWishlist(),
            {
                wrapper: Wrapper,
            },
        )

        await result.current.mutateAsync({
            wishlistId: 'wishlist-1',
            wishlist: {
                name: 'Later',
            },
        })

        expect(mockUpdateWishlist).toHaveBeenCalledWith(
            'wishlist-1',
            {
                name: 'Later',
            },
        )
        expect(invalidateQueries).toHaveBeenCalledWith({
            queryKey: queryKeys.wishlists.all,
        })

        queryClient.clear()
    })

    it('deletes a wishlist and invalidates wishlists', async () => {
        mockRemoveWishlist.mockResolvedValueOnce(
            undefined,
        )

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const invalidateQueries = vi.spyOn(
            queryClient,
            'invalidateQueries',
        )

        const {
            result,
        } = renderHook(
            () => useDeleteWishlist(),
            {
                wrapper: Wrapper,
            },
        )

        await result.current.mutateAsync('wishlist-1')

        expect(mockRemoveWishlist).toHaveBeenCalledWith(
            'wishlist-1',
        )
        expect(invalidateQueries).toHaveBeenCalledWith({
            queryKey: queryKeys.wishlists.all,
        })

        queryClient.clear()
    })
})

describe('useRemoveWishlistBook', () => {
    it('removes the membership and invalidates that wishlist books query', async () => {
        mockRemoveBook.mockResolvedValue(undefined)

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const invalidateQueries = vi.spyOn(
            queryClient,
            'invalidateQueries',
        )

        const {
            result,
        } = renderHook(
            () => useRemoveWishlistBook(),
            {
                wrapper: Wrapper,
            },
        )

        result.current.mutate({
            wishlistId: 'wishlist-1',
            wishlistBookId: 'membership-1',
        })

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(mockRemoveBook).toHaveBeenCalledWith(
            'wishlist-1',
            'membership-1',
        )

        expect(invalidateQueries).toHaveBeenCalledWith({
            queryKey:
                queryKeys.wishlists.books(
                    'wishlist-1',
                ),
        })
    })
})

describe('useMoveWishlistBookToShelf', () => {
    it('removes the membership before assigning the shelf', async () => {
        const calls: string[] = []

        mockRemoveBook.mockImplementation(
            async () => {
                calls.push('remove')
            },
        )

        mockUpdateBook.mockImplementation(
            async () => {
                calls.push('update')

                return {
                    id: 'book-1',
                    title: 'The Dispossessed',
                    shelf_name: 'a1',
                } as BookRead
            },
        )

        const {
            Wrapper,
        } = createWrapper()

        const {
            result,
        } = renderHook(
            () => useMoveWishlistBookToShelf(),
            {
                wrapper: Wrapper,
            },
        )

        result.current.mutate({
            wishlistId: 'wishlist-1',
            wishlistBookId: 'membership-1',
            bookId: 'book-1',
            shelfName: 'a1',
        })

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(calls).toEqual([
            'remove',
            'update',
        ])

        expect(mockUpdateBook).toHaveBeenCalledWith(
            'book-1',
            {
                shelf_name: 'a1',
            },
        )
    })

    it('reports when membership removal succeeded before shelf assignment failed', async () => {
        mockRemoveBook.mockResolvedValue(undefined)

        const updateError =
            new Error('Shelf update failed.')

        mockUpdateBook.mockRejectedValue(
            updateError,
        )

        const {
            Wrapper,
        } = createWrapper()

        const {
            result,
        } = renderHook(
            () => useMoveWishlistBookToShelf(),
            {
                wrapper: Wrapper,
            },
        )

        result.current.mutate({
            wishlistId: 'wishlist-1',
            wishlistBookId: 'membership-1',
            bookId: 'book-1',
            shelfName: 'a1',
        })

        await waitFor(() => {
            expect(result.current.isError).toBe(true)
        })

        expect(result.current.error)
            .toBeInstanceOf(
                MoveWishlistBookToShelfError,
            )

        expect(
            (
                result.current.error as
                    MoveWishlistBookToShelfError
            ).membershipRemoved,
        ).toBe(true)
    })

    it('skips membership removal when retrying after a partial failure', async () => {
        mockUpdateBook.mockResolvedValue({
            id: 'book-1',
            title: 'The Dispossessed',
            shelf_name: 'a1',
        } as BookRead)

        const {
            Wrapper,
        } = createWrapper()

        const {
            result,
        } = renderHook(
            () => useMoveWishlistBookToShelf(),
            {
                wrapper: Wrapper,
            },
        )

        result.current.mutate({
            wishlistId: 'wishlist-1',
            wishlistBookId: 'membership-1',
            bookId: 'book-1',
            shelfName: 'a1',
            membershipRemoved: true,
        })

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(
            mockRemoveBook,
        ).not.toHaveBeenCalled()

        expect(mockUpdateBook).toHaveBeenCalledWith(
            'book-1',
            {
                shelf_name: 'a1',
            },
        )
    })
})

describe('useMoveWishlistBook', () => {
    const wishlistBook: WishlistBookCreate = {
        book_id: 'book-1',
        status: 'wanted',
        priority: 2,
        notes: 'Hardcover if possible',
        url: 'https://example.com/book',
    }

    const destinationMembership: WishlistBookRead = {
        wishlist_book_id: 'membership-2',
        wishlist_id: 'wishlist-2',
        book_id: 'book-1',
        book_title: 'The Dispossessed',
        book_status: 'available',
        status: 'wanted',
        priority: 2,
        notes: 'Hardcover if possible',
        url: 'https://example.com/book',
        created_date: '2026-08-02T00:00:00Z',
    }

    it('adds the destination membership before removing the source membership', async () => {
        const calls: string[] = []

        mockAddBook.mockImplementation(
            async () => {
                calls.push('add')
                return destinationMembership
            },
        )

        mockRemoveBook.mockImplementation(
            async () => {
                calls.push('remove')
            },
        )

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const invalidateQueries = vi.spyOn(
            queryClient,
            'invalidateQueries',
        )

        const {
            result,
        } = renderHook(
            () => useMoveWishlistBook(),
            {
                wrapper: Wrapper,
            },
        )

        await result.current.mutateAsync({
            sourceWishlistId: 'wishlist-1',
            sourceWishlistBookId: 'membership-1',
            destinationWishlistId: 'wishlist-2',
            wishlistBook,
        })

        expect(calls).toEqual([
            'add',
            'remove',
        ])

        expect(mockAddBook).toHaveBeenCalledWith(
            'wishlist-2',
            wishlistBook,
        )

        expect(mockRemoveBook).toHaveBeenCalledWith(
            'wishlist-1',
            'membership-1',
        )

        expect(invalidateQueries).toHaveBeenCalledWith({
            queryKey:
                queryKeys.wishlists.books(
                    'wishlist-1',
                ),
        })

        expect(invalidateQueries).toHaveBeenCalledWith({
            queryKey:
                queryKeys.wishlists.books(
                    'wishlist-2',
                ),
        })

        queryClient.clear()
    })

    it('does not remove the source membership when destination creation fails', async () => {
        const addError =
            new Error('Destination add failed.')

        mockAddBook.mockRejectedValue(addError)

        const {
            Wrapper,
        } = createWrapper()

        const {
            result,
        } = renderHook(
            () => useMoveWishlistBook(),
            {
                wrapper: Wrapper,
            },
        )

        let thrownError: unknown

        try {
            await result.current.mutateAsync({
                sourceWishlistId: 'wishlist-1',
                sourceWishlistBookId:
                    'membership-1',
                destinationWishlistId:
                    'wishlist-2',
                wishlistBook,
            })
        } catch (error) {
            thrownError = error
        }

        expect(thrownError).toBeInstanceOf(
            MoveWishlistBookError,
        )

        expect(
            mockRemoveBook,
        ).not.toHaveBeenCalled()

        expect(
            (
                thrownError as MoveWishlistBookError
            ).destinationMembershipCreated,
        ).toBe(false)
    })

    it('reports when destination creation succeeded before source removal failed', async () => {
        mockAddBook.mockResolvedValue(
            destinationMembership,
        )

        const removeError =
            new Error('Source removal failed.')

        mockRemoveBook.mockRejectedValue(
            removeError,
        )

        const {
            Wrapper,
        } = createWrapper()

        const {
            result,
        } = renderHook(
            () => useMoveWishlistBook(),
            {
                wrapper: Wrapper,
            },
        )

        let thrownError: unknown

        try {
            await result.current.mutateAsync({
                sourceWishlistId: 'wishlist-1',
                sourceWishlistBookId:
                    'membership-1',
                destinationWishlistId:
                    'wishlist-2',
                wishlistBook,
            })
        } catch (error) {
            thrownError = error
        }

        expect(thrownError).toBeInstanceOf(
            MoveWishlistBookError,
        )

        expect(
            (
                thrownError as MoveWishlistBookError
            ).destinationMembershipCreated,
        ).toBe(true)

        expect(mockAddBook).toHaveBeenCalledTimes(1)
        expect(mockRemoveBook).toHaveBeenCalledTimes(1)
    })

    it('skips destination creation when retrying after a partial failure', async () => {
        mockRemoveBook.mockResolvedValue(undefined)

        mockListBooks.mockResolvedValue({
            items: [
                destinationMembership,
            ],
            total: 1,
        } satisfies WishlistBookList)

        const {
            Wrapper,
        } = createWrapper()

        const {
            result,
        } = renderHook(
            () => useMoveWishlistBook(),
            {
                wrapper: Wrapper,
            },
        )

        const moved =
            await result.current.mutateAsync({
                sourceWishlistId: 'wishlist-1',
                sourceWishlistBookId:
                    'membership-1',
                destinationWishlistId:
                    'wishlist-2',
                wishlistBook,
                destinationMembershipCreated:
                    true,
            })

        expect(
            mockAddBook,
        ).not.toHaveBeenCalled()

        expect(mockRemoveBook).toHaveBeenCalledWith(
            'wishlist-1',
            'membership-1',
        )

        expect(mockListBooks).toHaveBeenCalledWith(
            'wishlist-2',
        )

        expect(moved).toEqual(
            destinationMembership,
        )
    })
})

describe('useInfiniteWishlistBooks', () => {
    it('loads wishlist memberships in batches', async () => {
        mockListBooks.mockResolvedValue({
            items: [
                {
                    wishlist_book_id:
                        'membership-1',
                    wishlist_id: 'wishlist-1',
                    book_id: 'book-1',
                    status: 'wanted',
                    priority: null,
                    notes: null,
                    url: null,
                    created_date:
                        '2026-08-01T00:00:00Z',
                },
            ],
            total: 31,
        })

        const {
            Wrapper,
        } = createWrapper()

        const {
            result,
        } = renderHook(
            () =>
                useInfiniteWishlistBooks(
                    'wishlist-1',
                ),
            {
                wrapper: Wrapper,
            },
        )

        await waitFor(() => {
            expect(
                result.current.isSuccess,
            ).toBe(true)
        })

        expect(
            mockListBooks,
        ).toHaveBeenCalledWith(
            'wishlist-1',
            expect.objectContaining({
                skip: 0,
                take: 30,
            }),
        )
    })

    it('loads the next page after the memberships already loaded', async () => {
        const firstPageItems =
            Array.from(
                {
                    length: 30,
                },
                (_, index) => ({
                    wishlist_book_id:
                        `membership-${index}`,
                    wishlist_id: 'wishlist-1',
                    book_id: `book-${index}`,
                    status: 'wanted' as const,
                    priority: null,
                    notes: null,
                    url: null,
                    created_date:
                        '2026-08-01T00:00:00Z',
                }),
            )

        mockListBooks
            .mockResolvedValueOnce({
                items: firstPageItems,
                total: 31,
            })
            .mockResolvedValueOnce({
                items: [
                    {
                        wishlist_book_id:
                            'membership-30',
                        wishlist_id:
                            'wishlist-1',
                        book_id: 'book-30',
                        status: 'wanted',
                        priority: null,
                        notes: null,
                        url: null,
                        created_date:
                            '2026-08-01T00:00:00Z',
                    },
                ],
                total: 31,
            })

        const {
            Wrapper,
        } = createWrapper()

        const {
            result,
        } = renderHook(
            () =>
                useInfiniteWishlistBooks(
                    'wishlist-1',
                ),
            {
                wrapper: Wrapper,
            },
        )

        await waitFor(() => {
            expect(
                result.current.isSuccess,
            ).toBe(true)
        })

        await result.current.fetchNextPage()

        expect(
            mockListBooks,
        ).toHaveBeenLastCalledWith(
            'wishlist-1',
            expect.objectContaining({
                skip: 30,
                take: 30,
            }),
        )
    })

    it('does not load memberships while disabled', () => {
        const {
            Wrapper,
        } = createWrapper()

        renderHook(
            () =>
                useInfiniteWishlistBooks(
                    'wishlist-1',
                    {
                        enabled: false,
                    },
                ),
            {
                wrapper: Wrapper,
            },
        )

        expect(
            mockListBooks,
        ).not.toHaveBeenCalled()
    })
})



