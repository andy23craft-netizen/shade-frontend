import { AppLink } from '../../../components/AppLink'
import { EmptyState } from '../../../components/EmptyState'
import { LoadingState } from '../../../components/LoadingState'
import { QueryErrorState } from '../../../components/QueryErrorState'
import {
    useBooks,
} from '../../../api/booksQueries'
import {
    useLoans,
} from '../../../api/loansQueries'
import {
    displayLoanDate,
    getLoanDueState,
} from '../loanTemporal'

function dueStateLabel(
    dueAt: string | null | undefined,
): string {
    const state =
        getLoanDueState(dueAt)

    switch (state) {
        case 'no_due_date':
            return 'Active — no due date'
        case 'due':
            return 'Active — due'
        case 'due_today':
            return 'Active — due today'
        case 'overdue':
            return 'Active — overdue'
        case 'unknown':
            return 'Active — due date could not be interpreted'
    }
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

                <QueryErrorState
                    title="Unable to load loans"
                    error={loansQuery.error}
                    onRetry={() => {
                        void loansQuery.refetch()
                    }}
                />
            </section>
        )
    }

    if (booksQuery.isError) {
        return (
            <section className="route-page">
                <h1 tabIndex={-1}>Loans</h1>

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

            <section>
                <h2>Active Loans</h2>

                {activeLoans.length === 0 ? (
                    <p role="status">
                        No books are currently checked out.
                    </p>
                ) : (
                    <ul aria-label="Active loans">
                        {activeLoans.map((loan) => (
                            <li key={loan.id}>
                                <article>
                                    <h3>
                                        {renderBookName(
                                            loan.book_id,
                                        )}
                                    </h3>

                                    <p>
                                        <strong>
                                            {
                                                dueStateLabel(
                                                    loan.due_at,
                                                )
                                            }
                                        </strong>
                                    </p>

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
                                                {displayLoanDate(
                                                    loan.checked_out_at,
                                                )}
                                            </dd>
                                        </div>

                                        <div>
                                            <dt>
                                                Due
                                            </dt>
                                            <dd>
                                                {displayLoanDate(
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
                )}
            </section>

            <section>
                <h2>Returned Loans</h2>

                {returnedLoans.length === 0 ? (
                    <p role="status">
                        No returned loans yet.
                    </p>
                ) : (
                    <ul aria-label="Returned loans">
                        {returnedLoans.map((loan) => (
                            <li key={loan.id}>
                                <article>
                                    <h3>
                                        {renderBookName(
                                            loan.book_id,
                                        )}
                                    </h3>

                                    <p>
                                        <strong>
                                            Returned
                                        </strong>
                                    </p>

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
                                                {displayLoanDate(
                                                    loan.checked_out_at,
                                                )}
                                            </dd>
                                        </div>

                                        <div>
                                            <dt>
                                                Returned
                                            </dt>
                                            <dd>
                                                {displayLoanDate(
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
                )}
            </section>
        </section>
    )
}
