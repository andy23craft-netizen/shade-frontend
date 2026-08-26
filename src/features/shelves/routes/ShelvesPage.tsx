import {
    useEffect,
    useId,
    useRef,
    useState,
    type ChangeEvent,
    type FormEvent,
} from 'react'

import {
    useInfiniteScrollTrigger,
} from '../../../hooks/useInfiniteScrollTrigger'
import {
    ShelfShowcase,
} from '../components/ShelfShowcase'
import {
    Alert,
    Button,
    ConfirmationDialog,
    EmptyState,
    Field,
    LoadingState,
    ModalDialog,
    QueryErrorState,
} from '../../../components'
import {
    isApiError,
    type ApiFieldError,
} from '../../../api/apiErrors'
import type {
    ShelfRead,
} from '../../../api/apiTypes'
import {
    useCreateShelf,
    useDeleteShelf,
    useShelves,
    useUpdateShelf,
} from '../../../api/shelvesQueries'
import {
    useDashboardBreakdowns,
} from '../../../api/dashboardQueries'
import {
    canDeleteShelf,
    canRenameShelf,
    formatShelfCommonNameForDisplay,
    isSystemShelfCommonName,
} from '../shelfDisplay'
import {
    emptyShelfFormValues,
    formValuesToShelfCreate,
    formValuesToShelfUpdate,
    shelfFormValuesFromShelf,
    shelfUpdateHasChanges,
    validateShelfFormValues,
    type ShelfFormField,
    type ShelfFormFieldErrors,
    type ShelfFormValues,
} from '../shelfFormModel'

const SHELF_FORM_FIELDS = new Set<string>([
    'common_name',
    'location',
    'description',
])

const FIELD_LABELS: Record<
    ShelfFormField,
    string
> = {
    common_name: 'Name',
    location: 'Location',
    description: 'Description',
}

const SHELF_RENDER_BATCH_SIZE = 6

function mapShelfFieldErrors(
    fieldErrors: readonly ApiFieldError[],
): ShelfFormFieldErrors {
    const mapped: ShelfFormFieldErrors = {}

    for (const entry of fieldErrors) {
        const field = entry.field.split('.')[0]

        if (
            !field ||
            !SHELF_FORM_FIELDS.has(field) ||
            mapped[field as ShelfFormField]
        ) {
            continue
        }

        mapped[field as ShelfFormField] =
            entry.message
    }

    return mapped
}

function focusSummary(
    node: HTMLDivElement | null,
) {
    node?.focus()
}

function ShelfFields({
    values,
    onChange,
    fieldErrors,
    disabled,
    allowRename,
    idPrefix,
}: {
    values: ShelfFormValues
    onChange: (values: ShelfFormValues) => void
    fieldErrors: ShelfFormFieldErrors
    disabled: boolean
    allowRename: boolean
    idPrefix: string
}) {
    function handleChange(
        field: ShelfFormField,
    ) {
        return (
            event: ChangeEvent<
                HTMLInputElement | HTMLTextAreaElement
            >,
        ) => {
            onChange({
                ...values,
                [field]: event.target.value,
            })
        }
    }

    return (
        <>
            <Field
                id={`${idPrefix}-common-name`}
                label={FIELD_LABELS.common_name}
                error={fieldErrors.common_name}
                helpText={
                    allowRename
                        ? 'Stored lowercase; max 32 characters.'
                        : 'System shelves cannot be renamed.'
                }
            >
                <input
                    id={`${idPrefix}-common-name`}
                    name="common_name"
                    type="text"
                    value={values.common_name}
                    onChange={handleChange(
                        'common_name',
                    )}
                    disabled={
                        disabled || !allowRename
                    }
                    maxLength={32}
                    autoComplete="off"
                />
            </Field>

            <Field
                id={`${idPrefix}-location`}
                label={FIELD_LABELS.location}
                error={fieldErrors.location}
            >
                <input
                    id={`${idPrefix}-location`}
                    name="location"
                    type="text"
                    value={values.location}
                    onChange={handleChange(
                        'location',
                    )}
                    disabled={disabled}
                    autoComplete="off"
                />
            </Field>

            <Field
                id={`${idPrefix}-description`}
                label={FIELD_LABELS.description}
                error={fieldErrors.description}
            >
                <textarea
                    id={`${idPrefix}-description`}
                    name="description"
                    value={values.description}
                    onChange={handleChange(
                        'description',
                    )}
                    disabled={disabled}
                    rows={3}
                />
            </Field>
        </>
    )
}

