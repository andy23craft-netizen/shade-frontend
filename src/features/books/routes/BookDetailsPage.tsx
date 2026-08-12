import { useParams } from 'react-router-dom'

import {
    useBook,
} from '../../../api/booksQueries'

import {
    enumDisplayValue,
} from '../../../api/enumDisplay'

import type {
    Category,
    Shelf,
    Status,
} from '../../../api/apiTypes'

import {
    isApiError,
} from '../../../api/apiErrors'

import { AppLink } from '../../../components/AppLink'
import { Alert } from '../../../components/Alert'
import { Button } from '../../../components/Button'
import { LoadingState } from '../../../components/LoadingState'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../../api/queryKeys'
import { useEffect } from 'react'



const STATUS_VALUES: readonly Status[] = [
    'unknown',
    'available',
    'on_loan',
    'missing',
    'display_only',
    'reserved',
    'reading',
]

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

function displayEnum(
    value: string,
    knownValues: readonly string[],
): string {
    const result = enumDisplayValue(
        value,
        knownValues,
    )

    if (!result.known) {
        return `${result.value} (unknown)`
    }

    return result.value.replaceAll('_', ' ')
}

function displayValue(
    value: unknown,
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

    if (
        /^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        return value
    }

    const timestamp =
        Date.parse(value)

    if (Number.isNaN(timestamp)) {
        return `${value} (unrecognized date)`
    }

    return new Date(timestamp).toLocaleString()
}

