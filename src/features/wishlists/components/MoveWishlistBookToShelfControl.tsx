import {
    useEffect,
    useId,
    useRef,
    useState,
    type FormEvent,
} from 'react'
import {
    useNavigate,
} from 'react-router-dom'
import {
    useQueryClient,
} from '@tanstack/react-query'

import {
    Alert,
    Button,
    ConfirmationDialog,
    Field,
    LoadingState,
    QueryErrorState,
} from '../../../components'
import {
    isApiError,
} from '../../../api/apiErrors'
import {
    queryKeys,
} from '../../../api/queryKeys'
import {
    useShelves,
} from '../../../api/shelvesQueries'
import {
    MoveWishlistBookToShelfError,
    useMoveWishlistBookToShelf,
} from '../../../api/wishlistsQueries'
import {
    filterAssignableShelves,
    formatShelfCommonNameForDisplay,
} from '../../shelves/shelfDisplay'
import {
    emptyMoveWishlistBookFormValues,
    shelfIdToShelfNameUpdate,
    validateMoveWishlistBookFormValues,
    type MoveWishlistBookFormValues,
} from '../moveWishlistBookModel'

export interface MoveWishlistBookToShelfControlProps {
    wishlistId: string
    wishlistItemId: string
    bookId: string
    bookTitle: string
    disabled?: boolean
}

