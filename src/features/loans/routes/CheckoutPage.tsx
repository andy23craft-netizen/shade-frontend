import {
    lazy,
    Suspense,
    useEffect,
    useRef,
    useState,
} from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

import { Alert } from '../../../components/Alert'
import { AppLink } from '../../../components/AppLink'
import { Button } from '../../../components/Button'
import { ConfirmationDialog } from '../../../components/ConfirmationDialog'
import { Field } from '../../../components/Field'
import { LoadingState } from '../../../components/LoadingState'
import {
    isApiError,
    type ApiFieldError,
} from '../../../api/apiErrors'
import type { BookRead } from '../../../api/apiTypes'
import {
    useBooks,
    useCheckoutBook,
} from '../../../api/booksQueries'
import { queryKeys } from '../../../api/queryKeys'
import {
    compactIsbnForListFilter,
    isValidIsbn,
} from '../../books/utils/isbn'
import { useHardwareIsbnScanner } from '../../scanning/useHardwareIsbnScanner'
import {
    checkoutFormDefaults,
    checkoutFormValuesToRequest,
    validateCheckoutFormValues,
    type CheckoutFormFieldErrors,
    type CheckoutFormValues,
} from '../checkoutModel'

const CHECKOUT_FORM_FIELDS = new Set<string>([
    'borrower',
    'checked_out_at',
    'due_at',
    'notes',
])

const FIELD_LABELS: Record<
    keyof CheckoutFormFieldErrors,
    string
> = {
    borrower: 'Borrower',
    checked_out_at: 'Checkout date and time',
    due_at: 'Due date',
    notes: 'Notes',
}

const FIELD_IDS: Record<
    keyof CheckoutFormFieldErrors,
    string
> = {
    borrower: 'checkout-borrower',
    checked_out_at: 'checkout-checked-out-at',
    due_at: 'checkout-due-at',
    notes: 'checkout-notes',
}

const CONFLICT_MESSAGE =
    'Book is already checked out'

const IsbnCameraScanner = lazy(
    () =>
        import('../../scanning/IsbnCameraScanner').then(
            (module) => ({
                default: module.IsbnCameraScanner,
            }),
        ),
)

function isCheckoutEligible(
    book: BookRead,
): boolean {
    return (
        book.deletion_date === null &&
        book.status === 'available'
    )
}

function mapCheckoutFieldErrors(
    fieldErrors: readonly ApiFieldError[],
): CheckoutFormFieldErrors {
    const mapped: CheckoutFormFieldErrors = {}

    for (const entry of fieldErrors) {
        const field = entry.field.split('.')[0]

        if (
            !field ||
            !CHECKOUT_FORM_FIELDS.has(field) ||
            mapped[field as keyof CheckoutFormFieldErrors]
        ) {
            continue
        }

        mapped[field as keyof CheckoutFormFieldErrors] =
            entry.message
    }

    return mapped
}

function focusSummary(
    node: HTMLDivElement | null,
) {
    node?.focus()
}

