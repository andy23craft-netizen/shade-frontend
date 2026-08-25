import {
    useEffect,
    useId,
    useRef,
    useState,
    type FormEvent,
} from 'react'

import {
    AppLink,
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
} from '../../../api/collectionsQueries'
import {
    emptyAddCollectionBookFormValues,
    formValuesToCollectionBookCreate,
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

            if (addCollectionBook.isPending) {
                return
            }

            setCollectionId('')
            setNotes('')
            setCollectionError(null)
            setFormError(null)

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
        onClose()
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
            className="confirmation-dialog"
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

                {collectionsQuery.isSuccess &&
                collections.length === 0 ? (
                    <div>
                        <p>
                            You do not have any collections
                            yet.
                        </p>

                        <AppLink
                            to="/collections"
                            variant="secondary"
                            onClick={() => {
                                resetAndClose()
                            }}
                        >
                            Manage Collections
                        </AppLink>
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