function CreateShelfForm({
                             disabled,
                             onCreated,
                             onCancel,
                         }: {
    disabled: boolean
    onCreated: () => void
    onCancel: () => void
}) {
    const createShelf = useCreateShelf()
    const summaryRef =
        useRef<HTMLDivElement | null>(null)
    const formId = useId()

    const [
        values,
        setValues,
    ] = useState<ShelfFormValues>(
        emptyShelfFormValues,
    )

    const [
        fieldErrors,
        setFieldErrors,
    ] = useState<ShelfFormFieldErrors>({})

    const [
        formError,
        setFormError,
    ] = useState<string | null>(null)

    const isSubmitting =
        createShelf.isPending || disabled

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

        if (isSubmitting) {
            return
        }

        setFieldErrors({})
        setFormError(null)

        const clientErrors =
            validateShelfFormValues(values)

        if (Object.keys(clientErrors).length > 0) {
            setFieldErrors(clientErrors)
            setFormError(
                'Fix the highlighted fields and try again.',
            )
            return
        }

        let shelf

        try {
            shelf = formValuesToShelfCreate(values)
        } catch (error) {
            setFormError(
                error instanceof Error
                    ? error.message
                    : 'The shelf could not be created.',
            )
            return
        }

        createShelf.mutate(
            shelf,
            {
                onSuccess: () => {
                    setValues(emptyShelfFormValues)
                    setFieldErrors({})
                    setFormError(null)
                    onCreated()
                },
                onError: (error) => {
                    if (
                        isApiError(error) &&
                        error.fieldErrors.length > 0
                    ) {
                        setFieldErrors(
                            mapShelfFieldErrors(
                                error.fieldErrors,
                            ),
                        )
                        setFormError(error.message)
                        return
                    }

                    if (
                        isApiError(error) &&
                        (
                            error.status === 400 ||
                            error.status === 409
                        )
                    ) {
                        setFieldErrors({
                            common_name:
                                error.detail ??
                                error.message,
                        })
                        setFormError(
                            error.detail ??
                                error.message,
                        )
                        return
                    }

                    setFormError(
                        isApiError(error)
                            ? error.message
                            : error instanceof Error
                              ? error.message
                              : 'The shelf could not be created.',
                    )
                },
            },
        )
    }

    return (
        <form
            className="shelf-form"
            aria-labelledby={`${formId}-heading`}
            onSubmit={handleSubmit}
            noValidate
        >
            <h2
                id={`${formId}-heading`}
                className="shelf-form__heading"
            >
                Add shelf
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

            <ShelfFields
                values={values}
                onChange={setValues}
                fieldErrors={fieldErrors}
                disabled={isSubmitting}
                allowRename
                idPrefix={`${formId}-create`}
            />

            <div className="form-actions">
                <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                >
                    {createShelf.isPending
                        ? 'Adding…'
                        : 'Add Shelf'}
                </Button>

                <Button
                    type="button"
                    variant="secondary"
                    disabled={isSubmitting}
                    onClick={onCancel}
                >
                    Cancel
                </Button>
            </div>
        </form>
    )
}

