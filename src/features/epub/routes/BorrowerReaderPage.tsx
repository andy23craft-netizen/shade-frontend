import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createApiClient } from '../../../api/apiClient'
import { createEpubApi, type EpubProgress } from '../../../api/epubApi'
import { EpubReader } from '../components/EpubReader'

export function BorrowerReaderPage() {
    const [state, setState] = useState<{ bytes: ArrayBuffer; progress: EpubProgress } | null>(null)
    const [error, setError] = useState<string | null>(null)
    const invitationRef = useRef(new URL(window.location.href).searchParams.get('invitation'))
    // The HttpOnly cookie is scoped to /epub-reader, so these same-origin
    // requests intentionally bypass the normal /api prefix.
    const api = useMemo(() => createEpubApi(createApiClient({ apiBaseUrl: '' })), [])

    const load = useCallback(async () => {
        try {
            if (invitationRef.current) {
                await api.redeem(invitationRef.current)
                invitationRef.current = null
            }
            const [bytes, progress] = await Promise.all([api.borrowerContent(), api.borrowerProgress()])
            setState({ bytes, progress })
        } catch {
            setError('This reader link is unavailable or has expired. Ask the library for a new link.')
        }
    }, [api])

    useEffect(() => {
        document.title = 'Private EPUB Reader'
        let referrer = document.querySelector<HTMLMetaElement>('meta[name="referrer"]')
        if (!referrer) { referrer = document.createElement('meta'); referrer.name = 'referrer'; document.head.append(referrer) }
        referrer.content = 'no-referrer'
        window.history.replaceState(null, '', '/epub-reader')
        queueMicrotask(() => void load())
    }, [load])

    return <main className="borrower-reader-page">
        <header><h1>Private EPUB Reader</h1></header>
        {error ? <div role="alert"><p>{error}</p><button type="button" onClick={() => { setError(null); void load() }}>Retry reader session</button></div> : null}
        {!state && !error ? <p role="status">Opening your book…</p> : null}
        {state ? <EpubReader bytes={state.bytes} initial={state.progress} save={api.saveBorrowerProgress} refresh={api.borrowerProgress} /> : null}
    </main>
}
