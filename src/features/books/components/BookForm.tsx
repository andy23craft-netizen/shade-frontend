import type {
    FormEvent,
    ChangeEvent,
} from 'react'

import { Button } from '../../../components/Button'
import { Field } from '../../../components/Field'
import type {
    BookCreate,
    Category,
    Shelf,
    Status,
} from '../../../api/apiTypes'

import {
    useState,
} from 'react'


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

export interface BookFormValues {
    title: string
    authors: string
    isbn13: string
    publisher: string
    publication_date: string
    pages: string
    category: Category
    shelf: Shelf
    status: Status
    is_read: boolean
    tags: string[]
    acquisition_source: string
    purchase_date: string
    purchase_price: string
    notes: string
}

export interface BookFormProps {
    initialValues: BookFormValues
    onSubmit: (
        values: BookCreate,
    ) => void | Promise<void>
    onCancel: () => void
    isSubmitting?: boolean
}

function stringValue(
    value: string | null | undefined,
): string {
    return value ?? ''
}

function numberValue(
    value: string | number | null | undefined,
): string | number {
    return value ?? ''
}

export function BookForm({
                             initialValues,
                             onSubmit,
                             onCancel,
                             isSubmitting = false,
                         }: BookFormProps) {
    const [values, setValues] =
        useState<BookFormValues>(initialValues)

    const [validationError, setValidationError] =
        useState<string | null>(null)

    
    function updateField<
        K extends keyof BookFormValues,
    >(
        field: K,
        value: BookFormValues[K],
    ) {
        setValues((current) => ({
            ...current,
            [field]: value,
        }))
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
            | 'notes',
        event: ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement
        >,
    ) {
        updateField(
            field,
            event.target.value,
        )
    }

    function handleNumberChange(
        field:
            | 'pages'
            | 'purchase_price',
        event: ChangeEvent<HTMLInputElement>,
    ) {
        updateField(
            field,
            event.target.value,
        )
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault()
        setValidationError(null)

        if (values.title.trim() === '') {
            setValidationError(
                'Title is required.',
            )
            return
        }

        if (values.authors.trim() === '') {
            setValidationError(
                'Authors are required.',
            )
            return
        }

        const submission: BookCreate = {
            title: values.title.trim(),
            authors: values.authors.trim(),
            category: values.category,
            shelf: values.shelf,
            status: values.status,
            is_read: values.is_read,
            isbn13: values.isbn13,
            publisher: values.publisher,
            publication_date:
                values.publication_date,
            pages:
                values.pages.trim() === ''
                    ? null
                    : Number(values.pages),
            tags: values.tags,
            acquisition_source:
                values.acquisition_source,
            purchase_date: values.purchase_date,
            purchase_price:
                values.purchase_price.trim() === ''
                    ? null
                    : Number(values.purchase_price),
            notes: values.notes,
        }

        await onSubmit(submission)
    }

    return (
        <form onSubmit={handleSubmit}>
            {validationError ? (
                <div
                    role="alert"
                    className="field__error"
                >
                    {validationError}
                </div>
            ) : null}

            <section>
                <h2>Book Information</h2>

                <Field label="Title">
                    <input
                        type="text"
                        value={values.title}
                        onChange={(event) =>
                            updateField(
                                'title',
                                event.target.value,
                            )
                        }
                    />
                </Field>

                <Field label="Authors">
                    <input
                        type="text"
                        value={values.authors}
                        onChange={(event) =>
                            updateField(
                                'authors',
                                event.target.value,
                            )
                        }
                    />
                </Field>

                <Field label="ISBN-13">
                    <input
                        type="text"
                        value={stringValue(
                            values.isbn13,
                        )}
                        onChange={(event) =>
                            handleTextChange(
                                'isbn13',
                                event,
                            )
                        }
                        inputMode="numeric"
                    />
                </Field>

                <Field label="Publisher">
                    <input
                        type="text"
                        value={stringValue(
                            values.publisher,
                        )}
                        onChange={(event) =>
                            handleTextChange(
                                'publisher',
                                event,
                            )
                        }
                    />
                </Field>

                <Field label="Publication date">
                    <input
                        type="date"
                        value={stringValue(
                            values.publication_date,
                        )}
                        onChange={(event) =>
                            handleTextChange(
                                'publication_date',
                                event,
                            )
                        }
                    />
                </Field>

                <Field label="Pages">
                    <input
                        type="number"
                        min="0"
                        value={numberValue(
                            values.pages,
                        )}
                        onChange={(event) =>
                            handleNumberChange(
                                'pages',
                                event,
                            )
                        }
                    />
                </Field>
            </section>

            <section>
                <h2>Library Placement</h2>

                <Field label="Category">
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

                <Field label="Shelf">
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

                <Field label="Status">
                    <select
                        value={values.status}
                        onChange={(event) =>
                            updateField(
                                'status',
                                event.target
                                    .value as Status,
                            )
                        }
                    >
                        {STATUS_VALUES.map(
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

                <Field label="Read">
                    <input
                        type="checkbox"
                        checked={values.is_read}
                        onChange={(event) =>
                            updateField(
                                'is_read',
                                event.target.checked,
                            )
                        }
                    />
                </Field>
            </section>

            <section>
                <h2>Acquisition</h2>

                <Field label="Acquisition source">
                    <input
                        type="text"
                        value={stringValue(
                            values.acquisition_source,
                        )}
                        onChange={(event) =>
                            handleTextChange(
                                'acquisition_source',
                                event,
                            )
                        }
                    />
                </Field>

                <Field label="Purchase date">
                    <input
                        type="date"
                        value={stringValue(
                            values.purchase_date,
                        )}
                        onChange={(event) =>
                            handleTextChange(
                                'purchase_date',
                                event,
                            )
                        }
                    />
                </Field>

                <Field label="Purchase price">
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={numberValue(
                            values.purchase_price,
                        )}
                        onChange={(event) =>
                            handleNumberChange(
                                'purchase_price',
                                event,
                            )
                        }
                    />
                </Field>

            </section>

            <section>
                <h2>Notes</h2>

                <Field label="Tags">
                    <input
                        type="text"
                        value={values.tags.join(', ')}
                        onChange={(event) => {
                            const tags = event.target.value
                                .split(',')
                                .map((tag) => tag.trim())
                                .filter(Boolean)

                            updateField(
                                'tags',
                                tags,
                            )
                        }}
                    />
                </Field>

                <Field label="Notes">
                    <textarea
                        value={stringValue(
                            values.notes,
                        )}
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