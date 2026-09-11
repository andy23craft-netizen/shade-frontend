import { useEffect, useRef, useState } from 'react'
import { isApiError } from '../../../api/apiErrors'
import { useRefreshBookSummary } from '../../../api/booksQueries'
import type { BookRead } from '../../../api/apiTypes'
import { Alert, Button } from '../../../components'
import { normalizeProviderSummary } from './bookProviderSummaryText'

function errorMessage(error: unknown): string {
    if (isApiError(error) && error.status === 502) return 'The summary service is unavailable. You can try again.'
    if (isApiError(error) && (error.status === 504 || error.kind === 'timeout')) return 'The summary request took too long. You can try again.'
    return 'The summary could not be refreshed. You can try again.'
}

export function BookProviderSummary({ book }: { book: BookRead }) {
    const refresh = useRefreshBookSummary()
    const [availability, setAvailability] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const automaticallyRequestedBookId = useRef<string | null>(null)
    const hasIsbn = !book.isbn_not_applicable && Boolean(book.isbn13?.trim())
    const noProviderSummary = availability === 'not_available'
    const notRequestable = !hasIsbn || availability === 'isbn_missing' || availability === 'not_requestable'

    function refreshSummary() {
        setError(null)
        refresh.mutate(book.book_id, {
            onSuccess: (response) => setAvailability(response.availability_state),
            onError: (cause) => setError(errorMessage(cause)),
        })
    }

    useEffect(() => {
        if (book.summary?.trim() || noProviderSummary || notRequestable || automaticallyRequestedBookId.current === book.book_id) return
        automaticallyRequestedBookId.current = book.book_id
        refreshSummary()
    // The request is intentionally once per opened book. Retry remains an
    // explicit action after a failure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [book.book_id, book.summary, noProviderSummary, notRequestable])

    return <section className="book-details-panel book-provider-summary" aria-labelledby="book-summary-heading">
        <h2 id="book-summary-heading">Summary</h2>
        {book.summary?.trim() ? <div className="book-provider-summary__text">{normalizeProviderSummary(book.summary).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div> : noProviderSummary ? <p>No summary is available for this ISBN.</p> : notRequestable ? <p>A summary needs an ISBN for this book.</p> : <p>No summary has been added yet.</p>}
        {error ? <Alert variant="error">{error}</Alert> : null}
        {!book.summary?.trim() && !noProviderSummary && !notRequestable && !refresh.isPending ? <Button type="button" variant="secondary" onClick={refreshSummary}>{error ? 'Retry summary' : 'Refresh summary'}</Button> : null}
    </section>
}
