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
import dashboardBackground from '../../../assets/Dashboard_Background.webp'


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
    const listening = dashboard.listening ?? { albums_played: 0, albums_unplayed: 0, average_rating: null }
    const albumBorrowing = dashboard.album_borrowing ?? { active_loans: 0, lifetime_loans: 0, average_loan_days: null }

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
        <section
            className="route-page dashboard-page"
            style={{
                '--dashboard-desk-image':
                    `url(${dashboardBackground})`,
            } as CSSProperties}
        >
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

            <div className="dashboard-desk">
                <section
                    className="dashboard-paper dashboard-paper--collection"
                    aria-labelledby="dashboard-collection-heading"
                >
                    <header className="dashboard-paper__heading">
            <span
                className="dashboard-paper__index"
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

                            <dd>
                                <AppLink
                                    to="/books"
                                    aria-label={`${dashboard.total_books} total books — browse collection`}
                                >
                                    {dashboard.total_books}
                                </AppLink>
                            </dd>
                        </div>

                        <div className="dashboard-metric">
                            <dt>Checked Out Books</dt>

                            <dd>
                                <AppLink
                                    to="/loans"
                                    aria-label={`${dashboard.checked_out} checked out books — view loans`}
                                >
                                    {dashboard.checked_out}
                                </AppLink>
                            </dd>

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

                            <dd>
                                {dashboard.recently_added}
                            </dd>

                            <dd className="dashboard-metric__description">
                                Recent additions reported by the library.
                            </dd>
                        </div>
                    </dl>
                </section>

                <section
                    className="dashboard-paper dashboard-paper--circulation"
                    aria-labelledby="dashboard-circulation-heading"
                >
                    <header className="dashboard-paper__heading">
            <span
                className="dashboard-paper__index"
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
                                <AppLink
                                    to="/loans"
                                    aria-label={`${dashboard.borrowing.active_loans} active loan records — view loans`}
                                >
                                    {dashboard.borrowing.active_loans}
                                </AppLink>
                            </dd>

                            <dd className="dashboard-metric__description">
                                Open borrowing records, kept distinct from book status.
                            </dd>
                        </div>

                        <div className="dashboard-metric">
                            <dt>Lifetime Loans</dt>

                            <dd>
                                <AppLink
                                    to="/loans"
                                    aria-label={`${dashboard.borrowing.lifetime_loans} lifetime loans — view loan history`}
                                >
                                    {dashboard.borrowing.lifetime_loans}
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
                </section>

                <section
                    className="dashboard-paper dashboard-paper--reading"
                    aria-labelledby="dashboard-reading-heading"
                >
                    <header className="dashboard-paper__heading">
        <span
            className="dashboard-paper__index"
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
                                Read
                            </p>

                            <p>
                <span
                    className="dashboard-reading-chart__key dashboard-reading-chart__key--unread"
                    aria-hidden="true"
                />
                                Unread
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
                </section>

                <section
                    className="dashboard-paper dashboard-paper--stats"
                    aria-labelledby="dashboard-basic-stats-heading"
                >
                    <header className="dashboard-paper__heading">
        <span
            className="dashboard-paper__index"
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
                </section>

                <section
                    className="dashboard-paper dashboard-paper--healing"
                    aria-labelledby="dashboard-healing-heading"
                >
                    <header className="dashboard-paper__heading">
        <span
            className="dashboard-paper__index"
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

                    <div
                        className="dashboard-healing__stamp"
                        aria-hidden="true"
                    >
                        ATTN: LIBRARIAN
                    </div>

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
                </section>

                <section className="dashboard-paper dashboard-paper--albums" aria-labelledby="dashboard-albums-heading">
                    <header className="dashboard-paper__heading"><span className="dashboard-paper__index" aria-hidden="true">LP</span><h2 id="dashboard-albums-heading">Listening Room</h2><p>Album collection, circulation, and listening.</p></header>
                    <dl className="dashboard-metrics">
                        <div className="dashboard-metric"><dt>Total Albums</dt><dd><AppLink to="/albums">{dashboard.total_albums}</AppLink></dd></div>
                        <div className="dashboard-metric"><dt>On Loan</dt><dd>{dashboard.albums_checked_out}</dd></div>
                        <div className="dashboard-metric"><dt>Recently Added</dt><dd>{dashboard.albums_recently_added}</dd></div>
                        <div className="dashboard-metric"><dt>Played</dt><dd>{listening.albums_played}</dd></div>
                        <div className="dashboard-metric"><dt>Unplayed</dt><dd>{listening.albums_unplayed}</dd></div>
                        <div className="dashboard-metric"><dt>Average Rating</dt><dd>{listening.average_rating === null ? 'Not enough album data' : displayAverage(listening.average_rating, ' / 5')}</dd></div>
                        <div className="dashboard-metric"><dt>Lifetime Album Loans</dt><dd>{albumBorrowing.lifetime_loans}</dd></div>
                    </dl>
                    {breakdownsQuery.data ? <div className="album-dashboard-breakdowns"><h3>Formats</h3><dl>{(breakdownsQuery.data.albums_by_media_format ?? []).map(bucket => <div key={bucket.key}><dt>{bucket.key}</dt><dd>{bucket.count}</dd></div>)}</dl><h3>Album shelves</h3><dl>{(breakdownsQuery.data.albums_by_shelf ?? []).map(bucket => <div key={bucket.key}><dt>{bucket.key}</dt><dd>{bucket.count}</dd></div>)}</dl></div> : null}
                </section>
            </div>
        </section>
    )
}
