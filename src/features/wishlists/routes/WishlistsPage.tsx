import {
    useEffect,
    useId,
    useRef,
    useState,
    type FormEvent,
} from 'react'

import {
    Alert,
    AppLink,
    Button,
    ConfirmationDialog,
    EmptyState,
    Field,
    LoadingState,
    ModalDialog,
    QueryErrorState,
} from '../../../components'
import {
    useInfiniteScrollTrigger,
} from '../../../hooks/useInfiniteScrollTrigger'
import {
    isApiError,
    type ApiFieldError,
} from '../../../api/apiErrors'
import type {
    WishlistBookRead,
    WishlistRead,
} from '../../../api/apiTypes'
import {
    formatBookAuthors,
} from '../../books/authorDisplay'
import {
    useCreateWishlist,
    useDeleteWishlist,
    useInfiniteWishlistBooks,
    useRemoveWishlistBook,
    useUpdateWishlist,
    useUpdateWishlistBook,
    useWishlists,
} from '../../../api/wishlistsQueries'
import {
    MoveWishlistBookControl,
} from '../components/MoveWishlistBookControl'
import {
    AddWishlistBookControl,
} from '../components/AddWishlistBookControl'
import {
    MoveWishlistBookToShelfControl,
} from '../components/MoveWishlistBookToShelfControl'
import {
    displayWishlistBookStatus,
    displayWishlistPriority,
    safeHttpUrl,
} from '../wishlistDisplay'
import {
    emptyWishlistCreateFormValues,
    formValuesToWishlistCreate,
    validateWishlistCreateFormValues,
    type WishlistCreateField,
    type WishlistCreateFieldErrors,
    type WishlistCreateFormValues,
} from '../wishlistFormModel'
import { MembershipNotesEditor } from '../../shared/MembershipNotesEditor'
import { WishlistAlbums } from '../components/WishlistAlbums'

const CREATE_FIELDS = new Set<string>([
    'name',
    'description',
])

function mapCreateFieldErrors(
    fieldErrors: readonly ApiFieldError[],
): WishlistCreateFieldErrors {
    const mapped: WishlistCreateFieldErrors = {}

    for (const entry of fieldErrors) {
        const field = entry.field.split('.')[0]

        if (
            !field ||
            !CREATE_FIELDS.has(field) ||
            mapped[field as WishlistCreateField]
        ) {
            continue
        }

        mapped[field as WishlistCreateField] =
            entry.message
    }

    return mapped
}

function focusSummary(
    node: HTMLDivElement | null,
) {
    node?.focus()
}

function WishlistMembershipRow({
                                   membership,
                                   rowRef,
                               }: {
    membership: WishlistBookRead
    rowRef?: (
        node: HTMLLIElement | null,
    ) => void
}) {
    const removeMembership = useRemoveWishlistBook()
    const updateMembership = useUpdateWishlistBook()
    const [confirmRemove, setConfirmRemove] = useState(false)
    const [removeError, setRemoveError] = useState<string | null>(null)
    const {
        wishlist_item_id: membershipId,
        wishlist_id: wishlistId,
        book_id: bookId,
        book_title: title,
        book_authors: authors = [],
        status,
        priority,
        notes,
        url,
    } = membership

    if (bookId === null || membership.album_id !== null) return null

    const href = `/books/${encodeURIComponent(bookId)}`
    const safeUrl = safeHttpUrl(url)

    return (
        <li
            ref={rowRef}
            className="wishlist-membership"
            data-membership-id={membershipId}
        >
            <div>
                <strong>
                    <AppLink to={href}>
                        {title}
                    </AppLink>
                </strong>

                {authors.length > 0 ? (
                    <p>
                        {formatBookAuthors(authors)}
                    </p>
                ) : null}
            </div>

            <dl>
                <div>
                    <dt>Status</dt>
                    <dd>
                        {displayWishlistBookStatus(
                            status,
                        )}
                    </dd>
                </div>

                <div>
                    <dt>Priority</dt>
                    <dd>
                        {displayWishlistPriority(
                            priority,
                        )}
                    </dd>
                </div>

                {notes ? (
                    <div>
                        <dt>Notes</dt>
                        <dd>{notes}</dd>
                    </div>
                ) : null}

                {safeUrl ? (
                    <div>
                        <dt>URL</dt>
                        <dd>
                            <a
                                href={safeUrl}
                                rel="noreferrer"
                                target="_blank"
                            >
                                {safeUrl}
                            </a>
                        </dd>
                    </div>
                ) : null}
            </dl>

            <MoveWishlistBookControl
                sourceWishlistId={wishlistId}
                membership={membership}
                bookTitle={title}
            />

            <MembershipNotesEditor
                label="Wishlist description"
                notes={notes}
                onSave={(nextNotes) => updateMembership.mutateAsync({
                    wishlistId,
                    wishlistItemId: membershipId,
                    update: { notes: nextNotes },
                })}
            />

            <MoveWishlistBookToShelfControl
                wishlistId={wishlistId}
                wishlistItemId={membershipId}
                bookId={bookId}
                bookTitle={title}
            />

            {removeError ? <Alert variant="error">{removeError}</Alert> : null}

            <Button
                type="button"
                variant="danger"
                disabled={removeMembership.isPending}
                onClick={() => setConfirmRemove(true)}
            >
                Remove from Wishlist
            </Button>

            <ConfirmationDialog
                open={confirmRemove}
                title="Remove from wishlist?"
                confirmLabel={removeMembership.isPending ? 'Removing…' : 'Remove from Wishlist'}
                cancelLabel="Cancel"
                confirmVariant="danger"
                onConfirm={() => {
                    if (removeMembership.isPending) return
                    setRemoveError(null)
                    removeMembership.mutate(
                        { wishlistId, wishlistItemId: membershipId },
                        {
                            onSuccess: () => setConfirmRemove(false),
                            onError: (error) => {
                                setConfirmRemove(false)
                                setRemoveError(
                                    isApiError(error)
                                        ? error.detail ?? error.message
                                        : error instanceof Error
                                            ? error.message
                                            : 'The book could not be removed from the wishlist.',
                                )
                            },
                        },
                    )
                }}
                onCancel={() => {
                    if (!removeMembership.isPending) setConfirmRemove(false)
                }}
            >
                Remove <strong>{title}</strong> from this wishlist without adding it to the owned collection?
            </ConfirmationDialog>

        </li>
    )
}

