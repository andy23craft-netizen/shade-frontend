import {
    useState,
} from 'react'
import { useNavigate } from 'react-router-dom'

import { Alert } from '../../../components/Alert'
import { AppLink } from '../../../components/AppLink'
import { Button } from '../../../components/Button'
import { Field } from '../../../components/Field'
import { LoadingState } from '../../../components/LoadingState'
import {
    useBookLookup,
    useCreateBook,
} from '../../../api/booksQueries'
import {
    isApiError,
    type ApiFieldError,
} from '../../../api/apiErrors'
import type {
    BookCreate,
} from '../../../api/apiTypes'
import {
    isValidIsbn,
} from '../utils/isbn'
import {
    BookForm,
    type BookFormValues,
} from '../components/BookForm'
import { bookFormDefaults } from '../components/bookFormDefaults'
import type {
    BookFormField,
    BookFormFieldErrors,
} from '../components/bookFormModel'

const BOOK_FORM_FIELDS = new Set<string>([
    'title',
    'authors',
    'isbn13',
    'publisher',
    'publication_date',
    'pages',
    'category',
    'shelf',
    'tags',
    'acquisition_source',
    'purchase_date',
    'purchase_price',
    'notes',
])

function mapCreateFieldErrors(
    fieldErrors: readonly ApiFieldError[],
): BookFormFieldErrors {
    const mapped: BookFormFieldErrors = {}

    for (const entry of fieldErrors) {
        const field = entry.field.split('.')[0]

        if (
            !field ||
            !BOOK_FORM_FIELDS.has(field) ||
            mapped[field as BookFormField]
        ) {
            continue
        }

        mapped[field as BookFormField] =
            entry.message
    }

    return mapped
}

function lookupFailureMessage(
    error: unknown,
): string {
    const fallback =
        'ISBN lookup failed. You can still enter the book manually.'

    if (!isApiError(error)) {
        return fallback
    }

    if (error.status === 422) {
        return `${error.detail ?? error.message} You can still enter the book manually.`
    }

    if (error.status === 502) {
        return 'The metadata provider failed. You can still enter the book manually.'
    }

    if (
        error.status === 504 ||
        error.kind === 'timeout'
    ) {
        return 'Lookup timed out. You can still enter the book manually.'
    }

    return fallback
}

