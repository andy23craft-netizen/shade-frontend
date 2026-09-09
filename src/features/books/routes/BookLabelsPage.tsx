import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { useSearchParams } from 'react-router-dom'

import { Alert, AppLink, Button, LoadingState } from '../../../components'
import { useInfiniteBooks } from '../../../api/booksQueries'
import { flattenInfiniteBookPages } from '../booksListModel'
import { bookLabelValue } from '../labelCode'

function Label({ bookId, title }: { bookId: string; title: string }) {
    const [image, setImage] = useState<string | null>(null)

    useEffect(() => {
        let active = true
        void QRCode.toDataURL(bookLabelValue(bookId), {
            errorCorrectionLevel: 'M', margin: 1, width: 360,
            color: { dark: '#000000', light: '#ffffff' },
        }).then((value) => { if (active) setImage(value) })
        return () => { active = false }
    }, [bookId])

    return <article className="book-label">
        {image
            ? <img src={image} alt={`Shade label for ${title}`} />
            : <span className="book-label__generating">Generating code…</span>}
        <div className="book-label__text">
            <strong>{title}</strong>
            <span>Shade Library</span>
        </div>
    </article>
}

export function BookLabelsPage() {
    const [params, setParams] = useSearchParams()
    const requested = new Set(params.getAll('book_id'))
    const all = params.get('all') === '1'
    const start = Number(params.get('start') ?? '1')
    const booksQuery = useInfiniteBooks()
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
    const books = loadedBooks.filter((book) => all || requested.has(book.book_id))
    const position = Number.isInteger(start) && start >= 1 && start <= 8 ? start : 1
    const blanks = Array.from({ length: position - 1 }, (_, index) => <div className="book-label book-label--blank" key={`blank-${index}`} />)

    if (booksQuery.isPending) return <section className="route-page"><h1>Print Book Labels</h1><LoadingState label={all ? "Loading catalog books…" : "Loading selected books…"} /></section>
    if (booksQuery.isError) return <section className="route-page"><h1>Print Book Labels</h1><Alert variant="error">{all ? 'The catalog books could not be loaded.' : 'The selected books could not be loaded.'}</Alert></section>

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
                    Print labels
                </Button>

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
            <p className="no-print" role="status">{all && booksQuery.hasNextPage ? `Loading more catalog books; ${books.length} ready so far.` : `${books.length} ${all ? 'catalog' : 'selected'} ${books.length === 1 ? 'book' : 'books'} ready. Labels print two across by four down on R027 US Letter stock. Print at 100% / Actual Size.`}</p>
            <div className="book-label-sheet">{blanks}{books.map((book) => <Label key={book.book_id} bookId={book.book_id} title={book.title} />)}</div>
        </>}
    </section>
}
