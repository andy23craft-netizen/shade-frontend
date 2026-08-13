import {
    useEffect,
    useId,
    useRef,
    useState,
    type ChangeEvent,
    type FormEvent,
} from 'react'

import { Button } from '../../../components/Button'
import { Field } from '../../../components/Field'
import type {
    BookCreate,
    Category,
    Shelf,
} from '../../../api/apiTypes'

import {
    formValuesToBookCreate,
    parseTagsInput,
    validateBookFormValues,
    type BookFormField,
    type BookFormFieldErrors,
} from './bookFormModel'

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

export interface BookFormValues {
    title: string
    authors: string
    isbn13: string
    publisher: string
    publication_date: string
    pages: string
    category: Category
    shelf: Shelf
    tags: string
    acquisition_source: string
    purchase_date: string
    purchase_price: string
    notes: string
}

const FIELD_LABELS: Record<
    BookFormField,
    string
> = {
    title: 'Title',
    authors: 'Authors',
    isbn13: 'ISBN',
    publisher: 'Publisher',
    publication_date: 'Publication date',
    pages: 'Pages',
    category: 'Category',
    shelf: 'Shelf',
    tags: 'Tags',
    acquisition_source: 'Acquisition source',
    purchase_date: 'Purchase date',
    purchase_price: 'Purchase price',
    notes: 'Notes',
}

export interface BookFormProps {
    values: BookFormValues
    onChange: (
        values: BookFormValues,
    ) => void
    onSubmit: (
        values: BookCreate,
    ) => void | Promise<void>
    onCancel: () => void
    isSubmitting?: boolean
    serverFieldErrors?: BookFormFieldErrors
    formError?: string | null
}

function focusSummary(
    node: HTMLDivElement | null,
) {
    node?.focus()
}

