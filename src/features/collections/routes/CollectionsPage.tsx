import {
    useEffect,
    useId,
    useRef,
    useState,
    type FormEvent,
} from 'react'

import {
    ModalDialog,
    Alert,
    Button,
    ConfirmationDialog,
    EmptyState,
    Field,
    LoadingState,
    QueryErrorState,
} from '../../../components'
import {
    isApiError,
    type ApiFieldError,
} from '../../../api/apiErrors'
import type {
    CollectionRead,
} from '../../../api/apiTypes'
import {
    useCollectionBooks,
    useCollections,
    useCreateCollection,
    useDeleteCollection,
    useUpdateCollection,
} from '../../../api/collectionsQueries'
import {
    AddCollectionBookControl,
} from '../components/AddCollectionBookControl'
import {
    CollectionMembershipRow,
} from '../components/CollectionMembershipRow'
import {
    collectionEditFormValuesFromCollection,
    emptyCollectionCreateFormValues,
    formValuesToCollectionCreate,
    formValuesToCollectionUpdate,
    validateCollectionCreateFormValues,
    validateCollectionEditFormValues,
    type CollectionCreateField,
    type CollectionCreateFieldErrors,
    type CollectionCreateFormValues,
    type CollectionEditField,
    type CollectionEditFieldErrors,
    type CollectionEditFormValues,
} from '../collectionFormModel'

const CREATE_FIELDS = new Set<string>([
    'name',
    'description',
])

function mapCreateFieldErrors(
    fieldErrors: readonly ApiFieldError[],
): CollectionCreateFieldErrors {
    const mapped: CollectionCreateFieldErrors = {}

    for (const entry of fieldErrors) {
        const field = entry.field.split('.')[0]

        if (
            !field ||
            !CREATE_FIELDS.has(field) ||
            mapped[field as CollectionCreateField]
        ) {
            continue
        }

        mapped[field as CollectionCreateField] =
            entry.message
    }

    return mapped
}

function mapEditFieldErrors(
    fieldErrors: readonly ApiFieldError[],
): CollectionEditFieldErrors {
    const mapped: CollectionEditFieldErrors = {}

    for (const entry of fieldErrors) {
        const field = entry.field.split('.')[0]

        if (
            !field ||
            !CREATE_FIELDS.has(field) ||
            mapped[field as CollectionEditField]
        ) {
            continue
        }

        mapped[field as CollectionEditField] =
            entry.message
    }

    return mapped
}

function focusSummary(
    node: HTMLDivElement | null,
) {
    node?.focus()
}

