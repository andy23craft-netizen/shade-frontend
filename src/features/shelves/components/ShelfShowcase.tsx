import {
    useEffect,
    useRef,
    useState,
} from 'react'

import { formatBookAuthors } from '../../books/authorDisplay'
import {
    AppLink,
    Button,
} from '../../../components'
import type {
    BookRead,
    ShelfRead,
} from '../../../api/apiTypes'
import {
    useBooks,
} from '../../../api/booksQueries'
import {
    BookCover,
} from '../../books/components/BookCover'
import {
    formatShelfCommonNameForDisplay,
} from '../shelfDisplay'

const SHELF_PREVIEW_SIZE = 12
const SCROLL_AMOUNT = 420

interface ShelfShowcaseProps {
    shelf: ShelfRead
    bookCount: number
    isSystem: boolean
    mutationBusy: boolean
    canDelete: boolean
    onEdit: () => void
    onDelete: () => void
}

function ShelfBookCard({
                           book,
                       }: {
    book: BookRead
}) {
    const publicationYear =
        book.publication_date?.slice(0, 4)

    return (
        <article className="book-card book-card--compact shelf-showcase__book-card">
            <div className="book-card__cover">
                <BookCover
                    bookId={book.book_id}
                    title={book.title}
                    status={book.status}
                    decorative
                />
            </div>

            <div className="book-card__content">
                <div className="book-card__heading">
                    <h3 className="book-card__title">
                        <AppLink
                            to={`/books/${encodeURIComponent(
                                book.book_id,
                            )}`}
                        >
                            {book.title}
                        </AppLink>
                    </h3>

                    {book.authors && book.authors.length > 0 ? (
                        <p className="book-card__author">
                            {formatBookAuthors(book.authors)}
                        </p>
                    ) : null}
                </div>

                {publicationYear ? (
                    <dl className="book-card__metadata">
                        <div className="book-card__field">
                            <dt>Year</dt>
                            <dd>
                                {publicationYear}
                            </dd>
                        </div>
                    </dl>
                ) : null}
            </div>
        </article>
    )
}

