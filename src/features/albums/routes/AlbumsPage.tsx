import { lazy, Suspense, useCallback, useState, type ReactNode } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useInfiniteAlbums } from '../../../api/albumsQueries'
import { Alert, AppLink, BackToTop, Button, EmptyState, Field, LoadingState, QueryErrorState } from '../../../components'
import { useInfiniteScrollTrigger } from '../../../hooks/useInfiniteScrollTrigger'
import { AlbumArtwork } from '../components/AlbumArtwork'
import { displayMediaFormat, formatAlbumArtists } from '../albumDisplay'
import { flattenAlbumPages, parseAlbumListParams, updateAlbumListParams, type AlbumListFilters } from '../albumsListModel'
import { AddAlbumToWishlistControl } from '../../wishlists/components/AddAlbumToWishlistControl'

const AlbumBarcodeCameraScanner = lazy(() => import('../../scanning/IsbnCameraScanner').then(module => ({ default: module.AlbumBarcodeCameraScanner })))

function AlbumControls({ filters, onChange, onClear, onScanBarcode }: { filters: AlbumListFilters; onChange: (updates: Partial<AlbumListFilters>) => void; onClear: () => void; onScanBarcode: () => void }) {
    return <form className="album-filters" onSubmit={event => event.preventDefault()}>
        <Field label="Artist"><input type="search" value={filters.artist ?? ''} onChange={event => onChange({ artist: event.target.value })} /></Field>
        <Field label="Title"><input type="search" value={filters.title ?? ''} onChange={event => onChange({ title: event.target.value })} /></Field>
        <Field label="Barcode"><input inputMode="numeric" value={filters.barcode ?? ''} onChange={event => onChange({ barcode: event.target.value })} /></Field>
        <Button type="button" variant="secondary" onClick={onScanBarcode}>Scan barcode</Button>
        <Field label="Format"><select value={filters.mediaFormat ?? ''} onChange={event => onChange({ mediaFormat: event.target.value as AlbumListFilters['mediaFormat'] })}><option value="">All formats</option><option value="vinyl">Vinyl</option><option value="cd">CD</option><option value="cassette">Cassette</option><option value="other">Other</option><option value="unknown">Unknown</option></select></Field>
        <Field label="Placement"><select value={filters.placementState ?? 'shelved'} onChange={event => onChange({ placementState: event.target.value === 'unshelved' ? 'unshelved' : undefined })}><option value="shelved">In crates</option><option value="unshelved">Unshelved / wishlist candidates</option></select></Field>
        <Field label="Sort"><select value={filters.sortBy} onChange={event => onChange({ sortBy: event.target.value as AlbumListFilters['sortBy'] })}><option value="artist">Artist</option><option value="title">Title</option><option value="release_date">Release date</option><option value="creation_date">Date added</option></select></Field>
        <Field label="Direction"><select value={filters.sortOrder} onChange={event => onChange({ sortOrder: event.target.value as AlbumListFilters['sortOrder'] })}><option value="asc">Ascending</option><option value="desc">Descending</option></select></Field>
        <label className="album-filters__deleted"><input type="checkbox" checked={filters.includeDeleted} onChange={event => onChange({ includeDeleted: event.target.checked })} /> Include deleted albums</label>
        <Button type="button" variant="secondary" onClick={onClear}>Clear filters</Button>
    </form>
}

function AlbumBrowseLayout({ controls, children }: { controls: ReactNode; children: ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false)
    return <div className="album-browser"><aside className="album-browser__rail" aria-label="Album browse controls"><h2>Browse</h2>{controls}</aside><div className="album-browser__mobile"><button type="button" className="books-toolbar__mobile-toggle album-browser__mobile-toggle" aria-expanded={mobileOpen} aria-controls="album-browser-mobile-controls" onClick={() => setMobileOpen(open => !open)}><span className="books-toolbar__mobile-toggle-label">Filters &amp; search <span aria-hidden="true">{mobileOpen ? '▴' : '▾'}</span></span><span className="books-toolbar__mobile-toggle-hint">{mobileOpen ? 'Tap to collapse controls' : 'Tap to expand controls'}</span></button><div id="album-browser-mobile-controls" className={mobileOpen ? 'album-browser__mobile-controls album-browser__mobile-controls--open' : 'album-browser__mobile-controls'}>{controls}</div></div><div className="album-browser__results">{children}</div></div>
}

