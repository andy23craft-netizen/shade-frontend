import {
    useEffect,
    useRef,
    useState,
} from 'react'
import {
    useNavigate,
    useSearchParams,
} from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

import { ConfirmationDialog } from '../../../components'
import { Alert } from '../../../components/Alert'
import { AppLink } from '../../../components/AppLink'
import { Button } from '../../../components/Button'
import { Field } from '../../../components/Field'
import { LoadingState } from '../../../components/LoadingState'
import {
    isApiError,
    type ApiFieldError,
} from '../../../api/apiErrors'
import {
    useBook,
    useBooks,
    useCheckinBook,
} from '../../../api/booksQueries'
import {
    useLoans,
} from '../../../api/loansQueries'
import { queryKeys } from '../../../api/queryKeys'
import {
    findActiveLoan,
    isCheckinEligible,
} from '../checkinEligibility'
import {
    checkinFormDefaults,
    checkinFormValuesToRequest,
    validateCheckinFormValues,
    type CheckinFormFieldErrors,
    type CheckinFormValues,
} from '../checkinModel'

function focusSummary(
    node: HTMLDivElement | null,
) {
    node?.focus()
}

const CHECKIN_FORM_FIELDS = new Set<string>([
    'returned_at',
])

function mapCheckinFieldErrors(
    fieldErrors: readonly ApiFieldError[],
): CheckinFormFieldErrors {
    const mapped: CheckinFormFieldErrors = {}

    for (const entry of fieldErrors) {
        const field =
            entry.field.split('.')[0]

        if (
            !field ||
            !CHECKIN_FORM_FIELDS.has(field) ||
            mapped[
                field as keyof CheckinFormFieldErrors
                ]
        ) {
            continue
        }

        mapped[
            field as keyof CheckinFormFieldErrors
            ] = entry.message
    }

    return mapped
}

