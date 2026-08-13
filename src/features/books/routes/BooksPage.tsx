import { Alert } from '../../../components/Alert'
import { AppLink } from '../../../components/AppLink'
import { Button } from '../../../components/Button'
import { EmptyState } from '../../../components/EmptyState'
import { LoadingState } from '../../../components/LoadingState'
import { useBooks } from '../../../api/booksQueries'
import { enumDisplayValue } from '../../../api/enumDisplay'
import type {
    Category,
    Shelf,
    Status,
} from '../../../api/apiTypes'

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

export function BooksPage() {
    const booksQuery = useBooks()

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
                <Alert
                    variant="error"
                    title="Unable to load books"
                >
                    {booksQuery.error instanceof Error
                        ? booksQuery.error.message
                        : 'An unexpected error occurred.'}
                </Alert>
                <Button
                    type="button"
                    onClick={() => {
                        void booksQuery.refetch()
                    }}
                >
                    Retry
                </Button>
            </section>
        )
    }

    const books = booksQuery.data.items

    if (booksQuery.data.total === 0) {
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
            <div>
                <h1 tabIndex={-1}>Books</h1>
                <p>
                    {booksQuery.data.total} books in
                    the library.
                </p>
            </div>

            <ul aria-label="Library books">
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
                        <li key={book.id}>
                            <article>
                                <h2>
                                    <AppLink
                                        to={`/books/${book.id}`}
                                    >
                                        {book.title}
                                    </AppLink>
                                </h2>

                                <p>
                                    {book.authors}
                                </p>

                                <dl>
                                    <div>
                                        <dt>Status</dt>
                                        <dd>
                                            {status}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt>Reading</dt>
                                        <dd>
                                            {displayReadState(
                                                book.is_read,
                                            )}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt>Category</dt>
                                        <dd>
                                            {category}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt>Shelf</dt>
                                        <dd>
                                            {shelf}
                                        </dd>
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