export function AlbumsPage() {
    const location = useLocation()
    const [params, setParams] = useSearchParams()
    const filters = parseAlbumListParams(params)
    const query = useInfiniteAlbums(filters)
    const albums = flattenAlbumPages(query.data?.pages)
    const total = query.data?.pages[0]?.total ?? 0
    const { fetchNextPage } = query
    const fetchNext = useCallback(() => { void fetchNextPage() }, [fetchNextPage])
    const { getRowRef } = useInfiniteScrollTrigger({ enabled: query.isSuccess, hasNextPage: query.hasNextPage, isFetchingNextPage: query.isFetchingNextPage, fetchNextPage: fetchNext, itemCount: albums.length })
    const [scannerOpen, setScannerOpen] = useState(false)
    const change = (updates: Partial<AlbumListFilters>) => setParams(updateAlbumListParams(params, updates), { replace: true })
    const clear = () => setParams(new URLSearchParams(), { replace: true })
    const controls = <AlbumControls filters={filters} onChange={change} onClear={clear} onScanBarcode={() => setScannerOpen(true)} />

    return <section className="page page--albums"><header className="page-header album-room__header"><div className="albums-page__heading"><h1 tabIndex={-1}>Albums</h1><p>{total} albums in the library.</p></div><div className="form-actions"><AppLink className="button button--secondary" to="/albums/bulk-add">Bulk add</AppLink><AppLink className="button button--primary" to="/albums/new">Add album</AppLink></div></header>
        <AlbumBrowseLayout controls={controls}>{query.isPending ? <LoadingState label="Loading albums…" /> : query.isError ? <QueryErrorState title="Unable to load albums" error={query.error} onRetry={() => void query.refetch()} /> : total === 0 ? <EmptyState title="No albums found"><p>Add a release or change the filters.</p><Button type="button" variant="secondary" onClick={clear}>Clear filters</Button></EmptyState> : <><div className="album-grid" aria-label="Library albums">{albums.map((album, index) => <article ref={getRowRef(index)} className="album-card" key={album.album_id}><AppLink to={`/albums/${album.album_id}`} state={{ albumsReturnTo: `${location.pathname}${location.search}`, albumScrollY: window.scrollY, albumPlacementState: filters.placementState ?? 'shelved' }}><AlbumArtwork albumId={album.album_id} title={album.title} present={album.artwork_present} /><div className="album-card__copy"><div className="album-card__heading"><h2>{album.title}</h2><p className="album-card__artist">{formatAlbumArtists(album)}</p></div><dl className="album-card__metadata"><div><dt>Format</dt><dd>{displayMediaFormat(album.media_format)}</dd></div>{album.release_date ? <div><dt>Year</dt><dd>{album.release_date.slice(0, 4)}</dd></div> : null}{album.shelf_name ? <div><dt>Crate</dt><dd>{album.shelf_name}</dd></div> : null}</dl>{album.status === 'on_loan' ? <span className="album-card__stamp">On loan</span> : null}{album.deletion_date ? <span className="album-card__stamp">Deleted</span> : null}</div></AppLink>{filters.placementState === 'unshelved' && !album.deletion_date ? <AddAlbumToWishlistControl compact albumId={album.album_id} albumTitle={album.title} /> : null}</article>)}</div>{query.isFetchingNextPage ? <div className="infinite-scroll__footer"><LoadingState label="Loading more albums…" /></div> : null}{query.isFetchNextPageError ? <div className="infinite-scroll__footer"><Alert variant="error">Unable to load more albums.</Alert><Button variant="secondary" onClick={fetchNext}>Retry</Button></div> : null}</>}</AlbumBrowseLayout>
        {scannerOpen ? <Suspense fallback={<LoadingState label="Loading camera scanner…" />}><AlbumBarcodeCameraScanner onDetected={value => { change({ barcode: value }); setScannerOpen(false) }} onCancel={() => setScannerOpen(false)} /></Suspense> : null}
        <BackToTop enabled={albums.length > 30} focusSelector=".albums-page__heading h1" />
    </section>
}