export function ShelfShowcase({
                                  shelf,
                                  bookCount,
                                  isSystem,
                                  mutationBusy,
                                  canDelete,
                                  onEdit,
                                  onDelete,
                              }: ShelfShowcaseProps) {
    const rootRef =
        useRef<HTMLElement | null>(null)

    const trackRef =
        useRef<HTMLUListElement | null>(null)

    const [
        shouldLoad,
        setShouldLoad,
    ] = useState(
        () =>
            typeof IntersectionObserver ===
            'undefined',
    )

    const [
        canScrollPrevious,
        setCanScrollPrevious,
    ] = useState(false)

    const [
        canScrollNext,
        setCanScrollNext,
    ] = useState(false)

    useEffect(() => {
        const node = rootRef.current

        if (!node) {
            return
        }

        if (
            typeof IntersectionObserver ===
            'undefined'
        ) {
            return
        }

        const observer =
            new IntersectionObserver(
                (entries) => {
                    if (
                        entries.some(
                            (entry) =>
                                entry.isIntersecting,
                        )
                    ) {
                        setShouldLoad(true)
                        observer.disconnect()
                    }
                },
                {
                    rootMargin: '500px 0px',
                },
            )

        observer.observe(node)

        return () => {
            observer.disconnect()
        }
    }, [])

    const booksQuery = useBooks({
        shelfName: shelf.common_name,
        skip: 0,
        take: SHELF_PREVIEW_SIZE,
        sortBy: 'title',
        sortOrder: 'asc',
        enabled:
            shouldLoad &&
            bookCount > 0,
    })

    function updateScrollState() {
        const track = trackRef.current

        if (!track) {
            return
        }

        const maxScroll =
            track.scrollWidth -
            track.clientWidth

        setCanScrollPrevious(
            track.scrollLeft > 4,
        )

        setCanScrollNext(
            track.scrollLeft <
            maxScroll - 4,
        )
    }

    useEffect(() => {
        updateScrollState()

        const track = trackRef.current

        if (!track) {
            return
        }

        const handleResize = () => {
            updateScrollState()
        }

        window.addEventListener(
            'resize',
            handleResize,
        )

        return () => {
            window.removeEventListener(
                'resize',
                handleResize,
            )
        }
    }, [
        booksQuery.data,
    ])

    function scrollTrack(
        direction: -1 | 1,
    ) {
        trackRef.current?.scrollBy({
            left:
                direction *
                SCROLL_AMOUNT,
            behavior: 'smooth',
        })
    }

    const shelfUrl =
        `/books?shelf_name=${encodeURIComponent(
            shelf.common_name,
        )}`

    return (
        <article
            ref={rootRef}
            className="shelf-showcase"
            aria-labelledby={`shelf-${shelf.shelf_id}`}
        >
            <div className="shelf-showcase__end">
                <div className="shelf-showcase__label">
                    <h2
                        id={`shelf-${shelf.shelf_id}`}
                        className="shelf-showcase__name"
                    >
                        <AppLink to={shelfUrl}>
                            {formatShelfCommonNameForDisplay(
                                shelf.common_name,
                            )}
                        </AppLink>
                    </h2>
                </div>

                <p className="shelf-showcase__count">
                    <AppLink to={shelfUrl}>
                        {bookCount}{' '}
                        {bookCount === 1
                            ? 'book'
                            : 'books'}
                    </AppLink>
                </p>

                {shelf.location ? (
                    <p className="shelf-showcase__location">
                        {shelf.location}
                    </p>
                ) : null}

                {shelf.description ? (
                    <p className="shelf-showcase__description">
                        {shelf.description}
                    </p>
                ) : null}

                {isSystem ? (
                    <p className="shelf-showcase__system">
                        System shelf
                    </p>
                ) : null}

                <div className="shelf-showcase__actions">
                    <Button
                        type="button"
                        variant="secondary"
                        disabled={mutationBusy}
                        onClick={onEdit}
                    >
                        Edit
                    </Button>

                    {canDelete ? (
                        <Button
                            type="button"
                            variant="danger"
                            disabled={mutationBusy}
                            onClick={onDelete}
                        >
                            Delete
                        </Button>
                    ) : null}
                </div>
            </div>

            <div className="shelf-showcase__books">
                <div className="shelf-showcase__toolbar">
                    <p>
                        Browse this shelf
                    </p>

                    <div className="shelf-showcase__controls">
                        <button
                            type="button"
                            className="shelf-showcase__arrow"
                            aria-label={`Previous books on ${formatShelfCommonNameForDisplay(
                                shelf.common_name,
                            )}`}
                            disabled={!canScrollPrevious}
                            onClick={() => {
                                scrollTrack(-1)
                            }}
                        >
                            ←
                        </button>

                        <button
                            type="button"
                            className="shelf-showcase__arrow"
                            aria-label={`Next books on ${formatShelfCommonNameForDisplay(
                                shelf.common_name,
                            )}`}
                            disabled={!canScrollNext}
                            onClick={() => {
                                scrollTrack(1)
                            }}
                        >
                            →
                        </button>
                    </div>
                </div>

                {bookCount === 0 ? (
                    <p className="shelf-showcase__empty">
                        No books are currently assigned
                        to this shelf.
                    </p>
                ) : !shouldLoad ||
                booksQuery.isPending ? (
                    <div
                        className="shelf-showcase__loading"
                        role="status"
                        aria-live="polite"
                    >
                        <p>
                            Loading{' '}
                            {formatShelfCommonNameForDisplay(
                                shelf.common_name,
                            )}
                            …
                        </p>

                        <div
                            className="shelf-showcase__loading-cards"
                            aria-hidden="true"
                        >
                            <span />
                            <span />
                            <span />
                        </div>
                    </div>
                ) : booksQuery.isError ? (
                    <p
                        className="shelf-showcase__error"
                        role="alert"
                    >
                        Unable to load this shelf preview.
                    </p>
                ) : (
                    <>
                        <ul
                            ref={trackRef}
                            className="shelf-showcase__track"
                            aria-label={`Books on ${formatShelfCommonNameForDisplay(
                                shelf.common_name,
                            )}`}
                            onScroll={
                                updateScrollState
                            }
                        >
                            {booksQuery.data.items.map(
                                (book) => (
                                    <li
                                        key={book.book_id}
                                        className="shelf-showcase__book"
                                    >
                                        <ShelfBookCard
                                            book={book}
                                        />
                                    </li>
                                ),
                            )}
                        </ul>

                        {bookCount >
                        SHELF_PREVIEW_SIZE ? (
                            <AppLink
                                className="shelf-showcase__browse-all"
                                to={shelfUrl}
                            >
                                Browse all {bookCount} books
                            </AppLink>
                        ) : null}
                    </>
                )}
            </div>
        </article>
    )
}
