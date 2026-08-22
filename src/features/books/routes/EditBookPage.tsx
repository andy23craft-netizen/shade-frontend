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
    LoadingState,
    QueryErrorState,
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
    useUpdateBook,
} from '../../../api/booksQueries'
import {
    useCategories,
} from '../../../api/categoriesQueries'
import {
    useShelves,
} from '../../../api/shelvesQueries'
import { queryKeys } from '../../../api/queryKeys'
import {
    BookForm,
    type BookFormValues,
} from '../components/BookForm'
import type {
    BookFormField,
    BookFormFieldErrors,
} from '../components/bookFormModel'
import {
    bookFormValuesFromBook,
    bookFormValuesToUpdate,
} from './bookEditModel'

const BOOK_FORM_FIELDS = new Set<string>([
    'title',
    'authors',
    'isbn13',
    'publisher',
    'publication_date',
    'pages',
    'categoryIds',
    'shelfId',
    'tags',
    'acquisition_source',
    'purchase_date',
    'purchase_price',
    'notes',
])

function mapEditFieldErrors(
    fieldErrors: readonly ApiFieldError[],
): BookFormFieldErrors {
    const mapped: BookFormFieldErrors = {}

    for (const entry of fieldErrors) {
        let field = entry.field.split('.')[0]

        if (field === 'shelf_name') {
            field = 'shelfId'
        }

        if (field === 'category_ids') {
            field = 'categoryIds'
        }

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

export function EditBookPage() {
    const { bookId = '' } = useParams()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const bookQuery = useBook(bookId)
    const shelvesQuery = useShelves()
    const categoriesQuery = useCategories()
    const updateBook = useUpdateBook()

    const initializedBookIdRef =
        useRef<string | null>(null)

    const [
        values,
        setValues,
    ] = useState<BookFormValues | null>(
        null,
    )

    const [
        serverFieldErrors,
        setServerFieldErrors,
    ] = useState<BookFormFieldErrors>({})

    const [
        formError,
        setFormError,
    ] = useState<string | null>(null)

    useEffect(() => {
        const book = bookQuery.data
        const shelves = shelvesQuery.data
        const categories =
            categoriesQuery.data

        if (
            !book ||
            shelves === undefined ||
            categories === undefined ||
            initializedBookIdRef.current ===
            book.id
        ) {
            return
        }

        setValues(
            bookFormValuesFromBook(
                book,
                shelves,
            ),
        )

        initializedBookIdRef.current =
            book.id
    }, [
        bookQuery.data,
        categoriesQuery.data,
        shelvesQuery.data,
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

    function handleSubmit(
        nextValues: BookFormValues,
    ) {
        if (updateBook.isPending) {
            return
        }

        setServerFieldErrors({})
        setFormError(null)

        const book = bookQuery.data
        const shelves = shelvesQuery.data

        if (!book || shelves === undefined) {
            setFormError(
                'The book is not available to update.',
            )
            return
        }

        if (book.deletion_date !== null) {
            setFormError(
                'Deleted books cannot be edited here.',
            )
            void refetchBookState()
            return
        }

        const request =
            bookFormValuesToUpdate(
                book,
                nextValues,
                shelves,
            )

        if (Object.keys(request).length === 0) {
            setFormError(
                'No changes have been made.',
            )
            return
        }

        updateBook.mutate(
            {
                id: book.id,
                book: request,
            },
            {
                onSuccess: (updatedBook) => {
                    navigate(
                        `/books/${updatedBook.id}`,
                    )
                },
                onError: (error) => {
                    if (
                        isApiError(error) &&
                        error.status === 422
                    ) {
                        const mapped =
                            mapEditFieldErrors(
                                error.fieldErrors,
                            )

                        setServerFieldErrors(
                            mapped,
                        )

                        setFormError(
                            Object.keys(mapped)
                                .length > 0
                                ? 'Correct the marked fields and try again.'
                                : error.message,
                        )
                        return
                    }

                    if (
                        isApiError(error) &&
                        error.status === 400
                    ) {
                        setServerFieldErrors({
                            shelfId:
                                error.detail ??
                                error.message,
                        })
                        setFormError(
                            error.detail ??
                                error.message,
                        )
                        return
                    }

                    if (
                        isApiError(error) &&
                        error.status === 412
                    ) {
                        const message =
                            error.detail ??
                            'The book must be removed from the wishlist before it can be placed on a shelf.'

                        setServerFieldErrors({
                            shelfId: message,
                        })
                        setFormError(message)
                        return
                    }

                    if (isBookIdentityError(error)) {
                        setFormError(
                            'This book could not be updated because it is missing or no longer available.',
                        )
                        void refetchBookState()
                        return
                    }

                    setFormError(
                        error instanceof Error
                            ? error.message
                            : 'The book could not be updated.',
                    )

                    void refetchBookState()
                },
            },
        )
    }

    if (
        bookQuery.isPending ||
        shelvesQuery.isPending ||
        categoriesQuery.isPending
    ) {
        return (
            <section className="route-page">
                <h1 tabIndex={-1}>
                    Edit Book
                </h1>

                <LoadingState label="Loading book…" />
            </section>
        )
    }

    if (shelvesQuery.isError) {
        return (
            <section className="route-page">
                <h1 tabIndex={-1}>
                    Edit Book
                </h1>

                <p>
                    Shelves must load before a
                    book can be edited.
                </p>

                <QueryErrorState
                    error={shelvesQuery.error}
                    onRetry={() => {
                        void shelvesQuery.refetch()
                    }}
                    title="Unable to load shelves"
                />

                <AppLink
                    to="/books"
                    variant="secondary"
                >
                    Back to Books
                </AppLink>
            </section>
        )
    }

    if (categoriesQuery.isError) {
        return (
            <section className="route-page">
                <h1 tabIndex={-1}>
                    Edit Book
                </h1>

                <p>
                    Categories must load before a
                    book can be edited.
                </p>

                <QueryErrorState
                    error={categoriesQuery.error}
                    onRetry={() => {
                        void categoriesQuery.refetch()
                    }}
                    title="Unable to load categories"
                />

                <AppLink
                    to="/books"
                    variant="secondary"
                >
                    Back to Books
                </AppLink>
            </section>
        )
    }

    if (bookQuery.isError) {
        const isNotFound =
            isBookIdentityError(bookQuery.error)

        return (
            <section className="route-page">
                <h1 tabIndex={-1}>
                    Edit Book
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
                        : bookQuery.error instanceof
                        Error
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
    const shelves = shelvesQuery.data ?? []
    const categories =
        categoriesQuery.data ?? []

    if (book.deletion_date !== null) {
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
                    Edit Book
                </h1>

                <Alert
                    variant="warning"
                    title="This book has been deleted"
                >
                    Deleted books cannot be edited here.
                </Alert>
            </section>
        )
    }

    if (values === null) {
        return (
            <section className="route-page">
                <h1 tabIndex={-1}>
                    Edit Book
                </h1>

                <LoadingState label="Preparing book…" />
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
                Edit Book
            </h1>

            <p>
                Update metadata for{' '}
                <strong>{book.title}</strong> by{' '}
                {book.authors}.
            </p>

            <BookForm
                values={values}
                shelves={shelves}
                categories={categories}
                onChange={(nextValues) => {
                    setValues(nextValues)
                    setServerFieldErrors({})
                    setFormError(null)
                }}
                onSubmit={handleSubmit}
                onCancel={() => {
                    navigate(
                        `/books/${book.id}`,
                    )
                }}
                isSubmitting={
                    updateBook.isPending
                }
                serverFieldErrors={
                    serverFieldErrors
                }
                formError={formError}
            />
        </section>
    )
}
