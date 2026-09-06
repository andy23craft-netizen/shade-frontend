import { useDashboard, useDashboardBreakdowns } from '../../../api/dashboardQueries'
import { AppLink, LoadingState, QueryErrorState } from '../../../components'

function average(value: number | null, suffix: string) {
    return value === null ? 'Not enough data' : `${value.toFixed(1)}${suffix}`
}

export function ListeningDashboardPage() {
    const dashboardQuery = useDashboard()
    const breakdownsQuery = useDashboardBreakdowns()

    if (dashboardQuery.isPending) return <section className="route-page listening-dashboard"><h1 tabIndex={-1}>Listening Dashboard</h1><LoadingState label="Loading listening statistics…" /></section>
    if (dashboardQuery.isError) return <section className="route-page listening-dashboard"><h1 tabIndex={-1}>Listening Dashboard</h1><QueryErrorState title="Unable to load listening statistics" error={dashboardQuery.error} onRetry={() => { void dashboardQuery.refetch() }} /></section>

    const dashboard = dashboardQuery.data
    const listening = dashboard.listening ?? { albums_played: 0, albums_unplayed: 0, average_rating: null }
    const borrowing = dashboard.album_borrowing ?? { active_loans: 0, lifetime_loans: 0, average_loan_days: null }

    return (
        <section className="route-page listening-dashboard">
            <header className="listening-dashboard__heading"><p>Back Counter · Inventory & play log</p><h1 tabIndex={-1}>Listening Dashboard</h1><span>The record collection at a glance.</span></header>
            <div className="listening-dashboard__console">
                <section aria-labelledby="album-inventory-heading"><h2 id="album-inventory-heading">In the Bins</h2><dl className="dashboard-metrics">
                    <div><dt>Total Albums</dt><dd><AppLink to="/albums">{dashboard.total_albums}</AppLink></dd></div>
                    <div><dt>On Loan</dt><dd><AppLink to="/listening-room/loans">{dashboard.albums_checked_out}</AppLink></dd></div>
                    <div><dt>Recently Added</dt><dd>{dashboard.albums_recently_added}</dd></div>
                </dl></section>
                <section aria-labelledby="album-listening-heading"><h2 id="album-listening-heading">In Rotation</h2><dl className="dashboard-metrics">
                    <div><dt>Played</dt><dd>{listening.albums_played}</dd></div>
                    <div><dt>Unplayed</dt><dd>{listening.albums_unplayed}</dd></div>
                    <div><dt>Average Rating</dt><dd>{average(listening.average_rating, ' / 5')}</dd></div>
                </dl></section>
                <section aria-labelledby="album-circulation-heading"><h2 id="album-circulation-heading">Checkout Ledger</h2><dl className="dashboard-metrics">
                    <div><dt>Active Loans</dt><dd><AppLink to="/listening-room/loans">{borrowing.active_loans}</AppLink></dd></div>
                    <div><dt>Lifetime Loans</dt><dd>{borrowing.lifetime_loans}</dd></div>
                    <div><dt>Average Loan Length</dt><dd>{average(borrowing.average_loan_days, ' days')}</dd></div>
                </dl></section>
                <section aria-labelledby="album-breakdowns-heading"><h2 id="album-breakdowns-heading">Bin Dividers</h2>
                    {breakdownsQuery.isPending ? <LoadingState label="Loading album breakdowns…" /> : breakdownsQuery.isError ? <QueryErrorState title="Unable to load album breakdowns" error={breakdownsQuery.error} onRetry={() => { void breakdownsQuery.refetch() }} /> : <div className="album-dashboard-breakdowns"><h3>Formats</h3><dl>{(breakdownsQuery.data.albums_by_media_format ?? []).map(bucket => <div key={bucket.key}><dt>{bucket.key}</dt><dd>{bucket.count}</dd></div>)}</dl><h3>Crates</h3><dl>{(breakdownsQuery.data.albums_by_shelf ?? []).map(bucket => <div key={bucket.key}><dt>{bucket.key}</dt><dd>{bucket.count}</dd></div>)}</dl></div>}
                </section>
            </div>
        </section>
    )
}
