import {
    useEffect,
} from 'react'
import {
    useSearchParams,
} from 'react-router-dom'

import { AppLink } from '../../../components/AppLink'
import { EmptyState } from '../../../components/EmptyState'
import { LoadingState } from '../../../components/LoadingState'
import { QueryErrorState } from '../../../components/QueryErrorState'
import { useBooks } from '../../../api/booksQueries'
import { enumDisplayValue } from '../../../api/enumDisplay'
import type {
    Category,
    Shelf,
    Status,
} from '../../../api/apiTypes'
import { BooksListControls } from '../components/BooksListControls'
import {
    BOOKS_PAGE_SIZE,
    buildBooksListQuery,
    clampPage,
    parsePageParam,
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

const SHELF_VALUES: readonly Shelf[] = [
    'unknown',
    'liz_tbr',
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
        page?: number
        sortBy?: BookSortBy
        sortOrder?: BookSortOrder
    },
): URLSearchParams {
    const next = new URLSearchParams(searchParams)

    if (updates.page !== undefined) {
        if (updates.page <= 1) {
            next.delete('page')
        } else {
            next.set(
                'page',
                String(updates.page),
            )
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

    return next
}

export function BooksPage() {
    const [
        searchParams,
        setSearchParams,
    ] = useSearchParams()

    const page = parsePageParam(
        searchParams.get('page'),
    )
    const sortBy = parseSortByParam(
        searchParams.get('sortBy'),
    )
    const sortOrder = parseSortOrderParam(
        searchParams.get('sortOrder'),
    )

    const listQuery = buildBooksListQuery({
        page,
        sortBy,
        sortOrder,
    })

    const booksQuery = useBooks({
        skip: listQuery.skip,
        take: listQuery.take,
        sortBy: listQuery.sortBy,
        sortOrder: listQuery.sortOrder,
    })

    useEffect(() => {
        if (
            !booksQuery.isSuccess ||
            booksQuery.data.total === 0
        ) {
            return
        }

        const clampedPage = clampPage(
            page,
            booksQuery.data.total,
        )

        if (clampedPage !== page) {
            setSearchParams(
                updateListParams(
                    searchParams,
                    {
                        page: clampedPage,
                    },
                ),
                {
                    replace: true,
                },
            )
        }
    }, [
        booksQuery.isSuccess,
        booksQuery.data?.total,
        page,
        searchParams,
        setSearchParams,
    ])

    if (booksQuery.isPending) {
        return (
            <section className="route-page">
                <h1 tabIndex={-1}>Books</h1>
                <LoadingState label="Loading books…" />
            </section>
        )
    }

    if (booksQuery.isError) {
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

    const books = booksQuery.data.items
    const total = booksQuery.data.total

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

    const effectivePage = clampPage(page, total)

    return (
        <section className="route-page">
            <div className="books-page__heading">
                <h1 tabIndex={-1}>Books</h1>
                <p>
                    {total} books in the library.
                </p>
            </div>

            <BooksListControls
                page={effectivePage}
                pageSize={BOOKS_PAGE_SIZE}
                skip={listQuery.skip}
                total={total}
                itemsOnPage={books.length}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortByChange={(nextSortBy) => {
                    setSearchParams(
                        updateListParams(
                            searchParams,
                            {
                                sortBy: nextSortBy,
                                page: 1,
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
                                page: 1,
                            },
                        ),
                        {
                            replace: true,
                        },
                    )
                }}
                onPreviousPage={() => {
                    setSearchParams(
                        updateListParams(
                            searchParams,
                            {
                                page: effectivePage - 1,
                            },
                        ),
                        {
                            replace: true,
                        },
                    )
                }}
                onNextPage={() => {
                    setSearchParams(
                        updateListParams(
                            searchParams,
                            {
                                page: effectivePage + 1,
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
                {books.map((book) => {
                    const status = displayEnum(
                        book.status,
                        STATUS_VALUES,
                    )

                    const category = displayEnum(
                        book.category,
                        CATEGORY_VALUES,
                    )

                    const shelf = displayEnum(
                        book.shelf,
                        SHELF_VALUES,
                    )

                    return (
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
        </section>
    )
}
