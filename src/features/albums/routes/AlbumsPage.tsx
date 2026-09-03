import { useSearchParams } from 'react-router-dom'
import { useAlbums } from '../../../api/albumsQueries'
import { AppLink, EmptyState, Field, LoadingState, QueryErrorState } from '../../../components'
import { AlbumArtwork } from '../components/AlbumArtwork'
import { displayMediaFormat, formatAlbumArtists } from '../albumDisplay'
export function AlbumsPage() {
    const [params, setParams] = useSearchParams(); const title = params.get('title') ?? ''; const artist = params.get('artist') ?? ''; const format = params.get('media_format') ?? ''
    const query = useAlbums({ title, artist, mediaFormat: format || undefined, sortBy: 'artist', sortOrder: 'asc' })
    const update = (name: string, value: string) => { const next = new URLSearchParams(params); if (value.trim()) next.set(name, value); else next.delete(name); setParams(next, { replace: true }) }
    return <section className="page page--albums"><header className="page-header album-room__header"><p className="page-eyebrow">The listening room</p><h1>Albums</h1><p>Flip through the record bins, inspect a release, or put something on.</p><AppLink className="button button--primary" to="/albums/new">Add album</AppLink></header>
        <div className="album-filters"><Field label="Artist"><input type="search" value={artist} onChange={e => update('artist', e.target.value)} /></Field><Field label="Title"><input type="search" value={title} onChange={e => update('title', e.target.value)} /></Field><Field label="Format"><select value={format} onChange={e => update('media_format', e.target.value)}><option value="">All formats</option><option value="vinyl">Vinyl</option><option value="cd">CD</option><option value="cassette">Cassette</option><option value="other">Other</option><option value="unknown">Unknown</option></select></Field></div>
        {query.isPending ? <LoadingState label="Loading albums…" /> : query.isError ? <QueryErrorState title="Unable to load albums" error={query.error} onRetry={() => void query.refetch()} /> : query.data.items.length === 0 ? <EmptyState title="No albums found">Add a release or change the bin filters.</EmptyState> : <div className="album-grid">{query.data.items.map(album => <article className="album-card" key={album.album_id}><AppLink to={`/albums/${album.album_id}`}><AlbumArtwork albumId={album.album_id} title={album.title} present={album.artwork_present} /><div className="album-card__copy"><h2>{album.title}</h2><p>{formatAlbumArtists(album)}</p><p className="album-card__meta">{displayMediaFormat(album.media_format)} · {album.release_date?.slice(0, 4) ?? 'Year unknown'} · {album.shelf_name}</p>{album.status === 'on_loan' ? <span className="album-card__stamp">On loan</span> : null}</div></AppLink></article>)}</div>}
    </section>
}
