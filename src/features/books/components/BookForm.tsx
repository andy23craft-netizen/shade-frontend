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
    AuthorRead,
    CategoryRead,
    ShelfRead,
} from '../../../api/apiTypes'
import {
    filterAssignableShelves,
    formatShelfCommonNameForDisplay,
    normalizeShelfCommonName,
} from '../../shelves/shelfDisplay'
import {
    sortCategoriesByName,
} from '../categoryDisplay'

import {
    parseTagsInput,
    validateBookFormValues,
    type BookFormField,
    type BookFormFieldErrors,
} from './bookFormModel'

export interface BookFormValues {
    title: string
    authorIds: string[]
    isbn13: string
    publisher: string
    illustrator: string
    editor: string
    publication_date: string
    pages: string
    categoryIds: string[]
    shelfId: string
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
    authorIds: 'Authors',
    isbn13: 'ISBN',
    publisher: 'Publisher',
    illustrator: 'Illustrator',
    editor: 'Editor',
    publication_date: 'Publication date',
    pages: 'Pages',
    categoryIds: 'Categories',
    shelfId: 'Shelf',
    tags: 'Tags',
    acquisition_source: 'Acquisition source',
    purchase_date: 'Purchase date',
    purchase_price: 'Purchase price',
    notes: 'Notes',
}

export interface BookFormProps {
    values: BookFormValues
    shelves: ShelfRead[]
    categories: CategoryRead[]
    authors: AuthorRead[]
    onChange: (
        values: BookFormValues,
    ) => void
    onSubmit: (
        values: BookFormValues,
    ) => void | Promise<void>
    onCancel: () => void
    isSubmitting?: boolean
    serverFieldErrors?: BookFormFieldErrors
    formError?: string | null
    onCreateAuthor?: (
        name: string,
    ) => Promise<AuthorRead>
    onCreateCategory?: (
        name: string,
    ) => Promise<CategoryRead>
    onUpdateAuthor?: (
        author: AuthorRead,
        firstName: string,
        surname: string,
    ) => Promise<AuthorRead>
    onUpdateCategory?: (
        category: CategoryRead,
        name: string,
    ) => Promise<CategoryRead>
}

function focusSummary(
    node: HTMLDivElement | null,
) {
    node?.focus()
}

