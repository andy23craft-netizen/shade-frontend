import { useEffect, useState } from 'react'
import QRCodeStyling from 'qr-code-styling'
import { useSearchParams } from 'react-router-dom'

import { Alert, AppLink, Button, LoadingState } from '../../../components'
import {
    resolveLibraryContext,
    type LibraryId,
} from '../../../config/libraryContext'
import {
    useBooksByIds,
    useInfiniteBooks,
} from '../../../api/booksQueries'
import { flattenInfiniteBookPages } from '../booksListModel'
import { bookLabelValue } from '../labelCode'
import { createBookLabelQrOptions } from '../labelQrOptions'
import { bookLabelGenerationQueue } from '../qrGenerationQueue'

const LABELS_PER_BATCH = 48
const LABELS_PER_SHEET = 8

function Label({
    bookId,
    title,
    libraryId,
    libraryName,
}: {
    bookId: string
    title: string
    libraryId: LibraryId | null
    libraryName: string
}) {
    const [image, setImage] = useState<string | null>(null)

    useEffect(() => {
        let active = true
        let objectUrl: string | null = null
        const qrCode = new QRCodeStyling(
            createBookLabelQrOptions(bookLabelValue(bookId), libraryId),
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
    }, [bookId, libraryId])

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

export function BookLabelsPage() {
    const [params, setParams] = useSearchParams()
    const requestedIds = params.getAll('book_id')
    const all = params.get('all') === '1'
    const start = Number(params.get('start') ?? '1')
    const library = resolveLibraryContext(window.location.hostname)
    const libraryId = library?.id ?? null
    const libraryName = library?.id === 'andy'
        ? 'Shade Library'
        : library?.name ?? 'Shade Library'
    const booksQuery = useInfiniteBooks({ enabled: all })
    const selectedBookQueries = useBooksByIds(requestedIds)
    const {
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = booksQuery
    const loadedBooks = flattenInfiniteBookPages(booksQuery.data?.pages)
    useEffect(() => {
        if (all && hasNextPage && !isFetchingNextPage) {
            void fetchNextPage()
        }
    }, [all, fetchNextPage, hasNextPage, isFetchingNextPage])
    const selectedBooks = selectedBookQueries.flatMap((query) =>
        query.data === undefined ? [] : [query.data],
    )
    const books = all ? loadedBooks : selectedBooks
    const isPending = all
        ? booksQuery.isPending
        : selectedBookQueries.some((query) => query.isPending)
    const isError = all
        ? booksQuery.isError
        : selectedBookQueries.some((query) => query.isError)
    const position = Number.isInteger(start) && start >= 1 && start <= 8 ? start : 1
    const requestedBatch = Number(params.get('batch') ?? '1')
    const batchCount = Math.max(1, Math.ceil(books.length / LABELS_PER_BATCH))
    const batchIndex = Number.isInteger(requestedBatch) && requestedBatch >= 1
        ? Math.min(requestedBatch - 1, batchCount - 1)
        : 0
    const batchBooks = books.slice(
        batchIndex * LABELS_PER_BATCH,
        (batchIndex + 1) * LABELS_PER_BATCH,
    )
    const batchStart = batchIndex === 0 ? position : 1
    const labelSheets = Array.from(
        {
            length: Math.ceil(
                (batchStart - 1 + batchBooks.length) / LABELS_PER_SHEET,
            ),
        },
        (_, sheetIndex) => Array.from(
            { length: LABELS_PER_SHEET },
            (_, slotIndex) => {
                const bookIndex = sheetIndex * LABELS_PER_SHEET
                    + slotIndex - (batchStart - 1)

                return batchBooks[bookIndex] ?? null
            },
        ),
    )

    function changeBatch(nextBatchIndex: number): void {
        params.set('batch', String(nextBatchIndex + 1))
        setParams(params)
    }

    if (isPending) return <section className="route-page"><h1>Print Book Labels</h1><LoadingState label={all ? "Loading catalog books…" : "Loading selected books…"} /></section>
    if (isError) return <section className="route-page"><h1>Print Book Labels</h1><Alert variant="error">{all ? 'The catalog books could not be loaded.' : 'The selected books could not be loaded.'}</Alert></section>

    return <section className="route-page book-labels-page">
        <header><h1 tabIndex={-1}>Print Book Labels</h1><p>{all ? 'Preparing a label for every catalog book.' : 'Preparing labels for the books you selected.'} Each code contains only a copy-specific Shade identifier.</p></header>
        {books.length === 0 ? <Alert variant="warning">{all ? 'There are no catalog books to label.' : 'Select one or more books from Browse, then choose Print labels for selected books.'}</Alert> : <>
            <div className="book-labels-page__controls no-print">
                <label>
                    Start at sheet position
                    <select
                        value={position}
                        onChange={(event) => {
                            params.set('start', event.target.value)
                            setParams(params)
                        }}
                    >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((value) => (
                            <option key={value} value={value}>{value}</option>
                        ))}
                    </select>
                </label>

                <Button type="button" onClick={() => window.print()}>
                    Print this batch
                </Button>

                {batchCount > 1 && <>
                    <Button
                        type="button"
                        variant="secondary"
                        disabled={batchIndex === 0}
                        onClick={() => changeBatch(batchIndex - 1)}
                    >
                        Previous batch
                    </Button>
                    <span aria-live="polite">
                        Batch {batchIndex + 1} of {batchCount}
                    </span>
                    <Button
                        type="button"
                        variant="secondary"
                        disabled={batchIndex === batchCount - 1}
                        onClick={() => changeBatch(batchIndex + 1)}
                    >
                        Next batch
                    </Button>
                </>}

                <AppLink to="/books" variant="secondary">
                    Back to Books
                </AppLink>

                <a
                    href="https://www.amazon.com/dp/B0FWGXGBSP"
                    target="_blank"
                    rel="noreferrer"
                >
                    Buy compatible label sheets
                </a>


            </div>
            <p className="no-print" role="status">{all && booksQuery.hasNextPage ? `Loading more catalog books; ${books.length} ready so far.` : `${books.length} ${all ? 'catalog' : 'selected'} ${books.length === 1 ? 'book' : 'books'} ready.`} Each print batch holds up to {LABELS_PER_BATCH} labels to keep QR generation responsive. Labels print two across by four down on R027 US Letter stock. Print at 100% / Actual Size.</p>
            <div className="book-label-pages">
                {labelSheets.map((sheet, sheetIndex) => (
                    <div className="book-label-sheet" key={`sheet-${sheetIndex}`}>
                        {sheet.map((book, slotIndex) => book ? (
                            <Label key={book.book_id} bookId={book.book_id} title={book.title} libraryId={libraryId} libraryName={libraryName} />
                        ) : (
                            <div className="book-label book-label--blank" key={`blank-${slotIndex}`} />
                        ))}
                    </div>
                ))}
            </div>
        </>}
    </section>
}
