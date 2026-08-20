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
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import type {
    CollectionBookCreate,
    CollectionBookList,
    CollectionBookRead,
    CollectionList,
    CollectionRead,
} from './apiTypes'
import {
    queryKeys,
} from './queryKeys'
import {
    useAddCollectionBook,
    useCollectionBooks,
    useCollections,
    useCreateCollection,
    useDeleteCollection,
    useRemoveCollectionBook,
    useReorderCollectionBook,
    useUpdateCollection,
} from './collectionsQueries'

const mockListCollections = vi.fn()
const mockCreateCollection = vi.fn()
const mockUpdateCollection = vi.fn()
const mockRemoveCollection = vi.fn()
const mockListBooks = vi.fn()
const mockAddBook = vi.fn()
const mockReorderBook = vi.fn()
const mockRemoveBook = vi.fn()

vi.mock('./collectionsApi', () => ({
    createCollectionsApi: () => ({
        list: mockListCollections,
        create: mockCreateCollection,
        update: mockUpdateCollection,
        remove: mockRemoveCollection,
        listBooks: mockListBooks,
        addBook: mockAddBook,
        reorderBook: mockReorderBook,
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

const sampleCollection: CollectionRead = {
    collection_id: 'collection-1',
    name: 'Staff Picks',
    description: null,
    created_date: '2026-08-01T00:00:00Z',
    last_updated_date:
        '2026-08-01T00:00:00Z',
}

const sampleMembership: CollectionBookRead = {
    collection_book_id: 'membership-1',
    collection_id: 'collection-1',
    book_id: 'book-1',
    order_num: 1,
    notes: null,
    shelf_name: 'a1',
    on_wishlist: false,
    created_date: '2026-08-01T00:00:00Z',
}

describe('useCollections', () => {
    it('loads the unpaginated collections list', async () => {
        const list: CollectionList = {
            items: [sampleCollection],
            total: 1,
        }

        mockListCollections.mockResolvedValue(
            list,
        )

        const {
            Wrapper,
        } = createWrapper()

        const {
            result,
        } = renderHook(
            () => useCollections(),
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
            mockListCollections,
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                signal:
                    expect.any(AbortSignal),
            }),
        )

        expect(result.current.data).toEqual(
            list,
        )
    })

    it('does not fetch when disabled', () => {
        const {
            Wrapper,
        } = createWrapper()

        const {
            result,
        } = renderHook(
            () =>
                useCollections({
                    enabled: false,
                }),
            {
                wrapper: Wrapper,
            },
        )

        expect(
            result.current.fetchStatus,
        ).toBe('idle')

        expect(
            mockListCollections,
        ).not.toHaveBeenCalled()
    })
})

describe('useCollectionBooks', () => {
    it('loads memberships for a collection', async () => {
        const list: CollectionBookList = {
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
            () =>
                useCollectionBooks(
                    'collection-1',
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
            'collection-1',
            expect.objectContaining({
                signal:
                    expect.any(AbortSignal),
            }),
        )

        expect(result.current.data).toEqual(
            list,
        )
    })

    it('does not fetch when collection id is empty', () => {
        const {
            Wrapper,
        } = createWrapper()

        const {
            result,
        } = renderHook(
            () => useCollectionBooks(''),
            {
                wrapper: Wrapper,
            },
        )

        expect(
            result.current.fetchStatus,
        ).toBe('idle')

        expect(
            mockListBooks,
        ).not.toHaveBeenCalled()
    })
})

describe('collection write mutations', () => {
    it('creates a collection and invalidates collections', async () => {
        mockCreateCollection.mockResolvedValue(
            sampleCollection,
        )

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const invalidateQueries =
            vi.spyOn(
                queryClient,
                'invalidateQueries',
            )

        const {
            result,
        } = renderHook(
            () => useCreateCollection(),
            {
                wrapper: Wrapper,
            },
        )

        result.current.mutate({
            name: 'Staff Picks',
        })

        await waitFor(() => {
            expect(
                result.current.isSuccess,
            ).toBe(true)
        })

        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey:
            queryKeys.collections.all,
        })
    })

    it('updates a collection and invalidates collections', async () => {
        mockUpdateCollection.mockResolvedValue(
            sampleCollection,
        )

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const invalidateQueries =
            vi.spyOn(
                queryClient,
                'invalidateQueries',
            )

        const {
            result,
        } = renderHook(
            () => useUpdateCollection(),
            {
                wrapper: Wrapper,
            },
        )

        result.current.mutate({
            collectionId: 'collection-1',
            collection: {
                description: 'Updated',
            },
        })

        await waitFor(() => {
            expect(
                result.current.isSuccess,
            ).toBe(true)
        })

        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey:
            queryKeys.collections.all,
        })
    })

    it('deletes a collection and invalidates collections', async () => {
        mockRemoveCollection.mockResolvedValue(
            undefined,
        )

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const invalidateQueries =
            vi.spyOn(
                queryClient,
                'invalidateQueries',
            )

        const {
            result,
        } = renderHook(
            () => useDeleteCollection(),
            {
                wrapper: Wrapper,
            },
        )

        result.current.mutate(
            'collection-1',
        )

        await waitFor(() => {
            expect(
                result.current.isSuccess,
            ).toBe(true)
        })

        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey:
            queryKeys.collections.all,
        })
    })

    it('adds a membership and invalidates that collection', async () => {
        mockAddBook.mockResolvedValue(
            sampleMembership,
        )

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const invalidateQueries =
            vi.spyOn(
                queryClient,
                'invalidateQueries',
            )

        const {
            result,
        } = renderHook(
            () => useAddCollectionBook(),
            {
                wrapper: Wrapper,
            },
        )

        const collectionBook:
            CollectionBookCreate = {
            book_id: 'book-1',
        }

        result.current.mutate({
            collectionId: 'collection-1',
            collectionBook,
        })

        await waitFor(() => {
            expect(
                result.current.isSuccess,
            ).toBe(true)
        })

        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey:
                queryKeys.collections.books(
                    'collection-1',
                ),
        })
    })

    it('reorders a membership and invalidates that collection', async () => {
        mockReorderBook.mockResolvedValue({
            ...sampleMembership,
            order_num: 2,
        })

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const invalidateQueries =
            vi.spyOn(
                queryClient,
                'invalidateQueries',
            )

        const {
            result,
        } = renderHook(
            () =>
                useReorderCollectionBook(),
            {
                wrapper: Wrapper,
            },
        )

        result.current.mutate({
            collectionId: 'collection-1',
            collectionBookId:
                'membership-1',
            orderNum: 2,
        })

        await waitFor(() => {
            expect(
                result.current.isSuccess,
            ).toBe(true)
        })

        expect(
            mockReorderBook,
        ).toHaveBeenCalledWith(
            'collection-1',
            'membership-1',
            {
                order_num: 2,
            },
        )

        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey:
                queryKeys.collections.books(
                    'collection-1',
                ),
        })
    })

    it('removes a membership and invalidates that collection', async () => {
        mockRemoveBook.mockResolvedValue(
            undefined,
        )

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const invalidateQueries =
            vi.spyOn(
                queryClient,
                'invalidateQueries',
            )

        const {
            result,
        } = renderHook(
            () =>
                useRemoveCollectionBook(),
            {
                wrapper: Wrapper,
            },
        )

        result.current.mutate({
            collectionId: 'collection-1',
            collectionBookId:
                'membership-1',
        })

        await waitFor(() => {
            expect(
                result.current.isSuccess,
            ).toBe(true)
        })

        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey:
                queryKeys.collections.books(
                    'collection-1',
                ),
        })
    })
})
