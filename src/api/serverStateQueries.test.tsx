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
} from './apiTypes'
import {
    useDashboard,
} from './dashboardQueries'
import {
    useLoans,
} from './loansQueries'
import {
    queryKeys,
} from './queryKeys'

const mockListLoans = vi.fn()
const mockGetDashboard = vi.fn()

vi.mock('./loansApi', () => ({
    createLoansApi: () => ({
        list: mockListLoans,
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
            queryClient.getQueryData(
                queryKeys.loans.all,
            ),
        ).toEqual(loans)

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
})
