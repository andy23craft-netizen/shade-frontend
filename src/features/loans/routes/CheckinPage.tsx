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

import { Alert } from '../../../components/Alert'
import { AppLink } from '../../../components/AppLink'
import { Button } from '../../../components/Button'
import { Field } from '../../../components/Field'
import {
    isApiError,
} from '../../../api/apiErrors'
import {
    useBook,
    useCheckinBook,
} from '../../../api/booksQueries'
import {
    useLoans,
} from '../../../api/loansQueries'
import { queryKeys } from '../../../api/queryKeys'
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

export function CheckinPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [searchParams] = useSearchParams()
    const bookId = searchParams.get('bookId') ?? ''

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

    const activeLoan =
        loansQuery.data?.items.find(
            (loan) => loan.returned_at === null,
        )

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

    if (!bookId) {
        return (
            <section className="route-page">
                <Alert
                    variant="error"
                    title="Book not found"
                >
                    No book ID was provided.
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

    if (bookQuery.isPending) {
        return (
            <section className="route-page">
                <h1>Check In Book</h1>
                <p>Loading book...</p>
            </section>
        )
    }

    if (bookQuery.isError) {
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

    const book = bookQuery.data

    if (
        book.deletion_date !== null ||
        book.status !== 'on_loan'
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
            </section>
        )
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

        const request =
            checkinFormValuesToRequest(values)

        checkinBook.mutate(
            {
                id: bookId,
                request,
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

    async function handleCheckinError(
        error: unknown,
    ) {
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
                'This book is no longer available for check-in. The book and loan state were refreshed; your return date was kept.',
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
                                        <a
                                            href="#checkin-returned-at"
                                        >
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
        </section>
    )
}