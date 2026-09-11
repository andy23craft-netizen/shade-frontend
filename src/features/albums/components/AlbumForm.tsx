import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { AlbumCreate, AlbumRead, AlbumTrackWrite, MediaFormat } from '../../../api/apiTypes'
import { useArtists, useCreateArtist } from '../../../api/artistsQueries'
import { useGenres, useCreateGenre } from '../../../api/genresQueries'
import { useShelves } from '../../../api/shelvesQueries'
import { useAlbumLookup } from '../../../api/albumsQueries'
import { Alert, AppLink, Button, Field, LoadingState, QueryErrorState } from '../../../components'
import { formatArtist } from '../albumDisplay'
import { buildAlbumFormPayload } from '../albumFormPayload'

const AlbumBarcodeCameraScanner = lazy(() => import('../../scanning/IsbnCameraScanner').then(module => ({ default: module.AlbumBarcodeCameraScanner })))

const FORMATS: MediaFormat[] = ['vinyl', 'cd', 'cassette', 'other', 'unknown']
const slugify = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export function AlbumVocabularyPicker({ label, options, selectedIds, onChange, onAdd }: { label: string; options: Array<{ id: string; name: string }>; selectedIds: string[]; onChange: (ids: string[]) => void; onAdd: () => void }) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const selected = options.filter(option => selectedIds.includes(option.id))
    const visible = options.filter(option => option.name.toLowerCase().includes(search.trim().toLowerCase()))
    const toggle = (id: string) => onChange(selectedIds.includes(id) ? selectedIds.filter(selectedId => selectedId !== id) : [...selectedIds, id])

    return <fieldset className="album-form__vocabulary"><legend>{label}</legend>
        {selected.length ? <div className="book-form__selected-categories" aria-label={`Selected ${label.toLowerCase()}`}>{selected.map(option => <button type="button" className="button button--secondary" key={option.id} onClick={() => toggle(option.id)} aria-label={`Remove ${option.name}`}>{option.name} ×</button>)}</div> : <p className="album-form__vocabulary-empty">No {label.toLowerCase()} selected.</p>}
        <div className="book-form__category-picker"><Button type="button" variant="secondary" aria-expanded={open} onClick={() => setOpen(current => !current)}>{open ? `Close ${label.toLowerCase()}` : `Select ${label.toLowerCase()}${selected.length ? ` (${selected.length})` : ''}`}</Button>
            {open ? <div className="book-form__category-dropdown"><Field label={`Search ${label.toLowerCase()}`}><input type="search" value={search} onChange={event => setSearch(event.target.value)} /></Field><div className="book-form__category-dropdown-list">{visible.map(option => <label className="book-form__category-option" key={option.id}><input type="checkbox" checked={selectedIds.includes(option.id)} onChange={() => toggle(option.id)} /><span>{option.name}</span></label>)}{visible.length === 0 ? <p>No matches.</p> : null}</div><Button type="button" variant="secondary" onClick={onAdd}>Add {label.slice(0, -1).toLowerCase()}</Button></div> : null}
        </div>
    </fieldset>
}