export function CheckinPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [
        searchParams,
        setSearchParams,
    ] = useSearchParams()

    const bookId =
        searchParams.get('bookId') ?? ''

    const booksQuery = useBooks({
        enabled: !bookId,
    })

    const bookQuery = useBook(bookId)

    const loansQuery = useLoans(
        bookId
            ? {
                bookId,
            }
            : {},
    )

    const checkinBook = useCheckinBook()

    const summaryRef =
        useRef<HTMLDivElement>(null)

    const [
        values,
        setValues,
    ] = useState<CheckinFormValues>(
        checkinFormDefaults,
    )

    const [
        fieldErrors,
        setFieldErrors,
    ] = useState<CheckinFormFieldErrors>({})

    const [
        formError,
        setFormError,
    ] = useState<string | null>(null)

    const [
        pendingCheckinRequest,
        setPendingCheckinRequest,
    ] = useState<
        ReturnType<
            typeof checkinFormValuesToRequest
        > | null
    >(null)

    const [
        isConfirmationOpen,
        setIsConfirmationOpen,
    ] = useState(false)

    const loanItems =
        loansQuery.data?.items ?? []

    const activeLoan = bookId
        ? findActiveLoan(
            bookId,
            loanItems,
        )
        : undefined

    const errorEntries = (
        Object.entries(fieldErrors) as [
            keyof CheckinFormFieldErrors,
            string,
        ][]
    ).filter(
        (
            entry,
        ): entry is [
            keyof CheckinFormFieldErrors,
            string,
        ] => Boolean(entry[1]),
    )

    const hasSummary =
        errorEntries.length > 0 ||
        Boolean(formError)

    useEffect(() => {
        if (!hasSummary) {
            return
        }

        focusSummary(summaryRef.current)
    }, [
        formError,
        fieldErrors,
        hasSummary,
    ])

    async function refreshEligibleBooks() {
        setFormError(null)
        setFieldErrors({})
        setPendingCheckinRequest(null)
        setIsConfirmationOpen(false)

        setSearchParams({})

        await Promise.all([
            queryClient.invalidateQueries({
                queryKey: queryKeys.books.all,
            }),
            queryClient.invalidateQueries({
                queryKey: queryKeys.loans.all,
            }),
        ])
    }

    async function refetchStaleLoanState() {
        await Promise.all([
            queryClient.invalidateQueries({
                queryKey:
                    queryKeys.books.detail(bookId),
            }),
            queryClient.invalidateQueries({
                queryKey:
                queryKeys.books.all,
            }),
            queryClient.invalidateQueries({
                queryKey:
                queryKeys.loans.all,
            }),
        ])
    }

    function updateReturnedAt(
        value: string,
    ) {
        setValues({
            returned_at: value,
        })

        setFieldErrors((current) => {
            if (!current.returned_at) {
                return current
            }

            const next = {
                ...current,
            }

            delete next.returned_at
            return next
        })

        setFormError(null)
    }

    function handleSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault()

        const errors =
            validateCheckinFormValues(values)

        setFieldErrors(errors)
        setFormError(null)

        if (Object.keys(errors).length > 0) {
            return
        }

        if (
            !bookQuery.data ||
            !isCheckinEligible(
                bookQuery.data,
                loanItems,
            )
        ) {
            setFormError(
                'This book does not currently have an active loan.',
            )
            return
        }

        const request =
            checkinFormValuesToRequest(values)

        setPendingCheckinRequest(request)
        setIsConfirmationOpen(true)
    }

    function handleConfirmCheckin() {
        if (pendingCheckinRequest === null) {
            return
        }

        if (
            !bookQuery.data ||
            !isCheckinEligible(
                bookQuery.data,
                loanItems,
            )
        ) {
            setIsConfirmationOpen(false)
            setPendingCheckinRequest(null)
            setFormError(
                'This book does not currently have an active loan.',
            )
            return
        }

        setIsConfirmationOpen(false)

        checkinBook.mutate(
            {
                id: bookId,
                request: pendingCheckinRequest,
            },
            {
                onSuccess: () => {
                    navigate(`/books/${bookId}`)
                },
                onError: (error) => {
                    void handleCheckinError(error)
                },
            },
        )
    }

    function handleCancelCheckin() {
        setIsConfirmationOpen(false)
    }

    async function handleCheckinError(
        error: unknown,
    ) {
        if (
            isApiError(error) &&
            error.status === 422
        ) {
            const mappedErrors =
                mapCheckinFieldErrors(
                    error.fieldErrors,
                )

            setFieldErrors(mappedErrors)

            setFormError(
                Object.keys(mappedErrors).length === 0
                    ? error.message
                    : null,
            )

            return
        }

        if (
            isApiError(error) &&
            error.status === 404
        ) {
            await refetchStaleLoanState()

            setFormError(
                'This book or loan could not be found. The book and loan state were refreshed; your return date was kept.',
            )
            return
        }

        if (
            isApiError(error) &&
            error.status === 409
        ) {
            await refetchStaleLoanState()

            setFormError(
                error.detail === 'Book is not checked out'
                    ? 'Book is not checked out. The book and loan state were refreshed; your return date was kept.'
                    : error.message,
            )
            return
        }

        setFormError(
            isApiError(error)
                ? error.message
                : error instanceof Error
                    ? error.message
                    : 'The book could not be checked in.',
        )
    }

    if (!bookId) {
        if (
            booksQuery.isPending ||
            loansQuery.isPending
        ) {
            return (
                <section className="route-page">
                    <h1 tabIndex={-1}>
                        Check In Book
                    </h1>

                    <LoadingState label="Loading eligible books…" />
                </section>
            )
        }

        if (booksQuery.isError) {
            return (
                <section className="route-page">
                    <h1 tabIndex={-1}>
                        Check In Book
                    </h1>

                    <Alert
                        variant="error"
                        title="Unable to load books"
                    >
                        {booksQuery.error instanceof Error
                            ? booksQuery.error.message
                            : 'The books could not be loaded.'}
                    </Alert>

                    <Button
                        type="button"
                        onClick={() => {
                            void booksQuery.refetch()
                        }}
                    >
                        Retry
                    </Button>
                </section>
            )
        }

        if (loansQuery.isError) {
            return (
                <section className="route-page">
                    <h1 tabIndex={-1}>
                        Check In Book
                    </h1>

                    <Alert
                        variant="error"
                        title="Unable to load loans"
                    >
                        {loansQuery.error instanceof Error
                            ? loansQuery.error.message
                            : 'The loan state could not be loaded.'}
                    </Alert>

                    <Button
                        type="button"
                        onClick={() => {
                            void loansQuery.refetch()
                        }}
                    >
                        Retry
                    </Button>
                </section>
            )
        }

        const books =
            booksQuery.data.items

        const eligibleBooks =
            books.filter((book) =>
                isCheckinEligible(
                    book,
                    loanItems,
                ),
            )

        return (
            <section className="route-page">
                <AppLink
                    to="/books"
                    variant="secondary"
                >
                    ← Back to Books
                </AppLink>

                <header>
                    <h1 tabIndex={-1}>
                        Check In Book
                    </h1>

                    <p>
                        Select a book with an active
                        loan to check in.
                    </p>
                </header>

                {eligibleBooks.length === 0 ? (
                    <Alert
                        variant="info"
                        title="No books to check in"
                    >
                        There are no active loans
                        available for check-in.
                    </Alert>
                ) : (
                    <ul aria-label="Books available for check-in">
                        {eligibleBooks.map(
                            (book) => {
                                const loan =
                                    findActiveLoan(
                                        book.id,
                                        loanItems,
                                    )

                                return (
                                    <li key={book.id}>
                                        <article>
                                            <h2>
                                                {
                                                    book.title
                                                }
                                            </h2>

                                            <p>
                                                {
                                                    book.authors
                                                }
                                            </p>

                                            <dl>
                                                <dt>
                                                    Borrower
                                                </dt>
                                                <dd>
                                                    {loan?.borrower ??
                                                        'Not provided'}
                                                </dd>

                                                <dt>
                                                    Checked Out
                                                </dt>
                                                <dd>
                                                    {loan?.checked_out_at ??
                                                        'Not provided'}
                                                </dd>
                                            </dl>

                                            <Button
                                                type="button"
                                                variant="primary"
                                                onClick={() => {
                                                    setSearchParams(
                                                        {
                                                            bookId:
                                                            book.id,
                                                        },
                                                    )
                                                }}
                                            >
                                                Select
                                            </Button>
                                        </article>
                                    </li>
                                )
                            },
                        )}
                    </ul>
                )}
            </section>
        )
    }

    if (
        bookQuery.isPending ||
        loansQuery.isPending
    ) {
        return (
            <section className="route-page">
                <h1 tabIndex={-1}>
                    Check In Book
                </h1>

                <LoadingState label="Loading check-in…" />
            </section>
        )
    }

    if (bookQuery.isError) {
        const isNotFound =
            isApiError(bookQuery.error) &&
            bookQuery.error.status === 404

        if (isNotFound) {
            return (
                <section className="route-page">
                    <h1 tabIndex={-1}>
                        Check In Book
                    </h1>

                    <Alert
                        variant="warning"
                        title="Book is not available for check-in"
                    >
                        The selected book could not
                        be found or is no longer
                        eligible for check-in.
                    </Alert>

                    <Button
                        type="button"
                        onClick={() => {
                            void refreshEligibleBooks()
                        }}
                    >
                        Refresh eligible books
                    </Button>
                </section>
            )
        }

        return (
            <section className="route-page">
                <AppLink
                    to="/books"
                    variant="secondary"
                >
                    ← Back to Books
                </AppLink>

                <Alert
                    variant="error"
                    title="Unable to load book"
                >
                    {bookQuery.error instanceof Error
                        ? bookQuery.error.message
                        : 'The book could not be loaded.'}
                </Alert>

                <Button
                    type="button"
                    onClick={() => {
                        void bookQuery.refetch()
                    }}
                >
                    Retry
                </Button>
            </section>
        )
    }

    if (loansQuery.isError) {
        return (
            <section className="route-page">
                <AppLink
                    to={`/books/${bookId}`}
                    variant="secondary"
                >
                    ← Back to Book
                </AppLink>

                <Alert
                    variant="error"
                    title="Unable to load loan state"
                >
                    {loansQuery.error instanceof Error
                        ? loansQuery.error.message
                        : 'The loan state could not be loaded.'}
                </Alert>

                <Button
                    type="button"
                    onClick={() => {
                        void loansQuery.refetch()
                    }}
                >
                    Retry
                </Button>
            </section>
        )
    }

    const book = bookQuery.data

    if (
        !isCheckinEligible(
            book,
            loanItems,
        )
    ) {
        return (
            <section className="route-page">
                <AppLink
                    to={`/books/${bookId}`}
                    variant="secondary"
                >
                    ← Back to Book
                </AppLink>

                <Alert
                    variant="warning"
                    title="Book is not checked out"
                >
                    {book.title} does not currently have
                    an active loan.
                </Alert>

                <Button
                    type="button"
                    onClick={() => {
                        void refreshEligibleBooks()
                    }}
                >
                    Refresh eligible books
                </Button>
            </section>
        )
    }

    return (
        <section className="route-page">
            <AppLink
                to={`/books/${bookId}`}
                variant="secondary"
            >
                ← Back to Book
            </AppLink>

            <header>
                <h1>Check In Book</h1>

                <p>
                    Complete the current loan for this
                    book.
                </p>
            </header>

            <section>
                <h2>{book.title}</h2>
                <p>{book.authors}</p>

                <dl>
                    <dt>Borrower</dt>
                    <dd>
                        {activeLoan?.borrower ??
                            'Not provided'}
                    </dd>

                    <dt>Checked Out</dt>
                    <dd>
                        {activeLoan?.checked_out_at ??
                            'Not provided'}
                    </dd>
                </dl>
            </section>

            {hasSummary ? (
                <div
                    ref={summaryRef}
                    tabIndex={-1}
                    role="alert"
                    className="alert alert--error"
                >
                    <strong>
                        {formError
                            ? 'Check-in failed'
                            : 'Fix the following errors'}
                    </strong>

                    {formError ? (
                        <p>{formError}</p>
                    ) : null}

                    {errorEntries.length > 0 ? (
                        <ul>
                            {errorEntries.map(
                                ([
                                     field,
                                     message,
                                 ]) => (
                                    <li key={field}>
                                        <a href="#checkin-returned-at">
                                            Return date and
                                            time: {message}
                                        </a>
                                    </li>
                                ),
                            )}
                        </ul>
                    ) : null}
                </div>
            ) : null}

            <form
                onSubmit={handleSubmit}
                noValidate
            >
                <Field
                    label="Return date and time"
                    id="checkin-returned-at"
                    helpText="Leave blank to use the server's current UTC time."
                    error={
                        fieldErrors.returned_at
                    }
                >
                    <input
                        id="checkin-returned-at"
                        type="datetime-local"
                        value={
                            values.returned_at
                        }
                        onChange={(event) =>
                            updateReturnedAt(
                                event.target.value,
                            )
                        }
                    />
                </Field>

                <div>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={
                            checkinBook.isPending
                        }
                    >
                        {checkinBook.isPending
                            ? 'Checking In...'
                            : 'Check In Book'}
                    </Button>

                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() =>
                            navigate(-1)
                        }
                    >
                        Cancel
                    </Button>
                </div>
            </form>

            <ConfirmationDialog
                open={isConfirmationOpen}
                title="Confirm check-in"
                confirmLabel="Confirm check-in"
                onConfirm={handleConfirmCheckin}
                onCancel={handleCancelCheckin}
            >
                Are you sure you want to check in this book?
            </ConfirmationDialog>
        </section>
    )
}