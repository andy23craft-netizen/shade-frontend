import {
    type CSSProperties,
} from 'react'

import {
    useDashboard,
    useDashboardBreakdowns,
    useDashboardIncompleteMetadata,
} from '../../../api/dashboardQueries'

import {
    Alert,
    AppLink,
    Button,
    LoadingState,
    QueryErrorState,
} from '../../../components'
import {
    useCollectionIsbnJump,
} from '../../scanning/useCollectionIsbnJump'


function displayAverage(
    value: number | null,
    suffix = '',
): string {
    if (value === null) {
        return 'Not enough data'
    }

    return `${value.toFixed(1)}${suffix}`
}

const CATEGORY_CHART_COLORS = [
    'var(--category-chart-1, #6f4436)',
    'var(--category-chart-2, #8b6748)',
    'var(--category-chart-3, #4f6652)',
    'var(--category-chart-4, #7b5e70)',
    'var(--category-chart-5, #9a824f)',
    'var(--category-chart-6, #526d78)',
    'var(--category-chart-7, #82604a)',
    'var(--category-chart-8, #887f73)',
] as const

function categoryChartBuckets(
    buckets: {
        key: string
        count: number
    }[],
) {
    const sorted = [...buckets].sort(
        (left, right) =>
            right.count - left.count,
    )

    const top = sorted.slice(0, 7)
    const otherCount = sorted
        .slice(7)
        .reduce(
            (total, bucket) =>
                total + bucket.count,
            0,
        )

    return otherCount > 0
        ? [
            ...top,
            {
                key: 'Other',
                count: otherCount,
            },
        ]
        : top
}

function categoryChartGradient(
    buckets: {
        key: string
        count: number
    }[],
): string {
    const total = buckets.reduce(
        (sum, bucket) =>
            sum + bucket.count,
        0,
    )

    if (total === 0) {
        return 'var(--color-surface-muted)'
    }

    let start = 0
    const stops: string[] = []

    buckets.forEach((bucket, index) => {
        const end =
            start +
            (bucket.count / total) * 100

        const color =
            CATEGORY_CHART_COLORS[index] ??
            CATEGORY_CHART_COLORS[
            CATEGORY_CHART_COLORS.length - 1
                ]

        stops.push(
            `${color} ${start}%`,
            `${color} ${end}%`,
        )

        start = end
    })

    return `conic-gradient(${stops.join(', ')})`
}