function WishlistSection({
                             wishlist,
                             expanded,
                             onToggle,
                             onDelete,
                             deletePending,
                         }: {
    wishlist: WishlistRead
    expanded: boolean
    onToggle: () => void
    onDelete: (wishlist: WishlistRead) => void
    deletePending: boolean
}) {
    const updateWishlist = useUpdateWishlist()
    const [editing, setEditing] = useState(false)
    const [description, setDescription] = useState(wishlist.description ?? '')
    const [editError, setEditError] = useState<string | null>(null)
    const membershipsQuery =
        useInfiniteWishlistBooks(
            wishlist.wishlist_id,
            {
                enabled: expanded,
            },
        )

    const pages =
        membershipsQuery.data?.pages ?? []

    const items =
        pages.flatMap(
            (page) => page.items,
        )

    const total =
        pages[0]?.total ?? 0

    const fetchNextMembershipsPage =
        membershipsQuery.fetchNextPage

    const {
        getRowRef,
    } = useInfiniteScrollTrigger({
        enabled:
            expanded &&
            membershipsQuery.isSuccess,
        hasNextPage:
        membershipsQuery.hasNextPage,
        isFetchingNextPage:
        membershipsQuery.isFetchingNextPage,
        fetchNextPage: () => {
            void fetchNextMembershipsPage()
        },
        itemCount: items.length,
    })

    return (
        <article className="wishlist-card">
            <header className="wishlist-card__header">
                <h2>{wishlist.name}</h2>
                <div className="wishlist-card__summary">
                    {wishlist.description ? (
                        <p>{wishlist.description}</p>
                    ) : null}

                    {expanded &&
                    membershipsQuery.isSuccess ? (
                        <p>
                            {total === 1
                                ? '1 book'
                                : `${total} books`}
                        </p>
                    ) : null}
                </div>

                <div className="wishlist-card__actions">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                            setDescription(wishlist.description ?? '')
                            setEditError(null)
                            setEditing(true)
                        }}
                    >
                        Edit Wishlist
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onToggle}
                    >
                        {expanded
                            ? 'Collapse'
                            : 'Expand'}
                    </Button>

                    <Button
                        type="button"
                        variant="danger"
                        disabled={deletePending}
                        onClick={() => {
                            onDelete(wishlist)
                        }}
                    >
                        Delete Wishlist
                    </Button>
                </div>
            </header>

            {editing ? (
                <form
                    className="wishlist-form"
                    onSubmit={(event) => {
                        event.preventDefault()
                        if (updateWishlist.isPending) return
                        setEditError(null)
                        const trimmed = description.trim()
                        updateWishlist.mutate(
                            {
                                wishlistId: wishlist.wishlist_id,
                                wishlist: { description: trimmed === '' ? null : trimmed },
                            },
                            {
                                onSuccess: () => setEditing(false),
                                onError: (error) => setEditError(
                                    isApiError(error)
                                        ? error.detail ?? error.message
                                        : error instanceof Error
                                            ? error.message
                                            : 'The wishlist could not be updated.',
                                ),
                            },
                        )
                    }}
                >
                    {editError ? <Alert variant="error">{editError}</Alert> : null}
                    <Field label="Description">
                        <textarea
                            value={description}
                            rows={3}
                            disabled={updateWishlist.isPending}
                            onChange={(event) => setDescription(event.target.value)}
                        />
                    </Field>
                    <div className="wishlist-card__actions">
                        <Button type="submit" variant="primary" disabled={updateWishlist.isPending}>
                            {updateWishlist.isPending ? 'Saving…' : 'Save Wishlist'}
                        </Button>
                        <Button type="button" variant="secondary" disabled={updateWishlist.isPending} onClick={() => setEditing(false)}>
                            Cancel
                        </Button>
                    </div>
                </form>
            ) : null}

            {!expanded ? null : (
                <>
                    <WishlistAlbums wishlistId={wishlist.wishlist_id} enabled={expanded} />
                    {membershipsQuery.isPending ? (
                        <LoadingState
                            label={`Loading ${wishlist.name}…`}
                        />
                    ) : null}

                    {membershipsQuery.isLoadingError ? (
                        <QueryErrorState
                            title={`Unable to load ${wishlist.name}`}
                            error={
                                membershipsQuery.error
                            }
                            onRetry={() => {
                                void membershipsQuery.refetch()
                            }}
                        />
                    ) : null}

                    {membershipsQuery.isSuccess &&
                    total === 0 ? (
                        <p>
                            No books have been added to this
                            wishlist yet.
                        </p>
                    ) : null}

                    {membershipsQuery.isSuccess &&
                    items.length > 0 ? (
                        <ul
                            className="wishlist-memberships"
                            aria-label={`${wishlist.name} books`}
                        >
                            {items.map(
                                (
                                    membership,
                                    index,
                                ) => (
                                    <WishlistMembershipRow
                                        key={
                                            membership.wishlist_item_id
                                        }
                                        membership={
                                            membership
                                        }
                                        rowRef={
                                            getRowRef(
                                                index,
                                            )
                                        }
                                    />
                                ),
                            )}
                        </ul>
                    ) : null}

                    {membershipsQuery.isFetchingNextPage ? (
                        <div className="infinite-scroll__footer">
                            <LoadingState
                                label={`Loading more ${wishlist.name} books…`}
                            />
                        </div>
                    ) : null}

                    {membershipsQuery.isFetchNextPageError ? (
                        <div className="infinite-scroll__footer">
                            <Alert variant="error">
                                Unable to load more books.
                            </Alert>

                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                    void fetchNextMembershipsPage()
                                }}
                            >
                                Retry
                            </Button>
                        </div>
                    ) : null}
                </>
            )}
        </article>
    )
}

