import { useState } from 'react'
import { Alert } from '../../../components/Alert'
import { Button } from '../../../components/Button'
import { ConfirmationDialog } from '../../../components/ConfirmationDialog'
import { useBooks } from '../../../api/booksQueries'
import { useMergeWorks, useSplitWork, useWork } from '../../../api/worksQueries'
import type { BookRead } from '../../../api/apiTypes'
import { formatBookAuthors } from '../authorDisplay'

const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
const authors = (book: BookRead) => normalize(formatBookAuthors(book.authors))

export function WorkCorrection({ book }: { book: BookRead }) {
    const [open, setOpen] = useState(false); const [candidateId, setCandidateId] = useState(''); const [action, setAction] = useState<'merge' | 'split' | null>(null)
    const matchesQuery = useBooks({ enabled: open && Boolean(book.work_id) })
    const workQuery = useWork(book.work_id ?? '', open)
    const merge = useMergeWorks(); const split = useSplitWork()
    if (!book.work_id) return null
    if (!open) return <section className="book-details-panel"><h2>Possible duplicate copies</h2><p>Check only when you need to correct a duplicate grouping.</p><Button variant="secondary" onClick={() => setOpen(true)}>Check possible duplicates</Button></section>
    const matches = matchesQuery.data?.items.filter((item) => item.book_id !== book.book_id && item.work_id !== book.work_id && ((Boolean(book.isbn13?.trim()) && item.isbn13 === book.isbn13) || (normalize(item.title) === normalize(book.title) && authors(item) === authors(book)))) ?? []
    const candidate = matches.find((item) => item.book_id === candidateId)
    const copies = workQuery.data?.item_ids ?? []
    const error = merge.error ?? split.error
    const busy = merge.isPending || split.isPending
    return <section className="book-details-panel"><h2>Possible duplicate copies</h2><p>Only ISBN or title-and-author matches are offered. Check title, author, and shelf against the physical copy.</p>
        {matchesQuery.isPending ? <p>Checking for matches…</p> : matches.length ? <label>Matching copy <select value={candidateId} onChange={(event) => setCandidateId(event.target.value)}><option value="">Choose a matching copy</option>{matches.map((item) => <option key={item.book_id} value={item.book_id}>{item.title} — {formatBookAuthors(item.authors)} — {item.shelf_name ?? 'Unshelved'}</option>)}</select></label> : <p>No matching copies found.</p>}
        <Button variant="secondary" disabled={!candidate || busy} onClick={() => setAction('merge')}>Group as Same Work</Button>
        {copies.length > 1 ? <Button variant="secondary" disabled={busy} onClick={() => setAction('split')}>Separate from Work</Button> : null}
        {error ? <Alert variant="error">{error instanceof Error ? error.message : 'The correction could not be completed. Your selection was kept.'}</Alert> : null}
        <ConfirmationDialog open={action !== null} title={action === 'merge' ? 'Group as same work' : 'Separate from work'} confirmLabel={action === 'merge' ? 'Confirm grouping' : 'Confirm separation'} onCancel={() => setAction(null)} onConfirm={() => { if (action === 'merge' && candidate?.work_id) merge.mutate({ targetId: book.work_id!, sourceWorkIds: [candidate.work_id] }, { onSuccess: () => setAction(null) }); if (action === 'split') split.mutate({ id: book.work_id!, itemIds: [book.book_id] }, { onSuccess: () => setAction(null) }) }}>
            {action === 'merge' && candidate ? <>Group <strong>{book.title}</strong> with <strong>{candidate.title}</strong>? Their loan history and reviews remain unchanged.</> : <>Separate <strong>{book.title}</strong> from a work with {copies.length} copies? You can group it again later.</>}
        </ConfirmationDialog>
    </section>
}
