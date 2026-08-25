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
    isApiError,
    type ApiFieldError,
} from '../../../api/apiErrors'
import type {
    WishlistRead,
} from '../../../api/apiTypes'
import {
    useBook,
} from '../../../api/booksQueries'
import {
    useCreateWishlist,
    useDeleteWishlist,
    useWishlistBooks,
    useWishlists,
} from '../../../api/wishlistsQueries'
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
                                   wishlistId,
                                   bookId,
                                   status,
                                   priority,
                                   notes,
                                   url,
                                   membershipId,
                               }: {
    wishlistId: string
    bookId: string
    status: string
    priority: number | null
    notes: string | null | undefined
    url: string | null | undefined
    membershipId: string
}) {
    const bookQuery = useBook(bookId)
    const book = bookQuery.data
    const title = book?.title ?? `Book ${bookId}`
    const href = `/books/${encodeURIComponent(bookId)}`
    const safeUrl = safeHttpUrl(url)

    return (
        <li
            className="wishlist-membership"
            data-membership-id={membershipId}
        >
            <div>
                <strong>
                    <AppLink to={href}>
                        {title}
                    </AppLink>
                </strong>

                {book?.authors ? (
                    <p>{book.authors}</p>
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

            <MoveWishlistBookToShelfControl
                wishlistId={wishlistId}
                wishlistBookId={membershipId}
                bookId={bookId}
                bookTitle={title}
            />

        </li>
    )
}

function WishlistSection({
    wishlist,
    onDelete,
    deletePending,
}: {
    wishlist: WishlistRead
    onDelete: (wishlist: WishlistRead) => void
    deletePending: boolean
}) {
    const membershipsQuery = useWishlistBooks(
        wishlist.wishlist_id,
    )
    const total = membershipsQuery.data?.total
    const items = membershipsQuery.data?.items ?? []

    return (
        <article className="wishlist-card">
            <header className="wishlist-card__header">
                <div>
                    <h2>{wishlist.name}</h2>

                    {wishlist.description ? (
                        <p>{wishlist.description}</p>
                    ) : null}

                    {membershipsQuery.isSuccess ? (
                        <p>
                            {total === 1
                                ? '1 book'
                                : `${total ?? 0} books`}
                        </p>
                    ) : null}
                </div>

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
            </header>

            {membershipsQuery.isPending ? (
                <LoadingState
                    label={`Loading ${wishlist.name}…`}
                />
            ) : null}

            {membershipsQuery.isError ? (
                <QueryErrorState
                    title={`Unable to load ${wishlist.name}`}
                    error={membershipsQuery.error}
                    onRetry={() => {
                        void membershipsQuery.refetch()
                    }}
                />
            ) : null}

            {membershipsQuery.isSuccess &&
            items.length === 0 ? (
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
                    {items.map((membership) => (
                        <WishlistMembershipRow
                            key={
                                membership.wishlist_book_id
                            }
                            wishlistId={
                                wishlist.wishlist_id
                            }
                            membershipId={
                                membership.wishlist_book_id
                            }
                            bookId={membership.book_id}
                            status={membership.status}
                            priority={
                                membership.priority ??
                                null
                            }
                            notes={membership.notes}
                            url={membership.url}
                        />
                    ))}
                </ul>
            ) : null}
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
                    Keep track of books you want to add
                    to the collection. A book cannot be
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
