import { useState } from 'react'
import type { AlbumRead } from '../../../api/apiTypes'
import { useAlbums } from '../../../api/albumsQueries'
import { useMergeWorks, useSplitWork, useWork } from '../../../api/worksQueries'
import { Alert, Button, ConfirmationDialog } from '../../../components'
import { formatAlbumArtists } from '../albumDisplay'

const normalize = (value: string) =>
    value.trim().replace(/\s+/g, ' ').toLocaleLowerCase()

export function AlbumWorkCorrection({ album }: { album: AlbumRead }) {
    const [open, setOpen] = useState(false)
    const [candidateId, setCandidateId] = useState('')
    const [action, setAction] = useState<'merge' | 'split' | null>(null)
    const matchesQuery = useAlbums(
        { take: 100 },
        { enabled: open && Boolean(album.work_id) },
    )
    const workQuery = useWork(album.work_id ?? '', open)
    const merge = useMergeWorks()
    const split = useSplitWork()

    if (!album.work_id) return null

    if (!open) {
        return <section className="album-work-correction">
            <h2>Possible duplicate copies</h2>
            <p>Check only when you need to correct a duplicate grouping.</p>
            <Button variant="secondary" onClick={() => setOpen(true)}>
                Check possible duplicates
            </Button>
        </section>
    }

    const albumArtists = normalize(formatAlbumArtists(album))
    const matches = (matchesQuery.data?.items ?? []).filter((item) =>
        item.album_id !== album.album_id &&
        item.work_id !== album.work_id &&
        ((Boolean(album.barcode?.trim()) && item.barcode === album.barcode) ||
            (normalize(item.title) === normalize(album.title) &&
                normalize(formatAlbumArtists(item)) === albumArtists)),
    )
    const candidate = matches.find((item) => item.album_id === candidateId)
    const copies = workQuery.data?.item_ids ?? []
    const error = merge.error ?? split.error
    const busy = merge.isPending || split.isPending

    return <section className="album-work-correction">
        <h2>Possible duplicate copies</h2>
        <p>Only barcode or title-and-artist matches are offered. Check the release, artist, and crate against the physical copy.</p>
        {matchesQuery.isPending ? <p>Checking for matches…</p> : matches.length ? <label>Matching copy <select value={candidateId} onChange={(event) => setCandidateId(event.target.value)}><option value="">Choose a matching copy</option>{matches.map((item) => <option key={item.album_id} value={item.album_id}>{item.title} — {formatAlbumArtists(item)} — {item.shelf_name ?? 'Unfiled'}</option>)}</select></label> : <p>No matching copies found.</p>}
        <Button variant="secondary" disabled={!candidate || busy} onClick={() => setAction('merge')}>Group as Same Work</Button>
        {copies.length > 1 ? <Button variant="secondary" disabled={busy} onClick={() => setAction('split')}>Separate from Work</Button> : null}
        {error ? <Alert variant="error">{error instanceof Error ? error.message : 'The correction could not be completed. Your selection was kept.'}</Alert> : null}
        <ConfirmationDialog open={action !== null} title={action === 'merge' ? 'Group as same work' : 'Separate from work'} confirmLabel={action === 'merge' ? 'Confirm grouping' : 'Confirm separation'} onCancel={() => setAction(null)} onConfirm={() => { if (action === 'merge' && candidate?.work_id) merge.mutate({ targetId: album.work_id!, sourceWorkIds: [candidate.work_id] }, { onSuccess: () => setAction(null) }); if (action === 'split') split.mutate({ id: album.work_id!, itemIds: [album.album_id] }, { onSuccess: () => setAction(null) }) }}>
            {action === 'merge' && candidate ? <>Group <strong>{album.title}</strong> with <strong>{candidate.title}</strong>? Their loan history and reviews remain unchanged.</> : <>Separate <strong>{album.title}</strong> from a work with {copies.length} copies? You can group it again later.</>}
        </ConfirmationDialog>
    </section>
}