export function DashboardPage() {
    useCollectionIsbnJump()

    const dashboardQuery = useDashboard()
    const breakdownsQuery =
        useDashboardBreakdowns()
    const incompleteMetadataQuery =
        useDashboardIncompleteMetadata()


    const isDashboardRefreshing =
        dashboardQuery.isFetching ||
        breakdownsQuery.isFetching ||
        incompleteMetadataQuery.isFetching

    function refreshDashboard() {
        void Promise.all([
            dashboardQuery.refetch(),
            breakdownsQuery.refetch(),
            incompleteMetadataQuery.refetch(),
        ])
    }

    if (
        dashboardQuery.isPending &&
        dashboardQuery.fetchStatus === 'paused'
    ) {
        return (
            <section className="route-page">
                <h1 tabIndex={-1}>Dashboard</h1>

                <Alert
                    variant="warning"
                    title="Dashboard unavailable offline"
                >
                    Connect to the network to load dashboard
                    statistics.
                </Alert>

                <Button
                    type="button"
                    onClick={() => {
                        void dashboardQuery.refetch()
                    }}
                >
                    Retry
                </Button>
            </section>
        )
    }

    if (dashboardQuery.isPending) {
        return (
            <section className="route-page">
                <h1 tabIndex={-1}>Dashboard</h1>
                <LoadingState label="Loading dashboard…" />
            </section>
        )
    }

    if (dashboardQuery.isLoadingError) {
        return (
            <section className="route-page">
                <h1 tabIndex={-1}>Dashboard</h1>

                <QueryErrorState
                    title="Unable to load dashboard"
                    error={dashboardQuery.error}
                    onRetry={() => {
                        void dashboardQuery.refetch()
                    }}
                />
            </section>
        )
    }

    const dashboard = dashboardQuery.data

    const readingCountsMatch =
        dashboard.read === dashboard.reading.books_read &&
        dashboard.unread === dashboard.reading.books_unread

    const readingTotal = dashboard.read + dashboard.unread

    const percentageRead =
        readingTotal === 0
            ? 0
            : (dashboard.read / readingTotal) * 100

    const categoryBuckets =
        categoryChartBuckets(
            breakdownsQuery.data?.by_category ??
            [],
        )
    const categoryAssignmentTotal =
        categoryBuckets.reduce(
            (total, bucket) =>
                total + bucket.count,
            0,
        )

    return (
        <section className="route-page dashboard-page">
            <header className="dashboard-page__heading">
                <div>
                    <p className="dashboard-page__eyebrow">
                        Shade Library
                    </p>

                    <h1 tabIndex={-1}>
                        Dashboard
                    </h1>

                    <p>
                        The library at a glance.
                    </p>
                </div>

                <Button
                    type="button"
                    variant="secondary"
                    disabled={isDashboardRefreshing}
                    onClick={refreshDashboard}
                >
                    {isDashboardRefreshing
                        ? 'Refreshing…'
                        : 'Refresh'}
                </Button>
            </header>

            {dashboardQuery.isRefetchError ? (
                <QueryErrorState
                    title="Unable to refresh dashboard"
                    error={dashboardQuery.error}
                    onRetry={() => {
                        void dashboardQuery.refetch()
                    }}
                />
            ) : null}

            {dashboardQuery.fetchStatus === 'paused' ? (
                <p
                    className="dashboard-page__refresh-status"
                    role="status"
                    aria-live="polite"
                >
                    Offline. Showing the last available dashboard
                    data.
                </p>
            ) : isDashboardRefreshing &&
            !dashboardQuery.isRefetchError ? (
                <p
                    className="dashboard-page__refresh-status"
                    role="status"
                    aria-live="polite"
                >
                    Refreshing dashboard…
                </p>
            ) : dashboardQuery.isStale ? (
                <p
                    className="dashboard-page__refresh-status"
                    role="status"
                    aria-live="polite"
                >
                    Dashboard data may be out of date.
                </p>
            ) : null}

            {!readingCountsMatch ? (
                <div
                    className="dashboard-page__contract-warning"
                    role="alert"
                >
                    <strong>
                        Dashboard data is inconsistent.
                    </strong>{' '}
                    Reading totals reported by the API do not
                    match. The displayed totals have not been
                    recalculated.
                </div>
            ) : null}

            <div className="dashboard-drawer-bank">
                <section
                    className="dashboard-drawer"
                    aria-labelledby="dashboard-collection-heading"
                >

                    <header className="dashboard-drawer__heading">
                        <span
                            className="dashboard-drawer__index"
                            aria-hidden="true"
                        >
                            I
                        </span>

                        <h2 id="dashboard-collection-heading">
                            Collection
                        </h2>

                        <p>
                            The books currently held in the library.
                        </p>
                    </header>

                    <dl className="dashboard-metrics">
                        <div className="dashboard-metric">
                            <dt>Total Books</dt>
                            <dd>{dashboard.total_books}</dd>

                            <dd className="dashboard-metric__description">
                                <AppLink to="/books">
                                    Browse collection
                                </AppLink>
                            </dd>
                        </div>

                        <div className="dashboard-metric">
                            <dt>Checked Out Books</dt>
                            <dd>{dashboard.checked_out}</dd>

                            <dd className="dashboard-metric__description">
                                Books whose current catalog status is on loan.
                            </dd>
                        </div>

                        <div className="dashboard-metric">
                            <dt>
                                Added in the last{' '}
                                {dashboard.recent_window_days}{' '}
                                days
                            </dt>

                            <dd>{dashboard.recently_added}</dd>

                            <dd className="dashboard-metric__description">
                                Recent additions reported by the library.
                            </dd>
                        </div>
                    </dl>

                    <div
                        className="dashboard-drawer__pull"
                        aria-hidden="true"
                    />
                </section>

                <section
                    className="dashboard-drawer"
                    aria-labelledby="dashboard-circulation-heading"
                >
                    <header className="dashboard-drawer__heading">
        <span
            className="dashboard-drawer__index"
            aria-hidden="true"
        >
            II
        </span>

                        <h2 id="dashboard-circulation-heading">
                            Circulation
                        </h2>

                        <p>
                            The lending record of the library.
                        </p>
                    </header>

                    <dl className="dashboard-metrics">
                        <div className="dashboard-metric">
                            <dt>Active Loan Records</dt>

                            <dd>
                                {dashboard.borrowing.active_loans}
                            </dd>

                            <dd className="dashboard-metric__description">
                                Open borrowing records, kept distinct from book status.
                            </dd>
                        </div>

                        <div className="dashboard-metric">
                            <dt>Lifetime Loans</dt>

                            <dd>
                                {dashboard.borrowing.lifetime_loans}
                            </dd>

                            <dd className="dashboard-metric__description">
                                <AppLink to="/loans">
                                    View loan history
                                </AppLink>
                            </dd>
                        </div>

                        <div className="dashboard-metric">
                            <dt>Average Loan Length</dt>

                            <dd>
                                {displayAverage(
                                    dashboard.borrowing.average_loan_days,
                                    ' days',
                                )}
                            </dd>

                            <dd className="dashboard-metric__description">
                                Based on returned loans recorded by the library.
                            </dd>
                        </div>
                    </dl>

                    <div
                        className="dashboard-drawer__pull"
                        aria-hidden="true"
                    />
                </section>

                <section
                    className="dashboard-drawer"
                    aria-labelledby="dashboard-reading-heading"
                >
                    <header className="dashboard-drawer__heading">
        <span
            className="dashboard-drawer__index"
            aria-hidden="true"
        >
            III
        </span>

                        <h2 id="dashboard-reading-heading">
                            Reading Record
                        </h2>

                        <p>
                            Reading progress across the collection.
                        </p>
                    </header>

                    <div
                        className="dashboard-reading-chart"
                        aria-label={`${percentageRead.toFixed(1)}% of the collection has been read`}
                    >
                        <div
                            className="dashboard-reading-chart__pie"
                            style={{
                                '--percentage-read': `${percentageRead}%`,
                            } as CSSProperties}
                            aria-hidden="true"
                        >
                            <div className="dashboard-reading-chart__center">
                                <strong>
                                    {percentageRead.toFixed(1)}%
                                </strong>

                                <span>read</span>
                            </div>
                        </div>

                        <div className="dashboard-reading-chart__legend">
                            <p>
                                <span
                                    className="dashboard-reading-chart__key dashboard-reading-chart__key--read"
                                    aria-hidden="true"
                                />
                                <strong>
                                    <AppLink to="/books?is_read=true">
                                        {dashboard.read}
                                    </AppLink>
                                </strong>{' '}
                                read
                            </p>

                            <p>
                <span
                    className="dashboard-reading-chart__key dashboard-reading-chart__key--unread"
                    aria-hidden="true"
                />
                                <strong>
                                    <AppLink to="/books?is_read=false">
                                        {dashboard.unread}
                                    </AppLink>
                                </strong>{' '}
                                unread
                            </p>
                        </div>
                    </div>

                    <dl className="dashboard-metrics">
                        <div className="dashboard-metric">
                            <dt>Books Read</dt>
                            <dd>
                                <AppLink to="/books?is_read=true">
                                    {dashboard.read}
                                </AppLink>
                            </dd>

                            <dd className="dashboard-metric__description">
                                Books marked as read in the catalog.
                            </dd>
                        </div>

                        <div className="dashboard-metric">
                            <dt>Books Unread</dt>
                            <dd>
                                <AppLink to="/books?is_read=false">
                                    {dashboard.unread}
                                </AppLink>
                            </dd>

                            <dd className="dashboard-metric__description">
                                Books not yet marked as read.
                            </dd>
                        </div>

                        <div className="dashboard-metric">
                            <dt>Average Rating</dt>

                            <dd>
                                {displayAverage(
                                    dashboard.reading.average_rating,
                                    ' / 5',
                                )}
                            </dd>

                            <dd className="dashboard-metric__description">
                                Based only on books with a recorded rating.
                            </dd>
                        </div>
                    </dl>

                    <div
                        className="dashboard-drawer__pull"
                        aria-hidden="true"
                    />
                </section>

                <section
                    className="dashboard-drawer"
                    aria-labelledby="dashboard-basic-stats-heading"
                >
                    <header className="dashboard-drawer__heading">
        <span
            className="dashboard-drawer__index"
            aria-hidden="true"
        >
            IV
        </span>

                        <h2 id="dashboard-basic-stats-heading">
                            Basic Stats
                        </h2>

                        <p>
                            How the active collection is distributed.
                        </p>
                    </header>

                    {breakdownsQuery.isPending ? (
                        <LoadingState label="Loading collection breakdowns…" />
                    ) : breakdownsQuery.isLoadingError ? (
                        <QueryErrorState
                            title="Unable to load collection breakdowns"
                            error={breakdownsQuery.error}
                            onRetry={() => {
                                void breakdownsQuery.refetch()
                            }}
                        />
                    ) : (
                        <div className="dashboard-breakdowns">
                            <dl className="dashboard-breakdowns__summary">
                                <div>
                                    <dt>Total Books</dt>
                                    <dd>
                                        {breakdownsQuery.data.total_books}
                                    </dd>
                                </div>

                                <div>
                                    <dt>On Loan</dt>
                                    <dd>
                                        {breakdownsQuery.data.on_loan}
                                    </dd>
                                </div>
                            </dl>

                            <section className="dashboard-breakdown">
                                <h3>By Category</h3>

                                <p className="dashboard-category-chart__note">
                                    Top categories by assignment. Books may
                                    belong to more than one category.
                                </p>

                                {categoryBuckets.length === 0 ? (
                                    <p className="dashboard-breakdown__empty">
                                        No data recorded.
                                    </p>
                                ) : (
                                    <div className="dashboard-category-chart">
                                        <div
                                            className="dashboard-category-chart__pie"
                                            style={{
                                                background:
                                                    categoryChartGradient(
                                                        categoryBuckets,
                                                    ),
                                            }}
                                            aria-hidden="true"
                                        >
                                            <div className="dashboard-category-chart__center">
                                                <strong>
                                                    {categoryAssignmentTotal}
                                                </strong>
                                                <span>assignments</span>
                                            </div>
                                        </div>

                                        <dl className="dashboard-category-chart__legend">
                                            {categoryBuckets.map(
                                                (bucket, index) => (
                                                    <div
                                                        key={bucket.key}
                                                        className="dashboard-category-chart__legend-row"
                                                    >
                                                        <dt>
                                                            <span
                                                                className="dashboard-category-chart__key"
                                                                style={{
                                                                    backgroundColor:
                                                                        CATEGORY_CHART_COLORS[
                                                                            index
                                                                            ] ??
                                                                        CATEGORY_CHART_COLORS[
                                                                        CATEGORY_CHART_COLORS.length -
                                                                        1
                                                                            ],
                                                                }}
                                                                aria-hidden="true"
                                                            />
                                                            {bucket.key}
                                                        </dt>
                                                        <dd>{bucket.count}</dd>
                                                    </div>
                                                ),
                                            )}
                                        </dl>
                                    </div>
                                )}
                            </section>
                        </div>
                    )}

                    <div
                        className="dashboard-drawer__pull"
                        aria-hidden="true"
                    />
                </section>

                <section
                    className="dashboard-drawer"
                    aria-labelledby="dashboard-healing-heading"
                >
                    <header className="dashboard-drawer__heading">
        <span
            className="dashboard-drawer__index"
            aria-hidden="true"
        >
            V
        </span>

                        <h2 id="dashboard-healing-heading">
                            Healing Metadata
                        </h2>

                        <p>
                            Books with catalog information that still needs attention.
                        </p>
                    </header>

                    {incompleteMetadataQuery.isPending ? (
                        <LoadingState label="Loading metadata cleanup counts…" />
                    ) : incompleteMetadataQuery.isLoadingError ? (
                        <QueryErrorState
                            title="Unable to load metadata cleanup counts"
                            error={incompleteMetadataQuery.error}
                            onRetry={() => {
                                void incompleteMetadataQuery.refetch()
                            }}
                        />
                    ) : incompleteMetadataQuery.data.total_incomplete === 0 ? (
                        <div className="dashboard-healing__empty">
                            <strong>Catalog metadata is complete.</strong>

                            <p>
                                No active books currently need metadata cleanup.
                            </p>
                        </div>
                    ) : (
                        <div className="dashboard-healing">
                            <div className="dashboard-healing__total">
                                <span>Books needing metadata</span>

                                <strong>
                                    {
                                        incompleteMetadataQuery.data
                                            .total_incomplete
                                    }
                                </strong>
                            </div>

                            <dl className="dashboard-healing__counts">
                                <div>
                                    <dt>Category</dt>
                                    <dd>
                                        <AppLink to="/books?cleanup_field=category">
                                            {
                                                incompleteMetadataQuery.data
                                                    .missing_category
                                            }
                                        </AppLink>
                                    </dd>
                                </div>

                                <div>
                                    <dt>Shelf</dt>
                                    <dd>
                                        <AppLink to="/books?cleanup_field=shelf">
                                            {
                                                incompleteMetadataQuery.data
                                                    .missing_shelf
                                            }
                                        </AppLink>
                                    </dd>
                                </div>

                                <div>
                                    <dt>Pages</dt>
                                    <dd>
                                        <AppLink to="/books?cleanup_field=pages">
                                            {
                                                incompleteMetadataQuery.data
                                                    .missing_pages
                                            }
                                        </AppLink>
                                    </dd>
                                </div>

                                <div>
                                    <dt>Publisher</dt>
                                    <dd>
                                        <AppLink to="/books?cleanup_field=publisher">
                                            {
                                                incompleteMetadataQuery.data
                                                    .missing_publisher
                                            }
                                        </AppLink>
                                    </dd>
                                </div>

                                <div>
                                    <dt>Publication Year</dt>
                                    <dd>
                                        <AppLink to="/books?cleanup_field=year">
                                            {
                                                incompleteMetadataQuery.data
                                                    .missing_year
                                            }
                                        </AppLink>
                                    </dd>
                                </div>

                                <div>
                                    <dt>ISBN</dt>
                                    <dd>
                                        <AppLink to="/books?cleanup_field=isbn">
                                            {
                                                incompleteMetadataQuery.data
                                                    .missing_isbn
                                            }
                                        </AppLink>
                                    </dd>
                                </div>
                            </dl>

                            <p className="dashboard-healing__note">
                                A book can be missing more than one field, so these
                                counts do not add up to the total above.
                            </p>
                        </div>
                    )}

                    <div
                        className="dashboard-drawer__pull"
                        aria-hidden="true"
                    />
                </section>
            </div>
        </section>
    )
}
