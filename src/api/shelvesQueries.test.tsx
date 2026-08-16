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
    ShelfRead,
} from './apiTypes'
import {
    useShelves,
} from './shelvesQueries'
import {
    queryKeys,
} from './queryKeys'

const mockListShelves = vi.fn()

vi.mock('./shelvesApi', () => ({
    createShelvesApi: () => ({
        list: mockListShelves,
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

    return Wrapper
}

describe('useShelves', () => {
    it('loads the unpaginated shelves list', async () => {
        const shelves: ShelfRead[] = [
            {
                shelf_id: 'shelf-1',
                common_name: 'unknown',
                location: null,
                description: null,
                created_date:
                    '2026-01-01T00:00:00Z',
                updated_date:
                    '2026-01-01T00:00:00Z',
            },
        ]

        mockListShelves.mockResolvedValue(
            shelves,
        )

        const {
            result,
        } = renderHook(
            () => useShelves(),
            {
                wrapper: createWrapper(),
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
            result,
        } = renderHook(
            () =>
                useShelves({
                    enabled: false,
                }),
            {
                wrapper: createWrapper(),
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
            result,
        } = renderHook(
            () => useShelves(),
            {
                wrapper: createWrapper(),
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
