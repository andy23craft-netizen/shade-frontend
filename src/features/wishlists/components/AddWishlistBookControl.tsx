import {
    useEffect,
    useId,
    useRef,
    useState,
    type FormEvent,
} from 'react'

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
    useCreateBook,
    useLookupBook,
} from '../../../api/booksQueries'
import {
    useAddWishlistBook,
    useWishlists,
} from '../../../api/wishlistsQueries'
import {
    isValidIsbn,
} from '../../books/utils/isbn'
import {
    WISHLIST_BOOK_STATUS_VALUES,
} from '../wishlistDisplay'
import {
    emptyAddWishlistBookFormValues,
    formValuesToUnshelvedBookCreate,
    isWishlistBookStatus,
    validateAddWishlistBookFormValues,
    type AddWishlistBookField,
    type AddWishlistBookFieldErrors,
    type AddWishlistBookFormValues,
} from '../wishlistFormModel'

const ADD_BOOK_FIELDS = new Set<string>([
    'wishlistId',
    'title',
    'authors',
    'isbn13',
    'status',
    'book_id',
])

function mapAddBookFieldErrors(
    fieldErrors: readonly ApiFieldError[],
): AddWishlistBookFieldErrors {
    const mapped: AddWishlistBookFieldErrors = {}

    for (const entry of fieldErrors) {
        let field = entry.field.split('.')[0]

        if (field === 'book_id') {
            field = 'title'
        }

        if (
            !field ||
            !ADD_BOOK_FIELDS.has(field) ||
            mapped[field as AddWishlistBookField]
        ) {
            continue
        }

        mapped[field as AddWishlistBookField] =
            entry.message
    }

    return mapped
}

function focusSummary(
    node: HTMLDivElement | null,
) {
    node?.focus()
}

