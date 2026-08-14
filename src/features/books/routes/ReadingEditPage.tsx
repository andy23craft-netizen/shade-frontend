import {
    useEffect,
    useRef,
    useState,
} from 'react'
import {
    useNavigate,
    useParams,
} from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

import {
    Alert,
    AppLink,
    Button,
    ConfirmationDialog,
    Field,
    LoadingState,
} from '../../../components'
import {
    isApiError,
    type ApiFieldError,
} from '../../../api/apiErrors'
import type {
    BookUpdate,
} from '../../../api/apiTypes'
import {
    useBook,
    useUpdateBook,
} from '../../../api/booksQueries'
import { queryKeys } from '../../../api/queryKeys'
import {
    hasReadingEditChanges,
    readingEditFormValuesFromBook,
    readingEditFormValuesToRequest,
    validateReadingEditFormValues,
    type ReadingEditFormFieldErrors,
    type ReadingEditFormValues,
} from './readingEditModel'

const READING_EDIT_FORM_FIELDS =
    new Set<string>([
        'completion_date',
        'rating',
        'review',
    ])

const FIELD_LABELS: Record<
    keyof ReadingEditFormFieldErrors,
    string
> = {
    completion_date: 'Completion date',
    rating: 'Rating',
    review: 'Review',
}

const FIELD_IDS: Record<
    keyof ReadingEditFormFieldErrors,
    string
> = {
    completion_date:
        'reading-edit-completion-date',
    rating: 'reading-edit-rating',
    review: 'reading-edit-review',
}

function mapReadingEditFieldErrors(
    fieldErrors: readonly ApiFieldError[],
): ReadingEditFormFieldErrors {
    const mapped: ReadingEditFormFieldErrors = {}

    for (const entry of fieldErrors) {
        const field = entry.field.split('.')[0]

        if (
            !field ||
            !READING_EDIT_FORM_FIELDS.has(field) ||
            mapped[
                field as keyof ReadingEditFormFieldErrors
            ]
        ) {
            continue
        }

        mapped[
            field as keyof ReadingEditFormFieldErrors
        ] = entry.message
    }

    return mapped
}

