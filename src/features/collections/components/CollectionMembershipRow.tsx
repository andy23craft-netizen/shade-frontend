import {
    useState,
} from 'react'

import {
    BookCover,
} from '../../books/components/BookCover'
import {
    Alert,
    AppLink,
    Button,
    ConfirmationDialog,
    LoadingState,
} from '../../../components'
import type {
    CollectionBookRead,
} from '../../../api/apiTypes'
import {
    useBook,
} from '../../../api/booksQueries'
import {
    useRemoveCollectionBook,
    useReorderCollectionBook,
} from '../../../api/collectionsQueries'
import {
    collectionBookWishlistClassName,
    displayCollectionBookLocation,
    displayCollectionBookNotes,
    displayCollectionBookPosition,
} from '../collectionDisplay'

export interface CollectionMembershipRowProps {
    collectionId: string
    membership: CollectionBookRead
    isFirst: boolean
    isLast: boolean
}

export function CollectionMembershipRow({
                                            collectionId,
                                            membership,
                                            isFirst,
                                            isLast,
                                        }: CollectionMembershipRowProps) {
    const bookQuery =
        useBook(membership.book_id)

    const reorderBook =
        useReorderCollectionBook()

    const removeBook =
        useRemoveCollectionBook()

    const [
        removeOpen,
        setRemoveOpen,
    ] = useState(false)

    const [
        actionError,
        setActionError,
    ] = useState<string | null>(null)

    const book = bookQuery.data

    if (bookQuery.isPending) {
        return (
            <li
                className="collection-membership"
                data-membership-id={
                    membership.collection_book_id
                }
            >
                <LoadingState
                    label="Loading collection book…"
                />
            </li>
        )
    }

    if (bookQuery.isError) {
        return (
            <li
                className="collection-membership"
                data-membership-id={
                    membership.collection_book_id
                }
            >
                <div className="collection-membership__book">
                <span
                    className="collection-membership__position"
                    aria-label={`Position ${membership.order_num}`}
                >
                    {displayCollectionBookPosition(
                        membership.order_num,
                    )}
                </span>

                    <div>
                        <strong>
                            Book {membership.book_id}
                        </strong>

                        <p>
                            Book details could not be loaded.
                        </p>

                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                void bookQuery.refetch()
                            }}
                        >
                            Retry
                        </Button>
                    </div>
                </div>
            </li>
        )
    }

    if (
        book === undefined ||
        book.deletion_date !== null
    ) {
        return null
    }

    const pending =
        reorderBook.isPending ||
        removeBook.isPending

    const notes =
        displayCollectionBookNotes(
            membership.notes,
        )

    const location =
        displayCollectionBookLocation(
            membership.shelf_name,
            membership.on_wishlist,
        )

    const wishlistClass =
        collectionBookWishlistClassName(
            membership.on_wishlist,
        )

    const className = [
        'collection-membership',
        wishlistClass,
    ]
        .filter(Boolean)
        .join(' ')

    function handleMove(
        orderNum: number,
    ) {
        if (pending) {
            return
        }

        setActionError(null)

        reorderBook.mutate(
            {
                collectionId,
                collectionBookId:
                membership.collection_book_id,
                orderNum,
            },
            {
                onError: (error) => {
                    setActionError(
                        error instanceof Error
                            ? error.message
                            : 'The book could not be reordered.',
                    )
                },
            },
        )
    }

    function handleConfirmRemove() {
        if (removeBook.isPending) {
            return
        }

        setActionError(null)

        removeBook.mutate(
            {
                collectionId,
                collectionBookId:
                membership.collection_book_id,
            },
            {
                onSuccess: () => {
                    setRemoveOpen(false)
                },

                onError: (error) => {
                    setActionError(
                        error instanceof Error
                            ? error.message
                            : 'The book could not be removed from the collection.',
                    )
                },
            },
        )
    }

    return (
        <li
            className={className}
            data-membership-id={
                membership.collection_book_id
            }
        >
            <div className="collection-membership__book">
    <span
        className="collection-membership__position"
        aria-label={`Position ${membership.order_num}`}
    >
        {displayCollectionBookPosition(
            membership.order_num,
        )}
    </span>

                <div className="collection-membership__cover">
                    <BookCover
                        bookId={book.id}
                        title={book.title}
                        status={book.status}
                        decorative
                    />
                </div>

                <div className="collection-membership__identity">
                    <strong>
                        <AppLink
                            to={`/books/${encodeURIComponent(
                                book.id,
                            )}`}
                        >
                            {book.title}
                        </AppLink>
                    </strong>

                    {book.authors ? (
                        <p>{book.authors}</p>
                    ) : null}
                </div>
            </div>

            <dl className="collection-membership__details">
                <div>
                    <dt>Location</dt>
                    <dd>{location}</dd>
                </div>

                {notes ? (
                    <div>
                        <dt>Notes</dt>
                        <dd>{notes}</dd>
                    </div>
                ) : null}
            </dl>

            {actionError ? (
                <Alert variant="error">
                    {actionError}
                </Alert>
            ) : null}

            <div className="collection-membership__actions">
                <Button
                    type="button"
                    variant="secondary"
                    disabled={
                        pending ||
                        isFirst
                    }
                    onClick={() => {
                        handleMove(
                            membership.order_num - 1,
                        )
                    }}
                >
                    Move Up
                </Button>

                <Button
                    type="button"
                    variant="secondary"
                    disabled={
                        pending ||
                        isLast
                    }
                    onClick={() => {
                        handleMove(
                            membership.order_num + 1,
                        )
                    }}
                >
                    Move Down
                </Button>

                <Button
                    type="button"
                    variant="danger"
                    disabled={pending}
                    onClick={() => {
                        setActionError(null)
                        setRemoveOpen(true)
                    }}
                >
                    Remove
                </Button>
            </div>

            <ConfirmationDialog
                open={removeOpen}
                title="Remove from collection?"
                confirmLabel={
                    removeBook.isPending
                        ? 'Removing…'
                        : 'Remove Book'
                }
                cancelLabel="Cancel"
                confirmVariant="danger"
                onConfirm={handleConfirmRemove}
                onCancel={() => {
                    if (removeBook.isPending) {
                        return
                    }

                    setRemoveOpen(false)
                }}
            >
                <p>
                    Remove{' '}
                    <strong>{book.title}</strong>{' '}
                    from this collection? The catalog book
                    will remain in the library.
                </p>
            </ConfirmationDialog>
        </li>
    )
}
