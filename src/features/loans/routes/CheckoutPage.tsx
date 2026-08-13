import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Alert } from '../../../components/Alert'
import { AppLink } from '../../../components/AppLink'
import { Button } from '../../../components/Button'
import { Field } from '../../../components/Field'
import {
    useBooks,
    useCheckoutBook,
} from '../../../api/booksQueries'
import {
    checkoutFormDefaults,
    checkoutFormValuesToRequest,
    validateCheckoutFormValues,
    type CheckoutFormFieldErrors,
    type CheckoutFormValues,
} from '../checkoutModel'

export function CheckoutPage() {
    const navigate = useNavigate()
    const [
        searchParams,
        setSearchParams,
    ] = useSearchParams()

    const {
        data: booksResponse,
        isPending: booksPending,
        isError: booksError,
    } = useBooks()

    const books = booksResponse?.items ?? []

    const checkoutBook = useCheckoutBook()

    const [
        values,
        setValues,
    ] = useState<CheckoutFormValues>(
        checkoutFormDefaults,
    )

    const [
        fieldErrors,
        setFieldErrors,
    ] = useState<CheckoutFormFieldErrors>({})

    const [
        formError,
        setFormError,
    ] = useState<string | null>(null)

    const selectedBookId =
        searchParams.get('bookId') ?? ''

    const eligibleBooks = books.filter(
        (book) =>
            book.deletion_date === null &&
            book.status === 'available',
    )

    const selectedBook =
        books.find(
            (book) => book.id === selectedBookId,
        ) ?? null

    const selectedBookIsEligible =
        selectedBook !== null &&
        selectedBook.deletion_date === null &&
        selectedBook.status === 'available'

    function selectBook(id: string) {
        setSearchParams(
            id ? { bookId: id } : {},
        )
        setFormError(null)
    }

    function updateField<
        K extends keyof CheckoutFormValues,
    >(
        field: K,
        value: CheckoutFormValues[K],
    ) {
        setValues((current) => ({
            ...current,
            [field]: value,
        }))

        setFieldErrors((current) => {
            if (!(field in current)) {
                return current
            }

            const next = {
                ...current,
            }

            delete next[field]
            return next
        })

        setFormError(null)
    }

    function handleSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault()

        const errors =
            validateCheckoutFormValues(values)

        setFieldErrors(errors)
        setFormError(null)

        if (Object.keys(errors).length > 0) {
            return
        }

        if (!selectedBookIsEligible) {
            setFormError(
                'Select an available book before checking it out.',
            )
            return
        }

        const request =
            checkoutFormValuesToRequest(values)

        checkoutBook.mutate(
            {
                id: selectedBookId,
                request,
            },
            {
                onSuccess: () => {
                    navigate(
                        `/books/${selectedBookId}`,
                    )
                },
                onError: (error) => {
                    setFormError(
                        error instanceof Error
                            ? error.message
                            : 'The book could not be checked out.',
                    )
                },
            },
        )
    }

    if (booksPending) {
        return (
            <section className="route-page">
                <h1>Check Out Book</h1>
                <p>Loading books…</p>
            </section>
        )
    }

    if (booksError) {
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
                    title="Could not load books"
                >
                    The available books could not be loaded.
                </Alert>
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

            <header>
                <h1>Check Out Book</h1>
                <p>
                    Record a loan for an available book.
                </p>
            </header>

            {selectedBookId &&
            selectedBook &&
            !selectedBookIsEligible ? (
                <Alert
                    variant="warning"
                    title="Book is no longer available"
                >
                    {selectedBook.title} cannot be checked
                    out because its current status is{' '}
                    {selectedBook.status}.
                    Please select another book.
                </Alert>
            ) : null}

            {selectedBookId &&
            !selectedBook ? (
                <Alert
                    variant="warning"
                    title="Book not found"
                >
                    The requested book could not be found.
                    Please select another book.
                </Alert>
            ) : null}

            {formError ? (
                <Alert
                    variant="error"
                    title="Checkout failed"
                >
                    {formError}
                </Alert>
            ) : null}

            <form onSubmit={handleSubmit}>
                <Field
                    label="Book"
                    id="checkout-book"
                >
                    <select
                        id="checkout-book"
                        value={
                            selectedBookIsEligible
                                ? selectedBookId
                                : ''
                        }
                        onChange={(event) =>
                            selectBook(
                                event.target.value,
                            )
                        }
                    >
                        <option value="">
                            Select a book…
                        </option>

                        {eligibleBooks.map((book) => (
                            <option
                                key={book.id}
                                value={book.id}
                            >
                                {book.title} — {book.authors}
                            </option>
                        ))}
                    </select>
                </Field>

                <Field
                    label="Borrower"
                    id="checkout-borrower"
                    error={fieldErrors.borrower}
                >
                    <input
                        id="checkout-borrower"
                        type="text"
                        value={values.borrower}
                        onChange={(event) =>
                            updateField(
                                'borrower',
                                event.target.value,
                            )
                        }
                        autoComplete="off"
                    />
                </Field>

                <Field
                    label="Checkout date and time"
                    id="checkout-checked-out-at"
                    helpText="Leave blank to use the server's current UTC time."
                    error={
                        fieldErrors.checked_out_at
                    }
                >
                    <input
                        id="checkout-checked-out-at"
                        type="datetime-local"
                        value={
                            values.checked_out_at
                        }
                        onChange={(event) =>
                            updateField(
                                'checked_out_at',
                                event.target.value,
                            )
                        }
                    />
                </Field>

                <Field
                    label="Due date"
                    id="checkout-due-at"
                    error={fieldErrors.due_at}
                >
                    <input
                        id="checkout-due-at"
                        type="date"
                        value={values.due_at}
                        onChange={(event) =>
                            updateField(
                                'due_at',
                                event.target.value,
                            )
                        }
                    />
                </Field>

                <Field
                    label="Notes"
                    id="checkout-notes"
                    error={fieldErrors.notes}
                >
                    <textarea
                        id="checkout-notes"
                        value={values.notes}
                        onChange={(event) =>
                            updateField(
                                'notes',
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
                            checkoutBook.isPending ||
                            !selectedBookIsEligible
                        }
                    >
                        {checkoutBook.isPending
                            ? 'Checking Out…'
                            : 'Check Out Book'}
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