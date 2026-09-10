import { useEffect, useState } from 'react'
import QRCodeStyling from 'qr-code-styling'
import { useSearchParams } from 'react-router-dom'

import { useAlbumsByIds, useInfiniteAlbums } from '../../../api/albumsQueries'
import { Alert, AppLink, Button, LoadingState } from '../../../components'
import {
    resolveLibraryContext,
    type LibraryId,
} from '../../../config/libraryContext'
import { createBookLabelQrOptions } from '../../books/labelQrOptions'
import { bookLabelGenerationQueue } from '../../books/qrGenerationQueue'
import { flattenAlbumPages } from '../albumsListModel'
import { albumLabelValue } from '../labelCode'

const LABELS_PER_BATCH = 48
const LABELS_PER_SHEET = 8

function Label({
    albumId,
    title,
    libraryId,
    libraryName,
}: {
    albumId: string
    title: string
    libraryId: LibraryId | null
    libraryName: string
}) {
    const [image, setImage] = useState<string | null>(null)

    useEffect(() => {
        let active = true
        let objectUrl: string | null = null
        const qrCode = new QRCodeStyling(
            createBookLabelQrOptions(albumLabelValue(albumId), libraryId),
        )
        const generation = bookLabelGenerationQueue.enqueue(
            () => qrCode.getRawData('png') as Promise<Blob | null>,
        )

        void generation.result.then((imageData) => {
            if (!imageData || !(imageData instanceof Blob)) return

            objectUrl = URL.createObjectURL(imageData)
            if (active) setImage(objectUrl)
            else URL.revokeObjectURL(objectUrl)
        })

        return () => {
            active = false
            generation.cancel()
            if (objectUrl) URL.revokeObjectURL(objectUrl)
        }
    }, [albumId, libraryId])

    return <article className="book-label">
        {image
            ? <img src={image} alt={`Shade label for ${title}`} />
            : <span className="book-label__generating">Generating code…</span>}
        <div className="book-label__text">
            <strong>{title}</strong>
            <span>{libraryName}</span>
        </div>
    </article>
}

export function AlbumLabelsPage() {
    const [params, setParams] = useSearchParams()
    const requestedIds = params.getAll('album_id')
    const all = params.get('all') === '1'
    const start = Number(params.get('start') ?? '1')
    const library = resolveLibraryContext(window.location.hostname)
    const libraryId = library?.id ?? null
    const libraryName = library?.id === 'andy'
        ? 'Shade Library'
        : library?.name ?? 'Shade Library'
    const albumsQuery = useInfiniteAlbums({}, { enabled: all })
    const selectedAlbumQueries = useAlbumsByIds(requestedIds)
    const { fetchNextPage, hasNextPage, isFetchingNextPage } = albumsQuery
    const loadedAlbums = flattenAlbumPages(albumsQuery.data?.pages)

    useEffect(() => {
        if (all && hasNextPage && !isFetchingNextPage) {
            void fetchNextPage()
        }
    }, [all, fetchNextPage, hasNextPage, isFetchingNextPage])

    const selectedAlbums = selectedAlbumQueries.flatMap((query) =>
        query.data === undefined ? [] : [query.data],
    )
    const albums = all ? loadedAlbums : selectedAlbums
    const isPending = all
        ? albumsQuery.isPending
        : selectedAlbumQueries.some((query) => query.isPending)
    const isError = all
        ? albumsQuery.isError
        : selectedAlbumQueries.some((query) => query.isError)
    const position = Number.isInteger(start) && start >= 1 && start <= 8 ? start : 1
    const requestedBatch = Number(params.get('batch') ?? '1')
    const batchCount = Math.max(1, Math.ceil(albums.length / LABELS_PER_BATCH))
    const batchIndex = Number.isInteger(requestedBatch) && requestedBatch >= 1
        ? Math.min(requestedBatch - 1, batchCount - 1)
        : 0
    const batchAlbums = albums.slice(
        batchIndex * LABELS_PER_BATCH,
        (batchIndex + 1) * LABELS_PER_BATCH,
    )
    const batchStart = batchIndex === 0 ? position : 1
    const labelSheets = Array.from(
        {
            length: Math.ceil(
                (batchStart - 1 + batchAlbums.length) / LABELS_PER_SHEET,
            ),
        },
        (_, sheetIndex) => Array.from(
            { length: LABELS_PER_SHEET },
            (_, slotIndex) => {
                const albumIndex = sheetIndex * LABELS_PER_SHEET
                    + slotIndex - (batchStart - 1)

                return batchAlbums[albumIndex] ?? null
            },
        ),
    )

    function changeBatch(nextBatchIndex: number): void {
        params.set('batch', String(nextBatchIndex + 1))
        setParams(params)
    }

    if (isPending) return <section className="route-page"><h1>Print Album Labels</h1><LoadingState label={all ? 'Loading catalog albums…' : 'Loading selected albums…'} /></section>
    if (isError) return <section className="route-page"><h1>Print Album Labels</h1><Alert variant="error">{all ? 'The catalog albums could not be loaded.' : 'The selected albums could not be loaded.'}</Alert></section>

    return <section className="route-page book-labels-page">
        <header><h1 tabIndex={-1}>Print Album Labels</h1><p>{all ? 'Preparing a label for every catalog album.' : 'Preparing labels for the albums you selected.'} Each code contains only a copy-specific Shade identifier.</p></header>
        {albums.length === 0 ? <Alert variant="warning">{all ? 'There are no catalog albums to label.' : 'Select one or more albums, then choose Print labels.'}</Alert> : <>
            <div className="book-labels-page__controls no-print">
                <label>
                    Start at sheet position
                    <select value={position} onChange={(event) => {
                        params.set('start', event.target.value)
                        setParams(params)
                    }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((value) => (
                            <option key={value} value={value}>{value}</option>
                        ))}
                    </select>
                </label>
                <Button type="button" onClick={() => window.print()}>Print this batch</Button>
                {batchCount > 1 && <>
                    <Button type="button" variant="secondary" disabled={batchIndex === 0} onClick={() => changeBatch(batchIndex - 1)}>Previous batch</Button>
                    <span aria-live="polite">Batch {batchIndex + 1} of {batchCount}</span>
                    <Button type="button" variant="secondary" disabled={batchIndex === batchCount - 1} onClick={() => changeBatch(batchIndex + 1)}>Next batch</Button>
                </>}
                <AppLink to="/albums" variant="secondary">Back to Albums</AppLink>
                <a href="https://www.amazon.com/dp/B0FWGXGBSP" target="_blank" rel="noreferrer">Buy compatible label sheets</a>
            </div>
            <p className="no-print" role="status">{all && albumsQuery.hasNextPage ? `Loading more catalog albums; ${albums.length} ready so far.` : `${albums.length} ${all ? 'catalog' : 'selected'} ${albums.length === 1 ? 'album' : 'albums'} ready.`} Each print batch holds up to {LABELS_PER_BATCH} labels to keep QR generation responsive. Labels print two across by four down on R027 US Letter stock. Print at 100% / Actual Size.</p>
            <div className="book-label-pages">
                {labelSheets.map((sheet, sheetIndex) => (
                    <div className="book-label-sheet" key={`sheet-${sheetIndex}`}>
                        {sheet.map((album, slotIndex) => album ? (
                            <Label key={album.album_id} albumId={album.album_id} title={album.title} libraryId={libraryId} libraryName={libraryName} />
                        ) : (
                            <div className="book-label book-label--blank" key={`blank-${slotIndex}`} />
                        ))}
                    </div>
                ))}
            </div>
        </>}
    </section>
}