function CreateCollectionForm() {
    const createCollection =
        useCreateCollection()

    const formId = useId()

    const summaryRef =
        useRef<HTMLDivElement | null>(null)

    const [
        values,
        setValues,
    ] = useState<CollectionCreateFormValues>(
        emptyCollectionCreateFormValues,
    )

    const [
        fieldErrors,
        setFieldErrors,
    ] = useState<CollectionCreateFieldErrors>({})

    const [
        formError,
        setFormError,
    ] = useState<string | null>(null)

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

    function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault()

        if (createCollection.isPending) {
            return
        }

        setFieldErrors({})
        setFormError(null)

        const clientErrors =
            validateCollectionCreateFormValues(
                values,
            )

        if (
            Object.keys(clientErrors).length > 0
        ) {
            setFieldErrors(clientErrors)
            setFormError(
                'Fix the highlighted fields and try again.',
            )
            return
        }

        createCollection.mutate(
            formValuesToCollectionCreate(
                values,
            ),
            {
                onSuccess: () => {
                    setValues(
                        emptyCollectionCreateFormValues,
                    )
                    setFieldErrors({})
                    setFormError(null)
                },

                onError: (error) => {
                    if (
                        isApiError(error) &&
                        error.status === 422 &&
                        error.fieldErrors.length > 0
                    ) {
                        setFieldErrors(
                            mapCreateFieldErrors(
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

    return (
        <form
            id="create-collection"
            className="collection-form"
            aria-labelledby={`${formId}-heading`}
            onSubmit={handleSubmit}
            noValidate
        >
            <h2 id={`${formId}-heading`}>
                Create a collection
            </h2>

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

            <Field
                id={`${formId}-name`}
                label="Name"
                error={fieldErrors.name}
            >
                <input
                    id={`${formId}-name`}
                    name="name"
                    type="text"
                    value={values.name}
                    onChange={(event) => {
                        setValues((current) => ({
                            ...current,
                            name: event.target.value,
                        }))
                    }}
                    disabled={
                        createCollection.isPending
                    }
                    maxLength={255}
                    autoComplete="off"
                />
            </Field>

            <Field
                id={`${formId}-description`}
                label="Description"
                error={fieldErrors.description}
            >
                <textarea
                    id={`${formId}-description`}
                    name="description"
                    value={values.description}
                    onChange={(event) => {
                        setValues((current) => ({
                            ...current,
                            description:
                            event.target.value,
                        }))
                    }}
                    disabled={
                        createCollection.isPending
                    }
                    rows={3}
                />
            </Field>

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
        </form>
    )
}

function EditCollectionForm({
                                collection,
                                onCancel,
                            }: {
    collection: CollectionRead
    onCancel: () => void
}) {
    const updateCollection =
        useUpdateCollection()

    const formId = useId()

    const summaryRef =
        useRef<HTMLDivElement | null>(null)

    const [
        values,
        setValues,
    ] = useState<CollectionEditFormValues>(
        () =>
            collectionEditFormValuesFromCollection(
                collection,
            ),
    )

    const [
        fieldErrors,
        setFieldErrors,
    ] = useState<CollectionEditFieldErrors>({})

    const [
        formError,
        setFormError,
    ] = useState<string | null>(null)

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

    function updateField<
        Field extends keyof CollectionEditFormValues,
    >(
        field: Field,
        value: CollectionEditFormValues[Field],
    ) {
        setValues((current) => ({
            ...current,
            [field]: value,
        }))

        setFormError(null)

        setFieldErrors((current) => {
            if (
                current[
                    field as CollectionEditField
                    ] === undefined
            ) {
                return current
            }

            const next = {
                ...current,
            }

            delete next[
                field as CollectionEditField
                ]

            return next
        })
    }

    function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault()

        if (updateCollection.isPending) {
            return
        }

        setFieldErrors({})
        setFormError(null)

        const clientErrors =
            validateCollectionEditFormValues(
                values,
            )

        if (
            Object.keys(clientErrors).length > 0
        ) {
            setFieldErrors(clientErrors)
            setFormError(
                'Fix the highlighted fields and try again.',
            )
            return
        }

        const update =
            formValuesToCollectionUpdate(
                values,
                collection,
            )

        if (Object.keys(update).length === 0) {
            setFormError(
                'Make a change before saving.',
            )
            return
        }

        updateCollection.mutate(
            {
                collectionId:
                collection.collection_id,
                collection: update,
            },
            {
                onSuccess: () => {
                    onCancel()
                },

                onError: (error) => {
                    if (
                        isApiError(error) &&
                        error.status === 422 &&
                        error.fieldErrors.length > 0
                    ) {
                        setFieldErrors(
                            mapEditFieldErrors(
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
                            ? error.detail ??
                            error.message
                            : error instanceof Error
                                ? error.message
                                : 'The collection could not be updated.',
                    )
                },
            },
        )
    }

    return (
        <form
            className="collection-form"
            aria-labelledby={`${formId}-heading`}
            onSubmit={handleSubmit}
            noValidate
        >
            <h3 id={`${formId}-heading`}>
                Edit {collection.name}
            </h3>

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

            <Field
                id={`${formId}-name`}
                label="Name"
                error={fieldErrors.name}
            >
                <input
                    id={`${formId}-name`}
                    name="name"
                    type="text"
                    value={values.name}
                    onChange={(event) => {
                        updateField(
                            'name',
                            event.target.value,
                        )
                    }}
                    disabled={
                        updateCollection.isPending
                    }
                    maxLength={255}
                    autoComplete="off"
                />
            </Field>

            <Field
                id={`${formId}-description`}
                label="Description"
                error={fieldErrors.description}
            >
                <textarea
                    id={`${formId}-description`}
                    name="description"
                    value={values.description}
                    onChange={(event) => {
                        updateField(
                            'description',
                            event.target.value,
                        )
                    }}
                    disabled={
                        updateCollection.isPending
                    }
                    rows={3}
                />
            </Field>

            <div className="collection-form__actions">
                <Button
                    type="submit"
                    variant="primary"
                    disabled={
                        updateCollection.isPending
                    }
                >
                    {updateCollection.isPending
                        ? 'Saving…'
                        : 'Save Changes'}
                </Button>

                <Button
                    type="button"
                    variant="secondary"
                    disabled={
                        updateCollection.isPending
                    }
                    onClick={onCancel}
                >
                    Cancel
                </Button>
            </div>
        </form>
    )
}

function CollectionSection({
                               collection,
                               onDelete,
                               deletePending,
                           }: {
    collection: CollectionRead
    onDelete: (
        collection: CollectionRead,
    ) => void
    deletePending: boolean
}) {
    const [
        editOpen,
        setEditOpen,
    ] = useState(false)
    const membershipsQuery =
        useCollectionBooks(
            collection.collection_id,
        )

    const items =
        membershipsQuery.data?.items ?? []

    const orderedItems = [
        ...items,
    ].sort(
        (left, right) =>
            left.order_num -
            right.order_num,
    )

    const total =
        membershipsQuery.data?.total

    return (
        <article className="collection-card">
            <header className="collection-card__header">
                <div>
                    <h2>{collection.name}</h2>

                    {collection.description ? (
                        <p>
                            {collection.description}
                        </p>
                    ) : null}

                    {membershipsQuery.isSuccess ? (
                        <p>
                            {total === 1
                                ? '1 book'
                                : `${total ?? 0} books`}
                        </p>
                    ) : null}
                </div>

                <div className="collection-card__actions">
                    <Button
                        type="button"
                        variant="secondary"
                        disabled={
                            deletePending ||
                            editOpen
                        }
                        onClick={() => {
                            setEditOpen(true)
                        }}
                    >
                        Edit
                    </Button>

                    <Button
                        type="button"
                        variant="danger"
                        disabled={
                            deletePending ||
                            editOpen
                        }
                        onClick={() => {
                            onDelete(collection)
                        }}
                    >
                        Delete Collection
                    </Button>
                </div>
            </header>

            {editOpen ? (
                <EditCollectionForm
                    collection={collection}
                    onCancel={() => {
                        setEditOpen(false)
                    }}
                />
            ) : null}

            {membershipsQuery.isPending ? (
                <LoadingState
                    label={`Loading ${collection.name}…`}
                />
            ) : null}

            {membershipsQuery.isError ? (
                <QueryErrorState
                    title={`Unable to load ${collection.name}`}
                    error={
                        membershipsQuery.error
                    }
                    onRetry={() => {
                        void membershipsQuery.refetch()
                    }}
                />
            ) : null}

            {membershipsQuery.isSuccess &&
            orderedItems.length === 0 ? (
                <p>
                    No books have been added to this
                    collection yet.
                </p>
            ) : null}

            {membershipsQuery.isSuccess &&
            orderedItems.length > 0 ? (
                <ol
                    className="collection-memberships"
                    aria-label={`${collection.name} books`}
                >
                    {orderedItems.map(
                        (
                            membership,
                            index,
                        ) => (
                            <CollectionMembershipRow
                                key={
                                    membership.collection_book_id
                                }
                                collectionId={
                                    collection.collection_id
                                }
                                membership={
                                    membership
                                }
                                isFirst={
                                    index === 0
                                }
                                isLast={
                                    index ===
                                    orderedItems.length -
                                    1
                                }
                            />
                        ),
                    )}
                </ol>
            ) : null}
        </article>
    )
}

export function CollectionsPage() {
    const collectionsQuery =
        useCollections()

    const deleteCollection =
        useDeleteCollection()

    const [
        pendingDelete,
        setPendingDelete,
    ] = useState<CollectionRead | null>(
        null,
    )

    const [
        deleteError,
        setDeleteError,
    ] = useState<string | null>(null)

    const [
        collectionActionsOpen,
        setCollectionActionsOpen,
    ] = useState(false)

    function handleConfirmDelete() {
        if (
            pendingDelete === null ||
            deleteCollection.isPending
        ) {
            return
        }

        setDeleteError(null)

        deleteCollection.mutate(
            pendingDelete.collection_id,
            {
                onSuccess: () => {
                    setPendingDelete(null)
                },

                onError: (error) => {
                    setDeleteError(
                        isApiError(error)
                            ? error.detail ??
                            error.message
                            : error instanceof Error
                                ? error.message
                                : 'The collection could not be deleted.',
                    )
                },
            },
        )
    }

    if (collectionsQuery.isPending) {
        return (
            <section className="route-page collections-page">
                <h1 tabIndex={-1}>
                    Collections
                </h1>

                <LoadingState
                    label="Loading collections…"
                />
            </section>
        )
    }

    if (collectionsQuery.isError) {
        return (
            <section className="route-page collections-page">
                <h1 tabIndex={-1}>
                    Collections
                </h1>

                <QueryErrorState
                    title="Unable to load collections"
                    error={
                        collectionsQuery.error
                    }
                    onRetry={() => {
                        void collectionsQuery.refetch()
                    }}
                />
            </section>
        )
    }

    const collections =
        collectionsQuery.data?.items ?? []

    return (
        <section className="route-page collections-page">
            <header className="collections-page__heading">
                <h1 tabIndex={-1}>
                    Collections
                </h1>

                <p>
                    Curate ordered groups of books from
                    the catalog. Collections can include
                    books on shelves as well as books
                    already represented on a wishlist.
                </p>

                <p>
                    Use Browse for the full shelved
                    catalog. Use Wishlists for books you
                    want to acquire that are not yet on
                    a shelf.
                </p>
            </header>


            {deleteError ? (
                <Alert variant="error">
                    {deleteError}
                </Alert>
            ) : null}

            {collections.length === 0 ? (
                <EmptyState title="No collections yet">
                    Create your first collection to start
                    curating groups of books.
                </EmptyState>
            ) : (
                <ul
                    className="collections-list"
                    aria-label="Collections"
                >
                    {collections.map(
                        (collection) => (
                            <li
                                key={
                                    collection.collection_id
                                }
                                className="collections-list__item"
                            >
                                <CollectionSection
                                    collection={
                                        collection
                                    }
                                    onDelete={
                                        setPendingDelete
                                    }
                                    deletePending={
                                        deleteCollection.isPending
                                    }
                                />
                            </li>
                        ),
                    )}
                </ul>
            )}

            <button
                type="button"
                className="page-add-tab"
                aria-label="Manage collections"
                onClick={() => {
                    setCollectionActionsOpen(true)
                }}
            >
    <span
        className="page-add-tab__plus"
        aria-hidden="true"
    >
        +
    </span>

                <span className="page-add-tab__label">
        Collection
    </span>
            </button>

            <ModalDialog
                open={collectionActionsOpen}
                title="Collection actions"
                onClose={() => {
                    setCollectionActionsOpen(false)
                }}
            >
                <div className="collections-page__workbench collections-page__workbench--dialog">
                    <CreateCollectionForm />

                    <AddCollectionBookControl />
                </div>
            </ModalDialog>

            <ConfirmationDialog
                open={pendingDelete !== null}
                title="Delete collection?"
                confirmLabel={
                    deleteCollection.isPending
                        ? 'Deleting…'
                        : 'Delete Collection'
                }
                cancelLabel="Cancel"
                confirmVariant="danger"
                onConfirm={
                    handleConfirmDelete
                }
                onCancel={() => {
                    if (
                        deleteCollection.isPending
                    ) {
                        return
                    }

                    setPendingDelete(null)
                    setDeleteError(null)
                }}
            >
                {pendingDelete ? (
                    <p>
                        Delete{' '}
                        <strong>
                            {pendingDelete.name}
                        </strong>
                        ? Memberships in this collection
                        are removed permanently, but the
                        catalog books remain in the
                        library.
                    </p>
                ) : (
                    <p>
                        Delete this collection?
                    </p>
                )}
            </ConfirmationDialog>
        </section>
    )
}
