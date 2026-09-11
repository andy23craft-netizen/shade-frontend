import { useEffect, useRef, useState } from 'react'
import { AppLink, Alert, Button, EmptyState } from '../../../components'
import { isApiError } from '../../../api/apiErrors'
import { useCatalogImageSearch } from '../../../api/catalogQueries'
import type { ImageSearchResponse } from '../../../api/apiTypes'
import { externalAlbumLookup, externalBookIsbn, externalCandidateDetails, externalCandidateTitle, type ExternalImageCandidate } from '../externalImageCandidate'

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function errorMessage(error: unknown): string {
    if (isApiError(error)) {
        if (error.status === 422) return 'Shade could not use that image. Choose a JPEG, PNG, or WebP image up to 5 MB and try again.'
        if (error.status === 502) return 'The text-recognition provider is unavailable. Your image was not saved; try again shortly.'
        if (error.status === 504 || error.kind === 'timeout') return 'Text recognition took too long. Your image was not saved; try again.'
    }
    return 'The image search could not be completed. Your image was not saved; try again.'
}

function candidatePath(mediaType: 'book' | 'album', itemId: string): string {
    return mediaType === 'book' ? `/books/${itemId}` : `/albums/${itemId}`
}

export function CatalogImageSearchPage() {
    const search = useCatalogImageSearch()
    const inputRef = useRef<HTMLInputElement>(null)
    const previewUrlRef = useRef<string | null>(null)
    const [file, setFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [result, setResult] = useState<ImageSearchResponse | null>(null)
    const [selectionError, setSelectionError] = useState<string | null>(null)
    const [searchError, setSearchError] = useState<string | null>(null)

    function releasePreview() {
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = null
    }

    useEffect(() => () => releasePreview(), [])

    function select(next: File | undefined) {
        releasePreview()
        setResult(null); setSearchError(null); setSelectionError(null); setFile(null); setPreviewUrl(null)
        if (!next) return
        if (next.type && !ACCEPTED_TYPES.has(next.type)) {
            setSelectionError('Choose a JPEG, PNG, or WebP image.')
            return
        }
        if (next.size > 5 * 1024 * 1024) {
            setSelectionError('Choose an image no larger than 5 MB.')
            return
        }
        const url = URL.createObjectURL(next)
        previewUrlRef.current = url
        setPreviewUrl(url); setFile(next)
    }

    function clear() {
        select(undefined)
        if (inputRef.current) inputRef.current.value = ''
        inputRef.current?.focus()
    }

    function submit() {
        if (!file || search.isPending) return
        setSearchError(null); setResult(null)
        search.mutate(file, {
            onSuccess: setResult,
            onError: (error) => setSearchError(errorMessage(error)),
        })
    }

    const hasText = (result?.recognized_text.length ?? 0) > 0
    const hasLocalCandidates = (result?.candidates.length ?? 0) > 0
    const externalBooks = (result?.external_book_candidates ?? []) as ExternalImageCandidate[]
    const externalAlbums = (result?.external_album_candidates ?? []) as ExternalImageCandidate[]
    const hasExternalCandidates = externalBooks.length > 0 || externalAlbums.length > 0

    return <section className="page catalog-image-search" aria-labelledby="catalog-image-search-heading">
        <header className="page-header"><div><h1 id="catalog-image-search-heading" tabIndex={-1}>Search by cover or artwork</h1><p>Choose a book cover or album artwork. Shade reads it once and asks its catalog providers for suggestions.</p></div></header>
        <form className="catalog-image-search__form" onSubmit={(event) => { event.preventDefault(); submit() }}>
            <label htmlFor="catalog-image-input">Cover or artwork image</label>
            <input id="catalog-image-input" ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => select(event.target.files?.[0])} />
            <p className="field__help">JPEG, PNG, or WebP, up to 5 MB. On a phone, choose the camera when it is offered.</p>
            <div className="catalog-image-search__actions"><Button type="submit" disabled={!file || search.isPending}>{search.isPending ? 'Searching image…' : 'Search image'}</Button><Button type="button" variant="secondary" disabled={!file && !selectionError} onClick={clear}>Clear image</Button></div>
        </form>
        {previewUrl ? <figure className="catalog-image-search__preview"><img src={previewUrl} alt={`Selected image: ${file?.name ?? 'catalog image'}`} /><figcaption>{file?.name}</figcaption></figure> : null}
        {selectionError ? <Alert variant="error">{selectionError}</Alert> : null}
        {search.isPending ? <p role="status" aria-live="polite">Searching the image. This can take a moment.</p> : null}
        {searchError ? <Alert variant="error">{searchError}</Alert> : null}
        {result && hasText ? <section className="catalog-image-search__recognized" aria-labelledby="recognized-text-heading"><h2 id="recognized-text-heading">Recognized text</h2><p>This is context from the image, not a saved search or an automatic match.</p><ul>{result.recognized_text.map((entry, index) => <li key={`${entry.text}-${index}`}>{entry.text}{entry.confidence === null || entry.confidence === undefined ? null : ` (${Math.round(entry.confidence * 100)}% recognition confidence)`}</li>)}</ul></section> : null}
        {result && !hasText ? <EmptyState title="No usable text was found"><p>Try a clearer, well-lit photo that fills more of the frame, or choose a different image.</p></EmptyState> : null}
        {result && hasText && !hasLocalCandidates && !hasExternalCandidates ? <EmptyState title="No matches were found"><p>Try another image, or browse the book and album catalogs directly.</p><p><AppLink to="/books">Browse books</AppLink> · <AppLink to="/albums">Browse albums</AppLink></p></EmptyState> : null}
        {result && hasLocalCandidates ? <section aria-labelledby="image-search-results-heading"><h2 id="image-search-results-heading">Already in your catalog</h2><p>Choose an item to open it; image search never opens a result automatically.</p><ul className="catalog-image-search__results" aria-label="Local image search suggestions">{result.candidates.map((candidate) => <li key={`${candidate.media_type}-${candidate.item_id}`}><AppLink to={candidatePath(candidate.media_type, candidate.item_id)}><strong>{candidate.title}</strong></AppLink><dl><div><dt>Type</dt><dd>{candidate.media_type === 'book' ? 'Book' : 'Album'}</dd></div><div><dt>Matched</dt><dd>{candidate.matched_fields.join(', ') || 'Catalog text'}</dd></div><div><dt>Score</dt><dd>{candidate.score}</dd></div></dl></li>)}</ul></section> : null}
        {result && externalBooks.length > 0 ? <section aria-labelledby="external-book-results-heading"><h2 id="external-book-results-heading">Book suggestions from Open Library</h2><p>Select a result to start a new-book lookup. Nothing is added until you save it.</p><ul className="catalog-image-search__results" aria-label="External book suggestions">{externalBooks.map((candidate, index) => { const isbn = externalBookIsbn(candidate); const title = externalCandidateTitle(candidate, `Book result ${index + 1}`); return <li key={`book-${index}`}><strong>{title}</strong>{externalCandidateDetails(candidate) ? <p>{externalCandidateDetails(candidate)}</p> : null}{isbn ? <AppLink to={`/books/new?isbn=${encodeURIComponent(isbn)}`}>Use this book suggestion</AppLink> : <p>Review this suggestion manually; the provider did not supply an ISBN for lookup.</p>}</li> })}</ul></section> : null}
        {result && externalAlbums.length > 0 ? <section aria-labelledby="external-album-results-heading"><h2 id="external-album-results-heading">Album suggestions from Discogs and MusicBrainz</h2><p>Select a result to start a new-album lookup. Nothing is added until you save it.</p><ul className="catalog-image-search__results" aria-label="External album suggestions">{externalAlbums.map((candidate, index) => { const lookup = externalAlbumLookup(candidate); const title = externalCandidateTitle(candidate, `Album result ${index + 1}`); const href = lookup ? `/albums/new?${lookup.kind === 'barcode' ? 'barcode' : 'discogs_release_id'}=${encodeURIComponent(lookup.value)}` : null; return <li key={`album-${index}`}><strong>{title}</strong>{externalCandidateDetails(candidate) ? <p>{externalCandidateDetails(candidate)}</p> : null}{href ? <AppLink to={href}>Use this album suggestion</AppLink> : <p>Review this suggestion manually; the provider did not supply a barcode or Discogs release ID for lookup.</p>}</li> })}</ul></section> : null}
    </section>
}
