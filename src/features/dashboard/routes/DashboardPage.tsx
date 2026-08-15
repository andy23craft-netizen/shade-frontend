import { useDashboard } from '../../../api/dashboardQueries'
import {
    Alert,
    AppLink,
    Button,
    LoadingState,
    QueryErrorState,
} from '../../../components'
import type { CSSProperties } from 'react'

function displayAverage(
    value: number | null,
    suffix = '',
): string {
    if (value === null) {
        return 'Not enough data'
    }

    return `${value.toFixed(1)}${suffix}`
}

export function DashboardPage() {
    const dashboardQuery = useDashboard()

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
                    disabled={dashboardQuery.isFetching}
                    onClick={() => {
                        void dashboardQuery.refetch()
                    }}
                >
                    {dashboardQuery.isFetching
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
            ) : dashboardQuery.isFetching &&
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
                    <div
                        className="dashboard-drawer__clip"
                        aria-hidden="true"
                    />

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

                            <p>
                                <AppLink to="/books">
                                    Browse collection
                                </AppLink>
                            </p>
                        </div>

                        <div className="dashboard-metric">
                            <dt>Checked Out Books</dt>
                            <dd>{dashboard.checked_out}</dd>

                            <p>
                                Books whose current catalog status
                                is on loan.
                            </p>
                        </div>

                        <div className="dashboard-metric">
                            <dt>
                                Added in the last{' '}
                                {dashboard.recent_window_days}{' '}
                                days
                            </dt>

                            <dd>{dashboard.recently_added}</dd>

                            <p>
                                Recent additions reported by the
                                library.
                            </p>
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
                    <div
                        className="dashboard-drawer__clip"
                        aria-hidden="true"
                    />

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
                                {
                                    dashboard.borrowing
                                        .active_loans
                                }
                            </dd>

                            <p>
                                Open borrowing records, kept
                                distinct from book status.
                            </p>
                        </div>

                        <div className="dashboard-metric">
                            <dt>Lifetime Loans</dt>

                            <dd>
                                {
                                    dashboard.borrowing
                                        .lifetime_loans
                                }
                            </dd>

                            <p>
                                <AppLink to="/loans">
                                    View loan history
                                </AppLink>
                            </p>
                        </div>

                        <div className="dashboard-metric">
                            <dt>Average Loan Length</dt>

                            <dd>
                                {displayAverage(
                                    dashboard.borrowing
                                        .average_loan_days,
                                    ' days',
                                )}
                            </dd>

                            <p>
                                Based on returned loans recorded
                                by the library.
                            </p>
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
                    <div
                        className="dashboard-drawer__clip"
                        aria-hidden="true"
                    />

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

                            <p>
                                Books marked as read in the catalog.
                            </p>
                        </div>

                        <div className="dashboard-metric">
                            <dt>Books Unread</dt>
                            <dd>{dashboard.unread}</dd>

                            <p>
                                Books not yet marked as read.
                            </p>
                        </div>

                        <div className="dashboard-metric">
                            <dt>Average Rating</dt>

                            <dd>
                                {displayAverage(
                                    dashboard.reading
                                        .average_rating,
                                    ' / 5',
                                )}
                            </dd>

                            <p>
                                Based only on books with a
                                recorded rating.
                            </p>
                        </div>
                    </dl>

                    <div
                        className="dashboard-drawer__pull"
                        aria-hidden="true"
                    />
                </section>
            </div>
        </section>
    )
}
