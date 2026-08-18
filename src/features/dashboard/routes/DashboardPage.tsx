import {
    type CSSProperties,
    useState,
} from 'react'

import {
    useDashboard,
    useDashboardBreakdowns,
    useDashboardIncompleteMetadata,
    useInfiniteIncompleteMetadataBooks,
} from '../../../api/dashboardQueries'

import {
    useInfiniteScrollTrigger,
} from '../../../hooks/useInfiniteScrollTrigger'
import {
    Alert,
    AppLink,
    Button,
    LoadingState,
    QueryErrorState,
} from '../../../components'


function displayAverage(
    value: number | null,
    suffix = '',
): string {
    if (value === null) {
        return 'Not enough data'
    }

    return `${value.toFixed(1)}${suffix}`
}

function DashboardBreakdown({
                                title,
                                buckets,
                            }: {
    title: string
    buckets: {
        key: string
        count: number
    }[]
}) {
    return (
        <section className="dashboard-breakdown">
            <h3>{title}</h3>

            {buckets.length === 0 ? (
                <p className="dashboard-breakdown__empty">
                    No data recorded.
                </p>
            ) : (
                <dl className="dashboard-breakdown__list">
                    {buckets.map((bucket) => (
                        <div
                            className="dashboard-breakdown__row"
                            key={bucket.key}
                        >
                            <dt>{bucket.key}</dt>
                            <dd>{bucket.count}</dd>
                        </div>
                    ))}
                </dl>
            )}
        </section>
    )
}

