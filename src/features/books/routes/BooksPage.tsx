import { Alert } from '../../../components/Alert'
import { AppLink } from '../../../components/AppLink'
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
    'a1',
    'a2',
    'a3',
    'a4',
    'b1',
    'b2',
    'b3',
    'bath',
    'c1',
    'c2',
    'c3',
    'c4',
    'd1',
    'd2',
    'd3',
    'd4',
    'd5',
    'e1',
    'e2',
    'e3',
    'e4',
    'e5',
    'e6',
    'f1',
    'f2',
    'f3',
    'f4',
    'f5',
    'g1',
    'g2',
    'g3',
    'g4',
    'g5',
    'g6',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
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


return result.known
    ? result.value
    : `Unknown (${result.value})`


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
        </section>
    )
}

const books = booksQuery.data.items

if (booksQuery.data.total === 0) {
    return (
        <section className="route-page">
            <h1>Books</h1>

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
            <h1>Books</h1>
            <p>
                {booksQuery.data.total} books in
                the library.
            </p>
        </div>

        <div>
            {books.map((book) => (
                <article key={book.id}>
                    <h2>
                        <AppLink
                            to={`/books/${book.id}`}
                        >
                            {book.title}
                        </AppLink>
                    </h2>

                    <p>
                        Authors: {book.authors}
                    </p>

                    <p>
                        Status:{' '}
                        {displayEnum(
                            book.status,
                            STATUS_VALUES,
                        )}
                    </p>

                    <p>
                        Reading status:{' '}
                        {book.is_read
                            ? 'Read'
                            : 'Unread'}
                    </p>

                    <p>
                        Category:{' '}
                        {displayEnum(
                            book.category,
                            CATEGORY_VALUES,
                        )}
                    </p>

                    <p>
                        Shelf:{' '}
                        {displayEnum(
                            book.shelf,
                            SHELF_VALUES,
                        )}
                    </p>
                </article>
            ))}
        </div>
    </section>
)


}
