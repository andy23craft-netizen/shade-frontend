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
    parseCategoryParam,
    parseSortByParam,
    parseSortOrderParam,
    parseTextFilterParam,
    type BookSortBy,
    type BookSortOrder,
} from '../booksListModel'
import { AddToWishlistControl } from '../../wishlists/components/AddToWishlistControl'

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
        category?: Category | undefined
        author?: string | undefined
        title?: string | undefined
        sortBy?: BookSortBy
        sortOrder?: BookSortOrder
    },
): URLSearchParams {
    const next = new URLSearchParams(searchParams)

    if ('category' in updates) {
        if (updates.category === undefined) {
            next.delete('category')
        } else {
            next.set(
                'category',
                updates.category,
            )
        }
    }

    if ('author' in updates) {
        const author = updates.author?.trim()

        if (author) {
            next.set('author', author)
        } else {
            next.delete('author')
        }
    }

    if ('title' in updates) {
        const title = updates.title?.trim()

        if (title) {
            next.set('title', title)
        } else {
            next.delete('title')
        }
    }

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
    const category = parseCategoryParam(
        searchParams.get('category'),
    )
    const author = parseTextFilterParam(
        searchParams.get('author'),
    )
    const title = parseTextFilterParam(
        searchParams.get('title'),
    )

    const booksQuery = useInfiniteBooks({
        category,
        author,
        title,
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
    const hasActiveFilters =
        category !== undefined ||
        author !== undefined ||
        title !== undefined

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

    if (total === 0 && !hasActiveFilters) {
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
                key={`${author ?? ''}:${title ?? ''}`}
                category={category}
                author={author ?? ''}
                title={title ?? ''}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onCategoryChange={(nextCategory) => {
                    setSearchParams(
                        updateListParams(
                            searchParams,
                            {
                                category: nextCategory,
                            },
                        ),
                        {
                            replace: true,
                        },
                    )
                }}

                
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


                onApply={(nextAuthor, nextTitle) => {
                    setSearchParams(
                        updateListParams(
                            searchParams,
                            {
                                author: nextAuthor,
                                title: nextTitle,
                            },
                        ),
                        {
                            replace: true,
                        },
                    )
                }}
                onClear={() => {
                    setSearchParams(
                        updateListParams(
                            searchParams,
                            {
                                category: undefined,
                                author: undefined,
                                title: undefined,
                            },
                        ),
                        {
                            replace: true,
                        },
                    )
                }}
            />

            {total === 0 ? (
                <EmptyState title="No books match these filters.">
                    <p>
                        Try changing or clearing the current
                        filters.
                    </p>

                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                            setSearchParams(
                                updateListParams(
                                    searchParams,
                                    {
                                        category: undefined,
                                        author: undefined,
                                        title: undefined,
                                    },
                                ),
                                {
                                    replace: true,
                                },
                            )
                        }}
                    >
                        Clear filters
                    </Button>
                </EmptyState>
            ) : null}

            {total > 0 ? (
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
            ) : null}

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
