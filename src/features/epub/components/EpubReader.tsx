import { useEffect, useRef, useState } from 'react'
import ePub, { type Location } from 'epubjs'
import type { EpubProgress, EpubProgressWrite } from '../../../api/epubApi'

interface Props {
    bytes: ArrayBuffer
    initial: EpubProgress
    save: (value: EpubProgressWrite) => Promise<EpubProgress>
    refresh: () => Promise<EpubProgress>
    onNaturalEnd?: () => void
}

export function EpubReader({ bytes, initial, save, refresh, onNaturalEnd }: Props) {
    const mount = useRef<HTMLDivElement>(null)
    const rendition = useRef<ReturnType<ReturnType<typeof ePub>['renderTo']> | null>(null)
    const revision = useRef(initial.revision)
    const latest = useRef<EpubProgressWrite | null>(null)
    const busy = useRef(false)
    const conflicted = useRef(false)
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [status, setStatus] = useState('Opening book…')
    const [atEnd, setAtEnd] = useState(false)
    const [hasConflict, setHasConflict] = useState(false)

    async function flush() {
        if (busy.current || conflicted.current || !latest.current) return
        busy.current = true
        const write = { ...latest.current, base_revision: revision.current }
        latest.current = null
        let failed = false
        try {
            const accepted = await save(write)
            revision.current = accepted.revision
            setStatus('Position saved')
        } catch (error) {
            const errorStatus = typeof error === 'object' && error !== null && 'status' in error ? error.status : null
            if (errorStatus === 409) {
                try {
                    const current = await refresh()
                    revision.current = current.revision
                    latest.current = null
                    conflicted.current = true
                    setHasConflict(true)
                    setStatus('Another device has a newer position. Follow it before saving here again.')
                } catch { setStatus('Could not refresh progress. Please retry.') }
            } else if (errorStatus === 403) {
                conflicted.current = true
                latest.current = null
                setStatus('Reader access has ended. Ask the library for a new invitation if needed.')
            } else {
                failed = true
                latest.current ??= write
                setStatus('Position has not synced. Retry when connected.')
            }
        } finally {
            busy.current = false
            if (latest.current && !failed && !conflicted.current) timer.current = setTimeout(() => void flush(), 1000)
        }
    }

    useEffect(() => {
        if (!mount.current) return
        let disposed = false
        const book = ePub(bytes)
        const view = book.renderTo(mount.current, { width: '100%', height: '100%', flow: 'paginated', spread: 'none' })
        rendition.current = view
        const relocated = (location: Location) => {
            if (disposed || !location.start?.cfi) return
            if (conflicted.current) return
            latest.current = { base_revision: revision.current, cfi: location.start.cfi, chapter: location.start.href ?? null, chapter_progress: null, progress_percent: null, completed: location.atEnd }
            setAtEnd(location.atEnd)
            setStatus('Position waiting to sync…')
            if (timer.current) clearTimeout(timer.current)
            timer.current = setTimeout(() => void flush(), 900)
            if (location.atEnd) onNaturalEnd?.()
        }
        view.on('relocated', relocated)
        void view.display(initial.completed ? undefined : initial.cfi ?? undefined).then(() => { if (!disposed) setStatus('Reading') }).catch(() => { if (!disposed) setStatus('Unable to display this EPUB.') })
        return () => {
            disposed = true
            if (timer.current) clearTimeout(timer.current)
            view.off('relocated', relocated)
            view.destroy()
            book.destroy()
            rendition.current = null
        }
    // The renderer lifecycle is tied to EPUB bytes and the initial position.
    // Progress callbacks should not recreate the iframe while someone reads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bytes, initial.cfi, initial.completed])

    return <div className="epub-reader">
        <div className="epub-reader__controls">
            <button type="button" onClick={() => void rendition.current?.prev()}>← Previous</button>
            <span role="status">{status}</span>
            <button type="button" onClick={() => void rendition.current?.next()}>Next →</button>
        </div>
        <div ref={mount} className="epub-reader__pages" aria-label="EPUB book content" />
        {hasConflict ? <button type="button" onClick={() => { void refresh().then(async (current) => { revision.current = current.revision; await rendition.current?.display(current.cfi ?? undefined); conflicted.current = false; setHasConflict(false); setStatus('Following the newer saved position') }).catch(() => setStatus('Could not refresh progress. Please retry.')) }}>Follow newer saved position</button> : null}
        {status.includes('not synced') || status.includes('Could not refresh') ? <button type="button" onClick={() => void flush()}>Retry saving position</button> : null}
        {atEnd ? <p>You have reached the end of the book.</p> : null}
    </div>
}
