import { useMemo, useState } from 'react'
import { useAlbums } from '../../../api/albumsQueries'
import { useDashboard, useDashboardBreakdowns } from '../../../api/dashboardQueries'
import { AppLink, Button, LoadingState, QueryErrorState } from '../../../components'
import { AlbumArtwork } from '../../albums/components/AlbumArtwork'
import {
    displayMediaFormat,
    formatAlbumArtists,
} from '../../albums/albumDisplay'
import recordPlayer from '../../../assets/Record_player.png'
import vinylCrate from '../../../assets/Vinyl_Crate.png'
import coffeeMug from '../../../assets/Coffe_mug.png'
import {
    SeasonalAtmosphere,
    useCurrentSeason,
} from '../../seasonal/SeasonalAtmosphere'

function average(value: number | null, suffix: string) {
    return value === null ? 'Not enough data' : `${value.toFixed(1)}${suffix}`
}

function shuffledAlbumIds(ids: string[], seed: number) {
    const shuffled = [...ids]
    let state = seed || 1
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        state = (state * 1_664_525 + 1_013_904_223) >>> 0
        const next = state % (index + 1)
        ;[shuffled[index], shuffled[next]] = [shuffled[next], shuffled[index]]
    }
    return shuffled
}

export function ListeningDashboardPage() {
    const season = useCurrentSeason()
    const dashboardQuery = useDashboard()
    const breakdownsQuery = useDashboardBreakdowns()
    const albumsQuery = useAlbums({ placementState: 'shelved', skip: 0, take: 100 })
    const [shelfSeed, setShelfSeed] = useState(() => Math.floor(Math.random() * 2 ** 32))
    const [deckAlbumId, setDeckAlbumId] = useState<string | null>(null)
    const shelfAlbums = useMemo(() => {
        const albums = albumsQuery.data?.items ?? []
        const albumById = new Map(albums.map((album) => [album.album_id, album]))
        return shuffledAlbumIds(albums.map((album) => album.album_id), shelfSeed).slice(0, 5).flatMap((id) => {
            const album = albumById.get(id)
            return album ? [album] : []
        })
    }, [albumsQuery.data?.items, shelfSeed])
    const deckAlbum = shelfAlbums.find((album) => album.album_id === deckAlbumId) ?? shelfAlbums[0] ?? null

    if (dashboardQuery.isPending) return <section className="route-page listening-dashboard seasonal-surface" data-season={season}><SeasonalAtmosphere /><h1 tabIndex={-1}>Listening Dashboard</h1><LoadingState label="Loading listening statistics…" /></section>
    if (dashboardQuery.isError) return <section className="route-page listening-dashboard seasonal-surface" data-season={season}><SeasonalAtmosphere /><h1 tabIndex={-1}>Listening Dashboard</h1><QueryErrorState title="Unable to load listening statistics" error={dashboardQuery.error} onRetry={() => { void dashboardQuery.refetch() }} /></section>

    const dashboard = dashboardQuery.data
    const listening = dashboard.listening ?? { albums_played: 0, albums_unplayed: 0, average_rating: null }
    const borrowing = dashboard.album_borrowing ?? { active_loans: 0, lifetime_loans: 0, average_loan_days: null }

    return <section className="route-page listening-dashboard seasonal-surface" data-season={season}>
        <SeasonalAtmosphere />
        <header className="listening-dashboard__heading"><p>Back Counter · Inventory & play log</p><h1 tabIndex={-1}>Listening Dashboard</h1><span>The record collection at a glance.</span></header>
        <section className="listening-dashboard__pinboard" aria-label="Collection overview">
            <dl className="listening-dashboard__tickets">
                <div><dt>Albums</dt><dd><AppLink to="/albums">{dashboard.total_albums}</AppLink></dd></div>
                <div><dt>Played</dt><dd>{listening.albums_played}</dd></div>
                <div><dt>Unplayed</dt><dd>{listening.albums_unplayed}</dd></div>
                <div><dt>Added this month</dt><dd>{dashboard.albums_recently_added}</dd></div>
                <div><dt>Out on loan</dt><dd><AppLink to="/listening-room/loans">{dashboard.albums_checked_out}</AppLink></dd></div>
            </dl>
            <section className="listening-dashboard__format-ticket" aria-labelledby="format-breakdown-heading"><h2 id="format-breakdown-heading">Format breakdown</h2>
                {breakdownsQuery.isPending ? <LoadingState label="Loading formats…" /> : breakdownsQuery.isError ? <QueryErrorState title="Unable to load album breakdowns" error={breakdownsQuery.error} onRetry={() => { void breakdownsQuery.refetch() }} /> : <dl>{(breakdownsQuery.data.albums_by_media_format ?? []).map((bucket) => <div key={bucket.key}><dt>{bucket.key}</dt><dd>{bucket.count}</dd></div>)}</dl>}
            </section>
        </section>
        <section className="listening-dashboard__workbench" aria-label="Listening room workbench">
            <div className="listening-dashboard__turntable"><img src={recordPlayer} alt="" /></div>
            <section className="listening-dashboard__now-playing" aria-label="Now playing">
                {albumsQuery.isPending ? <LoadingState label="Loading records for the shelf…" /> : deckAlbum ? <><article className="album-card listening-dashboard__now-playing-card"><AppLink to={`/albums/${deckAlbum.album_id}`}><AlbumArtwork albumId={deckAlbum.album_id} title={deckAlbum.title} present={deckAlbum.artwork_present} /><div className="album-card__copy"><div className="album-card__heading"><h2>{deckAlbum.title}</h2><p className="album-card__artist">{formatAlbumArtists(deckAlbum)}</p></div><dl className="album-card__metadata"><div><dt>Format</dt><dd>{displayMediaFormat(deckAlbum.media_format)}</dd></div>{deckAlbum.release_date ? <div><dt>Year</dt><dd>{deckAlbum.release_date.slice(0, 4)}</dd></div> : null}{deckAlbum.shelf_name ? <div><dt>Crate</dt><dd>{deckAlbum.shelf_name}</dd></div> : null}</dl>{deckAlbum.status === 'on_loan' ? <span className="album-card__stamp">On loan</span> : null}</div></AppLink></article><p className="listening-dashboard__now-playing-placard">Now Playing</p><p className="listening-dashboard__session-note">A dashboard selection only; it does not start playback or change listening history.</p></> : <div className="listening-dashboard__now-playing-empty"><p>File albums in a crate to choose a record for this session.</p><p className="listening-dashboard__session-note">A dashboard selection only; it does not start playback or change listening history.</p></div>}
            </section>
            <img className="listening-dashboard__mug" src={coffeeMug} alt="" />
        </section>
        <section className="listening-dashboard__crate-section" aria-labelledby="crate-picks-heading">
            <div className="listening-dashboard__crate-heading"><div><h2 id="crate-picks-heading">Pull a record from the crate</h2><p>Five random shelved albums. Choose one to put on the dashboard deck.</p></div><Button variant="secondary" onClick={() => { setShelfSeed(Math.floor(Math.random() * 2 ** 32)); setDeckAlbumId(null) }}>Randomize picks</Button></div>
            {albumsQuery.isError ? <QueryErrorState title="Unable to load the crate" error={albumsQuery.error} onRetry={() => { void albumsQuery.refetch() }} /> : shelfAlbums.length ? <div className="listening-dashboard__crate"><img src={vinylCrate} alt="" /><div className="listening-dashboard__crate-albums">{shelfAlbums.map((album) => <button className="listening-dashboard__crate-album" type="button" key={album.album_id} aria-pressed={deckAlbum?.album_id === album.album_id} onClick={() => setDeckAlbumId(album.album_id)}><AlbumArtwork albumId={album.album_id} title={album.title} present={album.artwork_present} /><span className="sr-only">{album.title}</span></button>)}</div><div className="listening-dashboard__crate-labels" aria-hidden="true">{shelfAlbums.map((album) => <span key={album.album_id}>{album.title}</span>)}</div></div> : !albumsQuery.isPending ? <p>No shelved albums are available for the crate yet.</p> : null}
        </section>
        <div className="listening-dashboard__console">
            <section aria-labelledby="album-listening-heading"><h2 id="album-listening-heading">In Rotation</h2><dl className="dashboard-metrics"><div><dt>Average Rating</dt><dd>{average(listening.average_rating, ' / 5')}</dd></div><div><dt>Active Loans</dt><dd><AppLink to="/listening-room/loans">{borrowing.active_loans}</AppLink></dd></div><div><dt>Lifetime Loans</dt><dd>{borrowing.lifetime_loans}</dd></div><div><dt>Average Loan Length</dt><dd>{average(borrowing.average_loan_days, ' days')}</dd></div></dl></section>
            <section aria-labelledby="album-crates-heading"><h2 id="album-crates-heading">Crates</h2>{breakdownsQuery.isPending ? <LoadingState label="Loading crates…" /> : breakdownsQuery.isError ? <QueryErrorState title="Unable to load crate breakdowns" error={breakdownsQuery.error} onRetry={() => { void breakdownsQuery.refetch() }} /> : <dl className="album-dashboard-breakdowns">{(breakdownsQuery.data.albums_by_shelf ?? []).map((bucket) => <div key={bucket.key}><dt>{bucket.key}</dt><dd>{bucket.count}</dd></div>)}</dl>}</section>
        </div>
    </section>
}