export function MoveWishlistBookToShelfControl({
                                                   wishlistId,
                                                   wishlistItemId,
                                                   bookId,
                                                   bookTitle,
                                                   disabled = false,
                                               }: MoveWishlistBookToShelfControlProps) {
    const formId = useId()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const shelvesQuery = useShelves()
    const moveBook = useMoveWishlistBookToShelf()

    const summaryRef =
        useRef<HTMLDivElement | null>(null)

    const [
        values,
        setValues,
    ] = useState<MoveWishlistBookFormValues>(
        emptyMoveWishlistBookFormValues,
    )

    const [
        shelfError,
        setShelfError,
    ] = useState<string | null>(null)

    const [
        formError,
        setFormError,
    ] = useState<string | null>(null)

    const [
        confirmOpen,
        setConfirmOpen,
    ] = useState(false)

    const [
        membershipRemoved,
        setMembershipRemoved,
    ] = useState(false)

    const shelves = shelvesQuery.data ?? []

    const assignableShelves =
        filterAssignableShelves(shelves)

    const selectedShelf =
        assignableShelves.find(
            (shelf) =>
                shelf.shelf_id === values.shelfId,
        )

    useEffect(() => {
        if (
            shelfError !== null ||
            formError !== null
        ) {
            summaryRef.current?.focus()
        }
    }, [
        shelfError,
        formError,
    ])

    function updateShelf(shelfId: string) {
        setValues({
            shelfId,
        })
        setShelfError(null)
        setFormError(null)
    }

    function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault()

        setShelfError(null)
        setFormError(null)

        const errors =
            validateMoveWishlistBookFormValues(
                values,
            )

        if (errors.shelfId) {
            setShelfError(errors.shelfId)
            return
        }

        try {
            shelfIdToShelfNameUpdate(
                values.shelfId,
                shelves,
            )
        } catch (error) {
            setShelfError(
                error instanceof Error
                    ? error.message
                    : 'Choose a valid shelf.',
            )
            return
        }

        setConfirmOpen(true)
    }

    async function refreshStaleState() {
        await Promise.all([
            queryClient.invalidateQueries({
                queryKey:
                    queryKeys.wishlists.books(
                        wishlistId,
                    ),
            }),
            queryClient.invalidateQueries({
                queryKey:
                    queryKeys.books.detail(
                        bookId,
                    ),
            }),
        ])
    }

    function handleConfirm() {
        setConfirmOpen(false)
        setShelfError(null)
        setFormError(null)

        let update

        try {
            update =
                shelfIdToShelfNameUpdate(
                    values.shelfId,
                    shelves,
                )
        } catch (error) {
            setShelfError(
                error instanceof Error
                    ? error.message
                    : 'Choose a valid shelf.',
            )
            return
        }

        moveBook.mutate(
            {
                wishlistId,
                wishlistItemId,
                bookId,
                shelfName: update.shelf_name,
                membershipRemoved,
            },
            {
                onSuccess: () => {
                    navigate(
                        `/books/${encodeURIComponent(bookId)}`,
                    )
                },

                onError: (error) => {
                    const moveError =
                        error instanceof
                        MoveWishlistBookToShelfError
                            ? error
                            : null

                    if (
                        moveError?.membershipRemoved
                    ) {
                        setMembershipRemoved(true)
                    }

                    const cause =
                        moveError?.cause ?? error

                    if (isApiError(cause)) {
                        if (
                            cause.status === 412
                        ) {
                            setFormError(
                                'The shelf assignment could not be completed because the book is still recorded on a wishlist. The latest wishlist and book details are being refreshed.',
                            )

                            void refreshStaleState()
                            return
                        }

                        if (
                            cause.status === 404
                        ) {
                            setFormError(
                                moveError?.membershipRemoved
                                    ? 'The wishlist membership was removed, but the book could not be found while assigning its shelf. The latest data is being refreshed.'
                                    : 'The wishlist membership or book could not be found. The latest data is being refreshed.',
                            )

                            void refreshStaleState()
                            return
                        }

                        const shelfFieldError =
                            cause.fieldErrors.find(
                                (entry) =>
                                    entry.field
                                        .split('.')
                                        .at(-1) ===
                                    'shelf_name',
                            )

                        if (
                            shelfFieldError !==
                            undefined
                        ) {
                            setShelfError(
                                shelfFieldError.message,
                            )
                            return
                        }

                        if (
                            cause.status === 400 ||
                            cause.status === 422
                        ) {
                            setShelfError(
                                cause.detail ??
                                cause.message,
                            )
                            return
                        }
                    }

                    if (
                        moveError?.membershipRemoved
                    ) {
                        setFormError(
                            'The book was removed from the wishlist, but its shelf could not be assigned. Choose a shelf and try again; the wishlist membership will not be deleted again.',
                        )
                        return
                    }

                    setFormError(
                        cause instanceof Error
                            ? cause.message
                            : 'The book could not be moved to the collection.',
                    )
                },
            },
        )
    }

    if (shelvesQuery.isLoading) {
        return (
            <div className="wishlist-membership__move">
                <LoadingState>
                    Loading shelves…
                </LoadingState>
            </div>
        )
    }

    if (shelvesQuery.isError) {
        return (
            <div className="wishlist-membership__move">
                <QueryErrorState
                    title="Unable to load shelves"
                    error={shelvesQuery.error}
                    onRetry={() => {
                        void shelvesQuery.refetch()
                    }}
                />
            </div>
        )
    }

    const isDisabled =
        disabled || moveBook.isPending

    return (
        <div className="wishlist-membership__move">
            <form
                id={formId}
                onSubmit={handleSubmit}
            >
                {formError || shelfError ? (
                    <div
                        ref={summaryRef}
                        tabIndex={-1}
                    >
                        {formError ? (
                            <Alert
                                variant="error"
                                title="Unable to add book to collection"
                            >
                                {formError}
                            </Alert>
                        ) : null}
                    </div>
                ) : null}

                <Field
                    label={`Shelf for ${bookTitle}`}
                    error={shelfError}
                >
                    <select
                        value={values.shelfId}
                        disabled={isDisabled}
                        onChange={(event) => {
                            updateShelf(
                                event.target.value,
                            )
                        }}
                    >
                        <option value="">
                            Choose a shelf
                        </option>

                        {assignableShelves.map(
                            (shelf) => (
                                <option
                                    key={
                                        shelf.shelf_id
                                    }
                                    value={
                                        shelf.shelf_id
                                    }
                                >
                                    {formatShelfCommonNameForDisplay(
                                        shelf.common_name,
                                    )}
                                </option>
                            ),
                        )}
                    </select>
                </Field>

                <Button
                    type="submit"
                    variant="primary"
                    disabled={isDisabled}
                >
                    {moveBook.isPending
                        ? 'Adding…'
                        : membershipRemoved
                            ? 'Finish Adding to Collection'
                            : 'Add to Collection'}
                </Button>
            </form>

            <ConfirmationDialog
                open={confirmOpen}
                title="Add book to collection?"
                confirmLabel="Add to Collection"
                confirmVariant="primary"
                onCancel={() => {
                    setConfirmOpen(false)
                }}
                onConfirm={handleConfirm}
            >
                <p>
                    Move <strong>{bookTitle}</strong>{' '}
                    to{' '}
                    <strong>
                        {selectedShelf
                            ? formatShelfCommonNameForDisplay(
                                selectedShelf.common_name,
                            )
                            : 'the selected shelf'}
                    </strong>
                    ?
                </p>

                <p>
                    This removes the book from its
                    wishlist and places it in the
                    collection.
                </p>
            </ConfirmationDialog>
        </div>
    )
}
