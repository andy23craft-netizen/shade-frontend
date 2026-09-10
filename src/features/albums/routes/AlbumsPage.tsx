import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useInfiniteAlbums } from '../../../api/albumsQueries'
import { useGenres } from '../../../api/genresQueries'
import { Alert, AppLink, BackToTop, Button, EmptyState, Field, LoadingState, QueryErrorState } from '../../../components'
import { useInfiniteScrollTrigger } from '../../../hooks/useInfiniteScrollTrigger'
import { AlbumArtwork } from '../components/AlbumArtwork'
import { displayMediaFormat, formatAlbumArtists } from '../albumDisplay'
import { flattenAlbumPages, parseAlbumListParams, updateAlbumListParams, type AlbumListFilters, type AlbumSortBy } from '../albumsListModel'
import { AddAlbumToWishlistControl } from '../../wishlists/components/AddAlbumToWishlistControl'

const AlbumBarcodeCameraScanner = lazy(() => import('../../scanning/IsbnCameraScanner').then(module => ({ default: module.AlbumBarcodeCameraScanner })))

function AlbumControls({ filters, genres, onChange, onClear, onScanBarcode }: { filters: AlbumListFilters; genres: Array<{ genre_id: string; name: string }>; onChange: (updates: Partial<AlbumListFilters>) => void; onClear: () => void; onScanBarcode: () => void }) {
    const sortState = (field: AlbumSortBy) => filters.sortBy === field ? filters.sortOrder : 'none'
    const cycleSort = (field: AlbumSortBy) => {
        const current = sortState(field)
        const next = current === 'none' ? 'asc' : current === 'asc' ? 'desc' : 'none'
        onChange(next === 'none' ? { sortBy: 'artist', sortOrder: 'asc' } : { sortBy: field, sortOrder: next })
    }
    return <form className="album-filters" onSubmit={event => event.preventDefault()}>
        <Field className="album-filters__field" label="Search"><input type="search" placeholder="Artist or title" value={filters.search ?? ''} onChange={event => onChange({ search: event.target.value })} /></Field>
        <div className="album-filters__barcode">
            <Button type="button" variant="secondary" onClick={onScanBarcode}>Scan barcode</Button>
            <input aria-label="Barcode" inputMode="numeric" value={filters.barcode ?? ''} onChange={event => onChange({ barcode: event.target.value })} />
        </div>
        <Field className="album-filters__field" label="Placement"><select value={filters.placementState ?? 'shelved'} onChange={event => onChange({ placementState: event.target.value === 'unshelved' ? 'unshelved' : undefined })}><option value="shelved">In crates</option><option value="unshelved">Unshelved / wishlist candidates</option></select></Field>
        <Field className="album-filters__field" label="Genre"><select value={filters.genreIds[0] ?? ''} onChange={event => onChange({ genreIds: event.target.value ? [event.target.value] : [] })}><option value="">All genres</option>{genres.map((genre) => <option key={genre.genre_id} value={genre.genre_id}>{genre.name}</option>)}</select></Field>
        <div className="album-filters__sorts" aria-label="Album sorting">
            {([['artist', 'Artist', 'Sort by artist'], ['title', 'Title', 'Sort by title'], ['release_date', 'Release', 'Sort by release date'], ['creation_date', 'Added', 'Sort by date added']] as const).map(([field, label, ariaLabel]) => <button key={field} type="button" aria-label={ariaLabel} className="books-toolbar__button books-toolbar__sort album-filters__sort" onClick={() => cycleSort(field)}>{label}<strong>{sortState(field) === 'none' ? 'None' : sortState(field) === 'asc' ? 'Asc' : 'Desc'}</strong></button>)}
        </div>
        <Button type="button" variant="secondary" onClick={onClear}>Clear filters</Button>
    </form>
}

function AlbumBrowseLayout({ controls, children }: { controls: ReactNode; children: ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false)
    return <div className="album-browser"><aside className="album-browser__rail" aria-label="Album browse controls"><h2>Browse</h2>{controls}</aside><div className="album-browser__mobile"><button type="button" className="books-toolbar__mobile-toggle album-browser__mobile-toggle" aria-expanded={mobileOpen} aria-controls="album-browser-mobile-controls" onClick={() => setMobileOpen(open => !open)}><span className="books-toolbar__mobile-toggle-label">Filters &amp; search <span aria-hidden="true">{mobileOpen ? '▴' : '▾'}</span></span><span className="books-toolbar__mobile-toggle-hint">{mobileOpen ? 'Tap to collapse controls' : 'Tap to expand controls'}</span></button><div id="album-browser-mobile-controls" className={mobileOpen ? 'album-browser__mobile-controls album-browser__mobile-controls--open' : 'album-browser__mobile-controls'}>{controls}</div></div><div className="album-browser__results">{children}</div></div>
}