function EditShelfForm({
    shelf,
    disabled,
    onCancel,
    onSaved,
    onStale,
}: {
    shelf: ShelfRead
    disabled: boolean
    onCancel: () => void
    onSaved: () => void
    onStale: (message: string) => void
}) {
    const updateShelf = useUpdateShelf()
    const summaryRef =
        useRef<HTMLDivElement | null>(null)
    const formId = useId()
    const allowRename = canRenameShelf(shelf)

    const [
        values,
        setValues,
    ] = useState<ShelfFormValues>(() =>
        shelfFormValuesFromShelf(shelf),
    )

    const [
        fieldErrors,
        setFieldErrors,
    ] = useState<ShelfFormFieldErrors>({})

    const [
        formError,
        setFormError,
    ] = useState<string | null>(null)

    const isSubmitting =
        updateShelf.isPending || disabled

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

        if (isSubmitting) {
            return
        }

        setFieldErrors({})
        setFormError(null)

        const clientErrors =
            validateShelfFormValues(values, {
                allowRename,
            })

        if (Object.keys(clientErrors).length > 0) {
            setFieldErrors(clientErrors)
            setFormError(
                'Fix the highlighted fields and try again.',
            )
            return
        }

        let patch

        try {
            patch = formValuesToShelfUpdate(
                values,
                shelf,
                {
                    allowRename,
                },
            )
        } catch (error) {
            setFormError(
                error instanceof Error
                    ? error.message
                    : 'The shelf could not be updated.',
            )
            return
        }

        if (!shelfUpdateHasChanges(patch)) {
            setFormError(
                'No changes to save.',
            )
            return
        }

        updateShelf.mutate(
            {
                shelfId: shelf.shelf_id,
                shelf: patch,
            },
            {
                onSuccess: () => {
                    onSaved()
                },
                onError: (error) => {
                    if (
                        isApiError(error) &&
                        error.fieldErrors.length > 0
                    ) {
                        setFieldErrors(
                            mapShelfFieldErrors(
                                error.fieldErrors,
                            ),
                        )
                        setFormError(error.message)
                        return
                    }

                    if (
                        isApiError(error) &&
                        (
                            error.status === 400 ||
                            error.status === 404 ||
                            error.status === 409
                        )
                    ) {
                        const message =
                            error.detail ??
                            error.message

                        if (error.status === 404) {
                            onStale(message)
                            return
                        }

                        if (allowRename) {
                            setFieldErrors({
                                common_name:
                                    message,
                            })
                        }

                        setFormError(message)
                        return
                    }

                    setFormError(
                        isApiError(error)
                            ? error.message
                            : error instanceof Error
                              ? error.message
                              : 'The shelf could not be updated.',
                    )
                },
            },
        )
    }

    return (
        <form
            className="shelf-form shelf-form--edit"
            aria-labelledby={`${formId}-heading`}
            onSubmit={handleSubmit}
            noValidate
        >
            <h3
                id={`${formId}-heading`}
                className="shelf-form__heading"
            >
                Edit{' '}
                {formatShelfCommonNameForDisplay(
                    shelf.common_name,
                )}
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

            <ShelfFields
                values={values}
                onChange={setValues}
                fieldErrors={fieldErrors}
                disabled={isSubmitting}
                allowRename={allowRename}
                idPrefix={`${formId}-edit`}
            />

            <div className="form-actions">
                <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                >
                    {updateShelf.isPending
                        ? 'Saving…'
                        : 'Save Shelf'}
                </Button>

                <Button
                    type="button"
                    variant="secondary"
                    disabled={isSubmitting}
                    onClick={onCancel}
                >
                    Cancel
                </Button>
            </div>
        </form>
    )
}