export function BookDetailsPage() {
    const {
        bookId = '',
    } = useParams()

    const queryClient = useQueryClient()

    const bookQuery =
        useBook(bookId)

    useEffect(() => {
        if (
            bookQuery.isError &&
            isApiError(bookQuery.error) &&
            bookQuery.error.status === 404
        ) {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.books.all,
            })
        }
    }, [
        bookQuery.isError,
        bookQuery.error,
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
        const isNotFound =
            isApiError(bookQuery.error) &&
            bookQuery.error.status === 404

        return (
            <section className="route-page">
                <h1 tabIndex={-1}>
                    Book Details
                </h1>

                <Alert
                    variant="error"
                    title={
                        isNotFound
                            ? 'Book not found'
                            : 'Unable to load book'
                    }
                >
                    {isNotFound
                        ? 'This book is no longer available from the API.'
                        : bookQuery.error instanceof
                        Error
                            ? bookQuery.error.message
                            : 'An unexpected error occurred.'}
                </Alert>

                <div>
                    <Button
                        type="button"
                        onClick={() => {
                            void bookQuery.refetch()
                        }}
                    >
                        Retry
                    </Button>

                    <AppLink to="/books">
                        Back to Books
                    </AppLink>
                </div>
            </section>
        )
    }

    const book =
        bookQuery.data

    const status =
        displayEnum(
            book.status,
            STATUS_VALUES,
        )

    const category =
        displayEnum(
            book.category,
            CATEGORY_VALUES,
        )

    const shelf =
        displayEnum(
            book.shelf,
            SHELF_VALUES,
        )

    const isDeleted =
        book.deletion_date !== null

    const isOnLoan =
        book.status === 'on_loan'

    return (
        <section className="route-page">
            <AppLink to="/books">
                ← Back to Books
            </AppLink>

            <header>
                <h1 tabIndex={-1}>
                    {book.title}
                </h1>

                <p>
                    {displayValue(
                        book.authors,
                    )}
                </p>

                <p>
                    Status:{' '}
                    <strong>
                        {status}
                    </strong>
                </p>

                <p>
                    Reading:{' '}
                    <strong>
                        {book.is_read
                            ? 'Read'
                            : 'Unread'}
                    </strong>
                </p>
            </header>

            {isDeleted ? (
                <Alert
                    variant="warning"
                    title="This book has been deleted"
                >
                    The book's history has been
                    retained, but it is no longer
                    part of the active collection.
                </Alert>
            ) : null}

            <nav aria-label="Book actions">
                <h2>Actions</h2>

                <div>
                    {!isDeleted && !isOnLoan ? (
                        <AppLink
                            to={`/checkout?bookId=${encodeURIComponent(book.id)}`}
                            variant="primary"
                        >
                            Check Out
                        </AppLink>
                    ) : null}

                    {!isDeleted && isOnLoan ? (
                        <AppLink
                            to={`/checkin?bookId=${encodeURIComponent(book.id)}`}
                        >
                            Check In
                        </AppLink>
                    ) : null}

                    {!isDeleted && !book.is_read ? (
                        <Button type="button">
                            Mark Read
                        </Button>
                    ) : null}

                    {!isDeleted ? (
                        <AppLink
                            to={`/books/${encodeURIComponent(book.id)}/edit`}
                        >
                            Edit
                        </AppLink>
                    ) : null}

                    {!isDeleted && !isOnLoan ? (
                        <Button
                            type="button"
                            variant="danger"
                        >
                            Delete
                        </Button>
                    ) : null}

                    {isDeleted ? (
                        <AppLink to="/admin/deleted">
                            View deleted books
                        </AppLink>
                    ) : null}
                </div>
            </nav>

            <section>
                <h2>Bibliographic</h2>

                <dl>
                    <dt>ISBN-13</dt>
                    <dd>
                        {displayValue(
                            book.isbn13,
                        )}
                    </dd>

                    <dt>Publisher</dt>
                    <dd>
                        {displayValue(
                            book.publisher,
                        )}
                    </dd>

                    <dt>Publication date</dt>
                    <dd>
                        {displayDate(
                            book.publication_date,
                        )}
                    </dd>

                    <dt>Pages</dt>
                    <dd>
                        {displayValue(
                            book.pages,
                        )}
                    </dd>

                    <dt>Category</dt>
                    <dd>{category}</dd>

                    <dt>Shelf</dt>
                    <dd>{shelf}</dd>

                    <dt>Tags</dt>
                    <dd>
                        {book.tags?.length
                            ? book.tags.join(', ')
                            : 'None'}
                    </dd>
                </dl>
            </section>

            <section>
                <h2>Acquisition</h2>

                <dl>
                    <dt>Purchase date</dt>
                    <dd>
                        {displayDate(
                            book.purchase_date,
                        )}
                    </dd>

                    <dt>Purchase price</dt>
                    <dd>
                        {displayValue(
                            book.purchase_price,
                        )}
                    </dd>

                    <dt>Acquisition source</dt>
                    <dd>
                        {displayValue(
                            book.acquisition_source,
                        )}
                    </dd>

                    <dt>Notes</dt>
                    <dd>
                        {displayValue(
                            book.notes,
                        )}
                    </dd>
                </dl>
            </section>

            <section>
                <h2>Lifecycle</h2>

                <dl>
                    <dt>Status</dt>
                    <dd>{status}</dd>

                    <dt>Borrower</dt>
                    <dd>
                        {displayValue(
                            book.borrower,
                        )}
                    </dd>

                    <dt>Loaned out</dt>
                    <dd>
                        {displayDate(
                            book.datetime_loaned_out,
                        )}
                    </dd>

                    <dt>Deletion date</dt>
                    <dd>
                        {displayDate(
                            book.deletion_date,
                        )}
                    </dd>
                </dl>
            </section>

            <section>
                <h2>Reading</h2>

                <dl>
                    <dt>Read</dt>
                    <dd>
                        {book.is_read
                            ? 'Yes'
                            : 'No'}
                    </dd>

                    <dt>Completion date</dt>
                    <dd>
                        {displayDate(
                            book.completion_date,
                        )}
                    </dd>

                    <dt>Rating</dt>
                    <dd>
                        {displayValue(
                            book.rating,
                        )}
                    </dd>

                    <dt>Review</dt>
                    <dd>
                        {displayValue(
                            book.review,
                        )}
                    </dd>
                </dl>
            </section>

            <section>
                <h2>Borrowing Statistics</h2>

                <dl>
                    <dt>Times borrowed</dt>
                    <dd>
                        {book.times_borrowed}
                    </dd>

                    <dt>Last borrowed</dt>
                    <dd>
                        {displayDate(
                            book.last_borrowed_at,
                        )}
                    </dd>

                    <dt>Average loan length</dt>
                    <dd>
                        {book.average_loan_days ===
                        null
                            ? 'No returned loans yet'
                            : `${book.average_loan_days} days`}
                    </dd>
                </dl>
            </section>

            <section>
                <h2>Audit</h2>

                <dl>
                    <dt>ID</dt>
                    <dd>{book.id}</dd>

                    <dt>Created</dt>
                    <dd>
                        {displayDate(
                            book.creation_date,
                        )}
                    </dd>

                    <dt>Updated</dt>
                    <dd>
                        {displayDate(
                            book.updated_date,
                        )}
                    </dd>
                </dl>
            </section>
        </section>
    )
}