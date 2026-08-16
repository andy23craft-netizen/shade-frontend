import {
    useSearchParams,
} from 'react-router-dom'

import { Alert } from '../../../components/Alert'
import { AppLink } from '../../../components/AppLink'
import { Button } from '../../../components/Button'
import { EmptyState } from '../../../components/EmptyState'
import { LoadingState } from '../../../components/LoadingState'
import { QueryErrorState } from '../../../components/QueryErrorState'
import { useInfiniteBooks } from '../../../api/booksQueries'
import { enumDisplayValue } from '../../../api/enumDisplay'
import type {
    Category,
    Status,
} from '../../../api/apiTypes'
import { useInfiniteScrollTrigger } from '../../../hooks/useInfiniteScrollTrigger'
import { formatShelfCommonNameForDisplay } from '../../shelves/shelfDisplay'
import { BooksListControls } from '../components/BooksListControls'
import {
    flattenInfiniteBookPages,
    parseSortByParam,
    parseSortOrderParam,
    type BookSortBy,
    type BookSortOrder,
} from '../booksListModel'

const STATUS_VALUES: readonly Status[] = [
    'unknown',
    'available',
    'on_loan',
    'missing',
    'display_only',
    'reserved',
    'reading',
]

const CATEGORY_VALUES: readonly Category[] = [
    'unknown',
    'religion',
    'philosophy',
    'fiction',
    'nonfiction',
]

function displayEnum(
    value: string,
    knownValues: readonly string[],
): string {
    const result = enumDisplayValue(
        value,
        knownValues,
    )

    if (result.known) {
        return result.value
            .replaceAll('_', ' ')
            .replace(/\b\w/g, (character) =>
                character.toUpperCase(),
            )
    }

    return `${result.value} (unknown)`
}

function displayReadState(
    isRead: boolean,
): string {
    return isRead ? 'Read' : 'Unread'
}

function updateListParams(
    searchParams: URLSearchParams,
    updates: {
        sortBy?: BookSortBy
        sortOrder?: BookSortOrder
    },
): URLSearchParams {
    const next = new URLSearchParams(searchParams)

    if (updates.sortBy !== undefined) {
        if (updates.sortBy === 'author') {
            next.delete('sortBy')
        } else {
            next.set(
                'sortBy',
                updates.sortBy,
            )
        }
    }

    if (updates.sortOrder !== undefined) {
        if (updates.sortOrder === 'asc') {
            next.delete('sortOrder')
        } else {
            next.set(
                'sortOrder',
                updates.sortOrder,
            )
        }
    }

    next.delete('page')

    return next
}

export function BooksPage() {
    const [
        searchParams,
        setSearchParams,
    ] = useSearchParams()

    const sortBy = parseSortByParam(
        searchParams.get('sortBy'),
    )
    const sortOrder = parseSortOrderParam(
        searchParams.get('sortOrder'),
    )

    const booksQuery = useInfiniteBooks({
        sortBy,
        sortOrder,
    })

    const fetchNextBooksPage =
        booksQuery.fetchNextPage

    const books = flattenInfiniteBookPages(
        booksQuery.data?.pages,
    )
    const total =
        booksQuery.data?.pages[0]?.total ?? 0

    const {
        getRowRef,
    } = useInfiniteScrollTrigger({
        enabled: booksQuery.isSuccess,
        hasNextPage: booksQuery.hasNextPage,
        isFetchingNextPage:
            booksQuery.isFetchingNextPage,
        fetchNextPage: () => {
            void fetchNextBooksPage()
        },
        itemCount: books.length,
    })

    if (booksQuery.isPending) {
        return (
            <section className="route-page">
                <h1 tabIndex={-1}>Books</h1>
                <LoadingState label="Loading books…" />
            </section>
        )
    }

    if (booksQuery.isLoadingError) {
        return (
            <section className="route-page">
                <h1 tabIndex={-1}>Books</h1>
                <QueryErrorState
                    title="Unable to load books"
                    error={booksQuery.error}
                    onRetry={() => {
                        void booksQuery.refetch()
                    }}
                />
            </section>
        )
    }

    if (total === 0) {
        return (
            <section className="route-page">
                <h1 tabIndex={-1}>Books</h1>

                <EmptyState title="Your library is empty.">
                    <p>
                        Add your first book to get
                        started.
                    </p>

                    <AppLink
                        to="/books/new"
                        variant="primary"
                    >
                        Add Book
                    </AppLink>
                </EmptyState>
            </section>
        )
    }

    return (
        <section className="route-page">
            <div className="books-page__heading">
                <h1 tabIndex={-1}>Books</h1>
                <p>
                    {total} books in the library.
                </p>
            </div>

            <BooksListControls
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortByChange={(nextSortBy) => {
                    setSearchParams(
                        updateListParams(
                            searchParams,
                            {
                                sortBy: nextSortBy,
                            },
                        ),
                        {
                            replace: true,
                        },
                    )
                }}
                onSortOrderChange={(
                    nextSortOrder,
                ) => {
                    setSearchParams(
                        updateListParams(
                            searchParams,
                            {
                                sortOrder: nextSortOrder,
                            },
                        ),
                        {
                            replace: true,
                        },
                    )
                }}
            />

            <ul
                className="books-list"
                aria-label="Library books"
            >
                {books.map((book, index) => {
                    const status = displayEnum(
                        book.status,
                        STATUS_VALUES,
                    )

                    const category = displayEnum(
                        book.category,
                        CATEGORY_VALUES,
                    )

                    const shelf =
                        formatShelfCommonNameForDisplay(
                            book.shelf_name,
                        )

                    return (
                        <li
                            key={book.id}
                            ref={getRowRef(index)}
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

                                <dl className="book-card__metadata">
                                    <div className="book-card__field">
                                        <dt>Status</dt>
                                        <dd>{status}</dd>
                                    </div>

                                    <div className="book-card__field">
                                        <dt>Reading</dt>
                                        <dd>
                                            {displayReadState(
                                                book.is_read,
                                            )}
                                        </dd>
                                    </div>

                                    <div className="book-card__field">
                                        <dt>Rating</dt>
                                        <dd>
                                            {book.rating === null
                                                ? '—'
                                                : `${book.rating} / 5`}
                                        </dd>
                                    </div>

                                    <div className="book-card__field">
                                        <dt>Category</dt>
                                        <dd>{category}</dd>
                                    </div>

                                    <div className="book-card__field">
                                        <dt>Shelf</dt>
                                        <dd>{shelf}</dd>
                                    </div>
                                </dl>
                            </article>
                        </li>
                    )
                })}
            </ul>

            {booksQuery.isFetchingNextPage ? (
                <div className="infinite-scroll__footer">
                    <LoadingState label="Loading more books…" />
                </div>
            ) : null}

            {booksQuery.isFetchNextPageError ? (
                <div className="infinite-scroll__footer">
                    <Alert variant="error">
                        Unable to load more books.
                    </Alert>

                    <Button
                        variant="secondary"
                        onClick={() => {
                            void fetchNextBooksPage()
                        }}
                    >
                        Retry
                    </Button>
                </div>
            ) : null}
        </section>
    )
}