export function AlbumForm({ album, onSubmit, onCancel, submitting = false }: { album?: AlbumRead; onSubmit: (value: AlbumCreate) => Promise<void>; onCancel: () => void; submitting?: boolean }) {
    const artists = useArtists(); const genres = useGenres(); const shelves = useShelves(); const createArtist = useCreateArtist(); const createGenre = useCreateGenre()
    const [searchParams] = useSearchParams()
    const initialBarcode = album ? null : searchParams.get('barcode')?.trim() || null
    const initialDiscogs = album ? null : searchParams.get('discogs_release_id')?.trim() || null
    const initialLookup = initialBarcode || initialDiscogs
    const [title, setTitle] = useState(album?.title ?? ''); const [artistIds, setArtistIds] = useState(album?.artists.map(x => x.person_id) ?? []); const [genreIds, setGenreIds] = useState(album?.genres.map(x => x.genre_id) ?? []); const [format, setFormat] = useState<MediaFormat>(album?.media_format ?? 'unknown'); const [shelf, setShelf] = useState(album?.shelf_name ?? ''); const [barcode, setBarcode] = useState(album?.barcode ?? ''); const [label, setLabel] = useState(album?.label ?? ''); const [releaseDate, setReleaseDate] = useState(album?.release_date ?? ''); const [notes, setNotes] = useState(album?.notes ?? ''); const [tracks, setTracks] = useState(album?.tracks.map(x => x.title).join('\n') ?? ''); const [lookupValue, setLookupValue] = useState(initialLookup ?? ''); const [lookupKind, setLookupKind] = useState<'barcode' | 'discogs'>(initialBarcode ? 'barcode' : 'discogs'); const [lookupEnabled, setLookupEnabled] = useState(Boolean(initialLookup)); const [scannerOpen, setScannerOpen] = useState(false); const [error, setError] = useState<string | null>(null)
    const lookup = useAlbumLookup(lookupValue, lookupKind, lookupEnabled)
    // A completed external lookup intentionally hydrates the editable local draft.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { const draft = lookup.data?.draft; if (!lookup.data || !draft) return; setTitle(draft.title); setBarcode(draft.barcode ?? ''); setLabel(draft.label ?? ''); setReleaseDate(draft.release_date ?? ''); setFormat(draft.media_format); setTracks((draft.tracks ?? []).map(x => x.title).join('\n')); setLookupEnabled(false) }, [lookup.data])
    if (artists.isPending || genres.isPending || shelves.isPending) return <LoadingState label="Loading album form…" />
    if (artists.isError || genres.isError || shelves.isError) return <QueryErrorState title="Unable to load album form" error={artists.error ?? genres.error ?? shelves.error} />
    const submit = async (event: FormEvent) => { event.preventDefault(); setError(null); if (!title.trim()) { setError('Title is required.'); return } if (!artistIds.length) { setError('Select at least one artist.'); return } try { const parsedTracks: AlbumTrackWrite[] = tracks.split('\n').map(x => x.trim()).filter(Boolean).map((trackTitle, index) => ({ title: trackTitle, disc_number: 1, track_number: index + 1 })); await onSubmit(buildAlbumFormPayload({ title, artistIds, genreIds, mediaFormat: format, shelf, barcode, label, releaseDate, notes, tracks: parsedTracks, discogsReleaseId: album?.discogs_release_id ?? (lookupKind === 'discogs' && lookup.data?.found ? lookupValue : undefined), musicbrainzReleaseId: lookup.data?.draft?.musicbrainz_release_id ?? album?.musicbrainz_release_id }, album)) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to save album.') } }
    const addArtist = async () => { const name = prompt('Artist name (first name and surname)')?.trim(); if (!name) return; const parts = name.split(/\s+/); const created = await createArtist.mutateAsync({ surname: parts.pop()!, first_name: parts.join(' ') || null }); setArtistIds(x => [...x, created.person_id]) }
    const addGenre = async () => { const name = prompt('Genre name')?.trim(); if (!name) return; const created = await createGenre.mutateAsync({ name, slug: slugify(name) }); setGenreIds(x => [...x, created.genre_id]) }
    return <form className="album-form" onSubmit={submit}>
        {error ? <Alert variant="error">{error}</Alert> : null}
        <section className="album-form__lookup"><h2>Metadata lookup</h2><p>Find a release, review the draft, then save explicitly.</p><div className="album-form__lookup-row"><select aria-label="Lookup type" value={lookupKind} onChange={e => { const next = e.target.value as 'barcode' | 'discogs'; setLookupKind(next); if (next !== 'barcode') setScannerOpen(false) }}><option value="barcode">Barcode</option><option value="discogs">Discogs release ID</option></select><input aria-label="Lookup value" value={lookupValue} onChange={e => setLookupValue(e.target.value)} /><Button type="button" variant="secondary" disabled={!lookupValue.trim() || lookup.isFetching} onClick={() => setLookupEnabled(true)}>{lookup.isFetching ? 'Looking up…' : 'Look up'}</Button>{lookupKind === 'barcode' ? <Button type="button" variant="secondary" disabled={lookup.isFetching} onClick={() => setScannerOpen(true)}>Scan barcode</Button> : null}<AppLink to="/catalog/image-search" variant="secondary">Search by image</AppLink></div>{scannerOpen ? <Suspense fallback={<LoadingState label="Loading camera scanner…" />}><AlbumBarcodeCameraScanner onDetected={value => { setLookupValue(value); setLookupEnabled(true); setScannerOpen(false) }} onCancel={() => setScannerOpen(false)} /></Suspense> : null}{lookup.data && !lookup.data.found ? <Alert variant="info">No matching release was found. You can still enter it manually.</Alert> : null}</section>
        <section><h2>Release</h2><Field label="Title"><input value={title} onChange={e => setTitle(e.target.value)} required /></Field><AlbumVocabularyPicker label="Artists" options={artists.data.items.map(artist => ({ id: artist.person_id, name: formatArtist(artist) }))} selectedIds={artistIds} onChange={setArtistIds} onAdd={() => void addArtist()} /><AlbumVocabularyPicker label="Genres" options={genres.data.map(genre => ({ id: genre.genre_id, name: genre.name }))} selectedIds={genreIds} onChange={setGenreIds} onAdd={() => void addGenre()} /><Field label="Format"><select value={format} onChange={e => setFormat(e.target.value as MediaFormat)}>{FORMATS.map(x => <option key={x} value={x}>{x}</option>)}</select></Field><Field label="Crate"><select value={shelf} onChange={e => setShelf(e.target.value)}><option value="">No crate (wishlist only)</option>{shelves.data.filter(x => x.common_name !== 'removed').map(x => <option key={x.shelf_id} value={x.common_name}>{x.common_name}</option>)}</select></Field><Field label="Barcode"><input value={barcode} onChange={e => setBarcode(e.target.value)} /></Field><Field label="Label"><input value={label} onChange={e => setLabel(e.target.value)} /></Field><Field label="Release date"><input type="date" value={releaseDate} onChange={e => setReleaseDate(e.target.value)} /></Field></section>
        <section className="album-form__track-list"><h2>Track list</h2><Field label="Tracks" helpText="One track title per line, in play order"><textarea rows={8} value={tracks} onChange={e => setTracks(e.target.value)} /></Field><Field label="Notes"><textarea rows={5} value={notes} onChange={e => setNotes(e.target.value)} /></Field></section>
        <div className="album-form__actions"><Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save album'}</Button><Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button></div>
    </form>
}
