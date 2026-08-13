import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

import { Alert } from '../../../components/Alert'
import { AppLink } from '../../../components/AppLink'
import { LoadingState } from '../../../components/LoadingState'
import { isApiError } from '../../../api/apiErrors'
import { useBook } from '../../../api/booksQueries'
import { queryKeys } from '../../../api/queryKeys'
import type {
    Category,
    Shelf,
    Status,
} from '../../../api/apiTypes'

const CATEGORY_VALUES: readonly Category[] = [
    'unknown',
    'religion',
    'philosophy',
    'fiction',
    'nonfiction',
]

const SHELF_VALUES: readonly Shelf[] = [
    'unknown',
    'a1',
    'a2',
    'a3',
    'a4',
    'b1',
    'b2',
    'b3',
    'bath',
    'c1',
    'c2',
    'c3',
    'c4',
    'd1',
    'd2',
    'd3',
    'd4',
    'd5',
    'e1',
    'e2',
    'e3',
    'e4',
    'e5',
    'e6',
    'f1',
    'f2',
    'f3',
    'f4',
    'f5',
    'g1',
    'g2',
    'g3',
    'g4',
    'g5',
    'g6',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'liz_tbr',
]

const STATUS_VALUES: readonly Status[] = [
    'unknown',
    'available',
    'on_loan',
    'missing',
    'display_only',
    'reserved',
    'reading',
]

function displayEnum(
    value: string,
    knownValues: readonly string[],
): string {
    return knownValues.includes(value)
        ? value
        : `${value} (unknown)`
}

function displayValue(
    value: string | number | null | undefined,
): string {
    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {
        return 'Not provided'
    }

    return String(value)
}

function displayDate(
    value: string | null | undefined,
): string {
    if (!value) {
        return 'Not provided'
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] =
            value.split('-').map(Number)

        const date = new Date(
            year,
            month - 1,
            day,
        )

        if (
            date.getFullYear() !== year ||
            date.getMonth() !== month - 1 ||
            date.getDate() !== day
        ) {
            return `${value} (unrecognized date)`
        }

        return new Intl.DateTimeFormat(
            undefined,
            {
                dateStyle: 'medium',
            },
        ).format(date)
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return `${value} (unrecognized date)`
    }

    return new Intl.DateTimeFormat(
        undefined,
        {
            dateStyle: 'medium',
        },
    ).format(date)
}