export function DashboardPage() {
    const dashboardQuery = useDashboard()
    const breakdownsQuery =
        useDashboardBreakdowns()
    const incompleteMetadataQuery =
        useDashboardIncompleteMetadata()
    const [incompleteField, setIncompleteField] =
        useState('')
    const incompleteBooksQuery =
        useInfiniteIncompleteMetadataBooks({
            field:
                incompleteField === ''
                    ? undefined
                    : incompleteField,
            enabled:
                incompleteMetadataQuery.data
                    ?.total_incomplete !== 0,
        })

    const incompleteBooks =
        incompleteBooksQuery.data?.pages.flatMap(
            (page) => page.items,
        ) ?? []

    const {
        getRowRef: getIncompleteBookRowRef,
    } = useInfiniteScrollTrigger({
        enabled:
            incompleteBooksQuery.hasNextPage === true &&
            !incompleteBooksQuery.isFetchingNextPage,
        hasNextPage:
        incompleteBooksQuery.hasNextPage,
        isFetchingNextPage:
        incompleteBooksQuery.isFetchingNextPage,
        fetchNextPage: () => {
            void incompleteBooksQuery.fetchNextPage()
        },
        itemCount: incompleteBooks.length,
    })

    const isDashboardRefreshing =
        dashboardQuery.isFetching ||
        breakdownsQuery.isFetching ||
        incompleteMetadataQuery.isFetching ||
        incompleteBooksQuery.isFetching

    function refreshDashboard() {
        void Promise.all([
            dashboardQuery.refetch(),
            breakdownsQuery.refetch(),
            incompleteMetadataQuery.refetch(),
            incompleteBooksQuery.refetch(),
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
                                <strong>{dashboard.read}</strong> read
                            </p>

                            <p>
                <span
                    className="dashboard-reading-chart__key dashboard-reading-chart__key--unread"
                    aria-hidden="true"
                />
                                <strong>{dashboard.unread}</strong> unread
                            </p>
                        </div>
                    </div>

                    <dl className="dashboard-metrics">
                        <div className="dashboard-metric">
                            <dt>Books Read</dt>
                            <dd>{dashboard.read}</dd>

                            <dd className="dashboard-metric__description">
                                Books marked as read in the catalog.
                            </dd>
                        </div>

                        <div className="dashboard-metric">
                            <dt>Books Unread</dt>
                            <dd>{dashboard.unread}</dd>

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

                            <DashboardBreakdown
                                title="By Category"
                                buckets={
                                    breakdownsQuery.data.by_category
                                }
                            />

                            <DashboardBreakdown
                                title="By Creation Year"
                                buckets={
                                    breakdownsQuery.data.by_creation_year
                                }
                            />
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
                                        {
                                            incompleteMetadataQuery.data
                                                .missing_category
                                        }
                                    </dd>
                                </div>

                                <div>
                                    <dt>Shelf</dt>
                                    <dd>
                                        {
                                            incompleteMetadataQuery.data
                                                .missing_shelf
                                        }
                                    </dd>
                                </div>

                                <div>
                                    <dt>Pages</dt>
                                    <dd>
                                        {
                                            incompleteMetadataQuery.data
                                                .missing_pages
                                        }
                                    </dd>
                                </div>

                                <div>
                                    <dt>Publisher</dt>
                                    <dd>
                                        {
                                            incompleteMetadataQuery.data
                                                .missing_publisher
                                        }
                                    </dd>
                                </div>

                                <div>
                                    <dt>Publication Year</dt>
                                    <dd>
                                        {
                                            incompleteMetadataQuery.data
                                                .missing_year
                                        }
                                    </dd>
                                </div>

                                <div>
                                    <dt>ISBN</dt>
                                    <dd>
                                        {
                                            incompleteMetadataQuery.data
                                                .missing_isbn
                                        }
                                    </dd>
                                </div>
                            </dl>

                            <p className="dashboard-healing__note">
                                A book can be missing more than one field, so these
                                counts do not add up to the total above.
                            </p>
                        </div>
                    )}

                    <div className="dashboard-healing__books">
                        <label
                            className="dashboard-healing__filter"
                            htmlFor="dashboard-incomplete-field"
                        >
                            <span>Show books missing</span>

                            <select
                                id="dashboard-incomplete-field"
                                value={incompleteField}
                                onChange={(event) => {
                                    setIncompleteField(
                                        event.currentTarget.value,
                                    )
                                }}
                            >
                                <option value="">
                                    Any tracked field
                                </option>
                                <option value="category">
                                    Category
                                </option>
                                <option value="shelf">
                                    Shelf
                                </option>
                                <option value="pages">
                                    Pages
                                </option>
                                <option value="publisher">
                                    Publisher
                                </option>
                                <option value="year">
                                    Publication Year
                                </option>
                                <option value="isbn">
                                    ISBN
                                </option>
                            </select>
                        </label>

                        {incompleteBooksQuery.isPending ? (
                            <LoadingState label="Loading books needing cleanup…" />
                        ) : incompleteBooksQuery.isLoadingError ? (
                            <QueryErrorState
                                title="Unable to load books needing cleanup"
                                error={incompleteBooksQuery.error}
                                onRetry={() => {
                                    void incompleteBooksQuery.refetch()
                                }}
                            />
                        ) : incompleteBooks.length === 0 ? (
                            <p className="dashboard-healing__books-empty">
                                No books match this cleanup filter.
                            </p>
                        ) : (
                            <ul className="dashboard-healing__book-list">
                                {incompleteBooks.map(
                                    (book, index) => (
                                        <li
                                            key={book.id}
                                            ref={
                                                getIncompleteBookRowRef(
                                                    index,
                                                )
                                            }
                                            className="dashboard-healing__book"
                                        >
                                            <div>
                                                <AppLink
                                                    to={`/books/${book.id}`}
                                                >
                                                    {book.title}
                                                </AppLink>

                                                <p>{book.authors}</p>
                                            </div>

                                            <AppLink
                                                to={`/books/${book.id}/edit`}
                                            >
                                                Edit
                                            </AppLink>
                                        </li>
                                    ),
                                )}
                            </ul>
                        )}

                        {incompleteBooksQuery.isFetchingNextPage ? (
                            <div className="infinite-scroll__footer">
                                <LoadingState label="Loading more books…" />
                            </div>
                        ) : null}

                        {incompleteBooksQuery.isFetchNextPageError ? (
                            <div className="infinite-scroll__footer">
                                <Alert variant="error">
                                    Unable to load more books.
                                </Alert>

                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        void incompleteBooksQuery.fetchNextPage()
                                    }}
                                >
                                    Retry
                                </Button>
                            </div>
                        ) : null}
                    </div>

                    <div
                        className="dashboard-drawer__pull"
                        aria-hidden="true"
                    />
                </section>
            </div>
        </section>
    )
}
