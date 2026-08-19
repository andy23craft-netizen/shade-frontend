import {
    useEffect,
    useState,
} from 'react'
import {
    useParams,
    useSearchParams,
} from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

import { Alert } from '../../../components/Alert'
import { AppLink } from '../../../components/AppLink'
import { LoadingState } from '../../../components/LoadingState'
import { QueryErrorState } from '../../../components/QueryErrorState'
import { isApiError } from '../../../api/apiErrors'
import { useBook } from '../../../api/booksQueries'
import { useLoans } from '../../../api/loansQueries'
import {
    findActiveLoan,
    isCheckinEligible,
} from '../../loans/checkinEligibility'
import { queryKeys } from '../../../api/queryKeys'
import type {
    Category,
    Status,
} from '../../../api/apiTypes'
import { formatShelfCommonNameForDisplay } from '../../shelves/shelfDisplay'
import { Button } from '../../../components/Button'
import { CheckoutDialog } from '../../loans/components/CheckoutDialog'
import { isCheckoutEligible } from '../../loans/checkoutEligibility'

const CATEGORY_VALUES: readonly Category[] = [
    'unknown',
    'religion',
    'philosophy',
    'fiction',
    'nonfiction',
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
    const [searchParams, setSearchParams] =
        useSearchParams()

    const [checkoutOpen, setCheckoutOpen] =
        useState(() => searchParams.has('checkout'))
    const queryClient = useQueryClient()

    const bookQuery = useBook(bookId ?? '')

    const loansQuery = useLoans({
        bookId: bookId ?? '',
    })

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

    useEffect(() => {
        if (
            !searchParams.has('checkout') ||
            bookQuery.isPending
        ) {
            return
        }

        setSearchParams({}, {
            replace: true,
        })
    }, [
        bookQuery.isPending,
        searchParams,
        setSearchParams,
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

                <QueryErrorState
                    title="Unable to load book"
                    error={bookQuery.error}
                />

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
        isCheckoutEligible(book)

    const canCheckin =
        canShowActiveActions &&
        !loansQuery.isPending &&
        !loansQuery.isError &&
        isCheckinEligible(
            book,
            loansQuery.data?.items ?? [],
        )

    const hasActiveLoan =
        !loansQuery.isPending &&
        !loansQuery.isError &&
        findActiveLoan(
            book.id,
            loansQuery.data?.items ?? [],
        ) !== undefined

    const canDelete =
        canShowActiveActions &&
        !isOnLoan &&
        !hasActiveLoan
    const canMarkRead =
        canShowActiveActions &&
        !book.is_read
    const canEditReading =
        canShowActiveActions &&
        book.is_read

    return (
        <section className="route-page">
            <div className="book-details__topbar">
                <AppLink
                    to="/books"
                    variant="secondary"
                >
                    ← Back to Books
                </AppLink>
            </div>

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

            <article className="book-details-card">
                <header className="book-details-card__header">
                    <h1 tabIndex={-1}>
                        {book.title}
                    </h1>

                    <p>{book.authors}</p>
                </header>

                <dl className="book-details-card__metadata">
                    <div className="book-details-card__field">
                        <dt>Category</dt>
                        <dd>
                            {displayEnum(
                                book.category,
                                CATEGORY_VALUES,
                            )}
                        </dd>
                    </div>

                    <div className="book-details-card__field">
                        <dt>Shelf</dt>
                        <dd>
                            {formatShelfCommonNameForDisplay(
                                book.shelf_name,
                            )}
                        </dd>
                    </div>

                    <div className="book-details-card__field">
                        <dt>Status</dt>
                        <dd>
                            {displayEnum(
                                book.status,
                                STATUS_VALUES,
                            )}
                        </dd>
                    </div>

                    <div className="book-details-card__field">
                        <dt>ISBN-13</dt>
                        <dd>
                            {displayValue(book.isbn13)}
                        </dd>
                    </div>

                    <div className="book-details-card__field">
                        <dt>Publisher</dt>
                        <dd>
                            {displayValue(book.publisher)}
                        </dd>
                    </div>

                    <div className="book-details-card__field">
                        <dt>Publication Date</dt>
                        <dd>
                            {displayDate(
                                book.publication_date,
                            )}
                        </dd>
                    </div>

                    <div className="book-details-card__field">
                        <dt>Pages</dt>
                        <dd>
                            {displayValue(book.pages)}
                        </dd>
                    </div>

                    <div className="book-details-card__field">
                        <dt>Acquisition Source</dt>
                        <dd>
                            {displayValue(
                                book.acquisition_source,
                            )}
                        </dd>
                    </div>

                    <div className="book-details-card__field">
                        <dt>Purchase Date</dt>
                        <dd>
                            {displayDate(book.purchase_date)}
                        </dd>
                    </div>

                    <div className="book-details-card__field">
                        <dt>Purchase Price</dt>
                        <dd>
                            {book.purchase_price === null ||
                            book.purchase_price === undefined
                                ? 'Not provided'
                                : `$${book.purchase_price.toFixed(2)}`}
                        </dd>
                    </div>

                    <div className="book-details-card__field">
                        <dt>Read</dt>
                        <dd>
                            {book.is_read ? 'Yes' : 'No'}
                        </dd>
                    </div>

                    <div className="book-details-card__field">
                        <dt>Completion Date</dt>
                        <dd>
                            {displayDate(
                                book.completion_date,
                            )}
                        </dd>
                    </div>

                    <div className="book-details-card__field">
                        <dt>Rating</dt>
                        <dd>
                            {displayValue(book.rating)}
                        </dd>
                    </div>

                    <div className="book-details-card__field book-details-card__field--wide">
                        <dt>Review</dt>
                        <dd>
                            {displayValue(book.review)}
                        </dd>
                    </div>

                    <div className="book-details-card__field book-details-card__field--wide">
                        <dt>Notes</dt>
                        <dd>
                            {displayValue(book.notes)}
                        </dd>
                    </div>
                </dl>
            </article>

            {isOnLoan ? (
                <section className="book-details-panel">
                    <h2>Current Loan</h2>

                    <p>
                        This book is currently on loan.
                        Borrower and checkout timing live
                        on the loan record.
                    </p>
                </section>
            ) : null}

            <section className="book-details-panel">
                <h2>Borrowing History</h2>

                <dl className="book-details-panel__metadata">
                    <div>
                        <dt>Times Borrowed</dt>
                        <dd>
                            {book.times_borrowed}
                        </dd>
                    </div>

                    <div>
                        <dt>Last Borrowed</dt>
                        <dd>
                            {displayDate(
                                book.last_borrowed_at,
                            )}
                        </dd>
                    </div>

                    <div>
                        <dt>Average Loan</dt>
                        <dd>
                            {book.average_loan_days === null
                                ? 'No returned loans yet'
                                : `${book.average_loan_days} days`}
                        </dd>
                    </div>
                </dl>
            </section>

            {canShowActiveActions ? (
                <nav
                    className="book-details-actions"
                    aria-label="Book actions"
                >
                    <AppLink
                        to={`/books/${book.id}/edit`}
                        variant="secondary"
                    >
                        Edit Book
                    </AppLink>

                    {canCheckout ? (
                        <Button
                            type="button"
                            variant="primary"
                            onClick={() => {
                                setCheckoutOpen(true)
                            }}
                        >
                            Check Out
                        </Button>
                    ) : null}

                    {canCheckin ? (
                        <AppLink
                            to={`/loans?bookId=${encodeURIComponent(book.id)}`}
                            variant="primary"
                        >
                            Check In
                        </AppLink>
                    ) : null}

                    {canMarkRead ? (
                        <AppLink
                            to={`/books/${book.id}/mark-read`}
                            variant="secondary"
                        >
                            Mark Read
                        </AppLink>
                    ) : null}

                    {canEditReading ? (
                        <AppLink
                            to={`/books/${book.id}/reading`}
                            variant="secondary"
                        >
                            Edit Reading
                        </AppLink>
                    ) : null}

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

            <CheckoutDialog
                book={book}
                open={
                    checkoutOpen &&
                    canCheckout
                }
                onClose={() => {
                    setCheckoutOpen(false)
                }}
            />
        </section>
    )
}
