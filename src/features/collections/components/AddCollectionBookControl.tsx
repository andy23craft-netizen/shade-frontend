import {
    useEffect,
    useId,
    useRef,
    useState,
} from 'react'

import { formatBookAuthors } from '../../books/authorDisplay'
import {
    Alert,
    AppLink,
    Button,
    Field,
    LoadingState,
} from '../../../components'
import {
    isApiError,
    type ApiFieldError,
} from '../../../api/apiErrors'
import {
    useBooks,
} from '../../../api/booksQueries'
import {
    useAddCollectionBook,
    useCollections,
} from '../../../api/collectionsQueries'
import type {
    BookRead,
} from '../../../api/apiTypes'
import {
    compactIsbnForListFilter,
    isValidIsbn,
} from '../../books/utils/isbn'
import {
    emptyAddCollectionBookFormValues,
    formValuesToCollectionBookCreate,
    type AddCollectionBookField,
    type AddCollectionBookFieldErrors,
    type AddCollectionBookFormValues,
} from '../collectionFormModel'

const ADD_BOOK_FIELDS = new Set<string>([
    'collectionId',
    'isbn13',
    'title',
    'author',
    'bookId',
    'notes',
    'book_id',
    'order_num',
])

function mapAddBookFieldErrors(
    fieldErrors: readonly ApiFieldError[],
): AddCollectionBookFieldErrors {
    const mapped: AddCollectionBookFieldErrors = {}

    for (const entry of fieldErrors) {
        let field = entry.field.split('.')[0]

        if (field === 'book_id') {
            field = 'bookId'
        }

        if (
            !field ||
            !ADD_BOOK_FIELDS.has(field) ||
            mapped[field as AddCollectionBookField]
        ) {
            continue
        }

        mapped[field as AddCollectionBookField] =
            entry.message
    }

    return mapped
}

function focusSummary(
    node: HTMLDivElement | null,
) {
    node?.focus()
}

function bookOptionLabel(
    book: BookRead,
): string {
    const authors =
        formatBookAuthors(book.authors)

    return authors === 'Unknown author'
        ? book.title
        : `${book.title} — ${authors}`
}

