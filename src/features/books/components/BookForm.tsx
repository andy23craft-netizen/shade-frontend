import { useState } from 'react'
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

export interface BookFormProps {
    initialValues: BookCreate
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
    value: number | null | undefined,
): string {
    return value === null ||
        value === undefined
        ? ''
        : String(value)
}

export function BookForm({
    initialValues,
    onSubmit,
    onCancel,
    isSubmitting = false,
}: BookFormProps) {
    const [values, setValues] =
        useState<BookCreate>(initialValues)

    const [validationError, setValidationError] =
        useState<string | null>(null)

    function updateField<
        K extends keyof BookCreate,
    >(
        field: K,
        value: BookCreate[K],
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
            | 'completion_date'
            | 'review'
            | 'notes',
        event: ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement
        >,
    ) {
        const value = event.target.value

        updateField(
            field,
            value === ''
                ? null
                : value,
        )
    }

    function handleNumberChange(
        field:
            | 'pages'
            | 'purchase_price'
            | 'rating',
        event: ChangeEvent<HTMLInputElement>,
    ) {
        const value = event.target.value

        if (value === '') {
            updateField(field, null)
            return
        }

        const number = Number(value)

        if (!Number.isNaN(number)) {
            updateField(field, number)
        }
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
            ...values,
            title: values.title.trim(),
            authors: values.authors.trim(),
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
                <h2>Reading</h2>

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

                <Field label="Completion date">
                    <input
                        type="date"
                        value={stringValue(
                            values.completion_date,
                        )}
                        onChange={(event) =>
                            handleTextChange(
                                'completion_date',
                                event,
                            )
                        }
                    />
                </Field>

                <Field label="Rating">
                    <input
                        type="number"
                        min="0"
                        max="5"
                        step="1"
                        value={numberValue(
                            values.rating,
                        )}
                        onChange={(event) =>
                            handleNumberChange(
                                'rating',
                                event,
                            )
                        }
                    />
                </Field>

                <Field label="Review">
                    <textarea
                        value={stringValue(
                            values.review,
                        )}
                        onChange={(event) =>
                            handleTextChange(
                                'review',
                                event,
                            )
                        }
                        rows={5}
                    />
                </Field>
            </section>

            <section>
                <h2>Notes</h2>

                <Field label="Tags">
                    <input
                        type="text"
                        value={
                            values.tags?.join(', ') ??
                            ''
                        }
                        onChange={(event) => {
                            const raw =
                                event.target.value

                            const tags =
                                raw
                                    .split(',')
                                    .map(
                                        (tag) =>
                                            tag.trim(),
                                    )
                                    .filter(
                                        Boolean,
                                    )

                            updateField(
                                'tags',
                                tags.length > 0
                                    ? tags
                                    : null,
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
