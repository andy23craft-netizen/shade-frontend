import {
    useState,
} from 'react'
import {
    useNavigate,
    useParams,
} from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

import { formatBookAuthors } from '../authorDisplay'
import {
    Alert,
    AppLink,
    Button,
    ConfirmationDialog,
    LoadingState,
    QueryErrorState,
} from '../../../components'
import {
    isBookIdentityError,
} from '../../../api/bookIdentity'
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
            isBookIdentityError(bookQuery.error)

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
                        already have been deleted or removed,
                        or the book id may be invalid.
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

        if (!currentBook) {
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

                    if (isBookIdentityError(error)) {
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
                {formatBookAuthors(book.authors)}?
            </p>

            <Alert
                variant="warning"
                title="This permanently removes the book"
            >
                The book record, loan history, collection
                memberships, categories, shelf placement, and
                any custom cover file will be removed and
                cannot be restored.
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
                    Permanently delete{' '}
                    <strong>{book.title}</strong>?
                </p>

                <p>
                    This removes the book record, loans,
                    memberships, categories, shelf placement,
                    and any custom cover file. This action
                    cannot be undone.
                </p>
            </ConfirmationDialog>
        </section>
    )
}
