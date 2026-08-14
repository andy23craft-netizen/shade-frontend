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
    BookList,
} from './apiTypes'
import {
    useBooks,
} from './booksQueries'
import {
    queryKeys,
} from './queryKeys'

const mockList = vi.fn()

vi.mock('./booksApi', () => ({
    createBooksApi: () => ({
        list: mockList,
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

    return {
        Wrapper,
        queryClient,
    }
}

describe('stale query overwrite guard', () => {
    it('forwards abort signals to the books list helper', async () => {
        let seenSignal: AbortSignal | undefined

        mockList.mockImplementationOnce(
            ({
                signal,
            }: {
                signal?: AbortSignal
            }) => {
                seenSignal = signal

                return Promise.resolve({
                    items: [],
                    total: 0,
                } satisfies BookList)
            },
        )

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        renderHook(
            () => useBooks(),
            {
                wrapper: Wrapper,
            },
        )

        await waitFor(() =>
            expect(
                seenSignal,
            ).toBeInstanceOf(AbortSignal),
        )

        queryClient.clear()
    })

    it('does not let an aborted fetch overwrite a newer result for the same key', async () => {
        const resolvers: Array<(
            value: BookList,
        ) => void> = []

        mockList.mockImplementation(
            ({
                signal,
            }: {
                signal?: AbortSignal
            }) =>
                new Promise<BookList>(
                    (resolve, reject) => {
                        resolvers.push(resolve)

                        signal?.addEventListener(
                            'abort',
                            () => {
                                reject(
                                    new DOMException(
                                        'Aborted',
                                        'AbortError',
                                    ),
                                )
                            },
                        )
                    },
                ),
        )

        const queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        })

        const queryKey = queryKeys.books.list()

        const first = queryClient.fetchQuery({
            queryKey,
            queryFn: ({
                signal,
            }) =>
                mockList({
                    signal,
                }),
        })

        await waitFor(() =>
            expect(
                resolvers,
            ).toHaveLength(1),
        )

        await queryClient.cancelQueries({
            queryKey,
        })

        await expect(first).rejects.toBeTruthy()

        const second = queryClient.fetchQuery({
            queryKey,
            queryFn: ({
                signal,
            }) =>
                mockList({
                    signal,
                }),
        })

        await waitFor(() =>
            expect(
                resolvers,
            ).toHaveLength(2),
        )

        const freshResult: BookList = {
            items: [],
            total: 2,
        }
        const staleResult: BookList = {
            items: [],
            total: 1,
        }

        resolvers[1]?.(freshResult)
        await expect(second).resolves.toEqual(
            freshResult,
        )

        resolvers[0]?.(staleResult)

        expect(
            queryClient.getQueryData(queryKey),
        ).toEqual(freshResult)

        queryClient.clear()
    })
})
