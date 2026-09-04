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
    DashboardBreakdowns,
    DashboardIncompleteMetadata,
    DashboardSummary,
    LoanList,
    LoanRead,
} from './apiTypes'
import {
    useDashboard,
    useDashboardBreakdowns,
    useDashboardIncompleteMetadata,
    useInfiniteIncompleteMetadataBooks,
} from './dashboardQueries'
import {
    useLoan,
    useLoans,
    useInfiniteLoans,
    useUpdateLoan,
} from './loansQueries'
import {
    queryKeys,
} from './queryKeys'

const mockListLoans = vi.fn()
const mockGetLoan = vi.fn()
const mockUpdateLoan = vi.fn()
const mockGetDashboard = vi.fn()
const mockGetDashboardBreakdowns = vi.fn()
const mockGetIncompleteMetadata = vi.fn()
const mockListIncompleteMetadataBooks = vi.fn()

vi.mock('./loansApi', () => ({
    createLoansApi: () => ({
        list: mockListLoans,
        get: mockGetLoan,
        update: mockUpdateLoan,
    }),
}))

vi.mock('./dashboardApi', () => ({
    createDashboardApi: () => ({
        get: mockGetDashboard,
        getBreakdowns: mockGetDashboardBreakdowns,
        getIncompleteMetadata:
        mockGetIncompleteMetadata,
        listIncompleteMetadataBooks:
        mockListIncompleteMetadataBooks,
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

describe('loans and dashboard queries', () => {
    it('loads loans with the shared loans query key', async () => {
        const loans: LoanList = {
            items: [],
            total: 0,
        }

        mockListLoans.mockResolvedValueOnce(
            loans,
        )

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const { result } = renderHook(
            () => useLoans(),
            {
                wrapper: Wrapper,
            },
        )

        await waitFor(() =>
            expect(
                result.current.isSuccess,
            ).toBe(true),
        )

        expect(
            mockListLoans,
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                bookId: undefined,
                signal: expect.any(
                    AbortSignal,
                ),
            }),
        )

        expect(
            queryClient.getQueryData(
                queryKeys.loans.list(),
            ),
        ).toEqual(loans)

        expect(
            queryClient.getQueryData(
                queryKeys.loans.all,
            ),
        ).toEqual(loans)

        queryClient.clear()
    })

    it('loads loans filtered by bookId', async () => {
        const loans: LoanList = {
            items: [],
            total: 0,
        }

        mockListLoans.mockResolvedValueOnce(
            loans,
        )

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const { result } = renderHook(
            () =>
                useLoans({
                    bookId: 'book-1',
                }),
            {
                wrapper: Wrapper,
            },
        )

        await waitFor(() =>
            expect(
                result.current.isSuccess,
            ).toBe(true),
        )

        expect(
            mockListLoans,
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                bookId: 'book-1',
                signal: expect.any(
                    AbortSignal,
                ),
            }),
        )

        expect(
            queryClient.getQueryData(
                queryKeys.loans.list('book-1'),
            ),
        ).toEqual(loans)

        queryClient.clear()
    })

    it('loads additional infinite loan pages with chained skip values', async () => {
        const firstPage: LoanList = {
            items: Array.from(
                {
                    length: 30,
                },
                (_, index) => ({
                    album_id: null,
                    id: `loan-${index}`,
                    book_id: 'book-1',
                    borrower: 'Reader',
                    checked_out_at:
                        '2026-08-12T14:00:00Z',
                    created_date:
                        '2026-08-12T14:00:00Z',
                    due_at: null,
                    last_updated_date:
                        '2026-08-12T14:00:00Z',
                    notes: null,
                    returned_at: null,
                }),
            ),
            total: 40,
        }

        const secondPage: LoanList = {
            items: Array.from(
                {
                    length: 10,
                },
                (_, index) => ({
                    album_id: null,
                    id: `loan-${index + 30}`,
                    book_id: 'book-1',
                    borrower: 'Reader',
                    checked_out_at:
                        '2026-08-12T14:00:00Z',
                    created_date:
                        '2026-08-12T14:00:00Z',
                    due_at: null,
                    last_updated_date:
                        '2026-08-12T14:00:00Z',
                    notes: null,
                    returned_at:
                        '2026-08-13T15:30:00Z',
                }),
            ),
            total: 40,
        }

        mockListLoans.mockReset()
        mockListLoans.mockImplementation(
            async (options) => {
                if (options.skip === 0) {
                    return firstPage
                }

                if (options.skip === 30) {
                    return secondPage
                }

                throw new Error(
                    `Unexpected loans list skip: ${String(options.skip)}`,
                )
            },
        )

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const { result } = renderHook(
            () => useInfiniteLoans(),
            {
                wrapper: Wrapper,
            },
        )

        await waitFor(() =>
            expect(
                result.current.isSuccess,
            ).toBe(true),
        )

        await waitFor(() =>
            expect(
                result.current.hasNextPage,
            ).toBe(true),
        )

        await result.current.fetchNextPage()

        await waitFor(() =>
            expect(
                result.current.data?.pages,
            ).toHaveLength(2),
        )

        expect(
            mockListLoans,
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                skip: 0,
                take: 30,
            }),
        )

        expect(
            mockListLoans,
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                skip: 30,
                take: 30,
            }),
        )

        queryClient.clear()
    })

    it('uses distinct infinite loan query keys when filtered by bookId', async () => {
        const loans: LoanList = {
            items: [],
            total: 0,
        }

        mockListLoans.mockResolvedValue(loans)

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const unfiltered = renderHook(
            () => useInfiniteLoans(),
            {
                wrapper: Wrapper,
            },
        )

        const filtered = renderHook(
            () =>
                useInfiniteLoans({
                    bookId: 'book-1',
                }),
            {
                wrapper: Wrapper,
            },
        )

        await waitFor(() =>
            expect(
                unfiltered.result.current.isSuccess,
            ).toBe(true),
        )

        await waitFor(() =>
            expect(
                filtered.result.current.isSuccess,
            ).toBe(true),
        )

        expect(
            queryClient.getQueryCache().getAll(),
        ).toHaveLength(2)

        queryClient.clear()
    })

    it('loads a loan by id when enabled', async () => {
        const loan = {} as LoanRead

        mockGetLoan.mockResolvedValueOnce(loan)

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const { result } = renderHook(
            () => useLoan('loan-1'),
            {
                wrapper: Wrapper,
            },
        )

        await waitFor(() =>
            expect(
                result.current.isSuccess,
            ).toBe(true),
        )

        expect(
            mockGetLoan,
        ).toHaveBeenCalledWith(
            'loan-1',
            expect.objectContaining({
                signal: expect.any(
                    AbortSignal,
                ),
            }),
        )

        expect(
            queryClient.getQueryData(
                queryKeys.loans.detail('loan-1'),
            ),
        ).toEqual(loan)

        queryClient.clear()
    })

    it('does not fetch a loan when id is empty', async () => {
        mockGetLoan.mockClear()

        const {
            Wrapper,
        } = createWrapper()

        const { result } = renderHook(
            () => useLoan(''),
            {
                wrapper: Wrapper,
            },
        )

        expect(
            result.current.fetchStatus,
        ).toBe('idle')

        expect(
            mockGetLoan,
        ).not.toHaveBeenCalled()
    })

    it('updates a loan and refreshes loan queries', async () => {
        const loan = {
            id: 'loan-1',
            borrower: 'Corrected Name',
        } as LoanRead

        mockUpdateLoan.mockResolvedValueOnce(loan)

        const {
            Wrapper,
            queryClient,
        } = createWrapper()
        const invalidateQueries = vi.spyOn(
            queryClient,
            'invalidateQueries',
        )
        const { result } = renderHook(
            () => useUpdateLoan(),
            {
                wrapper: Wrapper,
            },
        )

        await result.current.mutateAsync({
            id: 'loan-1',
            update: {
                borrower: 'Corrected Name',
            },
        })

        expect(mockUpdateLoan).toHaveBeenCalledWith(
            'loan-1',
            {
                borrower: 'Corrected Name',
            },
        )
        expect(
            queryClient.getQueryData(
                queryKeys.loans.detail('loan-1'),
            ),
        ).toEqual(loan)
        expect(invalidateQueries).toHaveBeenCalledWith({
            queryKey: queryKeys.loans.all,
        })

        queryClient.clear()
    })

    it('loads dashboard with the shared dashboard query key', async () => {
        const dashboard =
            {} as DashboardSummary

        mockGetDashboard.mockResolvedValueOnce(
            dashboard,
        )

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const { result } = renderHook(
            () => useDashboard(),
            {
                wrapper: Wrapper,
            },
        )

        await waitFor(() =>
            expect(
                result.current.isSuccess,
            ).toBe(true),
        )

        expect(
            queryClient.getQueryData(
                queryKeys.dashboard.all,
            ),
        ).toEqual(dashboard)

        queryClient.clear()
    })

    it('loads dashboard breakdowns with the shared breakdowns query key', async () => {
        const breakdowns: DashboardBreakdowns = {
            total_albums: 0,
            albums_on_loan: 0,
            albums_by_media_format: [],
            albums_by_shelf: [],
            albums_by_creation_year: [],
            total_books: 542,
            on_loan: 7,
            by_category: [
                {
                    key: 'fiction',
                    count: 120,
                },
            ],
            by_shelf: [
                {
                    key: 'living_room',
                    count: 85,
                },
            ],
            by_creation_year: [
                {
                    key: '2026',
                    count: 42,
                },
            ],
        }

        mockGetDashboardBreakdowns
            .mockResolvedValueOnce(breakdowns)

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const { result } = renderHook(
            () => useDashboardBreakdowns(),
            {
                wrapper: Wrapper,
            },
        )

        await waitFor(() =>
            expect(
                result.current.isSuccess,
            ).toBe(true),
        )

        expect(
            mockGetDashboardBreakdowns,
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                signal: expect.any(
                    AbortSignal,
                ),
            }),
        )

        expect(
            queryClient.getQueryData(
                queryKeys.dashboard.breakdowns(),
            ),
        ).toEqual(breakdowns)

        queryClient.clear()
    })

    it('loads incomplete metadata with the shared query key', async () => {
        const incomplete:
            DashboardIncompleteMetadata = {
            total_incomplete: 12,
            missing_category: 2,
            missing_shelf: 3,
            missing_pages: 4,
            missing_publisher: 5,
            missing_year: 6,
            missing_isbn: 7,
        }

        mockGetIncompleteMetadata
            .mockResolvedValueOnce(incomplete)

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const { result } = renderHook(
            () =>
                useDashboardIncompleteMetadata(),
            {
                wrapper: Wrapper,
            },
        )

        await waitFor(() =>
            expect(
                result.current.isSuccess,
            ).toBe(true),
        )

        expect(
            mockGetIncompleteMetadata,
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                signal: expect.any(
                    AbortSignal,
                ),
            }),
        )

        expect(
            queryClient.getQueryData(
                queryKeys.dashboard
                    .incompleteMetadata(),
            ),
        ).toEqual(incomplete)

        queryClient.clear()
    })

    it('loads all incomplete metadata books without a field filter', async () => {
        const books: BookList = {
            items: [],
            total: 0,
        }

        mockListIncompleteMetadataBooks
            .mockResolvedValueOnce(books)

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const { result } = renderHook(
            () =>
                useInfiniteIncompleteMetadataBooks(),
            {
                wrapper: Wrapper,
            },
        )

        await waitFor(() =>
            expect(
                result.current.isSuccess,
            ).toBe(true),
        )

        expect(
            mockListIncompleteMetadataBooks,
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                field: undefined,
                skip: 0,
                take: 30,
            }),
            expect.objectContaining({
                signal: expect.any(
                    AbortSignal,
                ),
            }),
        )

        expect(
            queryClient.getQueryData(
                queryKeys.dashboard
                    .incompleteMetadataBooks({
                        take: 30,
                    }),
            ),
        ).toBeDefined()

        queryClient.clear()
    })

    it('uses a distinct incomplete-books query when filtered by field', async () => {
        const books: BookList = {
            items: [],
            total: 0,
        }

        mockListIncompleteMetadataBooks
            .mockResolvedValue(books)

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const allBooks = renderHook(
            () =>
                useInfiniteIncompleteMetadataBooks(),
            {
                wrapper: Wrapper,
            },
        )

        const isbnBooks = renderHook(
            () =>
                useInfiniteIncompleteMetadataBooks({
                    field: 'isbn',
                }),
            {
                wrapper: Wrapper,
            },
        )

        await waitFor(() =>
            expect(
                allBooks.result.current.isSuccess,
            ).toBe(true),
        )

        await waitFor(() =>
            expect(
                isbnBooks.result.current.isSuccess,
            ).toBe(true),
        )

        expect(
            mockListIncompleteMetadataBooks,
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                field: 'isbn',
                skip: 0,
                take: 30,
            }),
            expect.any(Object),
        )

        expect(
            queryClient.getQueryData(
                queryKeys.dashboard
                    .incompleteMetadataBooks({
                        take: 30,
                    }),
            ),
        ).toBeDefined()

        expect(
            queryClient.getQueryData(
                queryKeys.dashboard
                    .incompleteMetadataBooks({
                        field: 'isbn',
                        take: 30,
                    }),
            ),
        ).toBeDefined()

        queryClient.clear()
    })

    it('loads additional incomplete-book pages with chained skip values', async () => {
        const firstPage: BookList = {
            items: Array.from(
                {
                    length: 30,
                },
                (_, index) => ({
                    book_id: `book-${index}`,
                }),
            ) as BookList['items'],
            total: 40,
        }

        const secondPage: BookList = {
            items: Array.from(
                {
                    length: 10,
                },
                (_, index) => ({
                    book_id: `book-${index + 30}`,
                }),
            ) as BookList['items'],
            total: 40,
        }

        mockListIncompleteMetadataBooks
            .mockReset()

        mockListIncompleteMetadataBooks
            .mockImplementation(
                async (options) => {
                    if (options.skip === 0) {
                        return firstPage
                    }

                    if (options.skip === 30) {
                        return secondPage
                    }

                    throw new Error(
                        `Unexpected incomplete books skip: ${String(options.skip)}`,
                    )
                },
            )

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const { result } = renderHook(
            () =>
                useInfiniteIncompleteMetadataBooks(),
            {
                wrapper: Wrapper,
            },
        )

        await waitFor(() =>
            expect(
                result.current.isSuccess,
            ).toBe(true),
        )

        await waitFor(() =>
            expect(
                result.current.hasNextPage,
            ).toBe(true),
        )

        await result.current.fetchNextPage()

        await waitFor(() =>
            expect(
                result.current.data?.pages,
            ).toHaveLength(2),
        )

        expect(
            mockListIncompleteMetadataBooks,
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                skip: 0,
                take: 30,
            }),
            expect.any(Object),
        )

        expect(
            mockListIncompleteMetadataBooks,
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                skip: 30,
                take: 30,
            }),
            expect.any(Object),
        )

        queryClient.clear()
    })
})


it('retains typed loan filters across pages and keeps their caches separate', async () => {
    const { Wrapper, queryClient } = createWrapper()
    const first = { items: Array.from({ length: 30 }, (_, i) => ({
        id: `typed-loan-${i}`, book_id: 'book-1', album_id: null,
    })), total: 31 }
    const second = { items: [{ id: 'typed-loan-30', book_id: 'book-1', album_id: null }], total: 31 }
    mockListLoans.mockResolvedValueOnce(first).mockResolvedValueOnce(second)
    const { result } = renderHook(() => useInfiniteLoans({ mediaType: 'book' }), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    await result.current.fetchNextPage()
    expect(mockListLoans).toHaveBeenLastCalledWith(expect.objectContaining({
        mediaType: 'book', skip: 30, take: 30,
    }))
    expect(queryClient.getQueryData(queryKeys.loans.infiniteList({ mediaType: 'book', take: 30 })))
        .toMatchObject({ pages: [first, second] })
    expect(queryClient.getQueryData(queryKeys.loans.infiniteList({ mediaType: 'album', take: 30 })))
        .toBeUndefined()
    queryClient.clear()
})