export function ReadingEditPage() {
    const { bookId = '' } = useParams()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const bookQuery = useBook(bookId)
    const updateBook = useUpdateBook()

    const summaryRef =
        useRef<HTMLDivElement>(null)

    const initializedBookIdRef =
        useRef<string | null>(null)

    const [
        values,
        setValues,
    ] = useState<ReadingEditFormValues>({
        completion_date: '',
        rating: '',
        review: '',
    })

    const [
        fieldErrors,
        setFieldErrors,
    ] = useState<ReadingEditFormFieldErrors>({})

    const [
        formError,
        setFormError,
    ] = useState<string | null>(null)

    const [
        pendingRequest,
        setPendingRequest,
    ] = useState<BookUpdate | null>(null)

    const [
        isConfirmationOpen,
        setIsConfirmationOpen,
    ] = useState(false)

    useEffect(() => {
        const book = bookQuery.data

        if (
            !book ||
            initializedBookIdRef.current ===
                book.id
        ) {
            return
        }

        setValues(
            readingEditFormValuesFromBook(book),
        )

        initializedBookIdRef.current =
            book.id
    }, [bookQuery.data])

    const errorEntries = (
        Object.entries(fieldErrors) as [
            keyof ReadingEditFormFieldErrors,
            string,
        ][]
    ).filter(
        (
            entry,
        ): entry is [
            keyof ReadingEditFormFieldErrors,
            string,
        ] => Boolean(entry[1]),
    )

    const hasSummary =
        errorEntries.length > 0 ||
        Boolean(formError)

    useEffect(() => {
        if (hasSummary) {
            summaryRef.current?.focus()
        }
    }, [
        fieldErrors,
        formError,
        hasSummary,
    ])

    async function refetchBookState() {
        await Promise.all([
            queryClient.invalidateQueries({
                queryKey:
                    queryKeys.books.detail(bookId),
            }),
            queryClient.invalidateQueries({
                queryKey: queryKeys.books.all,
            }),
        ])
    }

    function updateField(
        field: keyof ReadingEditFormValues,
        value: string,
    ) {
        setValues((current) => ({
            ...current,
            [field]: value,
        }))

        setFieldErrors((current) => {
            if (!current[field]) {
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

        if (updateBook.isPending) {
            return
        }

        const errors =
            validateReadingEditFormValues(values)

        setFieldErrors(errors)
        setFormError(null)

        if (Object.keys(errors).length > 0) {
            return
        }

        const book = bookQuery.data

        if (!book) {
            setFormError(
                'The book is not available to update.',
            )
            return
        }

        if (book.deletion_date !== null) {
            setFormError(
                'Deleted books cannot be edited here.',
            )
            return
        }

        if (!book.is_read) {
            setFormError(
                'Reading completion has not been recorded for this book.',
            )
            return
        }

        if (
            !hasReadingEditChanges(
                book,
                values,
            )
        ) {
            setFormError(
                'No reading changes have been made.',
            )
            return
        }

        setPendingRequest(
            readingEditFormValuesToRequest(
                book,
                values,
            ),
        )
        setIsConfirmationOpen(true)
    }

    function handleCancelConfirmation() {
        if (updateBook.isPending) {
            return
        }

        setIsConfirmationOpen(false)
        setPendingRequest(null)
    }

    function handleConfirm() {
        if (
            pendingRequest === null ||
            updateBook.isPending
        ) {
            return
        }

        const book = bookQuery.data

        if (
            !book ||
            book.deletion_date !== null ||
            !book.is_read
        ) {
            setIsConfirmationOpen(false)
            setPendingRequest(null)
            setFormError(
                'This book is no longer available for reading updates.',
            )
            void refetchBookState()
            return
        }

        updateBook.mutate(
            {
                id: book.id,
                book: pendingRequest,
            },
            {
                onSuccess: (updatedBook) => {
                    setIsConfirmationOpen(false)
                    setPendingRequest(null)

                    navigate(
                        `/books/${updatedBook.id}`,
                    )
                },
                onError: (error) => {
                    setIsConfirmationOpen(false)
                    setPendingRequest(null)

                    if (
                        isApiError(error) &&
                        error.status === 422
                    ) {
                        const mapped =
                            mapReadingEditFieldErrors(
                                error.fieldErrors,
                            )

                        setFieldErrors(mapped)

                        setFormError(
                            Object.keys(mapped).length > 0
                                ? 'Correct the marked fields and try again.'
                                : error.message,
                        )
                        return
                    }

                    if (
                        isApiError(error) &&
                        error.status === 404
                    ) {
                        setFormError(
                            'This book could not be updated because it is missing or no longer available.',
                        )
                        void refetchBookState()
                        return
                    }

                    setFormError(
                        error instanceof Error
                            ? error.message
                            : 'The reading details could not be updated.',
                    )

                    void refetchBookState()
                },
            },
        )
    }

    if (bookQuery.isPending) {
        return (
            <section className="route-page">
                <h1 tabIndex={-1}>
                    Edit Reading
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
                    Edit Reading
                </h1>

                <Alert
                    variant={
                        isNotFound
                            ? 'warning'
                            : 'error'
                    }
                    title={
                        isNotFound
                            ? 'Book not found'
                            : 'Unable to load book'
                    }
                >
                    {isNotFound
                        ? 'This book could not be found. It may have been removed.'
                        : bookQuery.error instanceof Error
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

    if (isDeleted || !book.is_read) {
        return (
            <section className="route-page">
                <div className="book-details__topbar">
                    <AppLink
                        to={`/books/${book.id}`}
                        variant="secondary"
                    >
                        ← Back to Book
                    </AppLink>
                </div>

                <h1 tabIndex={-1}>
                    Edit Reading
                </h1>

                <Alert
                    variant="warning"
                    title={
                        isDeleted
                            ? 'This book has been deleted'
                            : 'This book has not been marked as read'
                    }
                >
                    {isDeleted
                        ? 'Deleted books cannot be edited here.'
                        : 'Mark this book as read before editing its reading details.'}
                </Alert>
            </section>
        )
    }

    return (
        <section className="route-page">
            <div className="book-details__topbar">
                <AppLink
                    to={`/books/${book.id}`}
                    variant="secondary"
                >
                    ← Back to Book
                </AppLink>
            </div>

            <h1 tabIndex={-1}>
                Edit Reading
            </h1>

            <p>
                Update reading details for{' '}
                <strong>{book.title}</strong> by{' '}
                {book.authors}.
            </p>

            {hasSummary ? (
                <div
                    ref={summaryRef}
                    className="form-error-summary"
                    role="alert"
                    tabIndex={-1}
                >
                    <h2>
                        There is a problem
                    </h2>

                    {formError ? (
                        <p>{formError}</p>
                    ) : null}

                    {errorEntries.length > 0 ? (
                        <ul>
                            {errorEntries.map(
                                ([field, message]) => (
                                    <li key={field}>
                                        <a
                                            href={`#${FIELD_IDS[field]}`}
                                        >
                                            {FIELD_LABELS[field]}:{' '}
                                            {message}
                                        </a>
                                    </li>
                                ),
                            )}
                        </ul>
                    ) : null}
                </div>
            ) : null}

            <form onSubmit={handleSubmit}>
                <Field
                    id={FIELD_IDS.completion_date}
                    label="Completion date"
                    helpText="Clear this field to remove the saved completion date."
                    error={fieldErrors.completion_date}
                >
                    <input
                        type="date"
                        value={values.completion_date}
                        disabled={updateBook.isPending}
                        onChange={(event) => {
                            updateField(
                                'completion_date',
                                event.target.value,
                            )
                        }}
                    />
                </Field>

                <Field
                    id={FIELD_IDS.rating}
                    label="Rating"
                    helpText="Choose 1 through 5, or clear the rating."
                    error={fieldErrors.rating}
                >
                    <select
                        value={values.rating}
                        disabled={updateBook.isPending}
                        onChange={(event) => {
                            updateField(
                                'rating',
                                event.target.value,
                            )
                        }}
                    >
                        <option value="">
                            No rating
                        </option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                    </select>
                </Field>

                <Field
                    id={FIELD_IDS.review}
                    label="Review"
                    helpText="Clear this field to remove the saved review."
                    error={fieldErrors.review}
                >
                    <textarea
                        value={values.review}
                        disabled={updateBook.isPending}
                        onChange={(event) => {
                            updateField(
                                'review',
                                event.target.value,
                            )
                        }}
                    />
                </Field>

                <div className="form-actions">
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={updateBook.isPending}
                    >
                        {updateBook.isPending
                            ? 'Saving…'
                            : 'Save Reading'}
                    </Button>

                    <AppLink
                        to={`/books/${book.id}`}
                        variant="secondary"
                    >
                        Cancel
                    </AppLink>
                </div>
            </form>

            <ConfirmationDialog
                open={isConfirmationOpen}
                title="Confirm reading changes"
                confirmLabel="Save Reading"
                confirmVariant="primary"
                onConfirm={handleConfirm}
                onCancel={handleCancelConfirmation}
            >
                <p>
                    Save the reading changes for{' '}
                    <strong>{book.title}</strong>?
                </p>
            </ConfirmationDialog>
        </section>
    )
}
