import {
    fireEvent,
    screen,
    within,
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
    renderWithProviders,
} from '../../../test/renderAppTree'
import {
    useDashboard,
    useDashboardBreakdowns,
    useDashboardIncompleteMetadata,
    useInfiniteIncompleteMetadataBooks,
} from '../../../api/dashboardQueries'

import type {
    DashboardSummary,
} from '../../../api/apiTypes'

const mockUseCollectionIsbnJump = vi.fn()

vi.mock('../../scanning/useCollectionIsbnJump', () => ({
    useCollectionIsbnJump: () =>
        mockUseCollectionIsbnJump(),
}))

vi.mock('../../../api/dashboardQueries', () => ({
    useDashboard: vi.fn(),
    useDashboardBreakdowns: vi.fn(),
    useDashboardIncompleteMetadata: vi.fn(),
    useInfiniteIncompleteMetadataBooks: vi.fn(),
}))

const dashboardFixture: DashboardSummary = {
    stash_count: 0,
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

const breakdownsFixture = {
    total_books: 542,
    on_loan: 7,
    by_category: [
        {
            key: 'fiction',
            count: 120,
        },
        {
            key: 'nonfiction',
            count: 98,
        },
    ],
    by_shelf: [
        {
            key: 'a1',
            count: 54,
        },
        {
            key: 'b2',
            count: 43,
        },
    ],
    by_creation_year: [
        {
            key: '2026',
            count: 42,
        },
        {
            key: '2025',
            count: 31,
        },
    ],
}

const incompleteMetadataFixture = {
    total_incomplete: 12,
    missing_category: 2,
    missing_shelf: 3,
    missing_pages: 4,
    missing_publisher: 5,
    missing_year: 6,
    missing_isbn: 7,
}

const incompleteBooksFixture = {
    pages: [
        {
            items: [
                {
                    id: 'book-1',
                    title: 'Incomplete Book',
                    authors: 'Example Author',
                },
            ],
            total: 1,
        },
    ],
    pageParams: [
        0,
    ],
}

type IncompleteBooksQuery =
    ReturnType<typeof useInfiniteIncompleteMetadataBooks>

function mockIncompleteBooksQuery(
    overrides: Partial<IncompleteBooksQuery> = {},
) {
    vi.mocked(
        useInfiniteIncompleteMetadataBooks,
    ).mockReturnValue({
        data: incompleteBooksFixture,
        error: null,
        isPending: false,
        isLoadingError: false,
        isFetchingNextPage: false,
        isFetchNextPageError: false,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        refetch: vi.fn(),
        ...overrides,
    } as unknown as IncompleteBooksQuery)
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

type DashboardBreakdownsQuery =
    ReturnType<typeof useDashboardBreakdowns>

function mockDashboardBreakdownsQuery(
    overrides: Partial<DashboardBreakdownsQuery> = {},
) {
    vi.mocked(
        useDashboardBreakdowns,
    ).mockReturnValue({
        data: breakdownsFixture,
        error: null,
        isPending: false,
        isLoadingError: false,
        isFetching: false,
        isRefetchError: false,
        isStale: false,
        fetchStatus: 'idle',
        refetch: vi.fn(),
        ...overrides,
    } as unknown as DashboardBreakdownsQuery)
}

type DashboardIncompleteMetadataQuery =
    ReturnType<typeof useDashboardIncompleteMetadata>

function mockDashboardIncompleteMetadataQuery(
    overrides: Partial<DashboardIncompleteMetadataQuery> = {},
) {
    vi.mocked(
        useDashboardIncompleteMetadata,
    ).mockReturnValue({
        data: incompleteMetadataFixture,
        error: null,
        isPending: false,
        isLoadingError: false,
        isFetching: false,
        isRefetchError: false,
        isStale: false,
        fetchStatus: 'idle',
        refetch: vi.fn(),
        ...overrides,
    } as unknown as DashboardIncompleteMetadataQuery)
}

function renderDashboard() {
    return renderWithProviders(
        <MemoryRouter>
            <DashboardPage />
        </MemoryRouter>,
    )
}

describe('DashboardPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockDashboardQuery()
        mockDashboardBreakdownsQuery()
        mockDashboardIncompleteMetadataQuery()
        mockIncompleteBooksQuery()
        mockUseCollectionIsbnJump.mockReset()
    })

    it('displays every dashboard business statistic from the API', () => {
        renderDashboard()

        expect(
            screen.getByRole('heading', {
                level: 1,
                name: 'Dashboard',
            }),
        ).toBeInTheDocument()

        const collectionDrawer = screen
            .getByRole('heading', {
                name: 'Collection',
            })
            .closest('section')

        expect(collectionDrawer).not.toBeNull()

        expect(
            within(collectionDrawer!).getByText(
                'Total Books',
            ),
        ).toBeInTheDocument()
        expect(
            within(collectionDrawer!).getByText('542'),
        ).toBeInTheDocument()

        expect(
            within(collectionDrawer!).getByText(
                'Checked Out Books',
            ),
        ).toBeInTheDocument()
        expect(
            within(collectionDrawer!).getByText('7'),
        ).toBeInTheDocument()

        expect(
            within(collectionDrawer!).getByText(
                'Added in the last 30 days',
            ),
        ).toBeInTheDocument()
        expect(
            within(collectionDrawer!).getByText('12'),
        ).toBeInTheDocument()

        const circulationDrawer = screen
            .getByRole('heading', {
                name: 'Circulation',
            })
            .closest('section')

        expect(circulationDrawer).not.toBeNull()

        expect(
            within(circulationDrawer!).getByText(
                'Active Loan Records',
            ),
        ).toBeInTheDocument()
        expect(
            within(circulationDrawer!).getByText('6'),
        ).toBeInTheDocument()

        expect(
            within(circulationDrawer!).getByText(
                'Lifetime Loans',
            ),
        ).toBeInTheDocument()
        expect(
            within(circulationDrawer!).getByText('84'),
        ).toBeInTheDocument()

        expect(
            within(circulationDrawer!).getByText(
                '18.5 days',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Books Read'),
        ).toBeInTheDocument()
        expect(
            screen.getByText('Books Read').closest('.dashboard-metric'),
        ).toHaveTextContent('318')

        expect(
            screen.getByText('Books Unread'),
        ).toBeInTheDocument()
        expect(
            screen.getByText('Books Unread').closest('.dashboard-metric'),
        ).toHaveTextContent('224')

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
                stash_count: 0,
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

        const collectionDrawer = screen
            .getByRole('heading', {
                name: 'Collection',
            })
            .closest('section')

        expect(collectionDrawer).not.toBeNull()

        expect(
            within(collectionDrawer!).getByText(
                'Total Books',
            ),
        ).toBeInTheDocument()
        expect(
            within(collectionDrawer!)
                .getByText('Total Books')
                .closest('.dashboard-metric'),
        ).toHaveTextContent('0')

        expect(
            screen.getByText('Checked Out Books').closest('.dashboard-metric'),
        ).toHaveTextContent('0')

        expect(
            screen.getByText(
                'Added in the last 30 days',
            ).closest('.dashboard-metric'),
        ).toHaveTextContent('0')

        expect(
            screen.getByText('Active Loan Records').closest('.dashboard-metric'),
        ).toHaveTextContent('0')

        expect(
            screen.getByText('Lifetime Loans').closest('.dashboard-metric'),
        ).toHaveTextContent('0')

        expect(
            screen.getByText('Books Read').closest('.dashboard-metric'),
        ).toHaveTextContent('0')

        expect(
            screen.getByText('Books Unread').closest('.dashboard-metric'),
        ).toHaveTextContent('0')

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

        const readLinks = screen.getAllByRole(
            'link',
            { name: '318' },
        )

        expect(readLinks).toHaveLength(2)

        for (const link of readLinks) {
            expect(link).toHaveAttribute(
                'href',
                '/books?is_read=true',
            )
        }

        const unreadLinks = screen.getAllByRole(
            'link',
            { name: '224' },
        )

        expect(unreadLinks).toHaveLength(2)

        for (const link of unreadLinks) {
            expect(link).toHaveAttribute(
                'href',
                '/books?is_read=false',
            )
        }

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            'Dashboard data is inconsistent.',
        )

        expect(
            screen.getByText('Books Read').closest('.dashboard-metric'),
        ).toHaveTextContent('318')

        expect(
            screen.getByText('Books Unread').closest('.dashboard-metric'),
        ).toHaveTextContent('224')

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

        const collectionDrawer = screen
            .getByRole('heading', {
                name: 'Collection',
            })
            .closest('section')

        expect(collectionDrawer).not.toBeNull()

        expect(
            within(collectionDrawer!).getByText('542'),
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

        const collectionDrawer = screen
            .getByRole('heading', {
                name: 'Collection',
            })
            .closest('section')

        expect(collectionDrawer).not.toBeNull()


        expect(
            within(collectionDrawer!).getByText('542'),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Retry',
            }),
        )

        expect(refetch).toHaveBeenCalledOnce()
    })

    it('links only to existing routes that preserve the statistic meaning', () => {
        renderDashboard()

        expect(
            screen.getByRole('link', {
                name: '542 total books — browse collection',
            }),
        ).toHaveAttribute(
            'href',
            '/books',
        )

        expect(
            screen.getByRole('link', {
                name: '6 active loan records — view loans',
            }),
        ).toHaveAttribute(
            'href',
            '/loans',
        )

        expect(
            screen.getByRole('link', {
                name: '84 lifetime loans — view loan history',
            }),
        ).toHaveAttribute(
            'href',
            '/loans',
        )
    })

    it('renders dashboard breakdown totals and buckets from the API', () => {
        renderDashboard()

        const basicStatsDrawer = screen
            .getByRole('heading', {
                name: 'Basic Stats',
            })
            .closest('section')

        expect(basicStatsDrawer).not.toBeNull()

        expect(
            within(basicStatsDrawer!).getByText(
                'Total Books',
            ),
        ).toBeInTheDocument()

        expect(
            within(basicStatsDrawer!).getByText('542'),
        ).toBeInTheDocument()

        expect(
            within(basicStatsDrawer!).getByText(
                'On Loan',
            ),
        ).toBeInTheDocument()

        expect(
            within(basicStatsDrawer!).getByText('7'),
        ).toBeInTheDocument()

        expect(
            within(basicStatsDrawer!).getByText(
                'By Category',
            ),
        ).toBeInTheDocument()

        expect(
            within(basicStatsDrawer!).getByText(
                'fiction',
            ),
        ).toBeInTheDocument()

        expect(
            within(basicStatsDrawer!).getByText(
                '120',
            ),
        ).toBeInTheDocument()

        expect(
            within(basicStatsDrawer!).getByText(
                '218',
            ),
        ).toBeInTheDocument()

        expect(
            within(basicStatsDrawer!).getByText(
                'assignments',
            ),
        ).toBeInTheDocument()

        expect(
            within(basicStatsDrawer!).queryByText(
                'By Creation Year',
            ),
        ).not.toBeInTheDocument()
    })

    it('does not invent missing category breakdown buckets', () => {
        mockDashboardBreakdownsQuery({
            data: {
                total_books: 10,
                on_loan: 1,
                by_category: [
                    {
                        key: 'fiction',
                        count: 10,
                    },
                ],
                by_shelf: [],
                by_creation_year: [],
            },
        })

        renderDashboard()

        const basicStatsDrawer = screen
            .getByRole('heading', {
                name: 'Basic Stats',
            })
            .closest('section')

        expect(basicStatsDrawer).not.toBeNull()

        expect(
            within(basicStatsDrawer!).getByText(
                'fiction',
            ),
        ).toBeInTheDocument()

        expect(
            within(basicStatsDrawer!).queryByText(
                'nonfiction',
            ),
        ).not.toBeInTheDocument()

        expect(
            within(basicStatsDrawer!).getByText(
                'fiction',
            ),
        ).toBeInTheDocument()

        expect(
            within(basicStatsDrawer!).queryByText(
                'nonfiction',
            ),
        ).not.toBeInTheDocument()

        expect(
            within(basicStatsDrawer!).queryByText(
                'By Creation Year',
            ),
        ).not.toBeInTheDocument()
    })

    it('shows a retryable drawer-level breakdown error without hiding summary statistics', () => {
        const refetch = vi.fn()

        mockDashboardBreakdownsQuery({
            data: undefined,
            error: new Error(
                'Breakdowns failed',
            ),
            isPending: false,
            isLoadingError: true,
            refetch,
        })

        renderDashboard()

        expect(
            screen.getByRole('heading', {
                name: 'Collection',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('heading', {
                name: 'Reading Record',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'Unable to load collection breakdowns',
            ),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Retry',
            }),
        )

        expect(refetch).toHaveBeenCalledTimes(1)
    })

    it('renders incomplete metadata counts without summing them into the total', () => {
        renderDashboard()

        const healingDrawer = screen
            .getByRole('heading', {
                name: 'Healing Metadata',
            })
            .closest('section')

        const healingCounts =
            healingDrawer!.querySelector<HTMLElement>(
                '.dashboard-healing__counts',
            )

        expect(healingCounts).not.toBeNull()

        expect(
            within(healingDrawer!).getByText(
                'Books needing metadata',
            ),
        ).toBeInTheDocument()

        expect(
            within(healingDrawer!).getByText('12'),
        ).toBeInTheDocument()

        expect(
            within(healingCounts!).getByText(
                'Category',
            ),
        ).toBeInTheDocument()

        expect(
            within(healingCounts!).getByText('2'),
        ).toBeInTheDocument()

        expect(
            within(healingCounts!).getByText(
                'Shelf',
            ),
        ).toBeInTheDocument()

        expect(
            within(healingCounts!).getByText('3'),
        ).toBeInTheDocument()

        expect(
            within(healingCounts!).getByText(
                'Pages',
            ),
        ).toBeInTheDocument()

        expect(
            within(healingCounts!).getByText('4'),
        ).toBeInTheDocument()

        expect(
            within(healingCounts!).getByText(
                'Publisher',
            ),
        ).toBeInTheDocument()

        expect(
            within(healingCounts!).getByText('5'),
        ).toBeInTheDocument()

        expect(
            within(healingCounts!).getByText(
                'Publication Year',
            ),
        ).toBeInTheDocument()

        expect(
            within(healingCounts!).getByText('6'),
        ).toBeInTheDocument()

        expect(
            within(healingCounts!).getByText(
                'ISBN',
            ),
        ).toBeInTheDocument()

        expect(
            within(healingCounts!).getByText('7'),
        ).toBeInTheDocument()

        expect(
            within(healingCounts!).getByRole(
                'link',
                { name: '2' },
            ),
        ).toHaveAttribute(
            'href',
            '/books?cleanup_field=category',
        )

        expect(
            within(healingCounts!).getByRole(
                'link',
                { name: '3' },
            ),
        ).toHaveAttribute(
            'href',
            '/books?cleanup_field=shelf',
        )

        expect(
            within(healingCounts!).getByRole(
                'link',
                { name: '4' },
            ),
        ).toHaveAttribute(
            'href',
            '/books?cleanup_field=pages',
        )

        expect(
            within(healingCounts!).getByRole(
                'link',
                { name: '5' },
            ),
        ).toHaveAttribute(
            'href',
            '/books?cleanup_field=publisher',
        )

        expect(
            within(healingCounts!).getByRole(
                'link',
                { name: '6' },
            ),
        ).toHaveAttribute(
            'href',
            '/books?cleanup_field=year',
        )

        expect(
            within(healingCounts!).getByRole(
                'link',
                { name: '7' },
            ),
        ).toHaveAttribute(
            'href',
            '/books?cleanup_field=isbn',
        )

        expect(
            within(healingDrawer!).getByText(
                /these counts do not add up to the total above/i,
            ),
        ).toBeInTheDocument()
    })

    it('shows a positive empty state when no active books need metadata cleanup', () => {
        mockDashboardIncompleteMetadataQuery({
            data: {
                total_incomplete: 0,
                missing_category: 0,
                missing_shelf: 0,
                missing_pages: 0,
                missing_publisher: 0,
                missing_year: 0,
                missing_isbn: 0,
            },
        })

        renderDashboard()

        const healingDrawer = screen
            .getByRole('heading', {
                name: 'Healing Metadata',
            })
            .closest('section')

        expect(healingDrawer).not.toBeNull()

        expect(
            within(healingDrawer!).getByText(
                'Catalog metadata is complete.',
            ),
        ).toBeInTheDocument()

        expect(
            within(healingDrawer!).getByText(
                'No active books currently need metadata cleanup.',
            ),
        ).toBeInTheDocument()
    })

    it('shows a retryable drawer-level incomplete metadata error without hiding other dashboard drawers', () => {
        const refetch = vi.fn()

        mockDashboardIncompleteMetadataQuery({
            data: undefined,
            error: new Error(
                'Incomplete metadata failed',
            ),
            isPending: false,
            isLoadingError: true,
            refetch,
        })

        renderDashboard()

        expect(
            screen.getByRole('heading', {
                name: 'Collection',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('heading', {
                name: 'Basic Stats',
            }),
        ).toBeInTheDocument()

        const healingDrawer = screen
            .getByRole('heading', {
                name: 'Healing Metadata',
            })
            .closest('section')

        expect(healingDrawer).not.toBeNull()

        expect(
            within(healingDrawer!).getByText(
                'Unable to load metadata cleanup counts',
            ),
        ).toBeInTheDocument()

        fireEvent.click(
            within(healingDrawer!).getByRole(
                'button',
                {
                    name: 'Retry',
                },
            ),
        )

        expect(refetch).toHaveBeenCalledTimes(1)
    })

    it('shows a loading state only inside the healing drawer while incomplete metadata loads', () => {
        mockDashboardIncompleteMetadataQuery({
            data: undefined,
            isPending: true,
        })

        renderDashboard()

        expect(
            screen.getByRole('heading', {
                name: 'Collection',
            }),
        ).toBeInTheDocument()

        const healingDrawer = screen
            .getByRole('heading', {
                name: 'Healing Metadata',
            })
            .closest('section')

        expect(healingDrawer).not.toBeNull()

        expect(
            within(healingDrawer!).getByText(
                'Loading metadata cleanup counts…',
            ),
        ).toBeInTheDocument()
    })

    it('mounts collection ISBN scanning on the dashboard', () => {
        renderDashboard()

        expect(
            mockUseCollectionIsbnJump,
        ).toHaveBeenCalled()
    })

    it('keeps collection ISBN scanning mounted while the dashboard is loading', () => {
        mockDashboardQuery({
            data: undefined,
            isPending: true,
        })

        renderDashboard()

        expect(
            mockUseCollectionIsbnJump,
        ).toHaveBeenCalled()
    })
})
