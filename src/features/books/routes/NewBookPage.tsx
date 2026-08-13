import {
    useState,
    type ChangeEvent,
    type FormEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'

import { Alert } from '../../../components/Alert'
import { AppLink } from '../../../components/AppLink'
import { Button } from '../../../components/Button'
import { Field } from '../../../components/Field'
import {
    useBookLookup,
    useCreateBook,
} from '../../../api/booksQueries'
import type {
    BookCreate,
    Category,
    Shelf,
    Status,
} from '../../../api/apiTypes'

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
    category: Category | string
    shelf: Shelf | string
    status: Status | string
    publication_date: string
    publisher: string
    pages: string
    acquisition_source: string
    purchase_date: string
    purchase_price: string
    is_read: boolean
    completion_date: string
    rating: string
    review: string
    notes: string
}

const initialFormState: FormState = {
    title: '',
    authors: '',
    isbn13: '',
    category: 'unknown',
    shelf: 'unknown',
    status: 'available',
    publication_date: '',
    publisher: '',
    pages: '',
    acquisition_source: '',
    purchase_date: '',
    purchase_price: '',
    is_read: false,
    completion_date: '',
    rating: '',
    review: '',
    notes: '',
}

function nullableString(
    value: string,
): string | null {
    const trimmed = value.trim()
    return trimmed === '' ? null : trimmed
}

function nullableNumber(
    value: string,
): number | null {
    const trimmed = value.trim()

    if (trimmed === '') {
        return null
    }

    const number = Number(trimmed)

    return Number.isFinite(number)
        ? number
        : null
}

function selectValues<T extends string>(
    values: readonly T[],
    current: string,
): readonly string[] {
    if (
        current !== '' &&
        !values.includes(current as T)
    ) {
        return [current, ...values]
    }

    return values
}

