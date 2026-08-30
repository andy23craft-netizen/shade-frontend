import {
    useEffect,
    useId,
    useRef,
    useState,
    type FormEvent,
} from 'react'

import {
    Button,
    Field,
    LoadingState,
    QueryErrorState,
} from '../../../components'
import {
    isApiError,
} from '../../../api/apiErrors'
import type {
    BookRead,
} from '../../../api/apiTypes'
import {
    useAddCollectionBook,
    useCollections,
    useCreateCollection,
} from '../../../api/collectionsQueries'
import {
    emptyAddCollectionBookFormValues,
    emptyCollectionCreateFormValues,
    formValuesToCollectionBookCreate,
    formValuesToCollectionCreate,
    validateCollectionCreateFormValues,
    type CollectionCreateFieldErrors,
    type CollectionCreateFormValues,
} from '../collectionFormModel'

export interface AddBookToCollectionDialogProps {
    book: BookRead
    open: boolean
    onClose: () => void
}

function getFocusableElements(
    container: HTMLElement,
): HTMLElement[] {
    const candidates =
        container.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )

    return Array.from(candidates).filter(
        (element) =>
            element.getAttribute('aria-hidden') !==
            'true',
    )
}

export function AddBookToCollectionDialog({
                                              book,
                                              open,
                                              onClose,
                                          }: AddBookToCollectionDialogProps) {
    const collectionsQuery =
        useCollections()

    const addCollectionBook =
        useAddCollectionBook()

    const createCollection =
        useCreateCollection()

    const dialogRef =
        useRef<HTMLDialogElement>(null)

    const collectionSelectRef =
        useRef<HTMLSelectElement>(null)

    const summaryRef =
        useRef<HTMLDivElement>(null)

    const previousFocusRef =
        useRef<HTMLElement | null>(null)

    const onCloseRef =
        useRef(onClose)

    const titleId = useId()

    const [
        collectionId,
        setCollectionId,
    ] = useState('')

    const [
        notes,
        setNotes,
    ] = useState('')

    const [
        collectionError,
        setCollectionError,
    ] = useState<string | null>(null)

    const [
        formError,
        setFormError,
    ] = useState<string | null>(null)

    const [
        createOpen,
        setCreateOpen,
    ] = useState(false)

    const [
        createValues,
        setCreateValues,
    ] = useState<CollectionCreateFormValues>(
        emptyCollectionCreateFormValues,
    )

    const [
        createFieldErrors,
        setCreateFieldErrors,
    ] = useState<CollectionCreateFieldErrors>({})

    const [
        createFormError,
        setCreateFormError,
    ] = useState<string | null>(null)

    useEffect(() => {
        onCloseRef.current = onClose
    }, [onClose])

    useEffect(() => {
        const dialog = dialogRef.current

        if (!dialog) {
            return
        }

        if (open && !dialog.open) {
            previousFocusRef.current =
                document.activeElement instanceof
                HTMLElement
                    ? document.activeElement
                    : null

            dialog.showModal()

            window.requestAnimationFrame(() => {
                collectionSelectRef.current?.focus()
            })

            return
        }

        if (!open && dialog.open) {
            dialog.close()

            const previousFocus =
                previousFocusRef.current

            previousFocusRef.current = null
            previousFocus?.focus()
        }
    }, [open])

    useEffect(() => {
        const dialog = dialogRef.current

        if (!dialog) {
            return
        }

        const restoreFocus = () => {
            const previousFocus =
                previousFocusRef.current

            previousFocusRef.current = null
            previousFocus?.focus()
        }

        const handleCancel = (event: Event) => {
            event.preventDefault()

            if (
                addCollectionBook.isPending ||
                createCollection.isPending
            ) {
                return
            }

            setCollectionId('')
            setNotes('')
            setCollectionError(null)
            setFormError(null)
            setCreateOpen(false)
            setCreateValues(
                emptyCollectionCreateFormValues,
            )
            setCreateFieldErrors({})
            setCreateFormError(null)

            onCloseRef.current()
        }

        const handleClose = () => {
            restoreFocus()
        }

        const handleKeyDown = (
            event: KeyboardEvent,
        ) => {
            if (
                event.key !== 'Tab' ||
                !dialog.open
            ) {
                return
            }

            const focusable =
                getFocusableElements(dialog)

            if (focusable.length === 0) {
                return
            }

            const first = focusable[0]
            const last =
                focusable[focusable.length - 1]

            if (
                event.shiftKey &&
                document.activeElement === first
            ) {
                event.preventDefault()
                last.focus()
                return
            }

            if (
                !event.shiftKey &&
                document.activeElement === last
            ) {
                event.preventDefault()
                first.focus()
            }
        }

        dialog.addEventListener(
            'cancel',
            handleCancel,
        )

        dialog.addEventListener(
            'close',
            handleClose,
        )

        dialog.addEventListener(
            'keydown',
            handleKeyDown,
        )

        return () => {
            dialog.removeEventListener(
                'cancel',
                handleCancel,
            )

            dialog.removeEventListener(
                'close',
                handleClose,
            )

            dialog.removeEventListener(
                'keydown',
                handleKeyDown,
            )
        }
    }, [
        addCollectionBook.isPending,
        createCollection.isPending,
    ])

    useEffect(() => {
        if (
            formError !== null ||
            collectionError !== null
        ) {
            summaryRef.current?.focus()
        }
    }, [
        formError,
        collectionError,
    ])

    function resetAndClose() {
        setCollectionId('')
        setNotes('')
        setCollectionError(null)
        setFormError(null)
        setCreateOpen(false)
        setCreateValues(
            emptyCollectionCreateFormValues,
        )
        setCreateFieldErrors({})
        setCreateFormError(null)
        onClose()
    }

    function handleCreateCollection(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault()

        if (createCollection.isPending) {
            return
        }

        setCreateFieldErrors({})
        setCreateFormError(null)

        const clientErrors =
            validateCollectionCreateFormValues(
                createValues,
            )

        if (Object.keys(clientErrors).length > 0) {
            setCreateFieldErrors(clientErrors)
            setCreateFormError(
                'Fix the highlighted fields and try again.',
            )
            return
        }

        createCollection.mutate(
            formValuesToCollectionCreate(
                createValues,
            ),
            {
                onSuccess: (createdCollection) => {
                    setCollectionId(
                        createdCollection.collection_id,
                    )
                    setCreateValues(
                        emptyCollectionCreateFormValues,
                    )
                    setCreateFieldErrors({})
                    setCreateFormError(null)
                    setCreateOpen(false)
                    setCollectionError(null)
                    setFormError(null)
                },
                onError: (error) => {
                    if (
                        isApiError(error) &&
                        error.status === 422 &&
                        error.fieldErrors.length > 0
                    ) {
                        const mapped: CollectionCreateFieldErrors = {}

                        for (const entry of error.fieldErrors) {
                            const field =
                                entry.field.split('.')[0]

                            if (
                                (field === 'name' ||
                                    field === 'description') &&
                                mapped[field] === undefined
                            ) {
                                mapped[field] =
                                    entry.message
                            }
                        }

                        setCreateFieldErrors(mapped)
                        setCreateFormError(
                            'Correct the marked fields and try again.',
                        )
                        return
                    }

                    setCreateFormError(
                        isApiError(error)
                            ? error.detail ??
                              error.message
                            : error instanceof Error
                                ? error.message
                                : 'The collection could not be created.',
                    )
                },
            },
        )
    }

    function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault()

        if (addCollectionBook.isPending) {
            return
        }

        setCollectionError(null)
        setFormError(null)

        const selectedCollectionId =
            collectionId.trim()

        if (selectedCollectionId === '') {
            setCollectionError(
                'Choose a collection.',
            )

            setFormError(
                'Fix the highlighted fields and try again.',
            )

            return
        }

        addCollectionBook.mutate(
            {
                collectionId:
                selectedCollectionId,

                collectionBook:
                    formValuesToCollectionBookCreate({
                        ...emptyAddCollectionBookFormValues,
                        collectionId:
                        selectedCollectionId,
                        bookId: book.id,
                        notes,
                    }),
            },
            {
                onSuccess: () => {
                    resetAndClose()
                },

                onError: (error) => {
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
                        error.status === 422
                    ) {
                        const collectionFieldError =
                            error.fieldErrors.find(
                                (entry) => {
                                    const field =
                                        entry.field.split(
                                            '.',
                                        )[0]

                                    return (
                                        field ===
                                        'collection_id' ||
                                        field ===
                                        'collectionId'
                                    )
                                },
                            )

                        if (collectionFieldError) {
                            setCollectionError(
                                collectionFieldError.message,
                            )
                        }

                        setFormError(
                            error.detail ??
                            error.message,
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

    const collections =
        collectionsQuery.data?.items ?? []

    return (
        <dialog
            ref={dialogRef}
            className="confirmation-dialog add-book-to-collection-dialog"
            aria-labelledby={titleId}
        >
            <div className="confirmation-dialog__content">
                <h2 id={titleId}>
                    Add to Collection
                </h2>

                <p>
                    Add <strong>{book.title}</strong>{' '}
                    to one of your collections.
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

                {collectionsQuery.isPending ? (
                    <LoadingState
                        label="Loading collections…"
                    />
                ) : null}

                {collectionsQuery.isError ? (
                    <QueryErrorState
                        title="Unable to load collections"
                        error={
                            collectionsQuery.error
                        }
                        onRetry={() => {
                            void collectionsQuery.refetch()
                        }}
                    />
                ) : null}

                {collectionsQuery.isSuccess ? (
                    <div className="add-book-to-collection-dialog__collection-tools">
                        {collections.length === 0 ? (
                            <p>
                                You do not have any collections
                                yet. Create one here, then add
                                this book to it.
                            </p>
                        ) : null}

                        {!createOpen &&
                        collections.length > 0 ? (
                            <Button
                                type="button"
                                variant="secondary"
                                disabled={
                                    addCollectionBook.isPending
                                }
                                onClick={() => {
                                    setCreateOpen(true)
                                    setCreateFormError(null)
                                    setCreateFieldErrors({})
                                }}
                            >
                                Create New Collection
                            </Button>
                        ) : null}

                        {createOpen ||
                        collections.length === 0 ? (
                            <form
                                className="add-book-to-collection-dialog__create-form"
                                onSubmit={
                                    handleCreateCollection
                                }
                                noValidate
                            >
                                <h3>Create a collection</h3>

                                {createFormError ? (
                                    <div
                                        className="alert alert--error"
                                        role="alert"
                                    >
                                        <p>{createFormError}</p>
                                    </div>
                                ) : null}

                                <Field
                                    id={`${titleId}-new-collection-name`}
                                    label="Name"
                                    error={
                                        createFieldErrors.name
                                    }
                                >
                                    <input
                                        id={`${titleId}-new-collection-name`}
                                        name="name"
                                        type="text"
                                        value={
                                            createValues.name
                                        }
                                        onChange={(event) => {
                                            setCreateValues(
                                                (current) => ({
                                                    ...current,
                                                    name: event.target.value,
                                                }),
                                            )
                                            setCreateFieldErrors(
                                                (current) => ({
                                                    ...current,
                                                    name: undefined,
                                                }),
                                            )
                                            setCreateFormError(null)
                                        }}
                                        disabled={
                                            createCollection.isPending
                                        }
                                        maxLength={255}
                                        autoComplete="off"
                                    />
                                </Field>

                                <Field
                                    id={`${titleId}-new-collection-description`}
                                    label="Description"
                                    error={
                                        createFieldErrors.description
                                    }
                                >
                                    <textarea
                                        id={`${titleId}-new-collection-description`}
                                        name="description"
                                        value={
                                            createValues.description
                                        }
                                        onChange={(event) => {
                                            setCreateValues(
                                                (current) => ({
                                                    ...current,
                                                    description:
                                                        event.target.value,
                                                }),
                                            )
                                            setCreateFieldErrors(
                                                (current) => ({
                                                    ...current,
                                                    description: undefined,
                                                }),
                                            )
                                            setCreateFormError(null)
                                        }}
                                        disabled={
                                            createCollection.isPending
                                        }
                                        rows={3}
                                    />
                                </Field>

                                <div className="confirmation-dialog__actions">
                                    {collections.length > 0 ? (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            disabled={
                                                createCollection.isPending
                                            }
                                            onClick={() => {
                                                setCreateOpen(false)
                                                setCreateValues(
                                                    emptyCollectionCreateFormValues,
                                                )
                                                setCreateFieldErrors({})
                                                setCreateFormError(null)
                                            }}
                                        >
                                            Cancel Create
                                        </Button>
                                    ) : null}

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={
                                            createCollection.isPending
                                        }
                                    >
                                        {createCollection.isPending
                                            ? 'Creating…'
                                            : 'Create Collection'}
                                    </Button>
                                </div>
                            </form>
                        ) : null}
                    </div>
                ) : null}

                {collectionsQuery.isSuccess &&
                collections.length > 0 ? (
                    <form
                        onSubmit={handleSubmit}
                        noValidate
                    >
                        <Field
                            id={`${titleId}-collection`}
                            label="Collection"
                            error={
                                collectionError ??
                                undefined
                            }
                        >
                            <select
                                ref={
                                    collectionSelectRef
                                }
                                id={`${titleId}-collection`}
                                name="collectionId"
                                value={collectionId}
                                onChange={(event) => {
                                    setCollectionId(
                                        event.target.value,
                                    )
                                    setCollectionError(null)
                                    setFormError(null)
                                }}
                                disabled={
                                    addCollectionBook.isPending
                                }
                            >
                                <option value="">
                                    Choose a collection
                                </option>

                                {collections.map(
                                    (collection) => (
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
                                    ),
                                )}
                            </select>
                        </Field>

                        <Field
                            id={`${titleId}-notes`}
                            label="Notes"
                        >
                            <textarea
                                id={`${titleId}-notes`}
                                name="notes"
                                value={notes}
                                onChange={(event) => {
                                    setNotes(
                                        event.target.value,
                                    )
                                    setFormError(null)
                                }}
                                disabled={
                                    addCollectionBook.isPending
                                }
                                rows={3}
                            />
                        </Field>

                        <div className="confirmation-dialog__actions">
                            <Button
                                type="button"
                                variant="secondary"
                                disabled={
                                    addCollectionBook.isPending
                                }
                                onClick={resetAndClose}
                            >
                                Cancel
                            </Button>

                            <Button
                                type="submit"
                                variant="primary"
                                disabled={
                                    addCollectionBook.isPending
                                }
                            >
                                {addCollectionBook.isPending
                                    ? 'Adding…'
                                    : 'Add to Collection'}
                            </Button>
                        </div>
                    </form>
                ) : null}
            </div>
        </dialog>
    )
}
