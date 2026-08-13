import {
    useState,
    type ChangeEvent,
    type FormEvent,
} from 'react'
import {
    useNavigate,
    useParams,
} from 'react-router-dom'

import { Alert } from '../../../components/Alert'
import { AppLink } from '../../../components/AppLink'
import { Button } from '../../../components/Button'
import { Field } from '../../../components/Field'
import { LoadingState } from '../../../components/LoadingState'
import {
    useBook,
    useUpdateBook,
} from '../../../api/booksQueries'
import type {
    BookUpdate,
    Category,
    Shelf,
    Status,
} from '../../../api/apiTypes'
import { enumDisplayValue } from '../../../api/enumDisplay'

const CATEGORY_VALUES: readonly Category[] = [
    'unknown',
    'religion',
    'philosophy',
    'fiction',
    'nonfiction',
]

const SHELF_VALUES: readonly Shelf[] = [
    'unknown',
    'a1',
    'a2',
    'a3',
    'a4',
    'b1',
    'b2',
    'b3',
    'bath',
    'c1',
    'c2',
    'c3',
    'c4',
    'd1',
    'd2',
    'd3',
    'd4',
    'd5',
    'e1',
    'e2',
    'e3',
    'e4',
    'e5',
    'e6',
    'f1',
    'f2',
    'f3',
    'f4',
    'f5',
    'g1',
    'g2',
    'g3',
    'g4',
    'g5',
    'g6',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'liz_tbr',
]

const STATUS_VALUES: readonly Status[] = [
    'unknown',
    'available',
    'on_loan',
    'missing',
    'display_only',
    'reserved',
    'reading',
]

interface FormState {
    title: string
    authors: string
    isbn13: string
    category: string
    shelf: string
    status: string
    publicationDate: string
    publisher: string
    pages: string
    acquisitionSource: string
    purchaseDate: string
    purchasePrice: string
    isRead: boolean
    completionDate: string
    rating: string
    review: string
    notes: string
    tags: string
}

function nullableString(
    value: string,
): string | null {
    return value.trim() === ''
        ? null
        : value
}

function optionalNumber(
    value: string,
): number | null {
    return value.trim() === ''
        ? null
        : Number(value)
}

function formStateFromBook(
    book: {
        title: string
        authors: string
        isbn13?: string | null
        category: string
        shelf: string
        status: string
        publication_date?: string | null
        publisher?: string | null
        pages?: number | null
        acquisition_source?: string | null
        purchase_date?: string | null
        purchase_price?: number | null
        is_read: boolean
        completion_date?: string | null
        rating?: number | null
        review?: string | null
        notes?: string | null
        tags?: string[] | null
    },
): FormState {
    return {
        title: book.title,
        authors: book.authors,
        isbn13: book.isbn13 ?? '',
        category: book.category,
        shelf: book.shelf,
        status: book.status,
        publicationDate:
            book.publication_date ?? '',
        publisher: book.publisher ?? '',
        pages:
            book.pages === null ||
            book.pages === undefined
                ? ''
                : String(book.pages),
        acquisitionSource:
            book.acquisition_source ?? '',
        purchaseDate:
            book.purchase_date ?? '',
        purchasePrice:
            book.purchase_price === null ||
            book.purchase_price === undefined
                ? ''
                : String(book.purchase_price),
        isRead: book.is_read,
        completionDate:
            book.completion_date ?? '',
        rating:
            book.rating === null ||
            book.rating === undefined
                ? ''
                : String(book.rating),
        review: book.review ?? '',
        notes: book.notes ?? '',
        tags: book.tags?.join(', ') ?? '',
    }
}

function enumOptions(
    value: string,
    knownValues: readonly string[],
): string[] {
    const display = enumDisplayValue(
        value,
        knownValues,
    )

    if (display.known) {
        return [...knownValues]
    }

    return [value, ...knownValues]
}

interface EditBookFormProps {
    bookId: string
    book: Parameters<typeof formStateFromBook>[0]
}