function CreateWishlistForm() {
    const createWishlist = useCreateWishlist()
    const formId = useId()
    const summaryRef = useRef<HTMLDivElement | null>(
        null,
    )

    const [
        values,
        setValues,
    ] = useState<WishlistCreateFormValues>(
        emptyWishlistCreateFormValues,
    )

    const [
        fieldErrors,
        setFieldErrors,
    ] = useState<WishlistCreateFieldErrors>({})

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

        if (createWishlist.isPending) {
            return
        }

        setFieldErrors({})
        setFormError(null)

        const clientErrors =
            validateWishlistCreateFormValues(values)

        if (Object.keys(clientErrors).length > 0) {
            setFieldErrors(clientErrors)
            setFormError(
                'Fix the highlighted fields and try again.',
            )
            return
        }

        createWishlist.mutate(
            formValuesToWishlistCreate(values),
            {
                onSuccess: () => {
                    setValues(
                        emptyWishlistCreateFormValues,
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
                                : 'The wishlist could not be created.',
                    )
                },
            },
        )
    }

    return (
        <form
            id="create-wishlist"
            className="wishlist-form"
            aria-labelledby={`${formId}-heading`}
            onSubmit={handleSubmit}
            noValidate
        >
            <h2 id={`${formId}-heading`}>
                Create a wishlist
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
                    disabled={createWishlist.isPending}
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
                    disabled={createWishlist.isPending}
                    rows={3}
                />
            </Field>

            <Button
                type="submit"
                variant="primary"
                disabled={createWishlist.isPending}
            >
                {createWishlist.isPending
                    ? 'Creating…'
                    : 'Create Wishlist'}
            </Button>
        </form>
    )
}

