import { Alert } from '../../../components/Alert'
import { AppLink } from '../../../components/AppLink'
import { Button } from '../../../components/Button'
import { EmptyState } from '../../../components/EmptyState'
import { LoadingState } from '../../../components/LoadingState'
import {
    useBooks,
} from '../../../api/booksQueries'
import {
    useLoans,
} from '../../../api/loansQueries'

function displayDate(
    value: string | null | undefined,
): string {
    if (!value) {
        return 'Not provided'
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return date.toLocaleString()
}

export function LoansPage() {
    const loansQuery = useLoans()
    const booksQuery = useBooks()

    if (
        loansQuery.isPending ||
        booksQuery.isPending
    ) {
        return (
            <section className="route-page">
                <h1 tabIndex={-1}>Loans</h1>
                <LoadingState label="Loading loans…" />
            </section>
        )
    }

    if (loansQuery.isError) {
        return (
            <section className="route-page">
                <h1 tabIndex={-1}>Loans</h1>

                <Alert
                    variant="error"
                    title="Unable to load loans"
                >
                    {loansQuery.error instanceof Error
                        ? loansQuery.error.message
                        : 'An unexpected error occurred.'}
                </Alert>

                <Button
                    type="button"
                    onClick={() => {
                        void loansQuery.refetch()
                    }}
                >
                    Retry
                </Button>
            </section>
        )
    }

    if (booksQuery.isError) {
        return (
            <section className="route-page">
                <h1 tabIndex={-1}>Loans</h1>

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

    const loans = loansQuery.data.items

    if (loans.length === 0) {
        return (
            <section className="route-page">
                <h1 tabIndex={-1}>Loans</h1>

                <EmptyState title="No loan history yet.">
                    <p>
                        Books that are checked out
                        will appear here.
                    </p>

                    <AppLink
                        to="/checkout"
                        variant="primary"
                    >
                        Check Out a Book
                    </AppLink>
                </EmptyState>
            </section>
        )
    }

    const booksById = new Map(
        booksQuery.data.items.map((book) => [
            book.id,
            book,
        ]),
    )

    const activeLoans = loans.filter(
        (loan) => loan.returned_at === null,
    )

    const returnedLoans = loans.filter(
        (loan) => loan.returned_at !== null,
    )

    function renderBookName(
        bookId: string,
    ) {
        const book = booksById.get(bookId)

        if (!book) {
            return (
                <span>
                    Book {bookId}
                </span>
            )
        }

        return (
            <AppLink
                to={`/books/${book.id}`}
            >
                {book.title}
            </AppLink>
        )
    }

    return (
        <section className="route-page">
            <header>
                <h1 tabIndex={-1}>Loans</h1>
                <p>
                    {loansQuery.data.total} loan
                    {loansQuery.data.total === 1
                        ? ''
                        : 's'} in the history.
                </p>
            </header>

            {activeLoans.length > 0 ? (
                <section>
                    <h2>Active Loans</h2>

                    <ul aria-label="Active loans">
                        {activeLoans.map((loan) => (
                            <li key={loan.id}>
                                <article>
                                    <h3>
                                        {renderBookName(
                                            loan.book_id,
                                        )}
                                    </h3>

                                    <dl>
                                        <div>
                                            <dt>
                                                Borrower
                                            </dt>
                                            <dd>
                                                {
                                                    loan.borrower
                                                }
                                            </dd>
                                        </div>

                                        <div>
                                            <dt>
                                                Checked Out
                                            </dt>
                                            <dd>
                                                {displayDate(
                                                    loan.checked_out_at,
                                                )}
                                            </dd>
                                        </div>

                                        <div>
                                            <dt>Due</dt>
                                            <dd>
                                                {displayDate(
                                                    loan.due_at,
                                                )}
                                            </dd>
                                        </div>

                                        {loan.notes ? (
                                            <div>
                                                <dt>
                                                    Notes
                                                </dt>
                                                <dd>
                                                    {
                                                        loan.notes
                                                    }
                                                </dd>
                                            </div>
                                        ) : null}
                                    </dl>
                                </article>
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}

            {returnedLoans.length > 0 ? (
                <section>
                    <h2>Returned Loans</h2>

                    <ul aria-label="Returned loans">
                        {returnedLoans.map((loan) => (
                            <li key={loan.id}>
                                <article>
                                    <h3>
                                        {renderBookName(
                                            loan.book_id,
                                        )}
                                    </h3>

                                    <dl>
                                        <div>
                                            <dt>
                                                Borrower
                                            </dt>
                                            <dd>
                                                {
                                                    loan.borrower
                                                }
                                            </dd>
                                        </div>

                                        <div>
                                            <dt>
                                                Checked Out
                                            </dt>
                                            <dd>
                                                {displayDate(
                                                    loan.checked_out_at,
                                                )}
                                            </dd>
                                        </div>

                                        <div>
                                            <dt>
                                                Returned
                                            </dt>
                                            <dd>
                                                {displayDate(
                                                    loan.returned_at,
                                                )}
                                            </dd>
                                        </div>

                                        {loan.notes ? (
                                            <div>
                                                <dt>
                                                    Notes
                                                </dt>
                                                <dd>
                                                    {
                                                        loan.notes
                                                    }
                                                </dd>
                                            </div>
                                        ) : null}
                                    </dl>
                                </article>
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}
        </section>
    )
}