import {
    useEffect,
    useState,
} from 'react'
import {
    useLocation,
    useParams,
    useSearchParams,
} from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

import {
    BookCover,
} from '../components/BookCover'
import {
    BookCoverManager,
} from '../components/BookCoverManager'
import {
    AddBookToCollectionDialog,
} from '../../collections/components/AddBookToCollectionDialog'
import { Alert } from '../../../components/Alert'
import { AppLink } from '../../../components/AppLink'
import { LoadingState } from '../../../components/LoadingState'
import { QueryErrorState } from '../../../components/QueryErrorState'
import { isBookIdentityError } from '../../../api/bookIdentity'
import { useBook } from '../../../api/booksQueries'
import { useLoans } from '../../../api/loansQueries'
import {
    findActiveLoan,
    isCheckinEligible,
} from '../../loans/checkinEligibility'
import { queryKeys } from '../../../api/queryKeys'
import type {
    Status,
} from '../../../api/apiTypes'
import { formatShelfCommonNameForDisplay } from '../../shelves/shelfDisplay'
import { formatBookCategories } from '../categoryDisplay'
import { formatBookAuthors } from '../authorDisplay'
import { Button } from '../../../components/Button'
import { CheckoutDialog } from '../../loans/components/CheckoutDialog'
import { isCheckoutEligible } from '../../loans/checkoutEligibility'
import { BorrowerReviews } from '../../loans/components/BorrowerReviews'

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
    const location = useLocation()
    const [searchParams, setSearchParams] =
        useSearchParams()

    const [checkoutOpen, setCheckoutOpen] =
        useState(() => searchParams.has('checkout'))
    const [
        addToCollectionOpen,
        setAddToCollectionOpen,
    ] = useState(false)
    const queryClient = useQueryClient()

    const booksReturnTo =
        typeof location.state === 'object' &&
        location.state !== null &&
        'booksReturnTo' in location.state &&
        typeof location.state.booksReturnTo === 'string' &&
        location.state.booksReturnTo.startsWith('/books')
            ? location.state.booksReturnTo
            : '/books'

    const bookQuery = useBook(bookId ?? '')

    const loansQuery = useLoans({
        bookId: bookId ?? '',
    })

    const isNotFound =
        bookQuery.isError &&
        isBookIdentityError(bookQuery.error)

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
                        from the API, or the book id is
                        not a valid GUID.
                    </Alert>

                    <AppLink
                        to={booksReturnTo}
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
                    to={booksReturnTo}
                    variant="secondary"
                >
                    Back to Books
                </AppLink>
            </section>
        )
    }

    const book = bookQuery.data

    const isOnLoan =
        book.status === 'on_loan'

    const canShowActiveActions = true

    const canCheckout =
        isCheckoutEligible(book) ||
        book.status === 'reserved' ||
        book.status === 'reading'

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
            book.book_id,
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
        <section className="route-page book-details-page">
            <div className="book-details__topbar">
                <AppLink
                    to={booksReturnTo}
                    variant="secondary"
                >
                    ← Back to Books
                </AppLink>
            </div>

            <article className="book-details-card">
                <div className="book-details-card__cover">
                    <BookCover
                        bookId={book.book_id}
                        title={book.title}
                        status={book.status}
                        eager
                    />

                    {canShowActiveActions ? (
                        <BookCoverManager
                            bookId={book.book_id}
                        />
                    ) : null}
                </div>

                <div className="book-details-card__content">
                    <header className="book-details-card__header">
                        <h1 tabIndex={-1}>
                            {book.title}
                        </h1>

                        <p>
                            {formatBookAuthors(
                                book.authors,
                            )}
                        </p>
                    </header>

                    <dl className="book-details-card__metadata">
                    {(book.categories?.length ?? 0) > 0 ? <div className="book-details-card__field">
                        <dt>Category</dt>
                        <dd>
                            {formatBookCategories(
                                book.categories,
                            )}
                        </dd>
                    </div> : null}

                    <div className="book-details-card__field">
                        <dt>Shelf</dt>
                        <dd>
                            {book.placement_state === 'stashed'
                                ? 'Stash'
                                : book.shelf_name
                                    ? formatShelfCommonNameForDisplay(book.shelf_name)
                                    : 'Unshelved'}
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

                    {book.isbn_not_applicable || Boolean(book.isbn13?.trim()) ? <div className="book-details-card__field">
                        <dt>ISBN-13</dt>
                        <dd>
                            {book.isbn_not_applicable
                                ? 'ISBN not applicable'
                                : displayValue(book.isbn13)}
                        </dd>
                    </div> : null}

                    {book.publisher?.trim() ? <div className="book-details-card__field">
                        <dt>Publisher</dt>
                        <dd>
                            {displayValue(book.publisher)}
                        </dd>
                    </div> : null}

                    {(book.illustrators?.length ?? 0) > 0 ? (
                        <div className="book-details-card__field">
                            <dt>Illustrators</dt>
                            <dd>{formatBookAuthors(book.illustrators)}</dd>
                        </div>
                    ) : null}

                    {(book.editors?.length ?? 0) > 0 ? (
                        <div className="book-details-card__field">
                            <dt>Editors</dt>
                            <dd>{formatBookAuthors(book.editors)}</dd>
                        </div>
                    ) : null}

                    {(book.translators?.length ?? 0) > 0 ? (
                        <div className="book-details-card__field">
                            <dt>Translators</dt>
                            <dd>{formatBookAuthors(book.translators)}</dd>
                        </div>
                    ) : null}

                    {book.publication_date?.trim() ? <div className="book-details-card__field">
                        <dt>Publication Date</dt>
                        <dd>
                            {displayDate(
                                book.publication_date,
                            )}
                        </dd>
                    </div> : null}

                    {book.pages !== null && book.pages !== undefined ? <div className="book-details-card__field">
                        <dt>Pages</dt>
                        <dd>
                            {displayValue(book.pages)}
                        </dd>
                    </div> : null}

                    {book.acquisition_source?.trim() ? <div className="book-details-card__field">
                        <dt>Acquisition Source</dt>
                        <dd>
                            {displayValue(
                                book.acquisition_source,
                            )}
                        </dd>
                    </div> : null}

                    {book.purchase_date?.trim() ? <div className="book-details-card__field">
                        <dt>Purchase Date</dt>
                        <dd>
                            {displayDate(book.purchase_date)}
                        </dd>
                    </div> : null}

                    {book.purchase_price !== null && book.purchase_price !== undefined ? <div className="book-details-card__field">
                        <dt>Purchase Price</dt>
                        <dd>
                            {book.purchase_price === null ||
                            book.purchase_price === undefined
                                ? 'Not provided'
                                : `$${book.purchase_price.toFixed(2)}`}
                        </dd>
                    </div> : null}

                    <div className="book-details-card__field">
                        <dt>Read</dt>
                        <dd>
                            {book.is_read ? 'Yes' : 'No'}
                        </dd>
                    </div>

                    {book.completion_date?.trim() ? <div className="book-details-card__field">
                        <dt>Completion Date</dt>
                        <dd>
                            {displayDate(
                                book.completion_date,
                            )}
                        </dd>
                    </div> : null}

                    {book.rating !== null && book.rating !== undefined ? <div className="book-details-card__field">
                        <dt>Owner rating</dt>
                        <dd>
                            {displayValue(book.rating)}
                        </dd>
                    </div> : null}

                    {book.borrower_rating?.count ? <div className="book-details-card__field">
                        <dt>Borrower rating</dt>
                        <dd>
                            {`${book.borrower_rating.average ?? 'Not provided'} / 5 (${book.borrower_rating.count})`}
                        </dd>
                    </div> : null}

                    {book.review?.trim() ? <div className="book-details-card__field book-details-card__field--wide">
                        <dt>Owner review</dt>
                        <dd>
                            {displayValue(book.review)}
                        </dd>
                    </div> : null}

                        {book.notes?.trim() ? <div className="book-details-card__field book-details-card__field--wide">
                            <dt>Notes</dt>
                            <dd>
                                {displayValue(book.notes)}
                            </dd>
                        </div> : null}
                    </dl>
                </div>
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

            <BorrowerReviews bookId={book.book_id} loans={loansQuery.data?.items ?? []} />

            {canShowActiveActions ? (
                <nav
                    className="book-details-actions"
                    aria-label="Book actions"
                >
                    <AppLink
                        to={`/books/${book.book_id}/edit`}
                        variant="secondary"
                    >
                        Edit Book
                    </AppLink>

                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                            setAddToCollectionOpen(true)
                        }}
                    >
                        Add to Collection
                    </Button>

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
                            to={`/reading-room/loans?bookId=${encodeURIComponent(book.book_id)}`}
                            variant="primary"
                        >
                            Check In
                        </AppLink>
                    ) : null}

                    {canMarkRead ? (
                        <AppLink
                            to={`/books/${book.book_id}/mark-read`}
                            variant="secondary"
                        >
                            Mark Read
                        </AppLink>
                    ) : null}

                    {canEditReading ? (
                        <AppLink
                            to={`/books/${book.book_id}/reading`}
                            variant="secondary"
                        >
                            Edit Reading
                        </AppLink>
                    ) : null}

                    {canDelete ? (
                        <AppLink
                            to={`/books/${book.book_id}/delete`}
                            variant="secondary"
                        >
                            Delete Book
                        </AppLink>
                    ) : null}
                </nav>
            ) : null}

            <AddBookToCollectionDialog
                book={book}
                open={
                    addToCollectionOpen &&
                    canShowActiveActions
                }
                onClose={() => {
                    setAddToCollectionOpen(false)
                }}
            />

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
