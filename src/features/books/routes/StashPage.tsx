import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Alert,
    AppLink,
    Button,
    EmptyState,
    LoadingState,
    QueryErrorState,
} from '../../../components'
import {
    useBulkApplyStash,
    useInfiniteBooks,
} from '../../../api/booksQueries'
import { useShelves } from '../../../api/shelvesQueries'
import { formatBookAuthors } from '../authorDisplay'
import { BookSelectionControl } from '../components/BookSelectionControl'
import { useBulkSelection } from '../useBulkSelection'
import { flattenInfiniteBookPages } from '../booksListModel'
import {
    formatShelfCommonNameForDisplay,
} from '../../shelves/shelfDisplay'
import {
    PlacementReconciliationDialog,
} from '../components/PlacementReconciliationDialog'
import {
    reconciliationFromApplyStash,
    shouldReconcilePlacement,
    type PlacementReconciliationResult,
} from '../placementReconciliation'

export function StashPage() {
    const navigate = useNavigate()
    const booksQuery = useInfiniteBooks({
        placementState: 'stashed',
        sortBy: 'author',
        sortOrder: 'asc',
    })
    const shelvesQuery = useShelves()
    const applyMutation = useBulkApplyStash()
    const books = flattenInfiniteBookPages(
        booksQuery.data?.pages,
    )
    const selection = useBulkSelection({
        books,
        resultIdentity: 'stash',
    })
    const [shelfName, setShelfName] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [notice, setNotice] = useState<string | null>(null)
    const [reconciliation, setReconciliation] =
        useState<PlacementReconciliationResult | null>(null)

    const destinations = useMemo(
        () => (shelvesQuery.data ?? []).filter(
            (shelf) =>
                shelf.common_name !== 'unknown' &&
                shelf.common_name !== 'removed',
        ),
        [shelvesQuery.data],
    )

    if (booksQuery.isPending || shelvesQuery.isPending) {
        return <LoadingState label="Loading Stash…" />
    }

    if (booksQuery.isError) {
        return (
            <QueryErrorState
                title="Unable to load Stash"
                error={booksQuery.error}
                onRetry={() => void booksQuery.refetch()}
            />
        )
    }

    if (shelvesQuery.isError) {
        return (
            <QueryErrorState
                title="Unable to load destination shelves"
                error={shelvesQuery.error}
                onRetry={() => void shelvesQuery.refetch()}
            />
        )
    }

    return (
        <section className="route-page stash-page">
            <header>
                <h1 tabIndex={-1}>Stash</h1>
                <p>
                    Books intentionally set aside while their
                    final shelf is decided.
                </p>
            </header>

            {error ? (
                <Alert variant="error" title="Unable to apply Stash">
                    {error}
                </Alert>
            ) : null}
            {notice ? (
                <Alert variant="success" title="Stash updated">
                    {notice}
                </Alert>
            ) : null}

            {books.length === 0 ? (
                <EmptyState title="Stash is empty">
                    There are no books awaiting placement.
                </EmptyState>
            ) : (
                <>
                    <div className="stash-page__actions">
                        <p>{selection.selectedCount} selected</p>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={selection.selectVisible}
                        >
                            Select all loaded books
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            disabled={selection.selectedCount === 0}
                            onClick={selection.clear}
                        >
                            Clear selection
                        </Button>
                        <label>
                            Destination shelf
                            <select
                                value={shelfName}
                                onChange={(event) => setShelfName(event.target.value)}
                            >
                                <option value="">Choose a shelf</option>
                                {destinations.map((shelf) => (
                                    <option key={shelf.shelf_id} value={shelf.common_name}>
                                        {formatShelfCommonNameForDisplay(shelf.common_name)}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <Button
                            type="button"
                            variant="primary"
                            disabled={
                                selection.selectedCount === 0 ||
                                !shelfName ||
                                applyMutation.isPending
                            }
                            onClick={() => {
                                setError(null)
                                setNotice(null)
                                applyMutation.mutate(
                                    {
                                        book_ids: selection.selectedBooks.map((book) => book.book_id),
                                        shelf_name: shelfName,
                                    },
                                    {
                                        onSuccess: (response) => {
                                            const result = reconciliationFromApplyStash(response)
                                            selection.clear()
                                            setShelfName('')
                                            setNotice(
                                                `${response.applied_count} ${response.applied_count === 1 ? 'book' : 'books'} applied to ${formatShelfCommonNameForDisplay(response.destination_shelf)}.`,
                                            )
                                            if (shouldReconcilePlacement(result)) {
                                                setReconciliation(result)
                                            }
                                        },
                                        onError: (failure) => {
                                            setError(
                                                failure instanceof Error
                                                    ? failure.message
                                                    : 'The selected books could not be applied.',
                                            )
                                            void booksQuery.refetch()
                                        },
                                    },
                                )
                            }}
                        >
                            {applyMutation.isPending ? 'Applying…' : 'Apply Stash'}
                        </Button>
                    </div>

                    <ul className="stash-page__list">
                        {books.map((book) => (
                            <li key={book.book_id} className="stash-page__book">
                                <BookSelectionControl
                                    bookTitle={book.title}
                                    checked={selection.isSelected(book.book_id)}
                                    onChange={() => selection.toggle(book.book_id)}
                                />
                                <div>
                                    <h2>
                                        <AppLink to={`/books/${encodeURIComponent(book.book_id)}`}>
                                            {book.title}
                                        </AppLink>
                                    </h2>
                                    <p>{formatBookAuthors(book.authors)}</p>
                                    <p>
                                        Previous shelf:{' '}
                                        {book.previous_shelf_name
                                            ? formatShelfCommonNameForDisplay(book.previous_shelf_name)
                                            : 'Unavailable'}
                                    </p>
                                    {book.status === 'on_loan' ? <strong>On Loan</strong> : null}
                                </div>
                            </li>
                        ))}
                    </ul>

                    {booksQuery.hasNextPage ? (
                        <Button
                            type="button"
                            variant="secondary"
                            disabled={booksQuery.isFetchingNextPage}
                            onClick={() => void booksQuery.fetchNextPage()}
                        >
                            {booksQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
                        </Button>
                    ) : null}
                </>
            )}

            <PlacementReconciliationDialog
                result={reconciliation}
                onDone={() => setReconciliation(null)}
                onReview={(destination) => {
                    setReconciliation(null)
                    navigate(`/books?shelf_name=${encodeURIComponent(destination)}&bulk_review=1`)
                }}
            />
        </section>
    )
}
