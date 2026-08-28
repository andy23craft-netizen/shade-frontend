import {
    useNavigate,
    useSearchParams,
} from 'react-router-dom'
import {
    useEffect,
    useRef,
    useState,
} from 'react'

import { BookCover } from '../components/BookCover'
import { Alert } from '../../../components/Alert'
import { AppLink } from '../../../components/AppLink'
import { Button } from '../../../components/Button'
import { EmptyState } from '../../../components/EmptyState'
import { formatBookAuthors } from '../authorDisplay'
import { LoadingState } from '../../../components/LoadingState'
import { QueryErrorState } from '../../../components/QueryErrorState'
import { useInfiniteBooks } from '../../../api/booksQueries'
import {
    useInfiniteIncompleteMetadataBooks,
} from '../../../api/dashboardQueries'
import { useCategories } from '../../../api/categoriesQueries'
import { enumDisplayValue } from '../../../api/enumDisplay'
import type {
    Status,
} from '../../../api/apiTypes'
import { useInfiniteScrollTrigger } from '../../../hooks/useInfiniteScrollTrigger'
import { formatShelfCommonNameForDisplay } from '../../shelves/shelfDisplay'
import { BooksListControls } from '../components/BooksListControls'
import {
    formatBookCategories,
} from '../categoryDisplay'
import { BooksBulkActions } from '../components/BooksBulkActions'
import { useBulkSelection } from '../useBulkSelection'
import {
    flattenInfiniteBookPages,
    parseCategoryIdParams,
    parseIsbnParam,
    parseReadStatusParam,
    parseSortByParam,
    parseSortOrderParam,
    parseTextFilterParam,
    parseCleanupFieldParam,
    type BookCleanupField,
    type BookSortBy,
    type BookSortOrder,
} from '../booksListModel'
import { isValidIsbn } from '../utils/isbn'
import { useCollectionIsbnJump } from '../../scanning/useCollectionIsbnJump'
import { BookSelectionControl } from '../components/BookSelectionControl'
import { isBookBulkSelectable } from '../utils/bulkSelectionModel'

