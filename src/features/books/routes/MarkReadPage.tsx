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
import {
    isBookIdentityError,
} from '../../../api/bookIdentity'
import {
    useBook,
    useMarkBookRead,
} from '../../../api/booksQueries'
import { queryKeys } from '../../../api/queryKeys'
import {
    markReadFormDefaults,
    markReadFormValuesToRequest,
    validateMarkReadFormValues,
    type MarkReadFormFieldErrors,
    type MarkReadFormValues,
} from './markReadModel'

const MARK_READ_FORM_FIELDS = new Set<string>([
    'completion_date',
    'rating',
    'review',
])

const FIELD_LABELS: Record<
    keyof MarkReadFormFieldErrors,
    string
> = {
    completion_date: 'Completion date',
    rating: 'Rating',
    review: 'Review',
}

const FIELD_IDS: Record<
    keyof MarkReadFormFieldErrors,
    string
> = {
    completion_date: 'mark-read-completion-date',
    rating: 'mark-read-rating',
    review: 'mark-read-review',
}

function mapMarkReadFieldErrors(
    fieldErrors: readonly ApiFieldError[],
): MarkReadFormFieldErrors {
    const mapped: MarkReadFormFieldErrors = {}

    for (const entry of fieldErrors) {
        const field = entry.field.split('.')[0]

        if (
            !field ||
            !MARK_READ_FORM_FIELDS.has(field) ||
            mapped[
                field as keyof MarkReadFormFieldErrors
            ]
        ) {
            continue
        }

        mapped[
            field as keyof MarkReadFormFieldErrors
        ] = entry.message
    }

    return mapped
}

function focusSummary(
    node: HTMLDivElement | null,
) {
    node?.focus()
}

export function MarkReadPage() {
    const { bookId = '' } = useParams()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const bookQuery = useBook(bookId)
    const markBookRead = useMarkBookRead()

    const summaryRef =
        useRef<HTMLDivElement>(null)

    const [
        values,
        setValues,
    ] = useState<MarkReadFormValues>(
        markReadFormDefaults,
    )

    const [
        fieldErrors,
        setFieldErrors,
    ] = useState<MarkReadFormFieldErrors>({})

    const [
        formError,
        setFormError,
    ] = useState<string | null>(null)

    const [
        pendingRequest,
        setPendingRequest,
    ] = useState<
        ReturnType<
            typeof markReadFormValuesToRequest
        > | null
    >(null)

    const [
        isConfirmationOpen,
        setIsConfirmationOpen,
    ] = useState(false)

    const errorEntries = (
        Object.entries(fieldErrors) as [
            keyof MarkReadFormFieldErrors,
            string,
        ][]
    ).filter(
        (
            entry,
        ): entry is [
            keyof MarkReadFormFieldErrors,
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
        field: keyof MarkReadFormValues,
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

        if (markBookRead.isPending) {
            return
        }

        const errors =
            validateMarkReadFormValues(values)

        setFieldErrors(errors)
        setFormError(null)

        if (Object.keys(errors).length > 0) {
            return
        }

        const book = bookQuery.data

        if (!book) {
            setFormError(
                'The book is not available to mark as read.',
            )
            return
        }

        if (book.deletion_date !== null) {
            setFormError(
                'Deleted books cannot be marked as read.',
            )
            return
        }

        if (book.is_read) {
            setFormError(
                'This book has already been marked as read.',
            )
            return
        }

        const request =
            markReadFormValuesToRequest(values)

        setPendingRequest(request)
        setIsConfirmationOpen(true)
    }

    function handleCancelConfirmation() {
        if (markBookRead.isPending) {
            return
        }

        setIsConfirmationOpen(false)
        setPendingRequest(null)
    }

    function handleConfirm() {
        if (
            pendingRequest === null ||
            markBookRead.isPending
        ) {
            return
        }

        const book = bookQuery.data

        if (
            !book ||
            book.deletion_date !== null ||
            book.is_read
        ) {
            setIsConfirmationOpen(false)
            setPendingRequest(null)
            setFormError(
                'This book is no longer available to mark as read.',
            )
            void refetchBookState()
            return
        }

        markBookRead.mutate(
            {
                id: book.id,
                request: pendingRequest,
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
                            mapMarkReadFieldErrors(
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

                    if (isBookIdentityError(error)) {
                        setFormError(
                            'This book could not be marked as read because it is missing, deleted, or no longer available.',
                        )
                        void refetchBookState()
                        return
                    }

                    setFormError(
                        error instanceof Error
                            ? error.message
                            : 'The book could not be marked as read.',
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
                    Mark Book Read
                </h1>

                <LoadingState label="Loading book…" />
            </section>
        )
    }

    if (bookQuery.isError) {
        const isNotFound =
            isBookIdentityError(bookQuery.error)

        return (
            <section className="route-page">
                <h1 tabIndex={-1}>
                    Mark Book Read
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
                        ? 'This book could not be found. It may have been removed, or the book id may be invalid.'
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

    const isAlreadyRead =
        book.is_read

    if (isDeleted || isAlreadyRead) {
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
                    Mark Book Read
                </h1>

                <Alert
                    variant="warning"
                    title={
                        isDeleted
                            ? 'This book has been deleted'
                            : 'This book is already marked as read'
                    }
                >
                    {isDeleted
                        ? 'Deleted books cannot be marked as read.'
                        : 'Initial reading completion has already been recorded for this book.'}
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
                Mark Book Read
            </h1>

            <p>
                Record your reading completion for{' '}
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
                    helpText="Leave blank to use the server's current UTC date."
                    error={fieldErrors.completion_date}
                >
                    <input
                        type="date"
                        value={values.completion_date}
                        disabled={markBookRead.isPending}
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
                    helpText="Optional. Choose a rating from 1 through 5."
                    error={fieldErrors.rating}
                >
                    <select
                        value={values.rating}
                        disabled={markBookRead.isPending}
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
                    helpText="Optional."
                    error={fieldErrors.review}
                >
                    <textarea
                        value={values.review}
                        disabled={markBookRead.isPending}
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
                        disabled={markBookRead.isPending}
                    >
                        {markBookRead.isPending
                            ? 'Marking Read…'
                            : 'Mark Read'}
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
                title="Confirm reading completion"
                confirmLabel="Mark Read"
                confirmVariant="primary"
                onConfirm={handleConfirm}
                onCancel={handleCancelConfirmation}
            >
                <p>
                    Mark <strong>{book.title}</strong>{' '}
                    as read?
                </p>

                {!pendingRequest?.completion_date ? (
                    <p>
                        The server will use its current UTC
                        date as the completion date.
                    </p>
                ) : null}
            </ConfirmationDialog>
        </section>
    )
}