export function NewBookPage() {
    const navigate = useNavigate()

    const [
        values,
        setValues,
    ] = useState<BookFormValues>(
        bookFormDefaults,
    )

    const [
        lookupInput,
        setLookupInput,
    ] = useState('')

    const [
        activeLookupIsbn,
        setActiveLookupIsbn,
    ] = useState('')

    const [
        lookupClientError,
        setLookupClientError,
    ] = useState<string | null>(null)

    const [
        serverFieldErrors,
        setServerFieldErrors,
    ] = useState<BookFormFieldErrors>({})

    const [
        formError,
        setFormError,
    ] = useState<string | null>(null)

    const lookup = useBookLookup(
        activeLookupIsbn,
    )

    const createBook = useCreateBook()

    function handleLookupSubmit() {
        const isbn = lookupInput.trim()

        if (!isbn) {
            setLookupClientError(
                'Enter an ISBN to look up.',
            )
            return
        }

        if (!isValidIsbn(isbn)) {
            setLookupClientError(
                'Enter a valid ISBN-10 or ISBN-13.',
            )
            return
        }

        setLookupClientError(null)
        setValues((current) => ({
            ...current,
            isbn13: isbn,
        }))

        if (activeLookupIsbn === isbn) {
            void lookup.refetch()
            return
        }

        setActiveLookupIsbn(isbn)
    }

    function cancelLookup() {
        setActiveLookupIsbn('')
    }

    function applyLookup() {
        const draft = lookup.data?.draft

        if (!draft) {
            return
        }

        setValues((current) => ({
            ...current,
            title:
                draft.title ?? current.title,
            authors:
                draft.authors ?? current.authors,
            pages:
                draft.pages === null ||
                draft.pages === undefined
                    ? current.pages
                    : String(draft.pages),
            publication_date:
                draft.publication_date ??
                current.publication_date,
            publisher:
                draft.publisher ??
                current.publisher,
        }))
    }

    function handleSubmit(
        book: BookCreate,
    ) {
        setServerFieldErrors({})
        setFormError(null)

        createBook.mutate(
            book,
            {
                onSuccess: (created) => {
                    navigate(
                        `/books/${created.id}`,
                    )
                },
                onError: (error) => {
                    if (
                        isApiError(error) &&
                        error.fieldErrors.length >
                            0
                    ) {
                        setServerFieldErrors(
                            mapCreateFieldErrors(
                                error.fieldErrors,
                            ),
                        )
                        setFormError(
                            error.message,
                        )
                        return
                    }

                    setFormError(
                        isApiError(error)
                            ? error.message
                            : error instanceof
                                  Error
                              ? error.message
                              : 'The book could not be created.',
                    )
                },
            },
        )
    }

    const lookupReady =
        Boolean(activeLookupIsbn) &&
        !lookup.isFetching &&
        !lookup.isError &&
        lookup.data !== undefined

    return (
        <section className="route-page">
            <AppLink
                to="/books"
                variant="secondary"
            >
                ← Back to Books
            </AppLink>

            <header>
                <h1>Add Book</h1>
                <p>
                    Add a book manually or use
                    ISBN lookup to prefill its
                    metadata.
                </p>
            </header>

            <section aria-labelledby="isbn-lookup-heading">
                <h2 id="isbn-lookup-heading">
                    ISBN Lookup
                </h2>

                <div>
                    <Field
                        label="Lookup ISBN"
                        helpText="ISBN-10 or ISBN-13; spaces and hyphens are allowed"
                        error={lookupClientError}
                    >
                        <input
                            name="lookupIsbn"
                            value={lookupInput}
                            onChange={(event) => {
                                setLookupInput(
                                    event.target
                                        .value,
                                )
                                setLookupClientError(
                                    null,
                                )
                            }}
                            autoComplete="off"
                        />
                    </Field>

                    <Button
                        type="button"
                        variant="secondary"
                        onClick={
                            handleLookupSubmit
                        }
                        disabled={
                            lookup.isFetching
                        }
                    >
                        {lookup.isFetching
                            ? 'Looking up…'
                            : 'Look Up ISBN'}
                    </Button>

                    {lookup.isFetching ? (
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={cancelLookup}
                        >
                            Cancel lookup
                        </Button>
                    ) : null}
                </div>

                {lookup.isFetching ? (
                    <LoadingState label="Looking up ISBN metadata…" />
                ) : null}

                {lookup.isError ? (
                    <Alert
                        variant="error"
                        title="Lookup failed"
                    >
                        {lookupFailureMessage(
                            lookup.error,
                        )}
                        <div>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                    void lookup.refetch()
                                }}
                            >
                                Retry lookup
                            </Button>
                        </div>
                    </Alert>
                ) : null}

                {lookupReady &&
                !lookup.data.found ? (
                    <Alert variant="info">
                        No metadata was found for
                        this ISBN. You can still
                        enter the book manually.
                    </Alert>
                ) : null}

                {lookupReady &&
                lookup.data.found &&
                lookup.data.draft ? (
                    <Alert
                        variant="success"
                        title="Metadata found"
                    >
                        Review and edit the fields
                        below before saving.
                        Lookup never creates a
                        book on its own.
                        <div>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={
                                    applyLookup
                                }
                            >
                                Apply Lookup
                            </Button>
                        </div>
                    </Alert>
                ) : null}
            </section>

            <BookForm
                values={values}
                onChange={setValues}
                onSubmit={handleSubmit}
                onCancel={() => {
                    navigate('/books')
                }}
                isSubmitting={
                    createBook.isPending
                }
                serverFieldErrors={
                    serverFieldErrors
                }
                formError={formError}
            />
        </section>
    )
}
