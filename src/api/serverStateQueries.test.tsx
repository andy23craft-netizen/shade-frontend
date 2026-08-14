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
    DashboardSummary,
    LoanList,
    LoanRead,
} from './apiTypes'
import {
    useDashboard,
} from './dashboardQueries'
import {
    useLoan,
    useLoans,
    useInfiniteLoans,
} from './loansQueries'
import {
    queryKeys,
} from './queryKeys'

const mockListLoans = vi.fn()
const mockGetLoan = vi.fn()
const mockGetDashboard = vi.fn()

vi.mock('./loansApi', () => ({
    createLoansApi: () => ({
        list: mockListLoans,
        get: mockGetLoan,
    }),
}))

vi.mock('./dashboardApi', () => ({
    createDashboardApi: () => ({
        get: mockGetDashboard,
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
})