export function AlbumsPage() {
    const location = useLocation()
    const navigate = useNavigate()
    const [params, setParams] = useSearchParams()
    const filters = parseAlbumListParams(params)
    const query = useInfiniteAlbums(filters)
    const genresQuery = useGenres(true)
    const albums = flattenAlbumPages(query.data?.pages)
    const total = query.data?.pages[0]?.total ?? 0
    const { fetchNextPage } = query
    const fetchNext = useCallback(() => { void fetchNextPage() }, [fetchNextPage])
    const { getRowRef } = useInfiniteScrollTrigger({ enabled: query.isSuccess, hasNextPage: query.hasNextPage, isFetchingNextPage: query.isFetchingNextPage, fetchNextPage: fetchNext, itemCount: albums.length })
    const [scannerOpen, setScannerOpen] = useState(false)
    const [selectionMode, setSelectionMode] = useState(false)
    const [selectedAlbumIds, setSelectedAlbumIds] = useState<Set<string>>(new Set())
    const previousFilterIdentity = useRef(params.toString())
    const change = (updates: Partial<AlbumListFilters>) => setParams(updateAlbumListParams(params, updates), { replace: true })
    const clear = () => setParams(new URLSearchParams(), { replace: true })
    const controls = <AlbumControls filters={filters} genres={genresQuery.data ?? []} onChange={change} onClear={clear} onScanBarcode={() => setScannerOpen(true)} />

    useEffect(() => {
        if (previousFilterIdentity.current !== params.toString()) {
            setSelectedAlbumIds(new Set())
            previousFilterIdentity.current = params.toString()
        }
    }, [params])

    const selectedCount = selectedAlbumIds.size
    const toggleSelection = (albumId: string) => setSelectedAlbumIds((current) => {
        const next = new Set(current)
        if (next.has(albumId)) next.delete(albumId)
        else next.add(albumId)
        return next
    })
    const selectVisible = () => setSelectedAlbumIds(new Set(albums.map((album) => album.album_id)))
    const printSelected = () => navigate(`/albums/labels?${[...selectedAlbumIds].map((albumId) => `album_id=${encodeURIComponent(albumId)}`).join('&')}`)

    return <section className="page page--albums"><header className="page-header album-room__header"><div className="albums-page__heading"><h1 tabIndex={-1}>Albums</h1><p>{total} albums in the library.</p></div><div className="form-actions">{selectionMode ? null : <Button type="button" variant="secondary" onClick={() => setSelectionMode(true)}>Select albums</Button>}<AppLink className="button button--secondary" to="/albums/bulk-add">Bulk add</AppLink><AppLink className="button button--primary" to="/albums/new">Add album</AppLink></div></header>
        {selectionMode ? <section className="books-bulk-actions" aria-label="Album bulk selection"><p className="books-bulk-actions__count" aria-live="polite">{selectedCount} {selectedCount === 1 ? 'album selected' : 'albums selected'}</p><div className="books-bulk-actions__controls"><Button type="button" variant="secondary" onClick={selectVisible}>Select all loaded albums</Button><Button type="button" variant="secondary" disabled={selectedCount === 0} onClick={printSelected}>Print labels for selected albums</Button><Button type="button" variant="secondary" disabled={selectedCount === 0} onClick={() => setSelectedAlbumIds(new Set())}>Clear selection</Button><Button type="button" variant="secondary" onClick={() => { setSelectedAlbumIds(new Set()); setSelectionMode(false) }}>Exit selection</Button></div></section> : null}
        <AlbumBrowseLayout controls={controls}>{query.isPending ? <LoadingState label="Loading albums…" /> : query.isError ? <QueryErrorState title="Unable to load albums" error={query.error} onRetry={() => void query.refetch()} /> : total === 0 ? <EmptyState title="No albums found"><p>Add a release or change the filters.</p><Button type="button" variant="secondary" onClick={clear}>Clear filters</Button></EmptyState> : <><div className="album-grid" aria-label="Library albums">{albums.map((album, index) => <article ref={getRowRef(index)} className={selectedAlbumIds.has(album.album_id) ? 'album-card album-card--selected' : 'album-card'} key={album.album_id}>{selectionMode ? <label className="album-card__selection"><input type="checkbox" checked={selectedAlbumIds.has(album.album_id)} onChange={() => toggleSelection(album.album_id)} aria-label={`Select ${album.title}`} /><span aria-hidden="true">Select</span></label> : null}<AppLink to={`/albums/${album.album_id}`} state={{ albumsReturnTo: `${location.pathname}${location.search}`, albumScrollY: window.scrollY, albumPlacementState: filters.placementState ?? 'shelved' }}><AlbumArtwork albumId={album.album_id} title={album.title} present={album.artwork_present} /><div className="album-card__copy"><div className="album-card__heading"><h2>{album.title}</h2><p className="album-card__artist">{formatAlbumArtists(album)}</p></div><dl className="album-card__metadata"><div><dt>Format</dt><dd>{displayMediaFormat(album.media_format)}</dd></div>{album.release_date ? <div><dt>Year</dt><dd>{album.release_date.slice(0, 4)}</dd></div> : null}{album.shelf_name ? <div><dt>Crate</dt><dd>{album.shelf_name}</dd></div> : null}</dl>{album.status === 'on_loan' ? <span className="album-card__stamp">On loan</span> : null}</div></AppLink>{filters.placementState === 'unshelved' ? <AddAlbumToWishlistControl compact albumId={album.album_id} albumTitle={album.title} /> : null}</article>)}</div>{query.isFetchingNextPage ? <div className="infinite-scroll__footer"><LoadingState label="Loading more albums…" /></div> : null}{query.isFetchNextPageError ? <div className="infinite-scroll__footer"><Alert variant="error">Unable to load more albums.</Alert><Button variant="secondary" onClick={fetchNext}>Retry</Button></div> : null}</>}</AlbumBrowseLayout>
        {scannerOpen ? <Suspense fallback={<LoadingState label="Loading camera scanner…" />}><AlbumBarcodeCameraScanner onDetected={value => { change({ barcode: value }); setScannerOpen(false) }} onCancel={() => setScannerOpen(false)} /></Suspense> : null}
        <BackToTop enabled={albums.length > 30} focusSelector=".albums-page__heading h1" />
    </section>
}
