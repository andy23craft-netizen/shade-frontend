import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBulkAlbumImport, useBulkAlbumLookup } from '../../../api/albumsQueries'
import { useArtists, useCreateArtist } from '../../../api/artistsQueries'
import { useGenres, useCreateGenre } from '../../../api/genresQueries'
import { useShelves } from '../../../api/shelvesQueries'
import { Alert, AppLink, Button, Field, LoadingState, QueryErrorState } from '../../../components'
import { resolveLibraryContext } from '../../../config/libraryContext'
import { formatShelfCommonNameForDisplay } from '../../shelves/shelfDisplay'
import { albumBulkStorageKey, albumCatalogStateLabel, albumLookupStatusLabel, canImportAlbum, draftFromAlbumLookup, emptyAlbumDraft, loadAlbumBulkSession, type AlbumBulkQueueItem, type AlbumCaptureKind } from '../albumBulkAddModel'

const MAX_ITEMS = 50
const FORMATS = ['vinyl', 'cd', 'cassette', 'other', 'unknown'] as const
const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
const displayArtist = (artist: { first_name?: string | null; surname: string }) => [artist.first_name, artist.surname].filter(Boolean).join(' ')
const parseManualArtists = (value: string) => value.split(/\s*(?:;|&)\s*/).map(name => name.trim()).filter(Boolean).map(name => { const bits = name.split(/\s+/); const surname = bits.pop() ?? name; return { first_name: bits.join(' ') || null, surname } })
const statusDetail = (item: AlbumBulkQueueItem) => item.saveDetail ?? (item.result?.catalog_state ? albumCatalogStateLabel(item.result.catalog_state) : albumLookupStatusLabel(item.status))