export function BookForm({
    values,
    shelves,
    categories,
    authors,
    onChange,
    onSubmit,
    onCancel,
    isSubmitting = false,
    serverFieldErrors = {},
    formError = null,
    onCreateCategory,
    onCreateAuthor,
    onUpdateAuthor,
    onUpdateCategory,
}: BookFormProps) {
    const idPrefix = useId()
    const summaryRef =
        useRef<HTMLDivElement>(null)
    const [
        clientErrors,
        setClientErrors,
    ] = useState<BookFormFieldErrors>({})

    const [
        categoryPickerOpen,
        setCategoryPickerOpen,
    ] = useState(false)

    const [
        isAuthorPickerOpen,
        setIsAuthorPickerOpen,
    ] = useState(false)

    const [
        authorSearch,
        setAuthorSearch,
    ] = useState('')

    const [
        authorCreateError,
        setAuthorCreateError,
    ] = useState<string | null>(null)

    const [
        isCreatingAuthor,
        setIsCreatingAuthor,
    ] = useState(false)

    const [
        editingAuthorId,
        setEditingAuthorId,
    ] = useState<string | null>(null)

    const [
        authorEditFirstName,
        setAuthorEditFirstName,
    ] = useState('')

    const [
        authorEditSurname,
        setAuthorEditSurname,
    ] = useState('')

    const [
        authorEditError,
        setAuthorEditError,
    ] = useState<string | null>(null)

    const [
        isUpdatingAuthor,
        setIsUpdatingAuthor,
    ] = useState(false)

    const [
        categorySearch,
        setCategorySearch,
    ] = useState('')

    const [
        editingCategoryId,
        setEditingCategoryId,
    ] = useState<string | null>(null)

    const [
        categoryEditName,
        setCategoryEditName,
    ] = useState('')

    const [
        categoryEditError,
        setCategoryEditError,
    ] = useState<string | null>(null)

    const [
        isUpdatingCategory,
        setIsUpdatingCategory,
    ] = useState(false)

    const [
        shelfPickerOpen,
        setShelfPickerOpen,
    ] = useState(false)

    const [
        shelfSearch,
        setShelfSearch,
    ] = useState('')

    const assignableShelves =
        filterAssignableShelves(shelves)

    const selectedShelf = shelves.find(
        (shelf) =>
            shelf.shelf_id === values.shelfId,
    )

    const selectedIsRemoved =
        selectedShelf !== undefined &&
        normalizeShelfCommonName(
            selectedShelf.common_name,
        ) === 'removed'

    const shelfOptions = selectedIsRemoved &&
        selectedShelf !== undefined
        ? [
            selectedShelf,
            ...assignableShelves,
        ]
        : assignableShelves

    const normalizedShelfSearch =
        shelfSearch.trim().toLowerCase()

    const visibleShelfOptions =
        normalizedShelfSearch === ''
            ? shelfOptions
            : shelfOptions.filter((shelf) =>
                formatShelfCommonNameForDisplay(
                    shelf.common_name,
                )
                    .toLowerCase()
                    .includes(
                        normalizedShelfSearch,
                    ),
            )

    const selectedShelfLabel =
        selectedShelf === undefined
            ? 'Select a shelf'
            : formatShelfCommonNameForDisplay(
                selectedShelf.common_name,
            )

    const sortedCategories =
        sortCategoriesByName(categories)

    const selectedCategoryIds =
        new Set(values.categoryIds)

    const selectedCategories =
        sortedCategories.filter(
            (category) =>
                selectedCategoryIds.has(
                    category.category_id,
                ),
        )

    const normalizedCategorySearch =
        categorySearch.trim().toLowerCase()

    const categorySearchName =
        categorySearch.trim().replace(/\s+/g, ' ')

    const hasExactCategoryMatch =
        categorySearchName !== '' &&
        categories.some(
            (category) =>
                category.name.trim().toLowerCase() ===
                categorySearchName.toLowerCase(),
        )

    const canCreateCategory =
        Boolean(onCreateCategory) &&
        categorySearchName !== '' &&
        !hasExactCategoryMatch

    const visibleCategories =
        normalizedCategorySearch === ''
            ? sortedCategories
            : sortedCategories.filter(
                (category) =>
                    category.name
                        .toLowerCase()
                        .includes(
                            normalizedCategorySearch,
                        ),
            )

    const authorName = (author: AuthorRead) =>
        [
            author.first_name,
            author.surname,
        ]
            .filter(Boolean)
            .join(' ')

    const selectedAuthors = values.authorIds
        .map((authorId) =>
            authors.find(
                (author) =>
                    author.author_id === authorId,
            ),
        )
        .filter(
            (author): author is AuthorRead =>
                author !== undefined,
        )

    const normalizedAuthorSearch = authorSearch
        .trim()
        .toLocaleLowerCase()

    const filteredAuthors = authors.filter(
        (author) =>
            normalizedAuthorSearch === '' ||
            authorName(author)
                .toLocaleLowerCase()
                .includes(normalizedAuthorSearch),
    )

    const hasExactAuthorMatch = authors.some(
        (author) =>
            authorName(author)
                .trim()
                .toLocaleLowerCase() ===
            normalizedAuthorSearch,
    )

    const canCreateAuthor =
        onCreateAuthor !== undefined &&
        authorSearch.trim() !== '' &&
        !hasExactAuthorMatch



    async function handleCreateAuthor() {
        const name = authorSearch
            .trim()
            .replace(/\s+/g, ' ')

        if (!name || !onCreateAuthor) {
            return
        }

        setAuthorCreateError(null)
        setIsCreatingAuthor(true)

        try {
            const created = await onCreateAuthor(name)

            if (!values.authorIds.includes(
                created.author_id,
            )) {
                updateField('authorIds', [
                    ...values.authorIds,
                    created.author_id,
                ])
            }

            setAuthorSearch('')
        } catch (error) {
            setAuthorCreateError(
                error instanceof Error
                    ? error.message
                    : 'The author could not be created.',
            )
        } finally {
            setIsCreatingAuthor(false)
        }
    }

    function startAuthorEdit(author: AuthorRead) {
        setEditingAuthorId(author.author_id)
        setAuthorEditFirstName(author.first_name ?? '')
        setAuthorEditSurname(author.surname)
        setAuthorEditError(null)
    }

    function cancelAuthorEdit() {
        setEditingAuthorId(null)
        setAuthorEditFirstName('')
        setAuthorEditSurname('')
        setAuthorEditError(null)
    }

    async function saveAuthorEdit(author: AuthorRead) {
        if (!onUpdateAuthor || isUpdatingAuthor) {
            return
        }

        const surname = authorEditSurname.trim()

        if (surname === '') {
            setAuthorEditError('Enter a surname.')
            return
        }

        setAuthorEditError(null)
        setIsUpdatingAuthor(true)

        try {
            await onUpdateAuthor(
                author,
                authorEditFirstName,
                surname,
            )
            cancelAuthorEdit()
        } catch (error) {
            setAuthorEditError(
                error instanceof Error
                    ? error.message
                    : 'The author could not be updated.',
            )
        } finally {
            setIsUpdatingAuthor(false)
        }
    }

    const toggleAuthor = (authorId: string) => {
        if (values.authorIds.includes(authorId)) {
            updateField(
                'authorIds',
                values.authorIds.filter(
                    (selectedId) =>
                        selectedId !== authorId,
                ),
            )

            return
        }

        updateField('authorIds', [
            ...values.authorIds,
            authorId,
        ])
    }

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

    function toggleCategoryId(
        categoryId: string,
    ) {
        const selected = new Set(
            values.categoryIds,
        )

        if (selected.has(categoryId)) {
            selected.delete(categoryId)
        } else {
            selected.add(categoryId)
        }

        updateField(
            'categoryIds',
            [...selected],
        )
    }

    async function handleCreateCategory() {
        if (!onCreateCategory || !categorySearchName) {
            return
        }

        const created =
            await onCreateCategory(categorySearchName)

        updateField('categoryIds', [
            ...values.categoryIds,
            created.category_id,
        ])

        setCategorySearch('')
    }

    function startCategoryEdit(category: CategoryRead) {
        setEditingCategoryId(category.category_id)
        setCategoryEditName(category.name)
        setCategoryEditError(null)
    }

    function cancelCategoryEdit() {
        setEditingCategoryId(null)
        setCategoryEditName('')
        setCategoryEditError(null)
    }

    async function saveCategoryEdit(
        category: CategoryRead,
    ) {
        if (!onUpdateCategory || isUpdatingCategory) {
            return
        }

        const name = categoryEditName
            .trim()
            .replace(/\s+/g, ' ')

        if (name === '') {
            setCategoryEditError('Enter a category name.')
            return
        }

        setCategoryEditError(null)
        setIsUpdatingCategory(true)

        try {
            await onUpdateCategory(category, name)
            cancelCategoryEdit()
        } catch (error) {
            setCategoryEditError(
                error instanceof Error
                    ? error.message
                    : 'The category could not be updated.',
            )
        } finally {
            setIsUpdatingCategory(false)
        }
    }

    function handleTextChange(
        field:
            | 'title'
            | 'isbn13'
            | 'publisher'
            | 'illustrator'
            | 'editor'
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

        await onSubmit(nextValues)
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
        <form
            className="book-form"
            onSubmit={handleSubmit}
            noValidate
        >
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

                <fieldset
                    className="book-form__categories"
                    id={fieldId('authorIds')}
                >
                    <legend>Authors</legend>

                    {selectedAuthors.length > 0 ? (
                        <div
                            className="book-form__selected-categories"
                            aria-label="Selected authors"
                        >
                            {selectedAuthors.map((author) => {
                                const name = authorName(author)

                                return (
                                    <button
                                        key={author.author_id}
                                        type="button"
                                        className="button button--secondary"
                                        aria-label={`Remove ${name} author`}
                                        onClick={() =>
                                            toggleAuthor(
                                                author.author_id,
                                            )
                                        }
                                    >
                                        {name}
                                        {' ×'}
                                    </button>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="book-form__categories-empty">
                            No authors selected.
                        </p>
                    )}

                    <div className="book-form__category-picker">
                        <Button
                            type="button"
                            variant="secondary"
                            aria-expanded={isAuthorPickerOpen}
                            aria-controls={`${fieldId(
                                'authorIds',
                            )}-picker`}
                            onClick={() => {
                                setIsAuthorPickerOpen(
                                    (open) => !open,
                                )
                                setAuthorCreateError(null)
                            }}
                        >
                            {isAuthorPickerOpen
                                ? 'Close authors'
                                : values.authorIds.length > 0
                                  ? `Select authors (${values.authorIds.length})`
                                  : 'Select authors'}
                        </Button>

                        {isAuthorPickerOpen ? (
                            <div
                                id={`${fieldId(
                                    'authorIds',
                                )}-picker`}
                                className="book-form__category-dropdown"
                            >
                                <Field label="Search authors">
                                    <input
                                        type="search"
                                        value={authorSearch}
                                        onChange={(event) => {
                                            setAuthorSearch(
                                                event.target.value,
                                            )
                                            setAuthorCreateError(null)
                                        }}
                                        autoComplete="off"
                                    />
                                </Field>

                                <div className="book-form__category-dropdown-list">
                                    {filteredAuthors.map(
                                        (author) => {
                                            const name =
                                                authorName(author)
                                            const inputId =
                                                `${fieldId(
                                                    'authorIds',
                                                )}-${author.author_id}`

                                            return (
                                                <div
                                                    key={author.author_id}
                                                    className="book-form__metadata-option"
                                                >
                                                    <div className="book-form__metadata-option-row">
                                                        <label
                                                            htmlFor={inputId}
                                                            className="book-form__category-option"
                                                        >
                                                            <input
                                                                id={inputId}
                                                                type="checkbox"
                                                                checked={values.authorIds.includes(
                                                                    author.author_id,
                                                                )}
                                                                onChange={() =>
                                                                    toggleAuthor(
                                                                        author.author_id,
                                                                    )
                                                                }
                                                            />
                                                            <span>{name}</span>
                                                        </label>

                                                        {onUpdateAuthor ? (
                                                            <button
                                                                type="button"
                                                                className="book-form__metadata-edit-button"
                                                                disabled={
                                                                    isUpdatingAuthor
                                                                }
                                                                onClick={() => {
                                                                    startAuthorEdit(
                                                                        author,
                                                                    )
                                                                }}
                                                            >
                                                                Edit
                                                            </button>
                                                        ) : null}
                                                    </div>

                                                    {editingAuthorId ===
                                                    author.author_id ? (
                                                        <div className="book-form__metadata-editor">
                                                            <Field label="First name">
                                                                <input
                                                                    type="text"
                                                                    value={
                                                                        authorEditFirstName
                                                                    }
                                                                    onChange={(event) => {
                                                                        setAuthorEditFirstName(
                                                                            event.target.value,
                                                                        )
                                                                        setAuthorEditError(
                                                                            null,
                                                                        )
                                                                    }}
                                                                    disabled={
                                                                        isUpdatingAuthor
                                                                    }
                                                                />
                                                            </Field>

                                                            <Field label="Surname">
                                                                <input
                                                                    type="text"
                                                                    value={
                                                                        authorEditSurname
                                                                    }
                                                                    onChange={(event) => {
                                                                        setAuthorEditSurname(
                                                                            event.target.value,
                                                                        )
                                                                        setAuthorEditError(
                                                                            null,
                                                                        )
                                                                    }}
                                                                    disabled={
                                                                        isUpdatingAuthor
                                                                    }
                                                                />
                                                            </Field>

                                                            {authorEditError ? (
                                                                <p
                                                                    className="field__error"
                                                                    role="alert"
                                                                >
                                                                    {authorEditError}
                                                                </p>
                                                            ) : null}

                                                            <div className="book-form__metadata-editor-actions">
                                                                <Button
                                                                    type="button"
                                                                    variant="primary"
                                                                    disabled={
                                                                        isUpdatingAuthor
                                                                    }
                                                                    onClick={() => {
                                                                        void saveAuthorEdit(
                                                                            author,
                                                                        )
                                                                    }}
                                                                >
                                                                    {isUpdatingAuthor
                                                                        ? 'Saving…'
                                                                        : 'Save author'}
                                                                </Button>

                                                                <Button
                                                                    type="button"
                                                                    variant="secondary"
                                                                    disabled={
                                                                        isUpdatingAuthor
                                                                    }
                                                                    onClick={
                                                                        cancelAuthorEdit
                                                                    }
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            )
                                        },
                                    )}

                                    {canCreateAuthor ? (
                                        <button
                                            type="button"
                                            className="book-form__author-create"
                                            disabled={isCreatingAuthor}
                                            onClick={() => {
                                                void handleCreateAuthor()
                                            }}
                                        >
                                            {isCreatingAuthor
                                                ? 'Adding author…'
                                                : `+ Add “${authorSearch
                                                      .trim()
                                                      .replace(
                                                          /\s+/g,
                                                          ' ',
                                                      )}”`}
                                        </button>
                                    ) : null}

                                    {filteredAuthors.length === 0 &&
                                    !canCreateAuthor ? (
                                        <p className="book-form__category-no-results">
                                            No authors match your search.
                                        </p>
                                    ) : null}
                                </div>

                                {authorCreateError ? (
                                    <p
                                        className="field__error book-form__author-create-error"
                                        role="alert"
                                    >
                                        {authorCreateError}
                                    </p>
                                ) : null}
                            </div>
                        ) : null}
                    </div>

                    {fieldErrors.authorIds ? (
                        <div
                            className="field__error"
                            id={`${fieldId(
                                'authorIds',
                            )}-error`}
                        >
                            {fieldErrors.authorIds}
                        </div>
                    ) : null}
                </fieldset>

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
                    label="Illustrator"
                    id={fieldId('illustrator')}
                    error={fieldErrors.illustrator}
                >
                    <input
                        type="text"
                        value={values.illustrator}
                        maxLength={255}
                        onChange={(event) => handleTextChange('illustrator', event)}
                    />
                </Field>

                <Field
                    label="Editor"
                    id={fieldId('editor')}
                    error={fieldErrors.editor}
                >
                    <input
                        type="text"
                        value={values.editor}
                        maxLength={255}
                        onChange={(event) => handleTextChange('editor', event)}
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
                        inputMode="numeric"
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

                <fieldset
                    id={fieldId('categoryIds')}
                    className="book-form__categories"
                    aria-invalid={
                        fieldErrors.categoryIds
                            ? true
                            : undefined
                    }
                    aria-describedby={
                        fieldErrors.categoryIds
                            ? `${fieldId('categoryIds')}-error`
                            : undefined
                    }
                >
                    <legend>Categories</legend>

                    {fieldErrors.categoryIds ? (
                        <p
                            id={`${fieldId('categoryIds')}-error`}
                            className="field__error"
                            role="alert"
                        >
                            {fieldErrors.categoryIds}
                        </p>
                    ) : null}

                    {selectedCategories.length > 0 ? (
                        <div
                            className="book-form__selected-categories"
                            aria-label="Selected categories"
                        >
                            {selectedCategories.map(
                                (category) => (
                                    <Button
                                        key={
                                            category.category_id
                                        }
                                        type="button"
                                        variant="secondary"
                                        aria-label={`Remove ${category.name} category`}
                                        onClick={() => {
                                            toggleCategoryId(
                                                category.category_id,
                                            )
                                        }}
                                    >
                                        {category.name} ×
                                    </Button>
                                ),
                            )}
                        </div>
                    ) : (
                        <p className="book-form__categories-empty">
                            No categories selected.
                        </p>
                    )}

                    <div className="book-form__category-picker">
                        <Button
                            type="button"
                            variant="secondary"
                            aria-expanded={
                                categoryPickerOpen
                            }
                            aria-controls={`${fieldId(
                                'categoryIds',
                            )}-picker`}
                            onClick={() => {
                                setCategoryPickerOpen(
                                    (open) => !open,
                                )
                            }}
                        >
                            {categoryPickerOpen
                                ? 'Close categories'
                                : selectedCategories.length > 0
                                    ? `Select categories (${selectedCategories.length})`
                                    : 'Select categories'}
                        </Button>

                        {categoryPickerOpen ? (
                            <div
                                id={`${fieldId(
                                    'categoryIds',
                                )}-picker`}
                                className="book-form__category-dropdown"
                            >
                                <Field label="Search categories">
                                    <input
                                        type="search"
                                        value={categorySearch}
                                        onChange={(event) => {
                                            setCategorySearch(
                                                event.target.value,
                                            )
                                        }}
                                        autoComplete="off"
                                    />
                                </Field>

                                <div className="book-form__category-dropdown-list">
                                    {visibleCategories.length >
                                    0 ? (
                                        visibleCategories.map(
                                            (category) => {
                                                const inputId =
                                                    `${fieldId(
                                                        'categoryIds',
                                                    )}-${category.category_id}`

                                                return (
                                                    <div
                                                        key={
                                                            category.category_id
                                                        }
                                                        className="book-form__metadata-option"
                                                    >
                                                        <div className="book-form__metadata-option-row">
                                                            <label
                                                                htmlFor={
                                                                    inputId
                                                                }
                                                                className="book-form__category-option"
                                                            >
                                                                <input
                                                                    id={
                                                                        inputId
                                                                    }
                                                                    type="checkbox"
                                                                    checked={values.categoryIds.includes(
                                                                        category.category_id,
                                                                    )}
                                                                    onChange={() => {
                                                                        toggleCategoryId(
                                                                            category.category_id,
                                                                        )
                                                                    }}
                                                                />

                                                                <span>
                                                                    {category.name}
                                                                </span>
                                                            </label>

                                                            {onUpdateCategory ? (
                                                                <button
                                                                    type="button"
                                                                    className="book-form__metadata-edit-button"
                                                                    disabled={
                                                                        isUpdatingCategory
                                                                    }
                                                                    onClick={() => {
                                                                        startCategoryEdit(
                                                                            category,
                                                                        )
                                                                    }}
                                                                >
                                                                    Edit
                                                                </button>
                                                            ) : null}
                                                        </div>

                                                        {editingCategoryId ===
                                                        category.category_id ? (
                                                            <div className="book-form__metadata-editor">
                                                                <Field label="Category name">
                                                                    <input
                                                                        type="text"
                                                                        value={
                                                                            categoryEditName
                                                                        }
                                                                        onChange={(event) => {
                                                                            setCategoryEditName(
                                                                                event.target.value,
                                                                            )
                                                                            setCategoryEditError(
                                                                                null,
                                                                            )
                                                                        }}
                                                                        disabled={
                                                                            isUpdatingCategory
                                                                        }
                                                                    />
                                                                </Field>

                                                                {categoryEditError ? (
                                                                    <p
                                                                        className="field__error"
                                                                        role="alert"
                                                                    >
                                                                        {categoryEditError}
                                                                    </p>
                                                                ) : null}

                                                                <div className="book-form__metadata-editor-actions">
                                                                    <Button
                                                                        type="button"
                                                                        variant="primary"
                                                                        disabled={
                                                                            isUpdatingCategory
                                                                        }
                                                                        onClick={() => {
                                                                            void saveCategoryEdit(
                                                                                category,
                                                                            )
                                                                        }}
                                                                    >
                                                                        {isUpdatingCategory
                                                                            ? 'Saving…'
                                                                            : 'Save category'}
                                                                    </Button>

                                                                    <Button
                                                                        type="button"
                                                                        variant="secondary"
                                                                        disabled={
                                                                            isUpdatingCategory
                                                                        }
                                                                        onClick={
                                                                            cancelCategoryEdit
                                                                        }
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                )
                                            },
                                        )
                                    ) : (
                                        <p className="book-form__category-no-results">
                                            No categories match
                                            your search.
                                        </p>
                                    )}
                                    {canCreateCategory ? (
                                        <button
                                            type="button"
                                            className="book-form__picker-create"
                                            onClick={() => {
                                                void handleCreateCategory()
                                            }}
                                        >
                                            + Add “{categorySearchName}”
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </fieldset>

                <Field
                    label="Shelf"
                    error={fieldErrors.shelfId}
                >
                    <div className="book-form__shelf-controls">
                    <select
                        id={`${fieldId('shelfId')}-native`}
                        className="book-form__shelf-native"
                        aria-label="Shelf (mobile)"
                        value={values.shelfId}
                        aria-invalid={fieldErrors.shelfId ? true : undefined}
                        onChange={(event) => updateField('shelfId', event.target.value)}
                    >
                        <option value="">Select a shelf</option>
                        {shelfOptions.map((shelf) => {
                            const isRemoved = normalizeShelfCommonName(shelf.common_name) === 'removed'
                            return (
                                <option key={shelf.shelf_id} value={shelf.shelf_id} disabled={isRemoved}>
                                    {formatShelfCommonNameForDisplay(shelf.common_name)}
                                </option>
                            )
                        })}
                    </select>
                    <div className="book-form__shelf-picker">
                        <button
                            id={fieldId('shelfId')}
                            type="button"
                            className="book-form__shelf-picker-trigger"
                            aria-label="Shelf"
                            aria-expanded={shelfPickerOpen}
                            aria-controls={`${fieldId(
                                'shelfId',
                            )}-picker`}
                            aria-invalid={
                                fieldErrors.shelfId
                                    ? true
                                    : undefined
                            }
                            onClick={() => {
                                setShelfPickerOpen(
                                    (open) => !open,
                                )
                            }}
                        >
            <span>
                {selectedShelfLabel}
            </span>

                            <span aria-hidden="true">
                {shelfPickerOpen
                    ? '▴'
                    : '▾'}
            </span>
                        </button>

                        {shelfPickerOpen ? (
                            <div
                                id={`${fieldId(
                                    'shelfId',
                                )}-picker`}
                                className="book-form__shelf-dropdown"
                            >
                                <Field label="Search shelves">
                                    <input
                                        type="search"
                                        value={shelfSearch}
                                        onChange={(event) => {
                                            setShelfSearch(
                                                event.target.value,
                                            )
                                        }}
                                        autoComplete="off"
                                    />
                                </Field>

                                <div className="book-form__shelf-dropdown-list">
                                    {visibleShelfOptions.length >
                                    0 ? (
                                        visibleShelfOptions.map(
                                            (shelf) => {
                                                const isRemoved =
                                                    normalizeShelfCommonName(
                                                        shelf.common_name,
                                                    ) ===
                                                    'removed'

                                                const selected =
                                                    shelf.shelf_id ===
                                                    values.shelfId

                                                return (
                                                    <button
                                                        key={
                                                            shelf.shelf_id
                                                        }
                                                        type="button"
                                                        className="book-form__shelf-option"
                                                        disabled={
                                                            isRemoved
                                                        }
                                                        aria-pressed={
                                                            selected
                                                        }
                                                        onClick={() => {
                                                            updateField(
                                                                'shelfId',
                                                                shelf.shelf_id,
                                                            )

                                                            setShelfPickerOpen(
                                                                false,
                                                            )

                                                            setShelfSearch(
                                                                '',
                                                            )
                                                        }}
                                                    >
                                                        {formatShelfCommonNameForDisplay(
                                                            shelf.common_name,
                                                        )}

                                                        {selected ? (
                                                            <span
                                                                aria-hidden="true"
                                                            >
                                                ✓
                                            </span>
                                                        ) : null}
                                                    </button>
                                                )
                                            },
                                        )
                                    ) : (
                                        <p className="book-form__shelf-no-results">
                                            No shelves match
                                            your search.
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>
                    </div>
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
                        inputMode="decimal"
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