export function BookDetailsPage() {
    const { bookId } = useParams()
    const queryClient = useQueryClient()

    const bookQuery = useBook(bookId ?? '')

    const isNotFound =
        bookQuery.isError &&
        isApiError(bookQuery.error) &&
        bookQuery.error.status === 404

    useEffect(() => {
        if (!isNotFound) {
            return
        }

        void queryClient.invalidateQueries({
            queryKey: queryKeys.books.all,
        })
    }, [
        isNotFound,
        queryClient,
    ])

    if (bookQuery.isPending) {
        return (
            <section className="route-page">
                <h1 tabIndex={-1}>
                    Book Details
                </h1>

                <LoadingState label="Loading book…" />
            </section>
        )
    }

    if (bookQuery.isError) {
        if (isNotFound) {
            return (
                <section className="route-page">
                    <h1 tabIndex={-1}>
                        Book Not Found
                    </h1>

                    <Alert
                        variant="warning"
                        title="This book could not be found"
                    >
                        The book is no longer available
                        from the API. It may have been
                        removed rather than soft-deleted.
                    </Alert>

                    <AppLink
                        to="/books"
                        variant="secondary"
                    >
                        Back to Books
                    </AppLink>
                </section>
            )
        }

        return (
            <section className="route-page">
                <h1 tabIndex={-1}>
                    Book Details
                </h1>

                <Alert
                    variant="error"
                    title="Unable to load book"
                >
                    {bookQuery.error instanceof Error
                        ? bookQuery.error.message
                        : 'An unexpected error occurred.'}
                </Alert>

                <AppLink
                    to="/books"
                    variant="secondary"
                >
                    Back to Books
                </AppLink>
            </section>
        )
    }

    const book = bookQuery.data

    const isDeleted =
        book.deletion_date !== null

    const isOnLoan =
        book.status === 'on_loan'

    const canShowActiveActions =
        !isDeleted

    const canCheckout =
        canShowActiveActions && !isOnLoan

    const canCheckin =
        canShowActiveActions && isOnLoan

    const canDelete =
        canShowActiveActions && !isOnLoan
    return (
        <section className="route-page">
            <AppLink
                to="/books"
                variant="secondary"
            >
                ← Back to Books
            </AppLink>

            {isDeleted ? (
                <Alert
                    variant="warning"
                    title="This book has been deleted"
                >
                    The book remains available here for
                    historical reference. Its loan and
                    reading history has been retained.
                </Alert>
            ) : null}

            <header>
                <h1 tabIndex={-1}>
                    {book.title}
                </h1>

                <p>{book.authors}</p>
            </header>

            <dl>
                <dt>Category</dt>
                <dd>
                    {displayEnum(
                        book.category,
                        CATEGORY_VALUES,
                    )}
                </dd>

                <dt>Shelf</dt>
                <dd>
                    {displayEnum(
                        book.shelf,
                        SHELF_VALUES,
                    )}
                </dd>

                <dt>Status</dt>
                <dd>
                    {displayEnum(
                        book.status,
                        STATUS_VALUES,
                    )}
                </dd>

                <dt>ISBN-13</dt>
                <dd>
                    {displayValue(book.isbn13)}
                </dd>

                <dt>Publisher</dt>
                <dd>
                    {displayValue(book.publisher)}
                </dd>

                <dt>Publication Date</dt>
                <dd>
                    {displayDate(
                        book.publication_date,
                    )}
                </dd>

                <dt>Pages</dt>
                <dd>
                    {displayValue(book.pages)}
                </dd>

                <dt>Acquisition Source</dt>
                <dd>
                    {displayValue(
                        book.acquisition_source,
                    )}
                </dd>

                <dt>Purchase Date</dt>
                <dd>
                    {displayDate(book.purchase_date)}
                </dd>

                <dt>Purchase Price</dt>
                <dd>
                    {book.purchase_price === null ||
                    book.purchase_price === undefined
                        ? 'Not provided'
                        : `$${book.purchase_price.toFixed(2)}`}
                </dd>

                <dt>Read</dt>
                <dd>
                    {book.is_read ? 'Yes' : 'No'}
                </dd>

                <dt>Completion Date</dt>
                <dd>
                    {displayDate(
                        book.completion_date,
                    )}
                </dd>

                <dt>Rating</dt>
                <dd>
                    {displayValue(book.rating)}
                </dd>

                <dt>Review</dt>
                <dd>
                    {displayValue(book.review)}
                </dd>

                <dt>Notes</dt>
                <dd>
                    {displayValue(book.notes)}
                </dd>
            </dl>

            {isOnLoan ? (
                <section>
                    <h2>Current Loan</h2>

                    <dl>
                        <dt>Borrower</dt>
                        <dd>
                            {displayValue(
                                book.borrower,
                            )}
                        </dd>

                        <dt>Loaned Out</dt>
                        <dd>
                            {displayDate(
                                book.datetime_loaned_out,
                            )}
                        </dd>
                    </dl>
                </section>
            ) : null}

            <section>
                <h2>Borrowing History</h2>

                <dl>
                    <dt>Times Borrowed</dt>
                    <dd>
                        {book.times_borrowed}
                    </dd>

                    <dt>Last Borrowed</dt>
                    <dd>
                        {displayDate(
                            book.last_borrowed_at,
                        )}
                    </dd>

                    <dt>Average Loan</dt>
                    <dd>
                        {book.average_loan_days === null
                            ? 'No returned loans yet'
                            : `${book.average_loan_days} days`}
                    </dd>
                </dl>
            </section>

            {canShowActiveActions ? (
                <nav aria-label="Book actions">
                    <AppLink
                        to={`/books/${book.id}/edit`}
                        variant="secondary"
                    >
                        Edit Book
                    </AppLink>

                    {canCheckout ? (
                        <AppLink
                            to={`/books/${book.id}/checkout`}
                            variant="primary"
                        >
                            Check Out
                        </AppLink>
                    ) : null}

                    {canCheckin ? (
                        <AppLink
                            to={`/books/${book.id}/checkin`}
                            variant="primary"
                        >
                            Check In
                        </AppLink>
                    ) : null}

                    <AppLink
                        to={`/books/${book.id}/mark-read`}
                        variant="secondary"
                    >
                        Mark Read
                    </AppLink>

                    {canDelete ? (
                        <AppLink
                            to={`/books/${book.id}/delete`}
                            variant="secondary"
                        >
                            Delete Book
                        </AppLink>
                    ) : null}
                </nav>
            ) : null}
        </section>
    )
}
