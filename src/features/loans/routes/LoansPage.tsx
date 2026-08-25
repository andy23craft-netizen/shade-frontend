import { useQueryClient } from '@tanstack/react-query'
import {
    useSearchParams,
} from 'react-router-dom'

import loansStamp from '../../../assets/Loans_Stamp.webp'
import { Alert } from '../../../components/Alert'
import { AppLink } from '../../../components/AppLink'
import { Button } from '../../../components/Button'
import { EmptyState } from '../../../components/EmptyState'
import { LoadingState } from '../../../components/LoadingState'
import { QueryErrorState } from '../../../components/QueryErrorState'
import {
    isBookIdentityError,
} from '../../../api/bookIdentity'
import type {
    BookRead,
    LoanRead,
} from '../../../api/apiTypes'
import {
    useBook,
    useBooks,
} from '../../../api/booksQueries'
import {
    useInfiniteLoans,
    useLoans,
} from '../../../api/loansQueries'
import { queryKeys } from '../../../api/queryKeys'
import { useInfiniteScrollTrigger } from '../../../hooks/useInfiniteScrollTrigger'
import {
    findActiveLoan,
    isCheckinEligible,
} from '../checkinEligibility'
import { CheckinForm } from '../components/CheckinForm'
import {
    flattenInfiniteListPages,
} from '../loansListModel'
import {
    displayLoanDate,
    getLoanDueState,
} from '../loanTemporal'
import {
    useCollectionIsbnJump,
} from '../../scanning/useCollectionIsbnJump'

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

interface SelectedCheckinProps {
    bookId: string
    cachedBook?: BookRead
    loadedLoans: readonly LoanRead[]
    onClose: () => void
}

function SelectedCheckin({
                             bookId,
                             cachedBook,
                             loadedLoans,
                             onClose,
                         }: SelectedCheckinProps) {
    const loadedActiveLoan =
        findActiveLoan(
            bookId,
            loadedLoans,
        )

    if (
        cachedBook &&
        loadedActiveLoan &&
        isCheckinEligible(
            cachedBook,
            loadedLoans,
        )
    ) {
        return (
            <CheckinForm
                book={cachedBook}
                loans={loadedLoans}
                onCancel={onClose}
                onSuccess={onClose}
            />
        )
    }

    return (
        <TargetedCheckin
            bookId={bookId}
            cachedBook={cachedBook}
            onClose={onClose}
        />
    )
}

interface TargetedCheckinProps {
    bookId: string
    cachedBook?: BookRead
    onClose: () => void
}

function TargetedCheckin({
                             bookId,
                             cachedBook,
                             onClose,
                         }: TargetedCheckinProps) {
    const queryClient = useQueryClient()

    const loansQuery = useLoans({
        bookId,
    })

    const needsBook =
        cachedBook === undefined

    const bookQuery = useBook(
        needsBook
            ? bookId
            : '',
    )

    const book =
        cachedBook ?? bookQuery.data

    async function refreshLoanState() {
        await Promise.all([
            queryClient.invalidateQueries({
                queryKey: queryKeys.books.all,
            }),
            queryClient.invalidateQueries({
                queryKey: queryKeys.loans.all,
            }),
        ])

        onClose()
    }

    if (
        loansQuery.isPending ||
        (needsBook && bookQuery.isPending)
    ) {
        return (
            <LoadingState label="Loading check-in…" />
        )
    }

    if (
        needsBook &&
        bookQuery.isError
    ) {
        const isNotFound =
            isBookIdentityError(bookQuery.error)

        if (isNotFound) {
            return (
                <div>
                    <Alert
                        variant="warning"
                        title="Book is not available for check-in"
                    >
                        The selected book could not
                        be found or is no longer
                        eligible for check-in.
                    </Alert>

                    <Button
                        type="button"
                        onClick={() => {
                            void refreshLoanState()
                        }}
                    >
                        Refresh loans
                    </Button>
                </div>
            )
        }

        return (
            <QueryErrorState
                title="Unable to load book"
                error={bookQuery.error}
                onRetry={() => {
                    void bookQuery.refetch()
                }}
            />
        )
    }

    if (loansQuery.isError) {
        return (
            <QueryErrorState
                title="Unable to load loan state"
                error={loansQuery.error}
                onRetry={() => {
                    void loansQuery.refetch()
                }}
            />
        )
    }

    if (
        !book ||
        !isCheckinEligible(
            book,
            loansQuery.data.items,
        )
    ) {
        return (
            <div>
                <Alert
                    variant="warning"
                    title="Book is not checked out"
                >
                    {book
                        ? `${book.title} does not currently have an active loan.`
                        : 'The selected book is not available for check-in.'}
                </Alert>

                <Button
                    type="button"
                    onClick={() => {
                        void refreshLoanState()
                    }}
                >
                    Refresh loans
                </Button>
            </div>
        )
    }

    return (
        <CheckinForm
            book={book}
            loans={loansQuery.data.items}
            onCancel={onClose}
            onSuccess={onClose}
        />
    )
}