export function BookForm({
    values,
    onChange,
    onSubmit,
    onCancel,
    isSubmitting = false,
    serverFieldErrors = {},
    formError = null,
}: BookFormProps) {
    const idPrefix = useId()
    const summaryRef =
        useRef<HTMLDivElement>(null)
    const [
        clientErrors,
        setClientErrors,
    ] = useState<BookFormFieldErrors>({})

    const fieldErrors: BookFormFieldErrors = {
        ...serverFieldErrors,
        ...clientErrors,
    }

    const errorEntries = (
        Object.entries(fieldErrors) as [
            BookFormField,
            string,
        ][]
    ).filter(
        (
            entry,
        ): entry is [BookFormField, string] =>
            Boolean(entry[1]),
    )

    const hasSummary =
        errorEntries.length > 0 ||
        Boolean(formError)

    const hasServerSummary =
        Boolean(formError) ||
        Object.keys(serverFieldErrors).length > 0

    function fieldId(
        field: BookFormField,
    ): string {
        return `${idPrefix}-${field}`
    }

    function updateField<
        K extends keyof BookFormValues,
    >(
        field: K,
        value: BookFormValues[K],
    ) {
        setClientErrors((current) => {
            if (!(field in current)) {
                return current
            }

            const next = {
                ...current,
            }

            delete next[field]

            return next
        })

        onChange({
            ...values,
            [field]: value,
        })
    }

    function handleTextChange(
        field:
            | 'title'
            | 'authors'
            | 'isbn13'
            | 'publisher'
            | 'publication_date'
            | 'acquisition_source'
            | 'purchase_date'
            | 'notes'
            | 'tags',
        event: ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement
        >,
    ) {
        updateField(
            field,
            event.target.value,
        )
    }

    function normalizeTagsField() {
        const normalized = parseTagsInput(
            values.tags,
        ).join(', ')

        if (normalized === values.tags) {
            return values
        }

        const nextValues: BookFormValues = {
            ...values,
            tags: normalized,
        }

        onChange(nextValues)

        return nextValues
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault()

        const nextValues = normalizeTagsField()

        const errors =
            validateBookFormValues(nextValues)

        setClientErrors(errors)

        if (Object.keys(errors).length > 0) {
            window.requestAnimationFrame(() => {
                focusSummary(summaryRef.current)
            })

            return
        }

        await onSubmit(
            formValuesToBookCreate(nextValues),
        )
    }

    useEffect(() => {
        if (!hasServerSummary) {
            return
        }

        focusSummary(summaryRef.current)
    }, [
        formError,
        hasServerSummary,
        serverFieldErrors,
    ])

    return (
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
                                            href={`#${fieldId(field)}`}
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

            <section>
                <h2>Book Information</h2>

                <Field
                    label="Title"
                    id={fieldId('title')}
                    error={fieldErrors.title}
                >
                    <input
                        type="text"
                        value={values.title}
                        maxLength={255}
                        onChange={(event) =>
                            updateField(
                                'title',
                                event.target.value,
                            )
                        }
                        autoComplete="off"
                    />
                </Field>

                <Field
                    label="Authors"
                    id={fieldId('authors')}
                    error={fieldErrors.authors}
                >
                    <input
                        type="text"
                        value={values.authors}
                        maxLength={255}
                        onChange={(event) =>
                            updateField(
                                'authors',
                                event.target.value,
                            )
                        }
                        autoComplete="off"
                    />
                </Field>

                <Field
                    label="ISBN"
                    id={fieldId('isbn13')}
                    helpText="ISBN-10 or ISBN-13; spaces and hyphens are allowed"
                    error={fieldErrors.isbn13}
                >
                    <input
                        type="text"
                        value={values.isbn13}
                        onChange={(event) =>
                            handleTextChange(
                                'isbn13',
                                event,
                            )
                        }
                        inputMode="text"
                        autoComplete="off"
                    />
                </Field>

                <Field
                    label="Publisher"
                    id={fieldId('publisher')}
                    error={fieldErrors.publisher}
                >
                    <input
                        type="text"
                        value={values.publisher}
                        maxLength={255}
                        onChange={(event) =>
                            handleTextChange(
                                'publisher',
                                event,
                            )
                        }
                    />
                </Field>

                <Field
                    label="Publication date"
                    id={fieldId('publication_date')}
                    helpText="Year-only (YYYY) or full date (YYYY-MM-DD)"
                    error={
                        fieldErrors.publication_date
                    }
                >
                    <input
                        type="text"
                        value={
                            values.publication_date
                        }
                        onChange={(event) =>
                            handleTextChange(
                                'publication_date',
                                event,
                            )
                        }
                        autoComplete="off"
                    />
                </Field>

                <Field
                    label="Pages"
                    id={fieldId('pages')}
                    helpText="Positive whole number"
                    error={fieldErrors.pages}
                >
                    <input
                        type="number"
                        min="1"
                        step="1"
                        value={values.pages}
                        onChange={(event) =>
                            updateField(
                                'pages',
                                event.target.value,
                            )
                        }
                    />
                </Field>
            </section>

            <section>
                <h2>Library Placement</h2>

                <Field
                    label="Category"
                    id={fieldId('category')}
                    error={fieldErrors.category}
                >
                    <select
                        value={values.category}
                        onChange={(event) =>
                            updateField(
                                'category',
                                event.target
                                    .value as Category,
                            )
                        }
                    >
                        {CATEGORY_VALUES.map(
                            (category) => (
                                <option
                                    key={category}
                                    value={category}
                                >
                                    {category}
                                </option>
                            ),
                        )}
                    </select>
                </Field>

                <Field
                    label="Shelf"
                    id={fieldId('shelf')}
                    error={fieldErrors.shelf}
                >
                    <select
                        value={values.shelf}
                        onChange={(event) =>
                            updateField(
                                'shelf',
                                event.target
                                    .value as Shelf,
                            )
                        }
                    >
                        {SHELF_VALUES.map(
                            (shelf) => (
                                <option
                                    key={shelf}
                                    value={shelf}
                                >
                                    {shelf}
                                </option>
                            ),
                        )}
                    </select>
                </Field>
            </section>

            <section>
                <h2>Acquisition</h2>

                <Field
                    label="Acquisition source"
                    id={fieldId('acquisition_source')}
                    error={
                        fieldErrors.acquisition_source
                    }
                >
                    <input
                        type="text"
                        value={
                            values.acquisition_source
                        }
                        onChange={(event) =>
                            handleTextChange(
                                'acquisition_source',
                                event,
                            )
                        }
                    />
                </Field>

                <Field
                    label="Purchase date"
                    id={fieldId('purchase_date')}
                    error={
                        fieldErrors.purchase_date
                    }
                >
                    <input
                        type="date"
                        value={
                            values.purchase_date
                        }
                        onChange={(event) =>
                            handleTextChange(
                                'purchase_date',
                                event,
                            )
                        }
                    />
                </Field>

                <Field
                    label="Purchase price"
                    id={fieldId('purchase_price')}
                    helpText="Optional amount; no currency conversion"
                    error={
                        fieldErrors.purchase_price
                    }
                >
                    <input
                        type="number"
                        step="0.01"
                        value={
                            values.purchase_price
                        }
                        onChange={(event) =>
                            updateField(
                                'purchase_price',
                                event.target.value,
                            )
                        }
                    />
                </Field>
            </section>

            <section>
                <h2>Notes</h2>

                <Field
                    label="Tags"
                    id={fieldId('tags')}
                    helpText="Comma-separated; duplicates are removed on save"
                    error={fieldErrors.tags}
                >
                    <input
                        type="text"
                        value={values.tags}
                        onChange={(event) =>
                            handleTextChange(
                                'tags',
                                event,
                            )
                        }
                        onBlur={() => {
                            normalizeTagsField()
                        }}
                    />
                </Field>

                <Field
                    label="Notes"
                    id={fieldId('notes')}
                    error={fieldErrors.notes}
                >
                    <textarea
                        value={values.notes}
                        onChange={(event) =>
                            handleTextChange(
                                'notes',
                                event,
                            )
                        }
                        rows={5}
                    />
                </Field>
            </section>

            <div>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting
                        ? 'Saving…'
                        : 'Save Book'}
                </Button>

                <Button
                    type="button"
                    variant="secondary"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
            </div>
        </form>
    )
}
