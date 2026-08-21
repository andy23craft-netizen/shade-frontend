import {
    useMemo,
    useState,
} from 'react'

import {
    Alert,
    AppLink,
    Button,
    ConfirmationDialog,
    EmptyState,
    LoadingState,
    QueryErrorState,
} from '../../../components'
import {
    isApiError,
} from '../../../api/apiErrors'
import {
    isBookIdentityError,
} from '../../../api/bookIdentity'
import type {
    BookRead,
} from '../../../api/apiTypes'
import {
    useBooks,
    useRestoreBook,
} from '../../../api/booksQueries'

export function DeletedBooksPage() {
    const booksQuery = useBooks({
        includeDeleted: true,
    })

    const restoreBook = useRestoreBook()

    const [
        pendingBook,
        setPendingBook,
    ] = useState<BookRead | null>(null)

    const [
        restoreError,
        setRestoreError,
    ] = useState<string | null>(null)

    const deletedBooks = useMemo(
        () =>
            (booksQuery.data?.items ?? []).filter(
                (book) =>
                    book.deletion_date !== null,
            ),
        [booksQuery.data],
    )

    function handleRestoreRequest(
        book: BookRead,
    ) {
        if (restoreBook.isPending) {
            return
        }

        setRestoreError(null)
        setPendingBook(book)
    }

    function handleCancelRestore() {
        if (restoreBook.isPending) {
            return
        }

        setPendingBook(null)
    }

    function handleConfirmRestore() {
        if (
            pendingBook === null ||
            restoreBook.isPending
        ) {
            return
        }

        const book = pendingBook

        restoreBook.mutate(
            book.id,
            {
                onSuccess: () => {
                    setPendingBook(null)
                },
                onError: (error) => {
                    setPendingBook(null)

                    if (
                        isBookIdentityError(error) ||
                        (
                            isApiError(error) &&
                            error.status === 409
                        )
                    ) {
                        setRestoreError(
                            'This book could not be restored because it is missing or is no longer deleted.',
                        )
                        void booksQuery.refetch()
                        return
                    }

                    setRestoreError(
                        error instanceof Error
                            ? error.message
                            : 'The book could not be restored.',
                    )

                    void booksQuery.refetch()
                },
            },
        )
    }

    if (booksQuery.isPending) {
        return (
            <section className="route-page">
                <h1 tabIndex={-1}>
                    Deleted Books
                </h1>

                <LoadingState label="Loading deleted books…" />
            </section>
        )
    }

    if (booksQuery.isError) {
        return (
            <section className="route-page">
                <h1 tabIndex={-1}>
                    Deleted Books
                </h1>

                <QueryErrorState
                    title="Unable to load deleted books"
                    error={booksQuery.error}
                    onRetry={() => {
                        void booksQuery.refetch()
                    }}
                />
            </section>
        )
    }

    if (deletedBooks.length === 0) {
        return (
            <section className="route-page">
                <h1 tabIndex={-1}>
                    Deleted Books
                </h1>

                {restoreError ? (
                    <Alert
                        variant="error"
                        title="Unable to restore book"
                    >
                        {restoreError}
                    </Alert>
                ) : null}

                <EmptyState title="No deleted books.">
                    <p>
                        Soft-deleted books will appear
                        here so they can be restored.
                    </p>

                    <AppLink
                        to="/books"
                        variant="secondary"
                    >
                        Back to Books
                    </AppLink>
                </EmptyState>
            </section>
        )
    }

    return (
        <section className="route-page">
            <div className="books-page__heading">
                <h1 tabIndex={-1}>
                    Deleted Books
                </h1>

                <p>
                    {deletedBooks.length}{' '}
                    {deletedBooks.length === 1
                        ? 'deleted book'
                        : 'deleted books'}.
                </p>
            </div>

            {restoreError ? (
                <Alert
                    variant="error"
                    title="Unable to restore book"
                >
                    {restoreError}
                </Alert>
            ) : null}

            <ul
                className="books-list"
                aria-label="Deleted books"
            >
                {deletedBooks.map((book) => (
                    <li
                        key={book.id}
                        className="books-list__item"
                    >
                        <article className="book-card">
                            <div className="book-card__heading">
                                <h2 className="book-card__title">
                                    <AppLink
                                        to={`/books/${book.id}`}
                                    >
                                        {book.title}
                                    </AppLink>
                                </h2>

                                <p className="book-card__author">
                                    {book.authors}
                                </p>
                            </div>

                            <div className="book-card__metadata">
                                <p>
                                    Reading:{' '}
                                    {book.is_read
                                        ? 'Read'
                                        : 'Unread'}
                                </p>

                                <p>
                                    Times borrowed:{' '}
                                    {book.times_borrowed}
                                </p>
                            </div>

                            <div className="form-actions">
                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={() => {
                                        handleRestoreRequest(
                                            book,
                                        )
                                    }}
                                    disabled={
                                        restoreBook.isPending
                                    }
                                >
                                    Restore Book
                                </Button>
                            </div>
                        </article>
                    </li>
                ))}
            </ul>

            <ConfirmationDialog
                open={pendingBook !== null}
                title="Confirm book restoration"
                confirmLabel="Restore Book"
                confirmVariant="primary"
                onConfirm={
                    handleConfirmRestore
                }
                onCancel={
                    handleCancelRestore
                }
            >
                {pendingBook ? (
                    <p>
                        Restore{' '}
                        <strong>
                            {pendingBook.title}
                        </strong>{' '}
                        by {pendingBook.authors} to
                        active browsing?
                    </p>
                ) : (
                    <p>
                        Restore this book?
                    </p>
                )}
            </ConfirmationDialog>
        </section>
    )
}
