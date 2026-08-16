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
} from 'vitest'

import type {
    ShelfCreate,
    ShelfRead,
    ShelfUpdate,
} from './apiTypes'
import {
    useCreateShelf,
    useDeleteShelf,
    useShelves,
    useUpdateShelf,
} from './shelvesQueries'
import {
    queryKeys,
} from './queryKeys'

const mockListShelves = vi.fn()
const mockCreateShelf = vi.fn()
const mockUpdateShelf = vi.fn()
const mockRemoveShelf = vi.fn()

vi.mock('./shelvesApi', () => ({
    createShelvesApi: () => ({
        list: mockListShelves,
        create: mockCreateShelf,
        update: mockUpdateShelf,
        remove: mockRemoveShelf,
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

const sampleShelf: ShelfRead = {
    shelf_id: 'shelf-1',
    common_name: 'a1',
    location: null,
    description: null,
    created_date: '2026-01-01T00:00:00Z',
    updated_date: '2026-01-01T00:00:00Z',
}

describe('useShelves', () => {
    it('loads the unpaginated shelves list', async () => {
        const shelves: ShelfRead[] = [
            sampleShelf,
        ]

        mockListShelves.mockResolvedValue(
            shelves,
        )

        const {
            Wrapper,
        } = createWrapper()

        const {
            result,
        } = renderHook(
            () => useShelves(),
            {
                wrapper: Wrapper,
            },
        )

        await waitFor(() => {
            expect(
                result.current.isSuccess,
            ).toBe(true)
        })

        expect(mockListShelves).toHaveBeenCalled()
        expect(result.current.data).toEqual(
            shelves,
        )
        expect(
            queryKeys.shelves.list(),
        ).toEqual([
            'shelves',
            {
                list: true,
            },
        ])
    })

    it('does not fetch when enabled is false', async () => {
        mockListShelves.mockClear()

        const {
            Wrapper,
        } = createWrapper()

        const {
            result,
        } = renderHook(
            () =>
                useShelves({
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
            mockListShelves,
        ).not.toHaveBeenCalled()
    })

    it('surfaces list errors', async () => {
        mockListShelves.mockRejectedValue(
            new Error('shelves failed'),
        )

        const {
            Wrapper,
        } = createWrapper()

        const {
            result,
        } = renderHook(
            () => useShelves(),
            {
                wrapper: Wrapper,
            },
        )

        await waitFor(() => {
            expect(
                result.current.isError,
            ).toBe(true)
        })

        expect(
            result.current.error,
        ).toEqual(
            expect.objectContaining({
                message: 'shelves failed',
            }),
        )
    })
})

describe('shelf write mutations', () => {
    it('creates a shelf and invalidates shelves', async () => {
        const body: ShelfCreate = {
            common_name: 'a1',
        }

        mockCreateShelf.mockResolvedValueOnce(
            sampleShelf,
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
            () => useCreateShelf(),
            {
                wrapper: Wrapper,
            },
        )

        await result.current.mutateAsync(body)

        expect(mockCreateShelf).toHaveBeenCalledWith(
            body,
        )

        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: queryKeys.shelves.all,
        })

        expect(
            invalidateQueries,
        ).not.toHaveBeenCalledWith({
            queryKey: queryKeys.books.all,
        })

        queryClient.clear()
    })

    it('updates metadata without invalidating books or dashboard', async () => {
        const body: ShelfUpdate = {
            location: 'Office',
        }

        mockUpdateShelf.mockResolvedValueOnce({
            ...sampleShelf,
            location: 'Office',
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
            () => useUpdateShelf(),
            {
                wrapper: Wrapper,
            },
        )

        await result.current.mutateAsync({
            shelfId: 'shelf-1',
            shelf: body,
        })

        expect(mockUpdateShelf).toHaveBeenCalledWith(
            'shelf-1',
            body,
        )

        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: queryKeys.shelves.all,
        })

        expect(
            invalidateQueries,
        ).not.toHaveBeenCalledWith({
            queryKey: queryKeys.books.all,
        })

        expect(
            invalidateQueries,
        ).not.toHaveBeenCalledWith({
            queryKey: queryKeys.dashboard.all,
        })

        queryClient.clear()
    })

    it('renames a shelf and invalidates shelves, books, and dashboard', async () => {
        const body: ShelfUpdate = {
            common_name: 'b2',
        }

        mockUpdateShelf.mockResolvedValueOnce({
            ...sampleShelf,
            common_name: 'b2',
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
            () => useUpdateShelf(),
            {
                wrapper: Wrapper,
            },
        )

        await result.current.mutateAsync({
            shelfId: 'shelf-1',
            shelf: body,
        })

        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: queryKeys.shelves.all,
        })

        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: queryKeys.books.all,
        })

        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: queryKeys.dashboard.all,
        })

        queryClient.clear()
    })

    it('deletes a shelf and invalidates shelves', async () => {
        mockRemoveShelf.mockResolvedValueOnce(
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
            () => useDeleteShelf(),
            {
                wrapper: Wrapper,
            },
        )

        await result.current.mutateAsync(
            'shelf-1',
        )

        expect(mockRemoveShelf).toHaveBeenCalledWith(
            'shelf-1',
        )

        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: queryKeys.shelves.all,
        })

        queryClient.clear()
    })

    it('surfaces create mutation errors', async () => {
        mockCreateShelf.mockRejectedValueOnce(
            new Error('create failed'),
        )

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const {
            result,
        } = renderHook(
            () => useCreateShelf(),
            {
                wrapper: Wrapper,
            },
        )

        await expect(
            result.current.mutateAsync({
                common_name: 'a1',
            }),
        ).rejects.toMatchObject({
            message: 'create failed',
        })

        queryClient.clear()
    })
})
