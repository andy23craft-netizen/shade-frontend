import {
    useState,
    type FormEvent,
} from 'react'

import {
    Alert,
    AppLink,
    Button,
    Field,
    LoadingState,
} from '../../../components'
import {
    isApiError,
} from '../../../api/apiErrors'
import {
    useAddWishlistBook,
    useWishlists,
} from '../../../api/wishlistsQueries'

export function AddToWishlistControl({
                                         bookId,
                                     }: {
    bookId: string
}) {
    const wishlistsQuery = useWishlists()
    const addWishlistBook = useAddWishlistBook()

    const [
        wishlistId,
        setWishlistId,
    ] = useState('')

    const [
        notice,
        setNotice,
    ] = useState<string | null>(null)

    const [
        error,
        setError,
    ] = useState<string | null>(null)

    function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault()

        if (
            wishlistId === '' ||
            addWishlistBook.isPending
        ) {
            return
        }

        setNotice(null)
        setError(null)

        addWishlistBook.mutate(
            {
                wishlistId,
                wishlistBook: {
                    book_id: bookId,
                },
            },
            {
                onSuccess: () => {
                    setNotice(
                        'Book added to wishlist.',
                    )
                },
                onError: (mutationError) => {
                    if (
                        isApiError(mutationError) &&
                        mutationError.status === 404
                    ) {
                        setError(
                            mutationError.detail ??
                            'The book or wishlist could not be found. Refresh and try again.',
                        )

                        void wishlistsQuery.refetch()
                        return
                    }

                    setError(
                        isApiError(mutationError)
                            ? mutationError.detail ??
                            mutationError.message
                            : mutationError instanceof Error
                                ? mutationError.message
                                : 'The book could not be added to the wishlist.',
                    )
                },
            },
        )
    }

    if (wishlistsQuery.isPending) {
        return (
            <div className="add-to-wishlist">
                <LoadingState label="Loading wishlists…" />
            </div>
        )
    }

    if (wishlistsQuery.isError) {
        return (
            <div className="add-to-wishlist">
                <Alert
                    variant="error"
                    title="Unable to load wishlists"
                >
                    <p>
                        Wishlists could not be loaded.
                    </p>

                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                            void wishlistsQuery.refetch()
                        }}
                    >
                        Retry
                    </Button>
                </Alert>
            </div>
        )
    }

    const wishlists =
        wishlistsQuery.data?.items ?? []

    if (wishlists.length === 0) {
        return (
            <div className="add-to-wishlist">
                <p>
                    Create a wishlist before adding
                    this book.
                </p>

                <AppLink
                    to="/wishlists"
                    variant="secondary"
                >
                    Create Wishlist
                </AppLink>
            </div>
        )
    }

    return (
        <form
            className="add-to-wishlist"
            onSubmit={handleSubmit}
        >
            <Field
                id={`wishlist-${bookId}`}
                label="Add to wishlist"
            >
                <select
                    id={`wishlist-${bookId}`}
                    value={wishlistId}
                    onChange={(event) => {
                        setWishlistId(
                            event.target.value,
                        )
                        setNotice(null)
                        setError(null)
                    }}
                    disabled={
                        addWishlistBook.isPending
                    }
                >
                    <option value="">
                        Choose a wishlist
                    </option>

                    {wishlists.map((wishlist) => (
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
                    ))}
                </select>
            </Field>

            <Button
                type="submit"
                variant="secondary"
                disabled={
                    wishlistId === '' ||
                    addWishlistBook.isPending
                }
            >
                {addWishlistBook.isPending
                    ? 'Adding…'
                    : 'Add'}
            </Button>

            {notice ? (
                <Alert variant="success">
                    {notice}
                </Alert>
            ) : null}

            {error ? (
                <Alert variant="error">
                    {error}
                </Alert>
            ) : null}
        </form>
    )
}