export function WishlistsPage() {
    const wishlistsQuery = useWishlists()
    const deleteWishlist = useDeleteWishlist()

    const [
        pendingDelete,
        setPendingDelete,
    ] = useState<WishlistRead | null>(null)

    const [
        deleteError,
        setDeleteError,
    ] = useState<string | null>(null)

    const [
        wishlistActionsOpen,
        setWishlistActionsOpen,
    ] = useState(false)

    const [
        activeWishlistId,
        setActiveWishlistId,
    ] = useState<string | null>(null)

    function handleConfirmDelete() {
        if (
            pendingDelete === null ||
            deleteWishlist.isPending
        ) {
            return
        }

        setDeleteError(null)

        deleteWishlist.mutate(
            pendingDelete.wishlist_id,
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
                                : 'The wishlist could not be deleted.',
                    )
                },
            },
        )
    }

    if (wishlistsQuery.isPending) {
        return (
            <section className="route-page wishlists-page">
                <h1 tabIndex={-1}>
                    Wishlists
                </h1>

                <LoadingState label="Loading wishlists…" />
            </section>
        )
    }

    if (wishlistsQuery.isError) {
        return (
            <section className="route-page wishlists-page">
                <h1 tabIndex={-1}>
                    Wishlists
                </h1>

                <QueryErrorState
                    title="Unable to load wishlists"
                    error={wishlistsQuery.error}
                    onRetry={() => {
                        void wishlistsQuery.refetch()
                    }}
                />
            </section>
        )
    }

    const wishlists =
        wishlistsQuery.data?.items ?? []

    return (
        <section className="route-page wishlists-page">
            <header className="wishlists-page__heading">
                <h1 tabIndex={-1}>
                    Wishlists
                </h1>

                <p>
                    Keep track of books and albums you want to add
                    to the library. An item cannot be
                    on a shelf and a wishlist at the
                    same time.
                </p>
            </header>


            {deleteError ? (
                <Alert variant="error">
                    {deleteError}
                </Alert>
            ) : null}

            {wishlists.length === 0 ? (
                <EmptyState title="No wishlists yet">
                    Create your first wishlist to start
                    collecting books you want.
                </EmptyState>
            ) : (
                <ul
                    className="wishlists-list"
                    aria-label="Wishlists"
                >
                    {wishlists.map((wishlist) => (
                        <li
                            key={wishlist.wishlist_id}
                            className="wishlists-list__item"
                        >
                            <WishlistSection
                                wishlist={wishlist}
                                expanded={
                                    activeWishlistId ===
                                    wishlist.wishlist_id
                                }
                                onToggle={() => {
                                    setActiveWishlistId(
                                        (current) =>
                                            current ===
                                            wishlist.wishlist_id
                                                ? null
                                                : wishlist.wishlist_id,
                                    )
                                }}
                                onDelete={
                                    setPendingDelete
                                }
                                deletePending={
                                    deleteWishlist.isPending
                                }
                            />
                        </li>
                    ))}
                </ul>
            )}

            <button
                type="button"
                className="page-add-tab"
                aria-label="Manage wishlists"
                onClick={() => {
                    setWishlistActionsOpen(true)
                }}
            >
    <span
        className="page-add-tab__plus"
        aria-hidden="true"
    >
        +
    </span>

                <span className="page-add-tab__label">
        Wishlist
    </span>
            </button>

            <ModalDialog
                open={wishlistActionsOpen}
                title="Wishlist actions"
                onClose={() => {
                    setWishlistActionsOpen(false)
                }}
            >
                <div className="wishlists-page__workbench wishlists-page__workbench--dialog">
                    <CreateWishlistForm />

                    <AddWishlistBookControl />
                </div>
            </ModalDialog>

            <ConfirmationDialog
                open={pendingDelete !== null}
                title="Delete wishlist?"
                confirmLabel={
                    deleteWishlist.isPending
                        ? 'Deleting…'
                        : 'Delete Wishlist'
                }
                cancelLabel="Cancel"
                confirmVariant="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => {
                    if (deleteWishlist.isPending) {
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
                        ? Memberships on this wishlist
                        are removed permanently, but
                        catalog books remain. Individual
                        books can be moved to a shelf
                        without deleting the wishlist.
                    </p>
                ) : (
                    <p>
                        Delete this wishlist?
                    </p>
                )}
            </ConfirmationDialog>
        </section>
    )
}