export function ShelvesPage() {
    const shelvesQuery = useShelves()
    const breakdownsQuery =
        useDashboardBreakdowns()
    const deleteShelf = useDeleteShelf()

    const [
        visibleShelfCount,
        setVisibleShelfCount,
    ] = useState(SHELF_RENDER_BATCH_SIZE)

    const [
        createShelfOpen,
        setCreateShelfOpen,
    ] = useState(false)

    const [
        editingShelfId,
        setEditingShelfId,
    ] = useState<string | null>(null)

    const [
        pendingDelete,
        setPendingDelete,
    ] = useState<ShelfRead | null>(null)

    const [
        actionError,
        setActionError,
    ] = useState<string | null>(null)

    const [
        actionNotice,
        setActionNotice,
    ] = useState<string | null>(null)

    const mutationBusy =
        deleteShelf.isPending

    const shelves = (
        shelvesQuery.data ?? []
    ).filter(
        (shelf) =>
            shelf.common_name !== 'removed',
    )

    const visibleShelves = shelves.slice(
        0,
        visibleShelfCount,
    )

    const hasMoreShelves =
        visibleShelves.length < shelves.length

    function exposeNextShelfBatch() {
        setVisibleShelfCount((currentCount) =>
            Math.min(
                currentCount +
                SHELF_RENDER_BATCH_SIZE,
                shelves.length,
            ),
        )
    }

    const {
        getRowRef,
    } = useInfiniteScrollTrigger({
        enabled:
            visibleShelves.length > 0 &&
            hasMoreShelves,
        hasNextPage: hasMoreShelves,
        isFetchingNextPage: false,
        fetchNextPage: exposeNextShelfBatch,
        itemCount: visibleShelves.length,
    })

    if (
        shelvesQuery.isPending ||
        breakdownsQuery.isPending
    ) {
        return (
            <section className="route-page shelves-page">
                <header>
                    <h1 tabIndex={-1}>
                        Shelves
                    </h1>
                </header>

                <LoadingState label="Loading shelves…" />
            </section>
        )
    }

    if (shelvesQuery.isError) {
        return (
            <section className="route-page shelves-page">
                <header>
                    <h1 tabIndex={-1}>
                        Shelves
                    </h1>
                </header>

                <QueryErrorState
                    error={shelvesQuery.error}
                    onRetry={() => {
                        void shelvesQuery.refetch()
                    }}
                    title="Unable to load shelves"
                />
            </section>
        )
    }

    if (breakdownsQuery.isLoadingError) {
        return (
            <section className="route-page shelves-page">
                <header>
                    <h1 tabIndex={-1}>
                        Shelves
                    </h1>
                </header>

                <QueryErrorState
                    title="Unable to load shelf counts"
                    error={breakdownsQuery.error}
                    onRetry={() => {
                        void breakdownsQuery.refetch()
                    }}
                />
            </section>
        )
    }

    const shelfCounts = new Map(
        breakdownsQuery.data.by_shelf.map(
            (bucket) => [
                bucket.key,
                bucket.count,
            ],
        ),
    )

    function handleDeleteRequest(
        shelf: ShelfRead,
    ) {
        if (
            mutationBusy ||
            !canDeleteShelf(shelf)
        ) {
            return
        }

        setActionError(null)
        setActionNotice(null)
        setPendingDelete(shelf)
    }

    function handleCancelDelete() {
        if (deleteShelf.isPending) {
            return
        }

        setPendingDelete(null)
    }

    function handleConfirmDelete() {
        if (
            pendingDelete === null ||
            deleteShelf.isPending
        ) {
            return
        }

        const shelf = pendingDelete

        deleteShelf.mutate(
            shelf.shelf_id,
            {
                onSuccess: () => {
                    setPendingDelete(null)
                    setEditingShelfId(null)
                    setActionNotice(
                        `${formatShelfCommonNameForDisplay(shelf.common_name)} was deleted.`,
                    )
                },
                onError: (error) => {
                    setPendingDelete(null)

                    if (
                        isApiError(error) &&
                        (
                            error.status === 400 ||
                            error.status === 404 ||
                            error.status === 409
                        )
                    ) {
                        setActionError(
                            error.detail ??
                                error.message,
                        )
                        void shelvesQuery.refetch()
                        return
                    }

                    setActionError(
                        error instanceof Error
                            ? error.message
                            : 'The shelf could not be deleted.',
                    )

                    void shelvesQuery.refetch()
                },
            },
        )
    }

    return (
        <section className="route-page shelves-page">
            <header className="shelves-page__heading">
                <h1 tabIndex={-1}>
                    Shelves
                </h1>
                <p>
                    Manage the shelf catalog used
                    when placing books. The Unknown
                    shelf is reserved for books
                    without an assigned shelf and
                    cannot be renamed or deleted.
                </p>
            </header>

            {actionError ? (
                <Alert
                    variant="error"
                    title="Unable to update shelves"
                >
                    {actionError}
                </Alert>
            ) : null}

            {actionNotice ? (
                <Alert
                    variant="success"
                    title="Shelf updated"
                >
                    {actionNotice}
                </Alert>
            ) : null}

            {shelves.length === 0 ? (
                <EmptyState title="No shelves yet">
                    The API returned an empty shelf
                    catalog.
                </EmptyState>
            ) : (
                <div
                    className="shelves-showcases"
                    aria-label="Shelves"
                >
                    {visibleShelves.map(
                        (shelf, index) => {
                        const isSystem =
                            isSystemShelfCommonName(
                                shelf.common_name,
                            )

                        const isEditing =
                            editingShelfId ===
                            shelf.shelf_id

                        const bookCount =
                            shelfCounts.get(
                                shelf.common_name,
                            ) ?? 0

                        return (
                            <div
                                key={shelf.shelf_id}
                                ref={getRowRef(index)}
                                className="shelves-showcases__item"
                            >
                                {isEditing ? (
                                    <section className="shelf-showcase shelf-showcase--editing">
                                        <EditShelfForm
                                            shelf={shelf}
                                            disabled={mutationBusy}
                                            onCancel={() => {
                                                setEditingShelfId(
                                                    null,
                                                )
                                            }}
                                            onSaved={() => {
                                                setEditingShelfId(
                                                    null,
                                                )
                                                setActionError(
                                                    null,
                                                )
                                                setActionNotice(
                                                    'Shelf saved.',
                                                )
                                            }}
                                            onStale={(
                                                message,
                                            ) => {
                                                setEditingShelfId(
                                                    null,
                                                )
                                                setActionNotice(
                                                    null,
                                                )
                                                setActionError(
                                                    message,
                                                )
                                                void shelvesQuery.refetch()
                                            }}
                                        />
                                    </section>
                                ) : (
                                    <ShelfShowcase
                                        shelf={shelf}
                                        bookCount={bookCount}
                                        isSystem={isSystem}
                                        mutationBusy={
                                            mutationBusy
                                        }
                                        canDelete={
                                            canDeleteShelf(
                                                shelf,
                                            )
                                        }
                                        onEdit={() => {
                                            setActionError(
                                                null,
                                            )
                                            setActionNotice(
                                                null,
                                            )
                                            setEditingShelfId(
                                                shelf.shelf_id,
                                            )
                                        }}
                                        onDelete={() => {
                                            handleDeleteRequest(
                                                shelf,
                                            )
                                        }}
                                    />
                                )}
                            </div>
                        )
                    },
                    )}
                </div>
            )}

            <button
                type="button"
                className="page-add-tab"
                aria-label="Add shelf"
                onClick={() => {
                    setActionError(null)
                    setActionNotice(null)
                    setCreateShelfOpen(true)
                }}
            >
    <span
        className="page-add-tab__plus"
        aria-hidden="true"
    >
        +
    </span>

                <span className="page-add-tab__label">
        Shelf
    </span>
            </button>

            <ModalDialog
                open={createShelfOpen}
                title="Add shelf"
                onClose={() => {
                    setCreateShelfOpen(false)
                }}
            >
                <CreateShelfForm
                    disabled={mutationBusy}
                    onCancel={() => {
                        setCreateShelfOpen(false)
                    }}
                    onCreated={() => {
                        setCreateShelfOpen(false)
                        setActionError(null)
                        setActionNotice(
                            'Shelf added.',
                        )
                    }}
                />
            </ModalDialog>

            <ConfirmationDialog
                open={pendingDelete !== null}
                title="Delete shelf?"
                confirmLabel={
                    deleteShelf.isPending
                        ? 'Deleting…'
                        : 'Delete Shelf'
                }
                cancelLabel="Cancel"
                confirmVariant="danger"
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
            >
                {pendingDelete ? (
                    <p>
                        Delete{' '}
                        <strong>
                            {formatShelfCommonNameForDisplay(
                                pendingDelete.common_name,
                            )}
                        </strong>
                        ? Only empty shelves can be
                        deleted. Books on this shelf
                        are not moved.
                    </p>
                ) : (
                    <p>
                        Delete this shelf?
                    </p>
                )}
            </ConfirmationDialog>
        </section>
    )
}