function EditBookForm({
                          bookId,
                          book,
                      }: EditBookFormProps) {
    const navigate = useNavigate()
    const updateBook = useUpdateBook()

    const [form, setForm] = useState<FormState>(
        () => formStateFromBook(book),
    )

    function updateField<K extends keyof FormState>(
        field: K,
        value: FormState[K],
    ) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }))
    }

    function handleTextChange(
        field: Exclude<
            keyof FormState,
            'isRead'
        >,
    ) {
        return (
            event: ChangeEvent<
                HTMLInputElement | HTMLTextAreaElement
            >,
        ) => {
            updateField(
                field,
                event.target.value,
            )
        }
    }

    function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault()

        const payload: BookUpdate = {
            title: form.title.trim(),
            authors: form.authors.trim(),
            isbn13: nullableString(
                form.isbn13,
            ),
            category:
                form.category as Category,
            shelf: form.shelf as Shelf,
            status: form.status as Status,
            publication_date:
                nullableString(
                    form.publicationDate,
                ),
            publisher: nullableString(
                form.publisher,
            ),
            pages: optionalNumber(
                form.pages,
            ),
            acquisition_source:
                nullableString(
                    form.acquisitionSource,
                ),
            purchase_date:
                nullableString(
                    form.purchaseDate,
                ),
            purchase_price:
                optionalNumber(
                    form.purchasePrice,
                ),
            is_read: form.isRead,
            completion_date:
                nullableString(
                    form.completionDate,
                ),
            rating: optionalNumber(
                form.rating,
            ),
            review: nullableString(
                form.review,
            ),
            notes: nullableString(
                form.notes,
            ),
            tags:
                form.tags.trim() === ''
                    ? null
                    : form.tags
                        .split(',')
                        .map((tag) =>
                            tag.trim(),
                        )
                        .filter(Boolean),
        }

        void updateBook
            .mutateAsync({
                id: bookId,
                book: payload,
            })
            .then(() => {
                void navigate(
                    `/books/${encodeURIComponent(bookId)}`,
                )
            })
    }

    const categoryOptions =
        enumOptions(
            form.category,
            CATEGORY_VALUES,
        )

    const shelfOptions =
        enumOptions(
            form.shelf,
            SHELF_VALUES,
        )

    const statusOptions =
        enumOptions(
            form.status,
            STATUS_VALUES,
        )

    return (
        <section className="route-page">
            <AppLink
                to={`/books/${encodeURIComponent(bookId)}`}
                variant="secondary"
            >
                ← Back to Book
            </AppLink>

            <h1 tabIndex={-1}>
                Edit Book
            </h1>

            {updateBook.isError ? (
                <Alert
                    variant="error"
                    title="Unable to save book"
                >
                    {updateBook.error instanceof Error
                        ? updateBook.error.message
                        : 'An unexpected error occurred.'}
                </Alert>
            ) : null}

            <form onSubmit={handleSubmit}>
                <Field label="Title">
                    <input
                        type="text"
                        value={form.title}
                        onChange={handleTextChange(
                            'title',
                        )}
                        required
                    />
                </Field>

                <Field label="Authors">
                    <input
                        type="text"
                        value={form.authors}
                        onChange={handleTextChange(
                            'authors',
                        )}
                        required
                    />
                </Field>

                <Field label="ISBN-13">
                    <input
                        type="text"
                        value={form.isbn13}
                        onChange={handleTextChange(
                            'isbn13',
                        )}
                    />
                </Field>

                <Field label="Category">
                    <select
                        value={form.category}
                        onChange={(event) =>
                            updateField(
                                'category',
                                event.target.value,
                            )
                        }
                    >
                        {categoryOptions.map(
                            (value) => (
                                <option
                                    key={value}
                                    value={value}
                                >
                                    {value}
                                </option>
                            ),
                        )}
                    </select>
                </Field>

                <Field label="Shelf">
                    <select
                        value={form.shelf}
                        onChange={(event) =>
                            updateField(
                                'shelf',
                                event.target.value,
                            )
                        }
                    >
                        {shelfOptions.map(
                            (value) => (
                                <option
                                    key={value}
                                    value={value}
                                >
                                    {value}
                                </option>
                            ),
                        )}
                    </select>
                </Field>

                <Field label="Status">
                    <select
                        value={form.status}
                        onChange={(event) =>
                            updateField(
                                'status',
                                event.target.value,
                            )
                        }
                    >
                        {statusOptions.map(
                            (value) => (
                                <option
                                    key={value}
                                    value={value}
                                >
                                    {value}
                                </option>
                            ),
                        )}
                    </select>
                </Field>

                <Field
                    label="Publication Date"
                    helpText="Use YYYY-MM-DD or a year."
                >
                    <input
                        type="text"
                        value={
                            form.publicationDate
                        }
                        onChange={handleTextChange(
                            'publicationDate',
                        )}
                    />
                </Field>

                <Field label="Publisher">
                    <input
                        type="text"
                        value={form.publisher}
                        onChange={handleTextChange(
                            'publisher',
                        )}
                    />
                </Field>

                <Field label="Pages">
                    <input
                        type="number"
                        min="0"
                        value={form.pages}
                        onChange={handleTextChange(
                            'pages',
                        )}
                    />
                </Field>

                <Field label="Acquisition Source">
                    <input
                        type="text"
                        value={
                            form.acquisitionSource
                        }
                        onChange={handleTextChange(
                            'acquisitionSource',
                        )}
                    />
                </Field>

                <Field label="Purchase Date">
                    <input
                        type="text"
                        value={form.purchaseDate}
                        onChange={handleTextChange(
                            'purchaseDate',
                        )}
                    />
                </Field>

                <Field label="Purchase Price">
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                            form.purchasePrice
                        }
                        onChange={handleTextChange(
                            'purchasePrice',
                        )}
                    />
                </Field>

                <Field label="Read">
                    <input
                        type="checkbox"
                        checked={form.isRead}
                        onChange={(event) =>
                            updateField(
                                'isRead',
                                event.target.checked,
                            )
                        }
                    />
                </Field>

                <Field label="Completion Date">
                    <input
                        type="text"
                        value={
                            form.completionDate
                        }
                        onChange={handleTextChange(
                            'completionDate',
                        )}
                    />
                </Field>

                <Field label="Rating">
                    <input
                        type="number"
                        min="0"
                        max="5"
                        step="1"
                        value={form.rating}
                        onChange={handleTextChange(
                            'rating',
                        )}
                    />
                </Field>

                <Field label="Review">
                    <textarea
                        value={form.review}
                        onChange={handleTextChange(
                            'review',
                        )}
                    />
                </Field>

                <Field label="Notes">
                    <textarea
                        value={form.notes}
                        onChange={handleTextChange(
                            'notes',
                        )}
                    />
                </Field>

                <Field
                    label="Tags"
                    helpText="Separate tags with commas."
                >
                    <input
                        type="text"
                        value={form.tags}
                        onChange={handleTextChange(
                            'tags',
                        )}
                    />
                </Field>

                <div>
                    <Button
                        type="submit"
                        disabled={
                            updateBook.isPending
                        }
                    >
                        {updateBook.isPending
                            ? 'Saving…'
                            : 'Save Changes'}
                    </Button>

                    <AppLink
                        to={`/books/${encodeURIComponent(bookId)}`}
                        variant="secondary"
                    >
                        Cancel
                    </AppLink>
                </div>
            </form>
        </section>
    )
}

export function EditBookPage() {
    const { bookId } = useParams<{
        bookId: string
    }>()

    const bookQuery = useBook(bookId ?? '')

    if (!bookId) {
        return (
            <section className="route-page">
                <h1 tabIndex={-1}>
                    Edit Book
                </h1>

                <Alert
                    variant="error"
                    title="Unable to edit book"
                >
                    No book ID was provided.
                </Alert>
            </section>
        )
    }

    if (bookQuery.isPending) {
        return (
            <section className="route-page">
                <h1 tabIndex={-1}>
                    Edit Book
                </h1>

                <LoadingState label="Loading book…" />
            </section>
        )
    }

    if (bookQuery.isError) {
        return (
            <section className="route-page">
                <h1 tabIndex={-1}>
                    Edit Book
                </h1>

                <Alert
                    variant="error"
                    title="Unable to load book"
                >
                    {bookQuery.error instanceof Error
                        ? bookQuery.error.message
                        : 'An unexpected error occurred.'}
                </Alert>
            </section>
        )
    }

    return (
        <EditBookForm
            bookId={bookId}
            book={bookQuery.data}
        />
    )
}