export function AlbumBulkAddPage() {
    const navigate = useNavigate()
    const storageKey = albumBulkStorageKey(window.location.hostname)
    const [initialSession] = useState(() => loadAlbumBulkSession(window.localStorage, storageKey))
    const [shelfName, setShelfName] = useState(initialSession?.shelfName ?? '')
    const [started, setStarted] = useState(initialSession?.started ?? false)
    const [queue, setQueue] = useState<AlbumBulkQueueItem[]>(initialSession?.queue ?? [])
    const sequence = useRef(initialSession?.nextSequence ?? 1)
    const [kind, setKind] = useState<AlbumCaptureKind>('barcode')
    const [capture, setCapture] = useState('')
    const [manualTitle, setManualTitle] = useState('')
    const [manualArtists, setManualArtists] = useState('')
    const [message, setMessage] = useState<string | null>(initialSession ? 'Restored your saved album intake session.' : null)
    const [error, setError] = useState<string | null>(null)
    const lookup = useBulkAlbumLookup()
    const importer = useBulkAlbumImport()
    const shelves = useShelves()
    const artists = useArtists()
    const genres = useGenres()
    const createArtist = useCreateArtist()
    const createGenre = useCreateGenre()
    const library = resolveLibraryContext(window.location.hostname)

    const assignableShelves = (shelves.data ?? []).filter(shelf => shelf.common_name !== 'removed')
    const pendingLookup = queue.filter(item => item.status === 'queued').slice(0, MAX_ITEMS)
    const importable = useMemo(() => queue.filter(canImportAlbum), [queue])
    const hasUnresolved = queue.some(item => item.saveStatus !== 'created' && item.saveStatus !== 'wishlist_acquired')

    useEffect(() => {
        window.localStorage.setItem(storageKey, JSON.stringify({ shelfName, started, queue, nextSequence: sequence.current }))
    }, [queue, shelfName, started, storageKey])

    useEffect(() => {
        const protect = (event: BeforeUnloadEvent) => { if (started && hasUnresolved) event.preventDefault() }
        window.addEventListener('beforeunload', protect)
        return () => window.removeEventListener('beforeunload', protect)
    }, [hasUnresolved, started])

    useEffect(() => {
        if (!started || lookup.isPending || pendingLookup.length === 0) return
        const ids = new Set(pendingLookup.map(item => item.clientItemId))
        const timer = window.setTimeout(() => {
        setQueue(current => current.map(item => ids.has(item.clientItemId) ? { ...item, status: 'looking_up' } : item))
        void lookup.mutateAsync({ items: pendingLookup.map(item => item.kind === 'manual'
            ? { client_item_id: item.clientItemId, manual: { title: item.draft.title, artists: parseManualArtists(item.draft.artistNames.join('; ')), genres: [], media_format: 'unknown', tracks: [] } }
            : item.kind === 'barcode' ? { client_item_id: item.clientItemId, barcode: item.value } : { client_item_id: item.clientItemId, discogs_release_id: item.value }) })
            .then(response => setQueue(current => current.map(item => {
                const result = response.items.find(candidate => candidate.client_item_id === item.clientItemId)
                if (!result || !ids.has(item.clientItemId)) return item
                const hydrated = draftFromAlbumLookup(result)
                return { ...item, result, status: result.status, draft: { ...hydrated,
                    artistIds: hydrated.artistNames.map(name => artists.data?.items.find(a => normalizeName(displayArtist(a)) === normalizeName(name))?.artist_id).filter((id): id is string => Boolean(id)),
                    genreIds: hydrated.genreNames.map(name => genres.data?.find(g => normalizeName(g.name) === normalizeName(name))?.genre_id).filter((id): id is string => Boolean(id)),
                } }
            }))).catch(cause => { setError(cause instanceof Error ? cause.message : 'Album lookup failed.'); setQueue(current => current.map(item => ids.has(item.clientItemId) ? { ...item, status: 'lookup_failed' } : item)) })
        }, 0)
        return () => window.clearTimeout(timer)
    // Catalog query results are deliberately read at lookup completion to resolve canonical references.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [started, queue.map(item => item.status).join('|')])

    if (shelves.isPending || artists.isPending || genres.isPending) return <LoadingState label="Loading album intake…" />
    if (shelves.isError || artists.isError || genres.isError) return <QueryErrorState title="Unable to load album intake" error={shelves.error ?? artists.error ?? genres.error} />

    const addCapture = (event: FormEvent) => {
        event.preventDefault(); setError(null)
        const entries = kind === 'manual' ? [manualTitle.trim()] : capture.split(/[\n,]+/).map(value => value.trim()).filter(Boolean)
        if (!entries[0] || (kind === 'manual' && parseManualArtists(manualArtists).length === 0)) { setError(kind === 'manual' ? 'Manual rows require a title and at least one artist.' : 'Enter at least one identifier.'); return }
        if (queue.length + entries.length > MAX_ITEMS) { setError(`A session can contain at most ${MAX_ITEMS} albums.`); return }
        const additions = entries.map(value => { const clientItemId = `album-${Date.now()}-${sequence.current++}`; return { clientItemId, kind, value, status: 'queued' as const, draft: kind === 'manual' ? { ...emptyAlbumDraft(), title: value, artistNames: parseManualArtists(manualArtists).map(displayArtist) } : emptyAlbumDraft() } })
        setQueue(current => [...current, ...additions]); setCapture(''); setManualTitle(''); setManualArtists(''); setMessage(`${additions.length} album${additions.length === 1 ? '' : 's'} added to the queue.`)
    }

    const updateDraft = (id: string, patch: Partial<AlbumBulkQueueItem['draft']>) => setQueue(current => current.map(item => item.clientItemId === id ? { ...item, draft: { ...item.draft, ...patch }, saveDetail: undefined } : item))
    const retry = (id: string) => setQueue(current => current.map(item => item.clientItemId === id ? { ...item, status: 'queued', saveDetail: undefined } : item))
    const addCanonicalArtist = async (id: string) => { const raw = window.prompt('Artist name')?.trim(); if (!raw) return; const parsed = parseManualArtists(raw)[0]; const created = await createArtist.mutateAsync(parsed); updateDraft(id, { artistIds: [...(queue.find(x => x.clientItemId === id)?.draft.artistIds ?? []), created.artist_id] }) }
    const addCanonicalGenre = async (id: string) => { const name = window.prompt('Genre name')?.trim(); if (!name) return; const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); const created = await createGenre.mutateAsync({ name, slug }); updateDraft(id, { genreIds: [...(queue.find(x => x.clientItemId === id)?.draft.genreIds ?? []), created.genre_id] }) }
    const save = async () => {
        setError(null)
        try {
            const response = await importer.mutateAsync({ shelf_name: shelfName, items: importable.map(item => ({ client_item_id: item.clientItemId, action: item.result?.catalog_state === 'wishlist' ? 'acquire_wishlist' : 'create', existing_album_id: item.result?.catalog_state === 'wishlist' ? item.result.catalog_album_ids?.[0] ?? null : null, allow_duplicate: item.draft.allowDuplicate, album: { title: item.draft.title.trim(), artist_ids: item.draft.artistIds, genre_ids: item.draft.genreIds, media_format: item.draft.mediaFormat, barcode: item.draft.barcode || null, discogs_release_id: item.draft.discogsReleaseId || null, musicbrainz_release_id: item.draft.musicbrainzReleaseId || null, label: item.draft.label || null, release_date: item.draft.releaseDate || null } })) })
            setQueue(current => current.map(item => { const result = response.items.find(saved => saved.client_item_id === item.clientItemId); return result ? { ...item, saveStatus: result.status, saveDetail: result.detail ?? result.error_code ?? undefined } : item }))
            setMessage(`${response.created_count + response.wishlist_acquired_count} album${response.created_count + response.wishlist_acquired_count === 1 ? '' : 's'} saved. ${response.failed_count ? `${response.failed_count} still need attention.` : ''}`)
        } catch (cause) { setError(cause instanceof Error ? cause.message : 'The crate could not be saved.') }
    }
    const discard = () => { if (hasUnresolved && !window.confirm('Discard the unresolved album intake queue?')) return; window.localStorage.removeItem(storageKey); setQueue([]); setStarted(false); setShelfName(''); setMessage(null) }
    const nextCrate = () => { if (hasUnresolved && !window.confirm('Discard unresolved albums and start the next crate?')) return; setQueue([]); setStarted(false); setShelfName(''); setMessage(null) }
    const finish = () => { if (hasUnresolved && !window.confirm('Discard unresolved albums and finish bulk add?')) return; window.localStorage.removeItem(storageKey); navigate('/albums') }

    return <section className="route-page bulk-add-page album-bulk-add-page" aria-labelledby="album-bulk-title">
        <header className="bulk-add-page__heading"><div><p className="bulk-add-page__eyebrow">Album intake · {library?.name ?? 'Library'}</p><h1 id="album-bulk-title">Build a Crate</h1></div><p>Capture up to 50 releases, review their metadata, then save every valid row independently.</p></header>
        {!started ? <form className="bulk-add-setup" onSubmit={event => { event.preventDefault(); if (shelfName) setStarted(true) }}><h2>Choose a destination crate</h2><Field label="Destination crate"><select value={shelfName} onChange={event => setShelfName(event.target.value)} required><option value="">Select a crate</option>{assignableShelves.map(shelf => <option key={shelf.shelf_id} value={shelf.common_name}>{formatShelfCommonNameForDisplay(shelf.common_name)}</option>)}</select></Field><div className="form-actions"><Button type="submit" disabled={!shelfName}>Start capture</Button><AppLink className="button button--secondary" to="/shelves">Manage crates</AppLink></div></form> : <>
            <div className="bulk-add-session-bar"><strong>Crate: {formatShelfCommonNameForDisplay(shelfName)}</strong><Button type="button" variant="secondary" onClick={discard}>Cancel session</Button></div>
            <form className="bulk-add-capture" onSubmit={addCapture}><div><h2>Capture releases</h2><p>Barcode and Discogs inputs accept comma- or line-separated batches.</p></div><div className="bulk-add-capture__form"><Field label="Capture type"><select value={kind} onChange={event => setKind(event.target.value as AlbumCaptureKind)}><option value="barcode">Barcode</option><option value="discogs">Discogs release ID</option><option value="manual">Manual artist/title</option></select></Field>{kind === 'manual' ? <><Field label="Title"><input value={manualTitle} onChange={event => setManualTitle(event.target.value)} /></Field><Field label="Artists" helpText="Separate artists with semicolons"><input value={manualArtists} onChange={event => setManualArtists(event.target.value)} /></Field></> : <Field label={kind === 'barcode' ? 'Barcodes' : 'Discogs release IDs'}><textarea rows={3} value={capture} onChange={event => setCapture(event.target.value)} /></Field>}<Button type="submit" disabled={queue.length >= MAX_ITEMS}>Add to queue</Button></div></form>
            {message ? <Alert variant="info">{message}</Alert> : null}{error ? <Alert variant="error">{error}</Alert> : null}
            <section className="bulk-add-queue"><div className="bulk-add-queue__heading"><div><h2>Review queue</h2><p>{queue.length} of {MAX_ITEMS} rows</p></div></div>{queue.length === 0 ? <p className="bulk-add-queue__empty">Capture a release to begin.</p> : <ol className="bulk-add-queue__list">{queue.map(item => <li className="bulk-add-queue-item" key={item.clientItemId}><div className="bulk-add-queue-item__main"><div><strong className="bulk-add-queue-item__title">{item.draft.title || item.value || 'Manual album'}</strong><span className="bulk-add-queue-item__isbn">{item.kind === 'manual' ? 'Manual entry' : `${item.kind === 'barcode' ? 'Barcode' : 'Discogs'}: ${item.value}`}</span></div><div className="bulk-add-queue-item__status"><span>{item.saveStatus ? item.saveStatus.replaceAll('_', ' ') : statusDetail(item)}</span></div></div>
                {(item.status === 'looking_up' || item.status === 'queued') ? <p className="bulk-add-queue-item__detail" aria-live="polite">{albumLookupStatusLabel(item.status)}…</p> : <div className="bulk-add-review"><Field label="Title"><input value={item.draft.title} aria-invalid={!item.draft.title.trim()} onChange={event => updateDraft(item.clientItemId, { title: event.target.value })} /></Field><Field label="Format"><select value={item.draft.mediaFormat} onChange={event => updateDraft(item.clientItemId, { mediaFormat: event.target.value as typeof item.draft.mediaFormat })}>{FORMATS.map(format => <option key={format}>{format}</option>)}</select></Field><Field label="Artists"><div><div className="album-form__choices">{artists.data.items.map(artist => <label key={artist.artist_id}><input type="checkbox" checked={item.draft.artistIds.includes(artist.artist_id)} onChange={event => updateDraft(item.clientItemId, { artistIds: event.target.checked ? [...item.draft.artistIds, artist.artist_id] : item.draft.artistIds.filter(id => id !== artist.artist_id) })} /> {displayArtist(artist)}</label>)}</div><Button type="button" variant="secondary" onClick={() => void addCanonicalArtist(item.clientItemId)}>Add artist</Button></div></Field><Field label="Genres"><div><div className="album-form__choices">{genres.data.map(genre => <label key={genre.genre_id}><input type="checkbox" checked={item.draft.genreIds.includes(genre.genre_id)} onChange={event => updateDraft(item.clientItemId, { genreIds: event.target.checked ? [...item.draft.genreIds, genre.genre_id] : item.draft.genreIds.filter(id => id !== genre.genre_id) })} /> {genre.name}</label>)}</div><Button type="button" variant="secondary" onClick={() => void addCanonicalGenre(item.clientItemId)}>Add genre</Button></div></Field><Field label="Label"><input value={item.draft.label} onChange={event => updateDraft(item.clientItemId, { label: event.target.value })} /></Field><Field label="Release date"><input value={item.draft.releaseDate} onChange={event => updateDraft(item.clientItemId, { releaseDate: event.target.value })} /></Field>
                    {item.draft.artistNames.some(name => !artists.data.items.some(a => normalizeName(displayArtist(a)) === normalizeName(name))) ? <Alert variant="warning">Resolve lookup artists to canonical artist records before import: {item.draft.artistNames.join(', ')}.</Alert> : null}
                    {item.result?.catalog_state === 'wishlist' ? <label className="bulk-add-review__wishlist"><input type="checkbox" checked={item.draft.acquireWishlist} onChange={event => updateDraft(item.clientItemId, { acquireWishlist: event.target.checked })} /> Acquire the existing wishlist copy</label> : null}
                    {item.result?.catalog_state === 'owned' ? <label className="bulk-add-review__wishlist"><input type="checkbox" checked={item.draft.allowDuplicate} onChange={event => updateDraft(item.clientItemId, { allowDuplicate: event.target.checked })} /> This is a separate physical copy</label> : null}
                    {item.result?.catalog_state === 'soft_deleted' ? <Alert variant="warning">This matches a soft-deleted album. Restore it from the album catalog or edit this row; Bulk Add will not restore it.</Alert> : null}
                    {item.result?.catalog_state === 'ambiguous' || item.result?.catalog_state === 'unshelved' ? <Alert variant="warning">This catalog match must be resolved outside Bulk Add before it can be saved.</Alert> : null}
                    {item.saveDetail ? <Alert variant="error">{item.saveDetail}</Alert> : null}<Button type="button" variant="secondary" onClick={() => retry(item.clientItemId)}>Retry lookup</Button></div>}</li>)}</ol>}</section>
            <div className="bulk-add-save"><Button type="button" disabled={!importable.length || importer.isPending} onClick={() => void save()}>{importer.isPending ? 'Saving…' : `Save Crate (${importable.length})`}</Button></div>
            {queue.some(item => item.saveStatus === 'created' || item.saveStatus === 'wishlist_acquired') ? <div className="bulk-add-complete-actions"><Button type="button" variant="secondary" onClick={nextCrate}>Start Next Crate</Button><Button type="button" onClick={finish}>Finish Bulk Add</Button></div> : null}
        </>}
    </section>
}
