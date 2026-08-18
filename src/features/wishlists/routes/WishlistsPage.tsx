import {
    useState,
    type FormEvent,
} from 'react'

import {
    Alert,
    Button,
    EmptyState,
    Field,
    LoadingState,
    QueryErrorState,
} from '../../../components'
import {
    useBooks,
} from '../../../api/booksQueries'
import {
    isApiError,
} from '../../../api/apiErrors'
import type {
    BookRead,
    WishlistRead,
} from '../../../api/apiTypes'
import {
    enumDisplayValue,
} from '../../../api/enumDisplay'
import {
    useCreateWishlist,
    useWishlistBooks,
    useWishlists,
} from '../../../api/wishlistsQueries'

const WISHLIST_STATUS_VALUES = [
    'wanted',
    'ordered',
    'owned',
    'dropped',
] as const

function displayStatus(
    value: string,
): string {
    const status = enumDisplayValue(
        value,
        WISHLIST_STATUS_VALUES,
    )

    if (!status.known) {
        return `${status.value} (unknown)`
    }

    return status.value
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (character) =>
            character.toUpperCase(),
        )
}

function WishlistSection({
                             wishlist,
                             booksById,
                         }: {
    wishlist: WishlistRead
    booksById: ReadonlyMap<string, BookRead>
}) {
    const membershipsQuery =
        useWishlistBooks(wishlist.wishlist_id)

    return (
        <article className="wishlist-card">
            <header>
                <h2>{wishlist.name}</h2>

                {wishlist.description ? (
                    <p>{wishlist.description}</p>
                ) : null}
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
            membershipsQuery.data.items.length === 0 ? (
                <p>
                    No books have been added to this
                    wishlist yet.
                </p>
            ) : null}

            {membershipsQuery.isSuccess &&
            membershipsQuery.data.items.length > 0 ? (
                <ul
                    className="wishlist-memberships"
                    aria-label={`${wishlist.name} books`}
                >
                    {membershipsQuery.data.items.map(
                        (membership) => {
                            const book =
                                booksById.get(
                                    membership.book_id,
                                )

                            return (
                                <li
                                    key={
                                        membership.wishlist_book_id
                                    }
                                    className="wishlist-membership"
                                >
                                    <div>
                                        <strong>
                                            {book?.title ??
                                                `Book ${membership.book_id}`}
                                        </strong>

                                        {book?.authors ? (
                                            <p>
                                                {
                                                    book.authors
                                                }
                                            </p>
                                        ) : null}
                                    </div>

                                    <dl>
                                        <div>
                                            <dt>Status</dt>
                                            <dd>
                                                {displayStatus(
                                                    membership.status,
                                                )}
                                            </dd>
                                        </div>

                                        <div>
                                            <dt>Priority</dt>
                                            <dd>
                                                {membership.priority ??
                                                    '—'}
                                            </dd>
                                        </div>
                                    </dl>
                                </li>
                            )
                        },
                    )}
                </ul>
            ) : null}
        </article>
    )
}

export function WishlistsPage() {
    const wishlistsQuery = useWishlists()
    const booksQuery = useBooks()

    const createWishlist = useCreateWishlist()

    const [name, setName] = useState('')
    const [description, setDescription] =
        useState('')
    const [formError, setFormError] =
        useState<string | null>(null)

    function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault()

        const trimmedName = name.trim()
        const trimmedDescription =
            description.trim()

        if (trimmedName === '') {
            setFormError(
                'Enter a name for the wishlist.',
            )
            return
        }

        setFormError(null)

        createWishlist.mutate(
            {
                name: trimmedName,
                description:
                    trimmedDescription === ''
                        ? null
                        : trimmedDescription,
            },
            {
                onSuccess: () => {
                    setName('')
                    setDescription('')
                    setFormError(null)
                },
                onError: (error) => {
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

    if (booksQuery.isPending) {
        return (
            <section className="route-page wishlists-page">
                <h1 tabIndex={-1}>
                    Wishlists
                </h1>

                <LoadingState label="Loading catalog…" />
            </section>
        )
    }

    if (booksQuery.isError) {
        return (
            <section className="route-page wishlists-page">
                <h1 tabIndex={-1}>
                    Wishlists
                </h1>

                <QueryErrorState
                    title="Unable to load catalog"
                    error={booksQuery.error}
                    onRetry={() => {
                        void booksQuery.refetch()
                    }}
                />
            </section>
        )
    }

    const wishlists =
        wishlistsQuery.data?.items ?? []

    const booksById = new Map(
        (booksQuery.data?.items ?? []).map(
            (book) => [
                book.id,
                book,
            ],
        ),
    )

    return (
        <section className="route-page wishlists-page">
            <header className="wishlists-page__heading">
                <h1 tabIndex={-1}>
                    Wishlists
                </h1>

                <p>
                    Keep track of books you want to add
                    to the collection.
                </p>
            </header>

            <form
                className="wishlist-form"
                onSubmit={handleSubmit}
                noValidate
            >
                <h2>Create a wishlist</h2>

                {formError ? (
                    <Alert variant="error">
                        {formError}
                    </Alert>
                ) : null}

                <Field
                    id="wishlist-name"
                    label="Name"
                >
                    <input
                        id="wishlist-name"
                        name="name"
                        type="text"
                        value={name}
                        onChange={(event) => {
                            setName(
                                event.target.value,
                            )
                        }}
                        disabled={
                            createWishlist.isPending
                        }
                        maxLength={255}
                        autoComplete="off"
                    />
                </Field>

                <Field
                    id="wishlist-description"
                    label="Description"
                >
                    <textarea
                        id="wishlist-description"
                        name="description"
                        value={description}
                        onChange={(event) => {
                            setDescription(
                                event.target.value,
                            )
                        }}
                        disabled={
                            createWishlist.isPending
                        }
                        rows={3}
                    />
                </Field>

                <Button
                    type="submit"
                    variant="primary"
                    disabled={
                        createWishlist.isPending
                    }
                >
                    {createWishlist.isPending
                        ? 'Creating…'
                        : 'Create Wishlist'}
                </Button>
            </form>

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
                            key={
                                wishlist.wishlist_id
                            }
                            className="wishlists-list__item"
                        >
                            <WishlistSection
                                wishlist={wishlist}
                                booksById={booksById}
                            />
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}
