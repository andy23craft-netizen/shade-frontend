import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AppLink } from '../../../components/AppLink'
import { Button } from '../../../components/Button'
import { LoadingState } from '../../../components/LoadingState'
import { QueryErrorState } from '../../../components/QueryErrorState'
import { useAuth } from '../../auth/useAuth'
import { createPdfLibraryApi, type PdfEntry } from '../../../api/pdfLibraryApi'

interface Folder { identifier?: string; name: string }

export function PdfLibraryPage() {
    const { apiClient } = useAuth()
    const api = createPdfLibraryApi(apiClient)
    const [trail, setTrail] = useState<Folder[]>([{ name: 'PDF Library' }])
    const [opening, setOpening] = useState<string | null>(null)
    const [openError, setOpenError] = useState<string | null>(null)
    const current = trail[trail.length - 1]
    const listing = useQuery({ queryKey: ['pdf-library', current.identifier ?? null], queryFn: () => api.list(current.identifier), retry: false, staleTime: 0 })

    async function open(entry: PdfEntry, download: boolean) {
        const viewer = download ? null : window.open('', '_blank')
        if (viewer) viewer.opener = null
        setOpening(entry.identifier)
        setOpenError(null)
        try {
            const url = await api.handoff(entry.identifier, download)
            if (download || !viewer) window.location.assign(url)
            else viewer.location.replace(url)
        } catch {
            viewer?.close()
            setOpenError('The PDF could not be opened. Please try again.')
        } finally {
            setOpening(null)
        }
    }

    return <section className="route-page pdf-library-page">
        <AppLink to="/collection/manage" variant="secondary">← Manage Collection</AppLink>
        <h1 tabIndex={-1}>PDF Library</h1>
        <p>Browse the library’s private PDF files.</p>
        <nav aria-label="PDF folders" className="pdf-library-breadcrumbs">
            {trail.map((folder, index) => <span key={index}>
                {index > 0 ? ' / ' : ''}
                <button type="button" aria-current={index === trail.length - 1 ? 'page' : undefined} onClick={() => setTrail(trail.slice(0, index + 1))}>{folder.name}</button>
            </span>)}
        </nav>
        {trail.length > 1 ? <Button type="button" variant="secondary" onClick={() => setTrail(trail.slice(0, -1))}>← Back</Button> : null}
        {listing.isPending ? <LoadingState label="Loading PDFs…" /> : null}
        {listing.isError ? <QueryErrorState title="PDF Library unavailable" error={listing.error} onRetry={() => void listing.refetch()} /> : null}
        {openError ? <p role="alert">{openError}</p> : null}
        {listing.data && listing.data.items.length === 0 ? <p>This folder is empty.</p> : null}
        {listing.data ? <ul className="pdf-library-list">{listing.data.items.map((entry) => <li key={entry.identifier}>
            {entry.kind === 'directory' ? <button type="button" onClick={() => setTrail([...trail, { identifier: entry.identifier, name: entry.name }])}>📁 {entry.name}</button> : <div>
                <span>📄 {entry.name}</span>
                {typeof entry.size === 'number' ? <small> · {Intl.NumberFormat().format(entry.size)} bytes</small> : null}
                <div className="pdf-library-actions"><Button type="button" variant="secondary" disabled={opening !== null} onClick={() => void open(entry, false)}>Open</Button><Button type="button" variant="secondary" disabled={opening !== null} onClick={() => void open(entry, true)}>Download</Button></div>
            </div>}
        </li>)}</ul> : null}
    </section>
}