export function NewBookPage() {
    const navigate = useNavigate()

    const [
        form,
        setForm,
    ] = useState<FormState>(
        initialFormState,
    )

    const [
        lookupIsbn,
        setLookupIsbn,
    ] = useState('')

    const [
        lookupRequested,
        setLookupRequested,
    ] = useState(false)

    const lookup = useBookLookup(
        lookupRequested
            ? lookupIsbn.trim()
            : '',
    )

    const createBook = useCreateBook()

    function updateField(
        event: ChangeEvent<
            HTMLInputElement |
            HTMLSelectElement |
            HTMLTextAreaElement
        >,
    ) {
        const {
            name,
            value,
        } = event.target

        setForm((current) => ({
            ...current,
            [name]: value,
        }))
    }

    function handleReadChange(
        event: ChangeEvent<HTMLInputElement>,
    ) {
        const isRead = event.target.checked

        setForm((current) => ({
            ...current,
            is_read: isRead,
            completion_date: isRead
                ? current.completion_date
                : '',
        }))
    }

    function handleLookupSubmit() {
        const isbn = lookupIsbn.trim()

        if (!isbn) {
            return
        }

        setLookupRequested(false)

        window.setTimeout(() => {
            setLookupRequested(true)
        }, 0)
    }

    function applyLookup() {
        const draft = lookup.data?.draft

        if (!draft) {
            return
        }

        setForm((current) => ({
            ...current,
            title: draft.title ?? current.title,
            authors: draft.authors ?? current.authors,
            isbn13: draft.isbn13,
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
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault()

        const book: BookCreate = {
            title: form.title.trim(),
            authors: form.authors.trim(),
            isbn13: nullableString(
                form.isbn13,
            ),
            category:
                form.category as Category,
            shelf:
                form.shelf as Shelf,
            status:
                form.status as Status,
            publication_date:
                nullableString(
                    form.publication_date,
                ),
            publisher:
                nullableString(
                    form.publisher,
                ),
            pages:
                nullableNumber(
                    form.pages,
                ),
            acquisition_source:
                nullableString(
                    form.acquisition_source,
                ),
            purchase_date:
                nullableString(
                    form.purchase_date,
                ),
            purchase_price:
                nullableNumber(
                    form.purchase_price,
                ),
            is_read: form.is_read,
            completion_date:
                form.is_read
                    ? nullableString(
                        form.completion_date,
                    )
                    : null,
            rating:
                nullableNumber(
                    form.rating,
                ),
            review:
                nullableString(
                    form.review,
                ),
            notes:
                nullableString(
                    form.notes,
                ),
        }

        createBook.mutate(
            book,
            {
                onSuccess: (created) => {
                    navigate(
                        `/books/${created.id}`,
                    )
                },
            },
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
                <h1>Add Book</h1>
                <p>
                    Add a book manually or use
                    ISBN lookup to prefill its
                    metadata.
                </p>
            </header>

            <form onSubmit={handleSubmit}>
                <section>
                    <h2>ISBN Lookup</h2>

                    <div>
                        <Field
                            label="ISBN"
                            helpText="ISBN-10 or ISBN-13"
                        >
                            <input
                                name="lookupIsbn"
                                value={lookupIsbn}
                                onChange={(event) =>
                                    setLookupIsbn(
                                        event.target.value,
                                    )
                                }
                            />
                        </Field>

                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleLookupSubmit}
                            disabled={
                                !lookupIsbn.trim() ||
                                lookup.isFetching
                            }
                        >
                            {lookup.isFetching
                                ? 'Looking up…'
                                : 'Look Up ISBN'}
                        </Button>
                    </div>

                    {lookup.isError ? (
                        <Alert
                            variant="error"
                            title="Lookup failed"
                        >
                            {lookup.error instanceof
                            Error
                                ? lookup.error.message
                                : 'ISBN lookup failed.'}
                            {' You can still enter the book manually.'}
                        </Alert>
                    ) : null}

                    {lookup.data &&
                    !lookup.data.found ? (
                        <Alert variant="info">
                            No metadata was found.
                            You can still enter the
                            book manually.
                        </Alert>
                    ) : null}

                    {lookup.data?.found &&
                    lookup.data.draft ? (
                        <Alert
                            variant="success"
                            title="Metadata found"
                        >
                            Review the fields below
                            before saving.
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

                {createBook.isError ? (
                    <Alert
                        variant="error"
                        title="Could not create book"
                    >
                        {createBook.error instanceof
                        Error
                            ? createBook.error.message
                            : 'The book could not be created.'}
                    </Alert>
                ) : null}

                <section>
                    <h2>Book Information</h2>

                    <Field label="Title">
                        <input
                            name="title"
                            value={form.title}
                            onChange={updateField}
                            required
                        />
                    </Field>

                    <Field label="Authors">
                        <input
                            name="authors"
                            value={form.authors}
                            onChange={updateField}
                            required
                        />
                    </Field>

                    <Field label="ISBN-13">
                        <input
                            name="isbn13"
                            value={form.isbn13}
                            onChange={updateField}
                        />
                    </Field>

                    <Field label="Category">
                        <select
                            name="category"
                            value={form.category}
                            onChange={updateField}
                        >
                            {selectValues(
                                CATEGORY_VALUES,
                                form.category,
                            ).map((value) => (
                                <option
                                    key={value}
                                    value={value}
                                >
                                    {value}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Shelf">
                        <select
                            name="shelf"
                            value={form.shelf}
                            onChange={updateField}
                        >
                            {selectValues(
                                SHELF_VALUES,
                                form.shelf,
                            ).map((value) => (
                                <option
                                    key={value}
                                    value={value}
                                >
                                    {value}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Status">
                        <select
                            name="status"
                            value={form.status}
                            onChange={updateField}
                        >
                            {selectValues(
                                STATUS_VALUES,
                                form.status,
                            ).map((value) => (
                                <option
                                    key={value}
                                    value={value}
                                >
                                    {value}
                                </option>
                            ))}
                        </select>
                    </Field>
                </section>

                <section>
                    <h2>Publication</h2>

                    <Field label="Publisher">
                        <input
                            name="publisher"
                            value={form.publisher}
                            onChange={updateField}
                        />
                    </Field>

                    <Field label="Publication Date">
                        <input
                            name="publication_date"
                            type="date"
                            value={
                                form.publication_date
                            }
                            onChange={updateField}
                        />
                    </Field>

                    <Field label="Pages">
                        <input
                            name="pages"
                            type="number"
                            min="0"
                            value={form.pages}
                            onChange={updateField}
                        />
                    </Field>
                </section>

                <section>
                    <h2>Acquisition</h2>

                    <Field label="Acquisition Source">
                        <input
                            name="acquisition_source"
                            value={
                                form.acquisition_source
                            }
                            onChange={updateField}
                        />
                    </Field>

                    <Field label="Purchase Date">
                        <input
                            name="purchase_date"
                            type="date"
                            value={
                                form.purchase_date
                            }
                            onChange={updateField}
                        />
                    </Field>

                    <Field label="Purchase Price">
                        <input
                            name="purchase_price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                                form.purchase_price
                            }
                            onChange={updateField}
                        />
                    </Field>
                </section>

                <section>
                    <h2>Reading</h2>

                    <Field label="Read">
                        <input
                            name="is_read"
                            type="checkbox"
                            checked={form.is_read}
                            onChange={
                                handleReadChange
                            }
                        />
                    </Field>

                    <Field label="Completion Date">
                        <input
                            name="completion_date"
                            type="date"
                            value={
                                form.completion_date
                            }
                            onChange={updateField}
                            disabled={
                                !form.is_read
                            }
                        />
                    </Field>

                    <Field label="Rating">
                        <input
                            name="rating"
                            type="number"
                            min="0"
                            max="5"
                            step="1"
                            value={form.rating}
                            onChange={updateField}
                        />
                    </Field>

                    <Field label="Review">
                        <textarea
                            name="review"
                            value={form.review}
                            onChange={updateField}
                        />
                    </Field>

                    <Field label="Notes">
                        <textarea
                            name="notes"
                            value={form.notes}
                            onChange={updateField}
                        />
                    </Field>
                </section>

                <div>
                    <Button
                        type="submit"
                        disabled={
                            createBook.isPending
                        }
                    >
                        {createBook.isPending
                            ? 'Saving…'
                            : 'Save Book'}
                    </Button>

                    <AppLink
                        to="/books"
                        variant="secondary"
                    >
                        Cancel
                    </AppLink>
                </div>
            </form>
        </section>
    )
}
