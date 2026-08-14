import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import { DashboardPage } from './DashboardPage'

import {
    useDashboard,
} from '../../../api/dashboardQueries'

import type {
    DashboardSummary,
} from '../../../api/apiTypes'

vi.mock('../../../api/dashboardQueries', () => ({
    useDashboard: vi.fn(),
}))

const dashboardFixture: DashboardSummary = {
    total_books: 542,
    checked_out: 7,
    read: 318,
    unread: 224,
    recently_added: 12,
    recent_window_days: 30,
    borrowing: {
        active_loans: 6,
        lifetime_loans: 84,
        average_loan_days: 18.5,
    },
    reading: {
        books_read: 318,
        books_unread: 224,
        average_rating: 4.2,
    },
}

type DashboardQuery =
    ReturnType<typeof useDashboard>

function mockDashboardQuery(
    overrides: Partial<DashboardQuery> = {},
) {
    vi.mocked(useDashboard).mockReturnValue({
        data: dashboardFixture,
        error: null,
        isPending: false,
        isLoadingError: false,
        isFetching: false,
        isRefetchError: false,
        isStale: false,
        fetchStatus: 'idle',
        refetch: vi.fn(),
        ...overrides,
    } as unknown as DashboardQuery)
}

function renderDashboard() {
    return render(
        <MemoryRouter>
            <DashboardPage />
        </MemoryRouter>,
    )
}