const STATUS_VALUES: readonly Status[] = [
    'unknown',
    'available',
    'on_loan',
    'missing',
    'display_only',
    'reserved',
    'reading',
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

function cleanupFieldLabel(
    field: BookCleanupField,
): string {
    switch (field) {
        case 'category':
            return 'category'
        case 'shelf':
            return 'shelf'
        case 'pages':
            return 'page count'
        case 'publisher':
            return 'publisher'
        case 'year':
            return 'publication year'
        case 'isbn':
            return 'ISBN'
    }
}

function updateListParams(
    searchParams: URLSearchParams,
    updates: {
        categoryIds?: string[] | undefined
        author?: string | undefined
        title?: string | undefined
        isbn?: string | undefined
        shelfName?: string | undefined
        isRead?: boolean | undefined
        cleanupField?: BookCleanupField | undefined
        sortBy?: BookSortBy
        sortOrder?: BookSortOrder
    },
): URLSearchParams {
    const next = new URLSearchParams(searchParams)

    if ('categoryIds' in updates) {
        next.delete('category_id')

        for (const categoryId of updates.categoryIds ?? []) {
            next.append(
                'category_id',
                categoryId,
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

    if ('isbn' in updates) {
        if (updates.isbn === undefined) {
            next.delete('isbn')
        } else {
            next.set('isbn', updates.isbn)
        }
    }

    if ('shelfName' in updates) {
        const shelfName = updates.shelfName?.trim()

        if (shelfName) {
            next.set('shelf_name', shelfName)
        } else {
            next.delete('shelf_name')
        }
    }

    if ('cleanupField' in updates) {
        if (updates.cleanupField === undefined) {
            next.delete('cleanup_field')
        } else {
            next.set(
                'cleanup_field',
                updates.cleanupField,
            )
        }
    }

    if ('isRead' in updates) {
        if (updates.isRead === undefined) {
            next.delete('is_read')
        } else {
            next.set(
                'is_read',
                String(updates.isRead),
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

    next.delete('page')

    return next
}

export function BooksPage() {
    useCollectionIsbnJump()

    const navigate = useNavigate()
    const uniqueOpenedIsbnRef =
        useRef<string | null>(null)

    const [
        searchParams,
        setSearchParams,
    ] = useSearchParams()

    const categoriesQuery = useCategories()

    const sortBy = parseSortByParam(
        searchParams.get('sortBy'),
    )
    const sortOrder = parseSortOrderParam(
        searchParams.get('sortOrder'),
    )
    const categoryIds = parseCategoryIdParams(
        searchParams.getAll('category_id'),
    )
    const author = parseTextFilterParam(
        searchParams.get('author'),
    )
    const title = parseTextFilterParam(
        searchParams.get('title'),
    )
    const shelfName = parseTextFilterParam(
        searchParams.get('shelf_name'),
    )
    const isRead = parseReadStatusParam(
        searchParams.get('is_read'),
    )

    const cleanupField = parseCleanupFieldParam(
        searchParams.get('cleanup_field'),
    )

    const isbn = parseIsbnParam(
        searchParams.get('isbn'),
    )

    const isUnifiedSearch =
        author !== undefined &&
        title === undefined

    /*
     * Unified catalog search tries the entered value
     * against authors first.
     *
     * Explicit title URLs and legacy author+title URLs
     * continue to use their filters literally.
     */
    const authorBooksQuery = useInfiniteBooks({
        categoryIds:
            categoryIds.length === 0
                ? undefined
                : categoryIds,
        author,
        title,
        isbn,
        shelfName,
        isRead,
        sortBy,
        sortOrder,
        enabled: cleanupField === undefined,
    })

    const authorSearchTotal =
        authorBooksQuery.data?.pages[0]?.total

    const shouldTryTitleSearch =
        cleanupField === undefined &&
        isUnifiedSearch &&
        authorBooksQuery.isSuccess &&
        authorSearchTotal === 0

    /*
     * Only make the fallback request after the author
     * search has completed successfully with zero matches.
     *
     * All other active catalog filters remain applied.
     */
    const titleFallbackBooksQuery =
        useInfiniteBooks({
            categoryIds:
                categoryIds.length === 0
                    ? undefined
                    : categoryIds,
            author: undefined,
            title: author,
            isbn,
            shelfName,
            isRead,
            sortBy,
            sortOrder,
            enabled: shouldTryTitleSearch,
        })

    const catalogBooksQuery =
        shouldTryTitleSearch
            ? titleFallbackBooksQuery
            : authorBooksQuery

    const cleanupBooksQuery =
        useInfiniteIncompleteMetadataBooks({
            field: cleanupField,
            enabled: cleanupField !== undefined,
        })

    const booksQuery =
        cleanupField === undefined
            ? catalogBooksQuery
            : cleanupBooksQuery

    const fetchNextBooksPage =
        booksQuery.fetchNextPage

    const books = flattenInfiniteBookPages(
        booksQuery.data?.pages,
    )
    const total =
        booksQuery.data?.pages[0]?.total ?? 0
    const hasActiveFilters =
        categoryIds.length > 0 ||
        author !== undefined ||
        title !== undefined ||
        isbn !== undefined ||
        shelfName !== undefined ||
        isRead !== undefined ||
        cleanupField !== undefined

    const bulkSelectionResultIdentity =
        JSON.stringify({
            categoryIds,
            author: author ?? null,
            title: title ?? null,
            isbn: isbn ?? null,
            shelfName: shelfName ?? null,
            isRead: isRead ?? null,
            cleanupField: cleanupField ?? null,
        })

    const [
        isBulkSelectionMode,
        setIsBulkSelectionMode,
    ] = useState(false)

    const bulkSelection = useBulkSelection({
        books,
        resultIdentity:
        bulkSelectionResultIdentity,
    })

    useEffect(() => {
        if (
            cleanupField !== undefined ||
            isbn === undefined ||
            !isValidIsbn(isbn) ||
            !booksQuery.isSuccess ||
            total !== 1 ||
            books.length !== 1 ||
            uniqueOpenedIsbnRef.current === isbn
        ) {
            return
        }

        uniqueOpenedIsbnRef.current = isbn

        navigate(
            `/books/${books[0].id}`,
            {
                replace: true,
            },
        )
    }, [
        cleanupField,
        books,
        booksQuery.isSuccess,
        isbn,
        navigate,
        total,
    ])

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
        <section className="route-page books-page">
            <div className="books-page__heading">
                <h1 tabIndex={-1}>Books</h1>
                <p>
                    {total} books in the library.
                </p>
            </div>

            {isBulkSelectionMode ? (
                <BooksBulkActions
                    selectedBookIds={
                        bulkSelection.selectedBooks.map(
                            (book) => book.id,
                        )
                    }
                    selectedCount={
                        bulkSelection.selectedCount
                    }
                    onSelectVisible={
                        bulkSelection.selectVisible
                    }
                    onClear={bulkSelection.clear}
                    onExit={() => {
                        bulkSelection.clear()
                        setIsBulkSelectionMode(false)
                    }}
                />
            ) : null}

            {cleanupField === undefined ? (
            <BooksListControls
                key={`${author ?? ''}:${title ?? ''}:${isRead === undefined ? '' : String(isRead)}`}
                categories={
                    categoriesQuery.data ?? []
                }
                categoryIds={categoryIds}
                author={author ?? ''}
                title={title ?? ''}
                isRead={isRead}
                sortBy={sortBy}
                sortOrder={sortOrder}
                selectionMode={
                    isBulkSelectionMode
                }
                onEnterSelectionMode={() => {
                    setIsBulkSelectionMode(true)
                }}

                onSearch={(search) => {
                    setSearchParams(
                        updateListParams(
                            searchParams,
                            {
                                /*
                                    * A unified search is represented
                                    * by author alone. BooksPage tries
                                    * author first and falls back to
                                    * title when author has no matches.
                                 */
                                author: search,
                                title: undefined,
                            },
                        ),
                        {
                            replace: true,
                        },
                    )
                }}

                onCategoryIdsChange={(
                    nextCategoryIds,
                ) => {
                    setSearchParams(
                        updateListParams(
                            searchParams,
                            {
                                categoryIds:
                                    nextCategoryIds,
                            },
                        ),
                        {
                            replace: true,
                        },
                    )
                }}

                onReadStatusChange={(nextIsRead) => {
                    setSearchParams(
                        updateListParams(
                            searchParams,
                            {
                                isRead: nextIsRead,
                            },
                        ),
                        {
                            replace: true,
                        },
                    )
                }}

                onSortChange={(
                    nextSortBy,
                    nextSortOrder,
                ) => {
                    setSearchParams(
                        updateListParams(
                            searchParams,
                            {
                                sortBy: nextSortBy,
                                sortOrder:
                                nextSortOrder,
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
                                categoryIds: [],
                                author: undefined,
                                title: undefined,
                                isbn: undefined,
                                shelfName: undefined,
                                isRead: undefined,
                                cleanupField: undefined,
                            },
                        ),
                        {
                            replace: true,
                        },
                    )
                }}
            /> ) : null}

            {cleanupField !== undefined ? (
                <div
                    className="books-page__isbn-filter"
                    role="status"
                    aria-live="polite"
                >
                    <p>
                        Showing books missing{' '}
                        <strong>
                            {cleanupFieldLabel(cleanupField)}
                        </strong>
                        .
                    </p>

                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                            setSearchParams(
                                updateListParams(
                                    searchParams,
                                    {
                                        cleanupField: undefined,
                                    },
                                ),
                                {
                                    replace: true,
                                },
                            )
                        }}
                    >
                        Clear cleanup filter
                    </Button>
                </div>
            ) : null}

            {cleanupField === undefined &&
            isbn !== undefined ? (
                <div
                    className="books-page__isbn-filter"
                    role="status"
                    aria-live="polite"
                >
                    <p>
                        Showing books matching ISBN{' '}
                        <strong>{isbn}</strong>.
                    </p>

                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                            setSearchParams(
                                updateListParams(
                                    searchParams,
                                    {
                                        isbn: undefined,
                                    },
                                ),
                                {
                                    replace: true,
                                },
                            )
                        }}
                    >
                        Clear ISBN
                    </Button>
                </div>
            ) : null}

            {cleanupField === undefined &&
            shelfName !== undefined ? (
                <div
                    className="books-page__isbn-filter"
                    role="status"
                    aria-live="polite"
                >
                    <p>
                        Showing books on shelf{' '}
                        <strong>
                            {formatShelfCommonNameForDisplay(
                                shelfName,
                            )}
                        </strong>.
                    </p>

                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                            setSearchParams(
                                updateListParams(
                                    searchParams,
                                    {
                                        shelfName: undefined,
                                    },
                                ),
                                {
                                    replace: true,
                                },
                            )
                        }}
                    >
                        Clear shelf
                    </Button>
                </div>
            ) : null}

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
                                        categoryIds: [],
                                        author: undefined,
                                        title: undefined,
                                        isbn: undefined,
                                        shelfName: undefined,
                                        isRead: undefined,
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

                        const category =
                            formatBookCategories(
                                book.categories,
                            )

                        const shelf =
                            formatShelfCommonNameForDisplay(
                                book.shelf_name,
                            )

                        const isSelectable =
                            isBookBulkSelectable(book)

                        const isSelected =
                            bulkSelection.isSelected(
                                book.id,
                            )

                        return (
                            <li
                                key={book.id}
                                ref={getRowRef(index)}
                                className="books-list__item"
                            >
                                <article
                                    className={
                                        isSelected
                                            ? 'book-card book-card--selected'
                                            : 'book-card'
                                    }
                                >
                                    {isBulkSelectionMode &&
                                    isSelectable ? (
                                        <div className="book-card__selection">
                                            <BookSelectionControl
                                                bookTitle={book.title}
                                                checked={isSelected}
                                                onChange={() => {
                                                    bulkSelection.toggle(
                                                        book.id,
                                                    )
                                                }}
                                            />
                                        </div>
                                    ) : null}

                                    <div className="book-card__cover">
                                        <BookCover
                                            bookId={book.id}
                                            title={book.title}
                                            status={book.status}
                                            decorative
                                        />
                                    </div>

                                    <div className="book-card__content">
                                        <div className="book-card__heading">
                                            <h2 className="book-card__title">
                                                <AppLink
                                                    to={`/books/${book.id}`}
                                                >
                                                    {book.title}
                                                </AppLink>
                                            </h2>

                                            <p className="book-card__author">
                                                {formatBookAuthors(
                                                    book.authors,
                                                )}
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
                                    </div>
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
