import { lazy, Suspense, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { createCatalogApi } from '../../api/catalogApi'
import { isApiError } from '../../api/apiErrors'
import type { PhysicalItemSummary } from '../../api/apiTypes'
import { Alert, AppLink, Button } from '../../components'
import { useConnection } from '../connection/useConnection'

const AlbumCatalogCodeCameraScanner = lazy(() => import('./IsbnCameraScanner').then((module) => ({
    default: module.AlbumCatalogCodeCameraScanner,
})))

function destination(candidate: PhysicalItemSummary, mediaType: 'book' | 'album'): string {
    if (mediaType === 'album') return `/albums/${candidate.item_id}`

    return candidate.status === 'on_loan'
        ? `/reading-room/loans?bookId=${encodeURIComponent(candidate.item_id)}`
        : `/books/${candidate.item_id}`
}

export function CatalogCodeResolver({
    mediaType = 'book',
}: {
    mediaType?: 'book' | 'album'
}) {
    const { apiClient } = useConnection()
    const navigate = useNavigate()
    const inputRef = useRef<HTMLInputElement>(null)
    const [value, setValue] = useState('')
    const [candidates, setCandidates] = useState<PhysicalItemSummary[] | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const [pending, setPending] = useState(false)
    const [cameraOpen, setCameraOpen] = useState(false)
    const itemName = mediaType === 'album' ? 'album' : 'book'
    const codeLabel = mediaType === 'album' ? 'Album code or barcode' : 'Book code or ISBN'

    function resolve(raw = value) {
        const trimmed = raw.trim()
        if (!trimmed || pending) return
        setPending(true); setMessage(null); setCandidates(null)
        void createCatalogApi(apiClient).resolveCode({ value: trimmed, active_media_type: mediaType }).then((response) => {
            if (response.candidates.length === 1 && response.kind === 'shade_item') {
                navigate(destination(response.candidates[0], mediaType)); return
            }
            setCandidates(response.candidates)
            if (response.candidates.length === 0) setMessage('No matching copy is available in this library.')
        }).catch((error: unknown) => {
            if (isApiError(error) && error.status === 404) setMessage('This item is not available in this library.')
            else if (isApiError(error) && error.status === 422) setMessage(`That scan is not a supported ${itemName} code or ${mediaType === 'album' ? 'barcode' : 'ISBN'}.`)
            else setMessage('The code could not be resolved. Try again.')
        }).finally(() => { setPending(false); inputRef.current?.focus() })
    }

    return <section className="catalog-code-resolver" aria-labelledby="catalog-code-heading">
        <h2 id="catalog-code-heading">Scan an {itemName}</h2>
        <p>Scan a Shade label or enter a {mediaType === 'album' ? 'barcode' : 'ISBN'} to open the matching copy.</p>
        <form onSubmit={(event) => { event.preventDefault(); resolve() }}>
            <label>{codeLabel}<input ref={inputRef} value={value} onChange={(event) => setValue(event.target.value)} autoComplete="off" /></label>
            <Button type="submit" disabled={pending || !value.trim()}>{pending ? 'Resolving…' : 'Resolve code'}</Button>
            {mediaType === 'album' ? <Button type="button" variant="secondary" onClick={() => setCameraOpen(true)}>Use camera</Button> : null}
        </form>
        {message ? <div role="status"><Alert variant="warning">{message}</Alert></div> : null}
        {candidates && candidates.length > 1 ? <ul aria-label={`Matching ${itemName}s`}>{candidates.map((candidate) => <li key={candidate.item_id}><AppLink to={destination(candidate, mediaType)}>{candidate.title}</AppLink> — {candidate.primary_creator} ({candidate.status.replaceAll('_', ' ')})</li>)}</ul> : null}
        {cameraOpen ? <Suspense fallback={<p role="status">Loading camera scanner…</p>}><AlbumCatalogCodeCameraScanner onDetected={(code) => { setValue(code); setCameraOpen(false); resolve(code) }} onCancel={() => setCameraOpen(false)} /></Suspense> : null}
    </section>
}
