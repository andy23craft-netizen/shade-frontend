import {
    useEffect,
    useId,
    useRef,
    useState,
    type FormEvent,
} from 'react'

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
    MoveWishlistBookError,
    useMoveWishlistBook,
    useWishlists,
} from '../../../api/wishlistsQueries'
import type {
    WishlistBookRead,
} from '../../../api/apiTypes'
import {
    emptyMoveWishlistBookFormValues,
    membershipToWishlistBookCreate,
    validateMoveWishlistBookFormValues,
    type MoveWishlistBookFormValues,
} from './moveWishlistBookModel'

export interface MoveWishlistBookControlProps {
    sourceWishlistId: string
    membership: WishlistBookRead
    bookTitle: string
    disabled?: boolean
}

export function MoveWishlistBookControl({
                                            sourceWishlistId,
                                            membership,
                                            bookTitle,
                                            disabled = false,
                                        }: MoveWishlistBookControlProps) {
    const formId = useId()
    const summaryRef =
        useRef<HTMLDivElement | null>(null)

    const wishlistsQuery = useWishlists()
    const moveBook = useMoveWishlistBook()

    const [
        values,
        setValues,
    ] = useState<MoveWishlistBookFormValues>(
        emptyMoveWishlistBookFormValues,
    )

    const [
        destinationError,
        setDestinationError,
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
        destinationMembershipCreated,
        setDestinationMembershipCreated,
    ] = useState(false)

    const wishlists =
        wishlistsQuery.data?.items ?? []

    const destinations =
        wishlists.filter(
            (wishlist) =>
                wishlist.wishlist_id !==
                sourceWishlistId,
        )

    const selectedWishlist =
        destinations.find(
            (wishlist) =>
                wishlist.wishlist_id ===
                values.destinationWishlistId,
        )

    useEffect(() => {
        if (
            destinationError !== null ||
            formError !== null
        ) {
            summaryRef.current?.focus()
        }
    }, [
        destinationError,
        formError,
    ])

    function updateDestination(
        destinationWishlistId: string,
    ) {
        setValues({
            destinationWishlistId,
        })

        setDestinationError(null)
        setFormError(null)
        setDestinationMembershipCreated(false)
    }

    function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault()

        setDestinationError(null)
        setFormError(null)

        const errors =
            validateMoveWishlistBookFormValues(
                values,
                sourceWishlistId,
                wishlists,
            )

        if (errors.destinationWishlistId) {
            setDestinationError(
                errors.destinationWishlistId,
            )
            return
        }

        setConfirmOpen(true)
    }

    function handleConfirm() {
        setConfirmOpen(false)
        setDestinationError(null)
        setFormError(null)

        const errors =
            validateMoveWishlistBookFormValues(
                values,
                sourceWishlistId,
                wishlists,
            )

        if (errors.destinationWishlistId) {
            setDestinationError(
                errors.destinationWishlistId,
            )
            return
        }

        moveBook.mutate(
            {
                sourceWishlistId,
                sourceWishlistItemId:
                membership.wishlist_item_id,
                destinationWishlistId:
                values.destinationWishlistId,
                wishlistBook:
                    membershipToWishlistBookCreate(
                        membership,
                    ),
                destinationMembershipCreated,
            },
            {
                onSuccess: () => {
                    setValues(
                        emptyMoveWishlistBookFormValues,
                    )
                    setDestinationMembershipCreated(
                        false,
                    )
                },

                onError: (error) => {
                    const moveError =
                        error instanceof
                        MoveWishlistBookError
                            ? error
                            : null

                    if (
                        moveError
                            ?.destinationMembershipCreated
                    ) {
                        setDestinationMembershipCreated(
                            true,
                        )
                    }

                    const cause =
                        moveError?.cause ?? error

                    if (isApiError(cause)) {
                        if (cause.status === 404) {
                            setFormError(
                                moveError
                                    ?.destinationMembershipCreated
                                    ? 'The destination membership was created, but the source membership could not be found. You can retry the move without creating a duplicate.'
                                    : 'The wishlist or membership could not be found. Refresh the page and try again.',
                            )
                            return
                        }

                        if (cause.status === 409) {
                            setFormError(
                                'This book is already in the destination wishlist. The source membership has been kept. Choose another destination or remove the existing destination membership first.',
                            )
                            return
                        }

                        if (cause.status === 422) {
                            setFormError(
                                'The book could not be moved because the wishlist membership data was rejected.',
                            )
                            return
                        }
                    }

                    setFormError(
                        moveError
                            ?.destinationMembershipCreated
                            ? 'The book was added to the destination wishlist, but could not be removed from the source wishlist. Try again to complete the move.'
                            : 'The book could not be moved to the destination wishlist.',
                    )
                },
            },
        )
    }

    if (wishlistsQuery.isPending) {
        return (
            <LoadingState
                label="Loading wishlists…"
            />
        )
    }

    if (wishlistsQuery.isError) {
        return (
            <QueryErrorState
                title="Unable to load wishlists"
                error={wishlistsQuery.error}
                onRetry={() => {
                    void wishlistsQuery.refetch()
                }}
            />
        )
    }

    if (membership.book_id === null || membership.album_id !== null) return null

    if (destinations.length === 0) {
        return null
    }

    return (
        <>
            <form
                id={formId}
                onSubmit={handleSubmit}
            >
                <h3>Move to Wishlist</h3>

                {destinationError !== null ||
                formError !== null ? (
                    <div
                        ref={summaryRef}
                        tabIndex={-1}
                    >
                        {destinationError !== null ? (
                            <Alert variant="error">
                                {destinationError}
                            </Alert>
                        ) : null}

                        {formError !== null ? (
                            <Alert variant="error">
                                {formError}
                            </Alert>
                        ) : null}
                    </div>
                ) : null}

                <Field
                    label={`Destination wishlist for ${bookTitle}`}
                    error={destinationError ?? undefined}
                >
                    <select
                        value={
                            values.destinationWishlistId
                        }
                        disabled={
                            disabled ||
                            moveBook.isPending
                        }
                        onChange={(event) => {
                            updateDestination(
                                event.target.value,
                            )
                        }}
                    >
                        <option value="">
                            Choose a wishlist
                        </option>

                        {destinations.map(
                            (wishlist) => (
                                <option
                                    key={
                                        wishlist.wishlist_id
                                    }
                                    value={
                                        wishlist.wishlist_id
                                    }
                                >
                                    {wishlist.name}
                                </option>
                            ),
                        )}
                    </select>
                </Field>

                <Button
                    type="submit"
                    disabled={
                        disabled ||
                        moveBook.isPending ||
                        values.destinationWishlistId ===
                        ''
                    }
                >
                    {moveBook.isPending
                        ? 'Moving…'
                        : 'Move'}
                </Button>
            </form>

            <ConfirmationDialog
                open={confirmOpen}
                title="Move wishlist book?"
                confirmLabel="Move Book"
                onConfirm={handleConfirm}
                onCancel={() => {
                    setConfirmOpen(false)
                }}
            >
                <p>
                    Move <strong>{bookTitle}</strong>
                    {' '}to{' '}
                    <strong>
                        {selectedWishlist?.name ??
                            'the selected wishlist'}
                    </strong>
                    ?
                </p>
            </ConfirmationDialog>
        </>
    )
}
