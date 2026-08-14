import {
    useState,
} from 'react'
import {
    useNavigate,
    useParams,
} from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

import {
    Alert,
    AppLink,
    Button,
    ConfirmationDialog,
    LoadingState,
    QueryErrorState,
} from '../../../components'
import {
    isApiError,
} from '../../../api/apiErrors'
import {
    useBook,
    useDeleteBook,
} from '../../../api/booksQueries'
import { useLoans } from '../../../api/loansQueries'
import { queryKeys } from '../../../api/queryKeys'
import {
    findActiveLoan,
} from '../../loans/checkinEligibility'

export function DeleteBookPage() {
    const { bookId = '' } = useParams()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const bookQuery = useBook(bookId)
    const loansQuery = useLoans({
        bookId,
    })
    const deleteBook = useDeleteBook()

    const [
        isConfirmationOpen,
        setIsConfirmationOpen,
    ] = useState(false)

    const [
        deleteError,
        setDeleteError,
    ] = useState<string | null>(null)

    async function refetchBookState() {
        await Promise.all([
            queryClient.invalidateQueries({
                queryKey:
                    queryKeys.books.detail(bookId),
            }),
            queryClient.invalidateQueries({
                queryKey: queryKeys.books.all,
            }),
            queryClient.invalidateQueries({
                queryKey:
                    queryKeys.loans.list(bookId),
            }),
        ])
    }

    if (bookQuery.isPending) {
        return (
            <section className="route-page">
                <h1 tabIndex={-1}>
                    Delete Book
                </h1>

                <LoadingState label="Loading book…" />
            </section>
        )
    }

    if (bookQuery.isError) {
        const isNotFound =
            isApiError(bookQuery.error) &&
            bookQuery.error.status === 404

        if (isNotFound) {
            return (
                <section className="route-page">
                    <h1 tabIndex={-1}>
                        Delete Book
                    </h1>

                    <Alert
                        variant="warning"
                        title="Book not found"
                    >
                        This book could not be found. It may
                        already have been deleted or removed.
                    </Alert>

                    <AppLink
                        to="/books"
                        variant="secondary"
                    >
                        Back to Books
                    </AppLink>
                </section>
            )
        }

        return (
            <section className="route-page">
                <h1 tabIndex={-1}>
                    Delete Book
                </h1>

                <QueryErrorState
                    title="Unable to load book"
                    error={bookQuery.error}
                />

                <AppLink
                    to="/books"
                    variant="secondary"
                >
                    Back to Books
                </AppLink>
            </section>
        )
    }

    const book = bookQuery.data

    if (book.deletion_date !== null) {
        return (
            <section className="route-page">
                <div className="book-details__topbar">
                    <AppLink
                        to={`/books/${book.id}`}
                        variant="secondary"
                    >
                        ← Back to Book
                    </AppLink>
                </div>

                <h1 tabIndex={-1}>
                    Delete Book
                </h1>

                <Alert
                    variant="warning"
                    title="This book has already been deleted"
                >
                    Deleted books cannot be deleted again.
                    Use Deleted Books if you want to restore
                    this record.
                </Alert>
            </section>
        )
    }

    if (loansQuery.isPending) {
        return (
            <section className="route-page">
                <h1 tabIndex={-1}>
                    Delete Book
                </h1>

                <LoadingState label="Checking loan status…" />
            </section>
        )
    }

    if (loansQuery.isError) {
        return (
            <section className="route-page">
                <div className="book-details__topbar">
                    <AppLink
                        to={`/books/${book.id}`}
                        variant="secondary"
                    >
                        ← Back to Book
                    </AppLink>
                </div>

                <h1 tabIndex={-1}>
                    Delete Book
                </h1>

                <QueryErrorState
                    title="Unable to verify loan status"
                    error={loansQuery.error}
                />
            </section>
        )
    }

    const activeLoan =
        findActiveLoan(
            book.id,
            loansQuery.data?.items ?? [],
        )

    const deletionBlocked =
        book.status === 'on_loan' ||
        activeLoan !== undefined

    if (deletionBlocked) {
        return (
            <section className="route-page">
                <div className="book-details__topbar">
                    <AppLink
                        to={`/books/${book.id}`}
                        variant="secondary"
                    >
                        ← Back to Book
                    </AppLink>
                </div>

                <h1 tabIndex={-1}>
                    Delete Book
                </h1>

                <Alert
                    variant="warning"
                    title="This book cannot be deleted"
                >
                    The book is currently on loan. Check it
                    in before deleting it.
                </Alert>
            </section>
        )
    }

    function handleOpenConfirmation() {
        if (deleteBook.isPending) {
            return
        }

        setDeleteError(null)
        setIsConfirmationOpen(true)
    }

    function handleCancelConfirmation() {
        if (deleteBook.isPending) {
            return
        }

        setIsConfirmationOpen(false)
    }

    function handleConfirm() {
        if (deleteBook.isPending) {
            return
        }

        const currentBook = bookQuery.data

        if (
            !currentBook ||
            currentBook.deletion_date !== null
        ) {
            setIsConfirmationOpen(false)
            setDeleteError(
                'This book is no longer available to delete.',
            )
            void refetchBookState()
            return
        }

        const currentActiveLoan =
            findActiveLoan(
                currentBook.id,
                loansQuery.data?.items ?? [],
            )

        if (
            currentBook.status === 'on_loan' ||
            currentActiveLoan !== undefined
        ) {
            setIsConfirmationOpen(false)
            setDeleteError(
                'This book cannot be deleted while it is on loan.',
            )
            void refetchBookState()
            return
        }

        deleteBook.mutate(
            currentBook.id,
            {
                onSuccess: () => {
                    setIsConfirmationOpen(false)
                    navigate('/books')
                },
                onError: (error) => {
                    setIsConfirmationOpen(false)

                    if (
                        isApiError(error) &&
                        error.status === 404
                    ) {
                        setDeleteError(
                            'This book could not be deleted because it is missing or has already been deleted.',
                        )
                        void refetchBookState()
                        return
                    }

                    setDeleteError(
                        error instanceof Error
                            ? error.message
                            : 'The book could not be deleted.',
                    )

                    void refetchBookState()
                },
            },
        )
    }

    return (
        <section className="route-page">
            <div className="book-details__topbar">
                <AppLink
                    to={`/books/${book.id}`}
                    variant="secondary"
                >
                    ← Back to Book
                </AppLink>
            </div>

            <h1 tabIndex={-1}>
                Delete Book
            </h1>

            <p>
                Delete{' '}
                <strong>{book.title}</strong> by{' '}
                {book.authors}?
            </p>

            <Alert
                variant="warning"
                title="This is a soft deletion"
            >
                The book will be removed from normal
                browsing, but its record, reading history,
                and loan history will be retained. It can
                later be restored from Deleted Books.
            </Alert>

            {deleteError ? (
                <Alert
                    variant="error"
                    title="Unable to delete book"
                >
                    {deleteError}
                </Alert>
            ) : null}

            <div className="form-actions">
                <Button
                    type="button"
                    variant="danger"
                    onClick={
                        handleOpenConfirmation
                    }
                    disabled={
                        deleteBook.isPending
                    }
                >
                    Delete Book
                </Button>

                <AppLink
                    to={`/books/${book.id}`}
                    variant="secondary"
                >
                    Cancel
                </AppLink>
            </div>

            <ConfirmationDialog
                open={isConfirmationOpen}
                title="Confirm book deletion"
                confirmLabel="Delete Book"
                confirmVariant="danger"
                onConfirm={handleConfirm}
                onCancel={handleCancelConfirmation}
            >
                <p>
                    Delete{' '}
                    <strong>{book.title}</strong>?
                </p>

                <p>
                    This removes the book from normal
                    browsing but preserves its history.
                </p>
            </ConfirmationDialog>
        </section>
    )
}