export function LoansPage() {
    useCollectionIsbnJump()

    const [
        searchParams,
        setSearchParams,
    ] = useSearchParams()

    const selectedBookId =
        searchParams.get('bookId') ?? ''

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

                    <AppLink to="/books">
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

    const selectedBook =
        selectedBookId
            ? booksById.get(selectedBookId)
            : undefined

    function clearSelectedBook() {
        setSearchParams({})
    }

    function selectBookForCheckin(
        bookId: string,
    ) {
        setSearchParams({
            bookId,
        })
    }

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
        <section className="route-page circulation-page loans-page loans-page--decorated">
            <img
                className="loans-library-stamp"
                src={loansStamp}
                alt=""
                aria-hidden="true"
            />
            <header>
                <h1 tabIndex={-1}>Loans</h1>

                <p>
                    {total} loan
                    {total === 1
                        ? ''
                        : 's'} in the history.
                </p>
            </header>

            {selectedBookId ? (
                <SelectedCheckin
                    bookId={selectedBookId}
                    cachedBook={selectedBook}
                    loadedLoans={loans}
                    onClose={clearSelectedBook}
                />
            ) : null}

            <section>
                <h2>Active Loans</h2>

                {activeLoans.length === 0 ? (
                    <p role="status">
                        No books are currently checked out.
                    </p>
                ) : (
                    <ul
                        className="loans-card-list"
                        aria-label="Active loans"
                    >
                        {activeLoans.map((loan) => (
                            <li
                                key={loan.id}
                                ref={renderLoanRowRef(
                                    loan.id,
                                )}
                            >
                                <article className="circulation-record-card">
                                    <header className="circulation-record-card__heading">
                                        <p className="circulation-record-card__eyebrow">
                                            {dueStateLabel(loan.due_at)}
                                        </p>

                                        <h3>
                                            {renderBookName(
                                                loan.book_id,
                                            )}
                                        </h3>
                                    </header>

                                    <dl className="circulation-record-card__metadata">
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
                                            <div className="circulation-record-card__metadata-wide">
                                                <dt>
                                                    Notes
                                                </dt>
                                                <dd>
                                                    {loan.notes}
                                                </dd>
                                            </div>
                                        ) : null}
                                    </dl>

                                    {(() => {
                                        const book =
                                            booksById.get(
                                                loan.book_id,
                                            )

                                        if (
                                            !book ||
                                            !isCheckinEligible(
                                                book,
                                                loans,
                                            )
                                        ) {
                                            return null
                                        }

                                        return (
                                            <div className="circulation-record-card__actions">
                                                <Button
                                                    type="button"
                                                    variant="primary"
                                                    onClick={() =>
                                                        selectBookForCheckin(
                                                            book.id,
                                                        )
                                                    }
                                                >
                                                    Check In
                                                </Button>
                                            </div>
                                        )
                                    })()}

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
                    <ul
                        className="loans-card-list"
                        aria-label="Returned loans"
                    >
                        {returnedLoans.map((loan) => (
                            <li
                                key={loan.id}
                                ref={renderLoanRowRef(
                                    loan.id,
                                )}
                            >
                                <article className="circulation-record-card">
                                    <header className="circulation-record-card__heading">
                                        <p className="circulation-record-card__eyebrow">
                                            Returned
                                        </p>

                                        <h3>
                                            {renderBookName(
                                                loan.book_id,
                                            )}
                                        </h3>
                                    </header>

                                    <dl className="circulation-record-card__metadata">
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
                                            <div className="circulation-record-card__metadata-wide">
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