export function AddCollectionBookControl() {
    const formId = useId()

    const collectionsQuery =
        useCollections()

    const addCollectionBook =
        useAddCollectionBook()

    const summaryRef =
        useRef<HTMLDivElement | null>(null)

    const [
        values,
        setValues,
    ] = useState<AddCollectionBookFormValues>(
        emptyAddCollectionBookFormValues,
    )

    const [
        searchValues,
        setSearchValues,
    ] = useState<{
        isbn?: string
        title?: string
        author?: string
    }>({})

    const [
        hasSearched,
        setHasSearched,
    ] = useState(false)

    const [
        fieldErrors,
        setFieldErrors,
    ] = useState<AddCollectionBookFieldErrors>({})

    const [
        formError,
        setFormError,
    ] = useState<string | null>(null)

    const [
        searchError,
        setSearchError,
    ] = useState<string | null>(null)

    const [
        notice,
        setNotice,
    ] = useState<string | null>(null)

    const collections =
        collectionsQuery.data?.items ?? []

    const selectedCollectionId =
        values.collectionId !== ''
            ? values.collectionId
            : collections.length === 1
                ? collections[0].collection_id
                : ''

    const booksQuery = useBooks({
        isbn: searchValues.isbn,
        title: searchValues.title,
        author: searchValues.author,
        enabled: hasSearched,
    })

    const matches =
        booksQuery.data?.items ?? []

    useEffect(() => {
        if (
            formError !== null ||
            Object.keys(fieldErrors).length > 0
        ) {
            focusSummary(summaryRef.current)
        }
    }, [
        formError,
        fieldErrors,
    ])

    function updateField<
        Field extends keyof AddCollectionBookFormValues,
    >(
        field: Field,
        value: AddCollectionBookFormValues[Field],
    ) {
        setValues((current) => ({
            ...current,
            [field]: value,
        }))

        setNotice(null)
        setFormError(null)

        setFieldErrors((current) => {
            const fieldKey =
                field as AddCollectionBookField

            if (
                current[fieldKey] === undefined
            ) {
                return current
            }

            const next = {
                ...current,
            }

            delete next[fieldKey]

            return next
        })

        if (
            field === 'isbn13' ||
            field === 'title' ||
            field === 'author'
        ) {
            setHasSearched(false)
            setSearchError(null)

            setValues((current) => ({
                ...current,
                bookId: '',
            }))
        }
    }

    function handleSearch() {
        const isbn =
            values.isbn13.trim()

        const title =
            values.title.trim()

        const author =
            values.author.trim()

        setNotice(null)
        setFormError(null)
        setSearchError(null)
        setHasSearched(false)

        updateField('bookId', '')

        if (
            isbn === '' &&
            title === '' &&
            author === ''
        ) {
            setSearchError(
                'Enter an ISBN, title, or author to find a book.',
            )
            return
        }

        if (
            isbn !== '' &&
            !isValidIsbn(isbn)
        ) {
            setFieldErrors((current) => ({
                ...current,
                isbn13:
                    'Enter a valid ISBN-10 or ISBN-13.',
            }))
            return
        }

        setSearchValues({
            ...(isbn === ''
                ? {}
                : {
                    isbn:
                        compactIsbnForListFilter(
                            isbn,
                        ),
                }),
            ...(title === ''
                ? {}
                : {
                    title,
                }),
            ...(author === ''
                ? {}
                : {
                    author,
                }),
        })

        setHasSearched(true)
    }

    function handleAdd() {
        if (addCollectionBook.isPending) {
            return
        }

        setNotice(null)
        setFormError(null)
        setFieldErrors({})

        const nextValues = {
            ...values,
            collectionId:
            selectedCollectionId,
        }

        const errors:
            AddCollectionBookFieldErrors = {}

        if (
            nextValues.collectionId.trim() === ''
        ) {
            errors.collectionId =
                'Choose a collection.'
        }

        if (
            nextValues.bookId.trim() === ''
        ) {
            errors.bookId =
                'Choose a book to add.'
        }

        if (
            Object.keys(errors).length > 0
        ) {
            setFieldErrors(errors)
            setFormError(
                'Fix the highlighted fields and try again.',
            )
            return
        }

        addCollectionBook.mutate(
            {
                collectionId:
                nextValues.collectionId,
                collectionBook:
                    formValuesToCollectionBookCreate(
                        nextValues,
                    ),
            },
            {
                onSuccess: () => {
                    setValues({
                        ...emptyAddCollectionBookFormValues,
                        collectionId:
                        nextValues.collectionId,
                    })

                    setSearchValues({})
                    setHasSearched(false)
                    setSearchError(null)
                    setFieldErrors({})
                    setFormError(null)

                    setNotice(
                        'Book added to the collection.',
                    )
                },

                onError: (error) => {
                    if (
                        isApiError(error) &&
                        error.status === 404
                    ) {
                        setFormError(
                            error.detail ??
                            'The collection or book could not be found. Refresh and try again.',
                        )

                        void collectionsQuery.refetch()

                        if (hasSearched) {
                            void booksQuery.refetch()
                        }

                        return
                    }

                    if (
                        isApiError(error) &&
                        error.status === 409
                    ) {
                        setFormError(
                            error.detail ??
                            'That book is already in this collection.',
                        )
                        return
                    }

                    if (
                        isApiError(error) &&
                        error.status === 422 &&
                        error.fieldErrors.length > 0
                    ) {
                        setFieldErrors(
                            mapAddBookFieldErrors(
                                error.fieldErrors,
                            ),
                        )

                        setFormError(
                            'Correct the marked fields and try again.',
                        )
                        return
                    }

                    setFormError(
                        isApiError(error)
                            ? error.detail ??
                            error.message
                            : error instanceof Error
                                ? error.message
                                : 'The book could not be added to the collection.',
                    )
                },
            },
        )
    }

    if (collectionsQuery.isPending) {
        return (
            <section className="add-to-collection">
                <h2>Add a book</h2>

                <LoadingState
                    label="Loading collections…"
                />
            </section>
        )
    }

    if (collectionsQuery.isError) {
        return (
            <section className="add-to-collection">
                <h2>Add a book</h2>

                <Alert
                    variant="error"
                    title="Unable to load collections"
                >
                    <p>
                        Collections could not be loaded.
                    </p>

                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                            void collectionsQuery.refetch()
                        }}
                    >
                        Retry
                    </Button>
                </Alert>
            </section>
        )
    }

    if (collections.length === 0) {
        return (
            <section className="add-to-collection">
                <h2>Add a book</h2>

                <p>
                    Create a collection before adding a
                    book.
                </p>
            </section>
        )
    }

    const disabled =
        addCollectionBook.isPending ||
        booksQuery.isFetching

    return (
        <section className="add-to-collection">
            <h2 id={`${formId}-heading`}>
                Add a book
            </h2>

            <p>
                Find a shelved book already in the catalog,
                then add it to a curated collection.
            </p>

            <p>
                Books that are not on a shelf are managed
                through{' '}
                <AppLink
                    to="/wishlists"
                    className="add-to-collection__wishlist-link"
                >
                    Wishlists
                </AppLink>
                .
            </p>

            {formError ? (
                <div
                    ref={summaryRef}
                    className="alert alert--error"
                    tabIndex={-1}
                    role="alert"
                >
                    <p>{formError}</p>
                </div>
            ) : null}

            {notice ? (
                <Alert variant="success">
                    {notice}
                </Alert>
            ) : null}

            <Field
                id={`${formId}-collection`}
                label="Collection"
                error={fieldErrors.collectionId}
            >
                <select
                    id={`${formId}-collection`}
                    name="collectionId"
                    value={selectedCollectionId}
                    onChange={(event) => {
                        updateField(
                            'collectionId',
                            event.target.value,
                        )
                    }}
                    disabled={disabled}
                >
                    <option value="">
                        Choose a collection
                    </option>

                    {collections.map((collection) => (
                        <option
                            key={
                                collection.collection_id
                            }
                            value={
                                collection.collection_id
                            }
                        >
                            {collection.name}
                        </option>
                    ))}
                </select>
            </Field>

            <Field
                id={`${formId}-isbn`}
                label="ISBN"
                error={fieldErrors.isbn13}
                helpText="Optional. ISBN must be valid before searching."
            >
                <input
                    id={`${formId}-isbn`}
                    name="isbn13"
                    type="text"
                    value={values.isbn13}
                    onChange={(event) => {
                        updateField(
                            'isbn13',
                            event.target.value,
                        )
                    }}
                    disabled={disabled}
                    autoComplete="off"
                />
            </Field>

            <Field
                id={`${formId}-title`}
                label="Title"
            >
                <input
                    id={`${formId}-title`}
                    name="title"
                    type="text"
                    value={values.title}
                    onChange={(event) => {
                        updateField(
                            'title',
                            event.target.value,
                        )
                    }}
                    disabled={disabled}
                    autoComplete="off"
                />
            </Field>

            <Field
                id={`${formId}-author`}
                label="Author"
            >
                <input
                    id={`${formId}-author`}
                    name="author"
                    type="text"
                    value={values.author}
                    onChange={(event) => {
                        updateField(
                            'author',
                            event.target.value,
                        )
                    }}
                    disabled={disabled}
                    autoComplete="off"
                />
            </Field>

            <div className="add-to-collection__search">
                <Button
                    type="button"
                    variant="secondary"
                    disabled={disabled}
                    onClick={handleSearch}
                >
                    {booksQuery.isFetching
                        ? 'Searching…'
                        : 'Find Books'}
                </Button>
            </div>

            {searchError ? (
                <Alert variant="warning">
                    {searchError}
                </Alert>
            ) : null}

            {hasSearched &&
            booksQuery.isError ? (
                <Alert
                    variant="error"
                    title="Unable to search books"
                >
                    <p>
                        Catalog search failed.
                    </p>

                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                            void booksQuery.refetch()
                        }}
                    >
                        Retry search
                    </Button>
                </Alert>
            ) : null}

            {hasSearched &&
            booksQuery.isSuccess &&
            matches.length === 0 ? (
                <p>
                    No shelved catalog books matched that
                    search.
                </p>
            ) : null}

            {hasSearched &&
            booksQuery.isSuccess &&
            matches.length > 0 ? (
                <Field
                    id={`${formId}-book`}
                    label="Book"
                    error={fieldErrors.bookId}
                >
                    <select
                        id={`${formId}-book`}
                        name="bookId"
                        value={values.bookId}
                        onChange={(event) => {
                            updateField(
                                'bookId',
                                event.target.value,
                            )
                        }}
                        disabled={disabled}
                    >
                        <option value="">
                            Choose a book
                        </option>

                        {matches.map((book) => (
                            <option
                                key={book.book_id}
                                value={book.book_id}
                            >
                                {bookOptionLabel(book)}
                            </option>
                        ))}
                    </select>
                </Field>
            ) : null}

            <Field
                id={`${formId}-notes`}
                label="Notes"
                helpText="Optional. Notes apply to this collection membership only."
            >
                <textarea
                    id={`${formId}-notes`}
                    name="notes"
                    value={values.notes}
                    onChange={(event) => {
                        updateField(
                            'notes',
                            event.target.value,
                        )
                    }}
                    disabled={disabled}
                />
            </Field>

            <Button
                type="button"
                variant="primary"
                disabled={disabled}
                onClick={handleAdd}
            >
                {addCollectionBook.isPending
                    ? 'Adding…'
                    : 'Add Book to Collection'}
            </Button>
        </section>
    )
}