export function AddWishlistBookControl() {
    const formId = useId()
    const wishlistsQuery = useWishlists()
    const createBook = useCreateBook()
    const addWishlistBook = useAddWishlistBook()
    const lookupBook = useLookupBook()
    const summaryRef = useRef<HTMLDivElement | null>(
        null,
    )

    const [
        values,
        setValues,
    ] = useState<AddWishlistBookFormValues>(
        emptyAddWishlistBookFormValues,
    )

    const [
        fieldErrors,
        setFieldErrors,
    ] = useState<AddWishlistBookFieldErrors>({})

    const [
        formError,
        setFormError,
    ] = useState<string | null>(null)

    const [
        notice,
        setNotice,
    ] = useState<string | null>(null)

    const [
        lookupError,
        setLookupError,
    ] = useState<string | null>(null)

    const wishlists =
        wishlistsQuery.data?.items ?? []
    const selectedWishlistId =
        values.wishlistId !== ''
            ? values.wishlistId
            : wishlists.length === 1
                ? wishlists[0].wishlist_id
                : ''

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

    const isSubmitting =
        createBook.isPending ||
        addWishlistBook.isPending

    function updateField<
        Field extends keyof AddWishlistBookFormValues,
    >(
        field: Field,
        value: AddWishlistBookFormValues[Field],
    ) {
        setValues((current) => ({
            ...current,
            [field]: value,
        }))
        setNotice(null)
        setFormError(null)
        setFieldErrors((current) => {
            const fieldKey =
                field as AddWishlistBookField

            if (current[fieldKey] === undefined) {
                return current
            }

            const next = {
                ...current,
            }

            delete next[fieldKey]
            return next
        })
    }

    function handleLookup() {
        const isbn = values.isbn13.trim()

        setLookupError(null)
        setNotice(null)

        if (isbn === '') {
            setLookupError('Enter an ISBN to look up.')
            return
        }

        if (!isValidIsbn(isbn)) {
            setLookupError(
                'Enter a valid ISBN-10 or ISBN-13.',
            )
            return
        }

        lookupBook.mutate(isbn, {
            onSuccess: (result) => {
                if (
                    !result.found ||
                    result.draft === null ||
                    result.draft === undefined
                ) {
                    setLookupError(
                        'No metadata was found for that ISBN. You can still enter the book manually.',
                    )
                    return
                }

                setValues((current) => ({
                    ...current,
                    title:
                        result.draft?.title ??
                        current.title,
                    authors:
                        result.draft?.authors ??
                        current.authors,
                    isbn13: isbn,
                }))
            },
            onError: () => {
                setLookupError(
                    'ISBN lookup failed. You can still enter the book manually.',
                )
            },
        })
    }

    function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault()

        if (isSubmitting) {
            return
        }

        setNotice(null)
        setLookupError(null)
        setFormError(null)
        setFieldErrors({})

        const nextValues = {
            ...values,
            wishlistId: selectedWishlistId,
        }

        const clientErrors =
            validateAddWishlistBookFormValues(
                nextValues,
            )

        if (Object.keys(clientErrors).length > 0) {
            setFieldErrors(clientErrors)
            setFormError(
                'Fix the highlighted fields and try again.',
            )
            return
        }

        const book =
            formValuesToUnshelvedBookCreate(
                nextValues,
            )

        createBook.mutate(book, {
            onSuccess: (created) => {
                addWishlistBook.mutate(
                    {
                        wishlistId:
                            nextValues.wishlistId,
                        wishlistBook: {
                            book_id: created.id,
                            status: nextValues.status,
                        },
                    },
                    {
                        onSuccess: () => {
                            setValues({
                                ...emptyAddWishlistBookFormValues,
                                wishlistId:
                                    nextValues.wishlistId,
                            })
                            setFieldErrors({})
                            setFormError(null)
                            setNotice(
                                'Book added to the wishlist.',
                            )
                        },
                        onError: (error) => {
                            handleAddError(error)
                        },
                    },
                )
            },
            onError: (error) => {
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
                        ? error.detail ?? error.message
                        : error instanceof Error
                            ? error.message
                            : 'The book could not be created.',
                )
            },
        })
    }

    function handleAddError(error: unknown) {
        if (
            isApiError(error) &&
            error.status === 404
        ) {
            setFormError(
                error.detail ??
                    'The book or wishlist could not be found. Refresh and try again.',
            )
            void wishlistsQuery.refetch()
            return
        }

        if (
            isApiError(error) &&
            error.status === 412
        ) {
            setFormError(
                error.detail ??
                    'Existing books cannot be added to a wishlist.',
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
                ? error.detail ?? error.message
                : error instanceof Error
                    ? error.message
                    : 'The book was created, but it could not be added to the wishlist.',
        )
    }

    if (wishlistsQuery.isPending) {
        return (
            <section className="add-to-wishlist">
                <h2>Add a book</h2>
                <LoadingState label="Loading wishlists…" />
            </section>
        )
    }

    if (wishlistsQuery.isError) {
        return (
            <section className="add-to-wishlist">
                <h2>Add a book</h2>

                <Alert
                    variant="error"
                    title="Unable to load wishlists"
                >
                    <p>
                        Wishlists could not be loaded.
                    </p>

                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                            void wishlistsQuery.refetch()
                        }}
                    >
                        Retry
                    </Button>
                </Alert>
            </section>
        )
    }

    if (wishlists.length === 0) {
        return (
            <section className="add-to-wishlist">
                <h2>Add a book</h2>

                <p>
                    Create a wishlist before adding a
                    book.
                </p>

                <AppLink
                    to="/wishlists#create-wishlist"
                    variant="secondary"
                >
                    Create a wishlist
                </AppLink>
            </section>
        )
    }

    const disabled =
        isSubmitting || lookupBook.isPending

    return (
        <form
            className="add-to-wishlist"
            aria-labelledby={`${formId}-heading`}
            onSubmit={handleSubmit}
            noValidate
        >
            <h2 id={`${formId}-heading`}>
                Add a book
            </h2>

            <p>
                Creates an unshelved catalog row, then
                adds it to the selected wishlist.
                Collection books already on a shelf
                cannot be added.
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
                id={`${formId}-wishlist`}
                label="Wishlist"
                error={fieldErrors.wishlistId}
            >
                <select
                    id={`${formId}-wishlist`}
                    name="wishlistId"
                    value={selectedWishlistId}
                    onChange={(event) => {
                        updateField(
                            'wishlistId',
                            event.target.value,
                        )
                    }}
                    disabled={disabled}
                >
                    <option value="">
                        Choose a wishlist
                    </option>

                    {wishlists.map((wishlist) => (
                        <option
                            key={wishlist.wishlist_id}
                            value={wishlist.wishlist_id}
                        >
                            {wishlist.name}
                        </option>
                    ))}
                </select>
            </Field>

            <Field
                id={`${formId}-title`}
                label="Title"
                error={fieldErrors.title}
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
                id={`${formId}-authors`}
                label="Authors"
                error={fieldErrors.authors}
            >
                <input
                    id={`${formId}-authors`}
                    name="authors"
                    type="text"
                    value={values.authors}
                    onChange={(event) => {
                        updateField(
                            'authors',
                            event.target.value,
                        )
                    }}
                    disabled={disabled}
                    autoComplete="off"
                />
            </Field>

            <Field
                id={`${formId}-isbn13`}
                label="ISBN"
                error={fieldErrors.isbn13}
                helpText="Optional. Look up fills title and authors when metadata is found."
            >
                <input
                    id={`${formId}-isbn13`}
                    name="isbn13"
                    type="text"
                    value={values.isbn13}
                    onChange={(event) => {
                        updateField(
                            'isbn13',
                            event.target.value,
                        )
                        setLookupError(null)
                    }}
                    disabled={disabled}
                    autoComplete="off"
                />
            </Field>

            <div className="add-to-wishlist__lookup">
                <Button
                    type="button"
                    variant="secondary"
                    disabled={disabled}
                    onClick={handleLookup}
                >
                    {lookupBook.isPending
                        ? 'Looking up…'
                        : 'Look up ISBN'}
                </Button>
            </div>

            {lookupError ? (
                <Alert variant="warning">
                    {lookupError}
                </Alert>
            ) : null}

            <Field
                id={`${formId}-status`}
                label="Status"
                error={fieldErrors.status}
            >
                <select
                    id={`${formId}-status`}
                    name="status"
                    value={values.status}
                    onChange={(event) => {
                        const next = event.target.value

                        if (isWishlistBookStatus(next)) {
                            updateField('status', next)
                        }
                    }}
                    disabled={disabled}
                >
                    {WISHLIST_BOOK_STATUS_VALUES.map(
                        (status) => (
                            <option
                                key={status}
                                value={status}
                            >
                                {status}
                            </option>
                        ),
                    )}
                </select>
            </Field>

            <Button
                type="submit"
                variant="primary"
                disabled={disabled}
            >
                {isSubmitting
                    ? 'Adding…'
                    : 'Add Book to Wishlist'}
            </Button>
        </form>
    )
}