describe('DashboardPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockDashboardQuery()
    })

    it('displays every dashboard business statistic from the API', () => {
        renderDashboard()

        expect(
            screen.getByRole('heading', {
                level: 1,
                name: 'Dashboard',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Total Books'),
        ).toBeInTheDocument()
        expect(
            screen.getByText('542'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Checked Out Books'),
        ).toBeInTheDocument()
        expect(
            screen.getByText('7'),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'Added in the last 30 days',
            ),
        ).toBeInTheDocument()
        expect(
            screen.getByText('12'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Active Loan Records'),
        ).toBeInTheDocument()
        expect(
            screen.getByText('6'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Lifetime Loans'),
        ).toBeInTheDocument()
        expect(
            screen.getByText('84'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('18.5 days'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Books Read'),
        ).toBeInTheDocument()
        expect(
            screen.getByText('318'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Books Unread'),
        ).toBeInTheDocument()
        expect(
            screen.getByText('224'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('4.2 / 5'),
        ).toBeInTheDocument()
    })

    it('uses the API-provided recent window instead of a hardcoded value', () => {
        mockDashboardQuery({
            data: {
                ...dashboardFixture,
                recently_added: 3,
                recent_window_days: 14,
            },
        })

        renderDashboard()

        expect(
            screen.getByText(
                'Added in the last 14 days',
            ),
        ).toBeInTheDocument()

        expect(
            screen.queryByText(
                'Added in the last 30 days',
            ),
        ).not.toBeInTheDocument()
    })

    it('treats an all-zero dashboard as valid data', () => {
        mockDashboardQuery({
            data: {
                total_books: 0,
                checked_out: 0,
                read: 0,
                unread: 0,
                recently_added: 0,
                recent_window_days: 30,
                borrowing: {
                    active_loans: 0,
                    lifetime_loans: 0,
                    average_loan_days: null,
                },
                reading: {
                    books_read: 0,
                    books_unread: 0,
                    average_rating: null,
                },
            },
        })

        renderDashboard()

        expect(
            screen.getByText('Total Books'),
        ).toBeInTheDocument()

        expect(
            screen.getAllByText('0'),
        ).toHaveLength(7)

        expect(
            screen.queryByText(
                /library is empty/i,
            ),
        ).not.toBeInTheDocument()
    })

    it('displays Not enough data for null averages', () => {
        mockDashboardQuery({
            data: {
                ...dashboardFixture,
                borrowing: {
                    ...dashboardFixture.borrowing,
                    average_loan_days: null,
                },
                reading: {
                    ...dashboardFixture.reading,
                    average_rating: null,
                },
            },
        })

        renderDashboard()

        expect(
            screen.getAllByText('Not enough data'),
        ).toHaveLength(2)

        expect(
            screen.queryByText('0 days'),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByText('0 / 5'),
        ).not.toBeInTheDocument()
    })

    it('keeps checked-out books and active loan records visibly distinct', () => {
        mockDashboardQuery({
            data: {
                ...dashboardFixture,
                checked_out: 9,
                borrowing: {
                    ...dashboardFixture.borrowing,
                    active_loans: 4,
                },
            },
        })

        renderDashboard()

        const checkedOutLabel =
            screen.getByText('Checked Out Books')
        const activeLoansLabel =
            screen.getByText('Active Loan Records')

        expect(
            checkedOutLabel.parentElement,
        ).toHaveTextContent('9')

        expect(
            activeLoansLabel.parentElement,
        ).toHaveTextContent('4')

        expect(
            screen.getByText(
                /current catalog status is on loan/i,
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                /open borrowing records/i,
            ),
        ).toBeInTheDocument()
    })

    it('uses the chosen top-level read and unread counts when duplicate API fields disagree', () => {
        mockDashboardQuery({
            data: {
                ...dashboardFixture,
                read: 318,
                unread: 224,
                reading: {
                    ...dashboardFixture.reading,
                    books_read: 999,
                    books_unread: 888,
                },
            },
        })

        renderDashboard()

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            'Dashboard data is inconsistent.',
        )

        expect(
            screen.getByText('318'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('224'),
        ).toBeInTheDocument()

        expect(
            screen.queryByText('999'),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByText('888'),
        ).not.toBeInTheDocument()
    })

    it('shows the loading state without rendering dashboard statistics', () => {
        mockDashboardQuery({
            data: undefined,
            isPending: true,
        })

        renderDashboard()

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'Loading dashboard…',
        )

        expect(
            screen.queryByText('Total Books'),
        ).not.toBeInTheDocument()
    })

    it('shows an explicit offline state when no dashboard data is available', () => {
        const refetch = vi.fn()

        mockDashboardQuery({
            data: undefined,
            isPending: true,
            fetchStatus: 'paused',
            refetch,
        })

        renderDashboard()

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'Dashboard unavailable offline',
        )

        expect(
            screen.getByText(
                /connect to the network/i,
            ),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Retry',
            }),
        )

        expect(refetch).toHaveBeenCalledOnce()
    })

    it('keeps cached statistics visible when offline', () => {
        mockDashboardQuery({
            fetchStatus: 'paused',
            isStale: true,
        })

        renderDashboard()

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'Offline. Showing the last available dashboard data.',
        )

        expect(
            screen.getByText('542'),
        ).toBeInTheDocument()
    })

    it('marks cached dashboard data as stale without hiding it', () => {
        mockDashboardQuery({
            isStale: true,
        })

        renderDashboard()

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'Dashboard data may be out of date.',
        )

        expect(
            screen.getByText('542'),
        ).toBeInTheDocument()
    })

    it('shows a retryable initial query failure', () => {
        const refetch = vi.fn()

        mockDashboardQuery({
            data: undefined,
            error: new Error(
                'Internal Server Error',
            ),
            isLoadingError: true,
            refetch,
        })

        renderDashboard()

        expect(
            screen.getByText(
                'Unable to load dashboard',
            ),
        ).toBeInTheDocument()

        const retryButton =
            screen.getByRole('button', {
                name: 'Retry',
            })

        fireEvent.click(retryButton)

        expect(refetch).toHaveBeenCalledOnce()
    })

    it('keeps stale statistics visible when a refresh fails', () => {
        const refetch = vi.fn()

        mockDashboardQuery({
            error: new Error(
                'Internal Server Error',
            ),
            isRefetchError: true,
            isStale: true,
            refetch,
        })

        renderDashboard()

        expect(
            screen.getByText(
                'Unable to refresh dashboard',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText('542'),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Retry',
            }),
        )

        expect(refetch).toHaveBeenCalledOnce()
    })

    it('allows the user to explicitly refresh the dashboard', () => {
        const refetch = vi.fn()

        mockDashboardQuery({
            refetch,
        })

        renderDashboard()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Refresh',
            }),
        )

        expect(refetch).toHaveBeenCalledOnce()
    })

    it('disables explicit refresh while a request is already in progress', () => {
        mockDashboardQuery({
            isFetching: true,
        })

        renderDashboard()

        expect(
            screen.getByRole('button', {
                name: 'Refreshing…',
            }),
        ).toBeDisabled()

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'Refreshing dashboard…',
        )
    })

    it('links only to existing routes that preserve the statistic meaning', () => {
        renderDashboard()

        expect(
            screen.getByRole('link', {
                name: 'Browse collection',
            }),
        ).toHaveAttribute(
            'href',
            '/books',
        )

        expect(
            screen.getByRole('link', {
                name: 'View loan history',
            }),
        ).toHaveAttribute(
            'href',
            '/loans',
        )
    })
})
