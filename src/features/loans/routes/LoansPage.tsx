import { Alert } from '../../../components/Alert'
import { AppLink } from '../../../components/AppLink'
import { Button } from '../../../components/Button'
import { EmptyState } from '../../../components/EmptyState'
import { LoadingState } from '../../../components/LoadingState'
import { QueryErrorState } from '../../../components/QueryErrorState'
import type {
    LoanRead,
} from '../../../api/apiTypes'
import {
    useBooks,
} from '../../../api/booksQueries'
import {
    useInfiniteLoans,
} from '../../../api/loansQueries'
import { useInfiniteScrollTrigger } from '../../../hooks/useInfiniteScrollTrigger'
import {
    flattenInfiniteListPages,
} from '../loansListModel'
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
    const loansQuery = useInfiniteLoans()
    const booksQuery = useBooks()

    const fetchNextLoansPage =
        loansQuery.fetchNextPage

    const loans = flattenInfiniteListPages<
        {
            items: LoanRead[]
        },
        LoanRead
    >(loansQuery.data?.pages)
    const total =
        loansQuery.data?.pages[0]?.total ?? 0

    const {
        getRowRef,
    } = useInfiniteScrollTrigger({
        enabled: loansQuery.isSuccess,
        hasNextPage: loansQuery.hasNextPage,
        isFetchingNextPage:
            loansQuery.isFetchingNextPage,
        fetchNextPage: () => {
            void fetchNextLoansPage()
        },
        itemCount: loans.length,
    })

    const loanIndexById = new Map(
        loans.map((loan, index) => [
            loan.id,
            index,
        ]),
    )

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

    if (loansQuery.isLoadingError) {
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

    if (total === 0) {
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

    // Book titles resolve from the unpaginated collection cache; paginate loans only.
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

    function renderLoanRowRef(
        loanId: string,
    ) {
        const index =
            loanIndexById.get(loanId)

        if (index === undefined) {
            return undefined
        }

        return getRowRef(index)
    }

    return (
        <section className="route-page">
            <header>
                <h1 tabIndex={-1}>Loans</h1>

                <p>
                    {total} loan
                    {total === 1
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
                            <li
                                key={loan.id}
                                ref={renderLoanRowRef(
                                    loan.id,
                                )}
                            >
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
                            <li
                                key={loan.id}
                                ref={renderLoanRowRef(
                                    loan.id,
                                )}
                            >
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

            {loansQuery.isFetchingNextPage ? (
                <div className="infinite-scroll__footer">
                    <LoadingState label="Loading more loans…" />
                </div>
            ) : null}

            {loansQuery.isFetchNextPageError ? (
                <div className="infinite-scroll__footer">
                    <Alert variant="error">
                        Unable to load more loans.
                    </Alert>

                    <Button
                        variant="secondary"
                        onClick={() => {
                            void fetchNextLoansPage()
                        }}
                    >
                        Retry
                    </Button>
                </div>
            ) : null}
        </section>
    )
}
