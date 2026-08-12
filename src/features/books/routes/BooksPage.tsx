import { AppLink } from '../../../components/AppLink'
import { Alert } from '../../../components/Alert'
import { EmptyState } from '../../../components/EmptyState'
import { LoadingState } from '../../../components/LoadingState'
import { useBooks } from '../../../api/booksQueries'

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

    if (books.length === 0) {
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

                        <p>{book.authors}</p>

                        <p>
                            {book.category} ·{' '}
                            {book.shelf} ·{' '}
                            {book.status}
                        </p>
                    </article>
                ))}
            </div>
        </section>
    )
}