export function CheckoutPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [
        searchParams,
        setSearchParams,
    ] = useSearchParams()

    const booksQuery = useBooks()
    const checkoutBook = useCheckoutBook()

    const summaryRef =
        useRef<HTMLDivElement>(null)
    const borrowerInputRef =
        useRef<HTMLInputElement>(null)
    const appliedSearchRef =
        useRef('')

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

    const [
        confirmOpen,
        setConfirmOpen,
    ] = useState(false)

    const [
        isbnDraft,
        setIsbnDraft,
    ] = useState('')

    const [
        activeSearchIsbn,
        setActiveSearchIsbn,
    ] = useState('')

    const [
        isbnClientError,
        setIsbnClientError,
    ] = useState<string | null>(null)

    const [
        isScannerOpen,
        setIsScannerOpen,
    ] = useState(false)

    const isbnSearchQuery = useBooks({
        isbn: activeSearchIsbn || undefined,
        enabled: Boolean(activeSearchIsbn),
    })

    const books = booksQuery.data?.items ?? []

    const selectedBookId =
        searchParams.get('bookId') ?? ''

    const eligibleBooks = books.filter(
        isCheckoutEligible,
    )

    const selectedBook =
        books.find(
            (book) => book.id === selectedBookId,
        ) ?? null

    const selectedBookIsEligible =
        selectedBook !== null &&
        isCheckoutEligible(selectedBook)

    const isbnSearchPending =
        Boolean(activeSearchIsbn) &&
        isbnSearchQuery.isFetching

    let isbnFindStatusMessage: string | null =
        null
    let isbnMatchChoices: BookRead[] | null =
        null
    let isbnSingleMatch: BookRead | null = null

    if (
        activeSearchIsbn &&
        !isbnSearchQuery.isFetching
    ) {
        if (isbnSearchQuery.isError) {
            isbnFindStatusMessage = isApiError(
                isbnSearchQuery.error,
            )
                ? isbnSearchQuery.error.message
                : 'ISBN search failed. You can still select a book from the list.'
        } else if (isbnSearchQuery.data) {
            const items =
                isbnSearchQuery.data.items
            const eligible = items.filter(
                isCheckoutEligible,
            )

            if (eligible.length === 1) {
                isbnSingleMatch = eligible[0]
            } else if (eligible.length > 1) {
                isbnMatchChoices = eligible
            } else if (items.length === 0) {
                isbnFindStatusMessage =
                    'No book in the library matched that ISBN.'
            } else {
                isbnFindStatusMessage =
                    'A matching book was found, but it is not available for checkout.'
            }
        }
    }
    const errorEntries = (
        Object.entries(fieldErrors) as [
            keyof CheckoutFormFieldErrors,
            string,
        ][]
    ).filter(
        (
            entry,
        ): entry is [
            keyof CheckoutFormFieldErrors,
            string,
        ] => Boolean(entry[1]),
    )

    const hasSummary =
        errorEntries.length > 0 ||
        Boolean(formError)

    async function refetchStaleLoanState(
        bookId: string,
    ) {
        await Promise.all([
            queryClient.invalidateQueries({
                queryKey: queryKeys.books.all,
            }),
            queryClient.invalidateQueries({
                queryKey:
                    queryKeys.books.detail(bookId),
            }),
            queryClient.invalidateQueries({
                queryKey: queryKeys.loans.all,
            }),
        ])
    }

    function selectBook(id: string) {
        setSearchParams(
            id ? { bookId: id } : {},
        )
        setFormError(null)
    }

    function focusBorrowerField() {
        window.requestAnimationFrame(() => {
            borrowerInputRef.current?.focus()
        })
    }

    function applyEligibleMatch(
        book: BookRead,
    ) {
        selectBook(book.id)
        setActiveSearchIsbn('')
        focusBorrowerField()
    }

    function startFind(
        isbnInput: string,
    ) {
        const compacted =
            compactIsbnForListFilter(isbnInput)

        if (!compacted) {
            setIsbnClientError(
                'Enter an ISBN to find a book.',
            )
            return
        }

        if (!isValidIsbn(compacted)) {
            setIsbnClientError(
                'Enter a valid ISBN-10 or ISBN-13.',
            )
            return
        }

        setIsbnClientError(null)
        setIsbnDraft(compacted)
        appliedSearchRef.current = ''

        if (activeSearchIsbn === compacted) {
            void isbnSearchQuery.refetch()
            return
        }

        setActiveSearchIsbn(compacted)
    }

    function handleIsbnDetected(
        isbn: string,
    ) {
        setIsScannerOpen(false)
        setIsbnDraft(isbn)
        startFind(isbn)
    }

    useHardwareIsbnScanner({
        enabled:
            !isScannerOpen &&
            !isbnSearchQuery.isFetching,
        onDetected: handleIsbnDetected,
    })

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
            window.requestAnimationFrame(() => {
                focusSummary(summaryRef.current)
            })
            return
        }

        if (!selectedBookIsEligible) {
            setFormError(
                'Select an available book before checking it out.',
            )
            return
        }

        setConfirmOpen(true)
    }

    function handleConfirmCheckout() {
        if (!selectedBookIsEligible) {
            setConfirmOpen(false)
            return
        }

        const request =
            checkoutFormValuesToRequest(values)
        const bookId = selectedBookId

        setConfirmOpen(false)
        setFieldErrors({})
        setFormError(null)

        checkoutBook.mutate(
            {
                id: bookId,
                request,
            },
            {
                onSuccess: () => {
                    navigate(
                        `/books/${bookId}`,
                    )
                },
                onError: (error) => {
                    void handleCheckoutError(
                        error,
                        bookId,
                    )
                },
            },
        )
    }

    async function handleCheckoutError(
        error: unknown,
        bookId: string,
    ) {
        if (
            isApiError(error) &&
            error.status === 422 &&
            error.fieldErrors.length > 0
        ) {
            setFieldErrors(
                mapCheckoutFieldErrors(
                    error.fieldErrors,
                ),
            )
            setFormError(error.message)
            return
        }

        if (
            isApiError(error) &&
            error.status === 409
        ) {
            await refetchStaleLoanState(bookId)
            setFormError(
                `${CONFLICT_MESSAGE}. The book state changed since this form was opened. Eligible books and loans were refreshed; your borrower and optional fields were kept.`,
            )
            return
        }

        if (
            isApiError(error) &&
            error.status === 404
        ) {
            await refetchStaleLoanState(bookId)
            setFormError(
                'This book is missing or no longer available for checkout. Eligible books were refreshed; your form values were kept.',
            )
            return
        }

        setFormError(
            isApiError(error)
                ? error.message
                : error instanceof Error
                  ? error.message
                  : 'The book could not be checked out.',
        )
    }

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

    useEffect(() => {
        if (
            !isbnSingleMatch ||
            !activeSearchIsbn
        ) {
            return
        }

        if (
            appliedSearchRef.current ===
            activeSearchIsbn
        ) {
            return
        }

        appliedSearchRef.current =
            activeSearchIsbn

        setSearchParams({
            bookId: isbnSingleMatch.id,
        })

        window.requestAnimationFrame(() => {
            borrowerInputRef.current?.focus()
        })
    }, [
        activeSearchIsbn,
        isbnSingleMatch,
        setSearchParams,
    ])

    if (booksQuery.isPending) {
        return (
            <section className="route-page">
                <h1>Check Out Book</h1>
                <p>Loading books…</p>
            </section>
        )
    }

    if (booksQuery.isError) {
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

    const trimmedBorrower = values.borrower.trim()

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
                    <p>
                        {selectedBook.title} cannot be checked
                        out because its current status is{' '}
                        {selectedBook.status}.
                        Please select another book or refresh
                        the eligible list.
                    </p>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                            void booksQuery.refetch()
                        }}
                    >
                        Refresh eligible books
                    </Button>
                </Alert>
            ) : null}

            {selectedBookId &&
            !selectedBook ? (
                <Alert
                    variant="warning"
                    title="Book not found"
                >
                    <p>
                        The requested book could not be found.
                        Please select another book or refresh
                        the eligible list.
                    </p>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                            void booksQuery.refetch()
                        }}
                    >
                        Refresh eligible books
                    </Button>
                </Alert>
            ) : null}

            <section aria-labelledby="isbn-find-heading">
                <h2 id="isbn-find-heading">
                    Find by ISBN
                </h2>
                <p>
                    Scan a barcode or type an ISBN to select
                    an available library book.
                </p>

                <div>
                    <Field
                        label="ISBN"
                        id="checkout-isbn"
                        helpText="ISBN-10 or ISBN-13; spaces and hyphens are allowed"
                        error={isbnClientError}
                    >
                        <input
                            id="checkout-isbn"
                            name="checkoutIsbn"
                            value={isbnDraft}
                            onChange={(event) => {
                                setIsbnDraft(
                                    event.target
                                        .value,
                                )
                                setIsbnClientError(
                                    null,
                                )
                            }}
                            autoComplete="off"
                        />
                    </Field>

                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() =>
                            startFind(isbnDraft)
                        }
                        disabled={isbnSearchPending}
                    >
                        {isbnSearchPending
                            ? 'Finding…'
                            : 'Find'}
                    </Button>

                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() =>
                            setIsScannerOpen(true)
                        }
                        disabled={
                            isbnSearchPending ||
                            isScannerOpen
                        }
                    >
                        Scan ISBN
                    </Button>
                </div>

                {isScannerOpen ? (
                    <Suspense
                        fallback={
                            <LoadingState label="Loading camera scanner…" />
                        }
                    >
                        <IsbnCameraScanner
                            onDetected={
                                handleIsbnDetected
                            }
                            onCancel={() =>
                                setIsScannerOpen(
                                    false,
                                )
                            }
                        />
                    </Suspense>
                ) : null}

                {isbnSearchPending ? (
                    <LoadingState label="Searching library by ISBN…" />
                ) : null}

                {isbnFindStatusMessage ? (
                    <Alert variant="info">
                        <p>{isbnFindStatusMessage}</p>
                        {isbnFindStatusMessage.includes(
                            'No book in the library',
                        ) ? (
                            <p>
                                <AppLink to="/books/new">
                                    Add a book
                                </AppLink>
                                {' '}
                                if this ISBN is new to the
                                library. You can still select
                                a book from the list below.
                            </p>
                        ) : (
                            <p>
                                You can still select a book
                                from the list below.
                            </p>
                        )}
                    </Alert>
                ) : null}

                {isbnMatchChoices &&
                isbnMatchChoices.length > 1 ? (
                    <Alert
                        variant="info"
                        title="Multiple matches"
                    >
                        <p>
                            More than one available book
                            matched that ISBN. Choose one:
                        </p>
                        <ul>
                            {isbnMatchChoices.map(
                                (book) => (
                                    <li key={book.id}>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() =>
                                                applyEligibleMatch(
                                                    book,
                                                )
                                            }
                                        >
                                            {book.title}
                                            {' — '}
                                            {book.authors}
                                        </Button>
                                    </li>
                                ),
                            )}
                        </ul>
                    </Alert>
                ) : null}
            </section>

            <form onSubmit={handleSubmit} noValidate>
                {hasSummary ? (
                    <div
                        ref={summaryRef}
                        tabIndex={-1}
                        role="alert"
                        className="alert alert--error"
                    >
                        <strong>
                            Fix the following
                            {' '}
                            {errorEntries.length === 1
                                ? 'error'
                                : 'errors'}
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
                                                href={`#${FIELD_IDS[field]}`}
                                            >
                                                {FIELD_LABELS[field]}
                                                :
                                                {' '}
                                                {message}
                                            </a>
                                        </li>
                                    ),
                                )}
                            </ul>
                        ) : null}
                    </div>
                ) : null}

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
                        ref={borrowerInputRef}
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

            <ConfirmationDialog
                open={confirmOpen}
                title="Confirm checkout"
                confirmLabel="Confirm checkout"
                cancelLabel="Cancel"
                confirmVariant="primary"
                onConfirm={handleConfirmCheckout}
                onCancel={() => {
                    setConfirmOpen(false)
                }}
            >
                <p>
                    Check out
                    {' '}
                    <strong>
                        {selectedBook?.title ?? 'this book'}
                    </strong>
                    {' '}
                    to
                    {' '}
                    <strong>
                        {trimmedBorrower || 'the borrower'}
                    </strong>
                    ?
                </p>
            </ConfirmationDialog>
        </section>
    )
}
