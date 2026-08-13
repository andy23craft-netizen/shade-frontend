import { useState } from 'react'
import {
    useNavigate,
    useSearchParams,
} from 'react-router-dom'

import { Alert } from '../../../components/Alert'
import { AppLink } from '../../../components/AppLink'
import { Button } from '../../../components/Button'
import { Field } from '../../../components/Field'
import {
    useBook,
    useCheckinBook,
} from '../../../api/booksQueries'
import {
    useLoans,
} from '../../../api/loansQueries'
import {
    checkinFormDefaults,
    checkinFormValuesToRequest,
    validateCheckinFormValues,
    type CheckinFormFieldErrors,
    type CheckinFormValues,
} from '../checkinModel'

export function CheckinPage() {
    const navigate = useNavigate()
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

    const checkedInBookId = bookId

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

    const activeLoan =
        loansQuery.data?.items.find(
            (loan) => loan.returned_at === null,
        )

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

        const request =
            checkinFormValuesToRequest(values)

        checkinBook.mutate(
            {
                id: checkedInBookId,
                request,
            },
            {
                onSuccess: () => {
                    navigate(`/books/${bookId}`)
                },
                onError: (error) => {
                    setFormError(
                        error instanceof Error
                            ? error.message
                            : 'The book could not be checked in.',
                    )
                },
            },
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

            {formError ? (
                <Alert
                    variant="error"
                    title="Check-in failed"
                >
                    {formError}
                </Alert>
            ) : null}

            <form onSubmit={handleSubmit}>
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
