import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { LoansPage } from './LoansPage'
import type {
    BookList,
    LoanList,
} from '../../../api/apiTypes'
import { ApiError } from '../../../api/apiErrors'
import { renderWithProviders } from '../../../test/renderAppTree'

const mockUseInfiniteLoans = vi.fn()
const mockUseLoans = vi.fn()
const mockUseBooks = vi.fn()
const mockUseBook = vi.fn()
const mockUseInfiniteScrollTrigger = vi.fn()
const mockUseCollectionIsbnJump = vi.fn()

vi.mock('../../scanning/useCollectionIsbnJump', () => ({
    useCollectionIsbnJump: () =>
        mockUseCollectionIsbnJump(),
}))
vi.mock('../../../api/loansQueries', () => ({
    useInfiniteLoans: () => mockUseInfiniteLoans(),
    useLoans: (options: unknown) =>
        mockUseLoans(options),
}))

vi.mock('../../../api/booksQueries', () => ({
    useBooks: () => mockUseBooks(),
    useBook: (id: string) =>
        mockUseBook(id),
}))

vi.mock('../../../hooks/useInfiniteScrollTrigger', () => ({
    useInfiniteScrollTrigger: (
        options: unknown,
    ) =>
        mockUseInfiniteScrollTrigger(options),
}))

vi.mock('../components/CheckinDialog', () => ({
    CheckinDialog: ({
                        book,
                        onClose,
                    }: {
        book: {
            id: string
            title: string
        }
        onClose: () => void
    }) => (
        <div
            role="dialog"
            aria-label="Check In"
            data-testid="checkin-form"
        >
            <p>
                Returning {book.title}
            </p>

            <button
                type="button"
                onClick={onClose}
            >
                Cancel return
            </button>

            <button
                type="button"
                onClick={onClose}
            >
                Complete return
            </button>
        </div>
    ),
}))

function makeBookList(
    overrides: Partial<BookList> = {},
): BookList {
    return {
        items: [
            {
                id: 'book-1',
                title: 'The Left Hand of Darkness',
                authors: [
                    {
                        author_id: 'author-ursula-le-guin',
                        first_name: 'Ursula K.',
                        surname: 'Le Guin',
                    },
                ],
                categories: [{ category_id: 'cat-fiction', name: 'Fiction', slug: 'fiction' }],
                shelf_name: 'liz_tbr',
                status: 'on_loan',
                is_read: false,
                isbn13: null,
                publisher: null,
                publication_date: null,
                pages: null,
                tags: null,
                purchase_date: null,
                purchase_price: null,
                acquisition_source: null,
                notes: null,
                completion_date: null,
                rating: null,
                review: null,
                times_borrowed: 1,
                last_borrowed_at:
                    '2026-08-12T14:00:00Z',
                average_loan_days: null,
                creation_date: '2026-08-01T00:00:00Z',
                updated_date: '2026-08-12T14:00:00Z',
            },
        ],
        total: 1,
        ...overrides,
    }
}

function makeLoanList(
    overrides: Partial<LoanList> = {},
): LoanList {
    return {
        items: [
            {
                id: 'loan-1',
                book_id: 'book-1',
                borrower: 'Jane Reader',
                checked_out_at:
                    '2026-08-12T14:00:00Z',
                created_date:
                    '2026-08-12T14:00:00Z',
                due_at:
                    '2026-08-20T14:00:00Z',
                last_updated_date:
                    '2026-08-12T14:00:00Z',
                notes: 'Read for book club.',
                returned_at: null,
            },
        ],
        total: 1,
        ...overrides,
    }
}

function makeInfiniteLoansResult(
    pages: LoanList[],
    overrides: Record<string, unknown> = {},
) {
    return {
        isPending: false,
        isError: false,
        isSuccess: true,
        hasNextPage: false,
        isFetchingNextPage: false,
        isFetchNextPageError: false,
        fetchNextPage: vi.fn(),
        refetch: vi.fn(),
        data: {
            pages,
        },
        ...overrides,
    }
}

function renderPage(
    initialEntry = '/loans',
) {
    return renderWithProviders(
        <MemoryRouter
            initialEntries={[initialEntry]}
        >
            <LoansPage />
        </MemoryRouter>,
    )
}

describe('LoansPage', () => {
    beforeEach(() => {
        mockUseInfiniteLoans.mockReset()
        mockUseBooks.mockReset()
        mockUseInfiniteScrollTrigger.mockReset()
        mockUseLoans.mockReset()
        mockUseBook.mockReset()
        mockUseCollectionIsbnJump.mockReset()

        mockUseLoans.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeLoanList(),
            refetch: vi.fn(),
        })

        mockUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: undefined,
            refetch: vi.fn(),
        })

        mockUseInfiniteScrollTrigger.mockReturnValue({
            getRowRef: () => undefined,
        })
    })

    it('shows a loading state while loans are loading', () => {
        mockUseInfiniteLoans.mockReturnValue({
            isPending: true,
            isError: false,
        })

        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
        })

        renderPage()

        expect(
            screen.getByRole('heading', {
                name: 'Loans',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'Loading loans…',
        )
    })

    it('shows a loading state while books are loading', () => {
        mockUseInfiniteLoans.mockReturnValue(
            makeInfiniteLoansResult([
                makeLoanList(),
            ]),
        )

        mockUseBooks.mockReturnValue({
            isPending: true,
            isError: false,
        })

        renderPage()

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'Loading loans…',
        )
    })

    it('shows an error when the loan collection fails', () => {
        mockUseInfiniteLoans.mockReturnValue({
            isPending: false,
            isLoadingError: true,
            isError: true,
            error: new Error(
                'Unable to reach the loans API',
            ),
        })

        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeBookList(),
        })

        renderPage()

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            'Unable to reach the loans API',
        )

        expect(
            screen.getByRole('button', {
                name: 'Retry',
            }),
        ).toBeInTheDocument()
    })

    it(
        'shows a rejected-access message without retry when loans return 403',
        () => {
            mockUseInfiniteLoans.mockReturnValue({
                isPending: false,
                isLoadingError: true,
                isError: true,
                error: new ApiError({
                    kind: 'unauthorized',
                    status: 403,
                    message:
                        'API access was rejected.',
                }),
            })

            mockUseBooks.mockReturnValue({
                isPending: false,
                isError: false,
                data: makeBookList(),
            })

            renderPage()

            expect(
                screen.getByRole('alert'),
            ).toHaveTextContent(
                'API access was rejected.',
            )

            expect(
                screen.queryByRole('button', {
                    name: 'Retry',
                }),
            ).not.toBeInTheDocument()
        },
    )

    it('shows an error when the book collection fails', () => {
        mockUseInfiniteLoans.mockReturnValue(
            makeInfiniteLoansResult([
                makeLoanList(),
            ]),
        )

        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: true,
            error: new Error(
                'Unable to reach the books API',
            ),
        })

        renderPage()

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            'Unable to reach the books API',
        )
    })

    it('shows an empty state when there is no loan history', () => {
        mockUseInfiniteLoans.mockReturnValue(
            makeInfiniteLoansResult([
                {
                    items: [],
                    total: 0,
                },
            ]),
        )

        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeBookList(),
        })

        renderPage()

        expect(
            screen.getByRole('heading', {
                name: 'No loan history yet.',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('link', {
                name: 'Check Out a Book',
            }),
        ).toHaveAttribute(
            'href',
            '/books',
        )
    })

    it('renders an active loan with its book details', () => {
        mockUseInfiniteLoans.mockReturnValue(
            makeInfiniteLoansResult([
                makeLoanList(),
            ]),
        )

        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeBookList(),
        })

        renderPage()

        expect(
            screen.getByRole('heading', {
                name: 'Active Loans',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('link', {
                name: 'The Left Hand of Darkness',
            }),
        ).toHaveAttribute(
            'href',
            '/books/book-1',
        )

        expect(
            screen.getByText('Jane Reader'),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'Read for book club.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                /8\/12\/2026/,
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                /8\/20\/2026/,
            ),
        ).toBeInTheDocument()
    })

    it('offers check-in for an eligible active loan', () => {
        mockUseInfiniteLoans.mockReturnValue(
            makeInfiniteLoansResult([
                makeLoanList(),
            ]),
        )

        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeBookList(),
        })

        renderPage()

        expect(
            screen.getByRole('button', {
                name: 'Check In',
            }),
        ).toBeInTheDocument()
    })

    it('does not offer check-in for a returned loan', () => {
        mockUseInfiniteLoans.mockReturnValue(
            makeInfiniteLoansResult([
                makeLoanList({
                    items: [
                        {
                            ...makeLoanList().items[0],
                            returned_at:
                                '2026-08-13T15:30:00Z',
                        },
                    ],
                }),
            ]),
        )

        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeBookList(),
        })

        renderPage()

        expect(
            screen.queryByRole('button', {
                name: 'Check In',
            }),
        ).not.toBeInTheDocument()
    })

    it('opens check-in from an active loan without targeted fallback queries', () => {
        mockUseInfiniteLoans.mockReturnValue(
            makeInfiniteLoansResult([
                makeLoanList(),
            ]),
        )

        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeBookList(),
        })

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Check In',
            }),
        )

        expect(
            screen.getByRole('dialog', {
                name: 'Check In',
            }),
        ).toBeInTheDocument()

        expect(
            mockUseLoans,
        ).not.toHaveBeenCalled()

        expect(
            mockUseBook,
        ).not.toHaveBeenCalled()
    })

    it('opens check-in from a bookId deep link using loaded state', () => {
        mockUseInfiniteLoans.mockReturnValue(
            makeInfiniteLoansResult([
                makeLoanList(),
            ]),
        )

        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeBookList(),
        })

        renderPage(
            '/loans?bookId=book-1',
        )

        expect(
            screen.getByTestId('checkin-form'),
        ).toHaveTextContent(
            'Returning The Left Hand of Darkness',
        )

        expect(
            mockUseLoans,
        ).not.toHaveBeenCalled()

        expect(
            mockUseBook,
        ).not.toHaveBeenCalled()
    })

    it('closes check-in when the return is cancelled', () => {
        mockUseInfiniteLoans.mockReturnValue(
            makeInfiniteLoansResult([
                makeLoanList(),
            ]),
        )

        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeBookList(),
        })

        renderPage(
            '/loans?bookId=book-1',
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Cancel return',
            }),
        )

        expect(
            screen.queryByTestId('checkin-form'),
        ).not.toBeInTheDocument()
    })

    it('closes check-in after a successful return', () => {
        mockUseInfiniteLoans.mockReturnValue(
            makeInfiniteLoansResult([
                makeLoanList(),
            ]),
        )

        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeBookList(),
        })

        renderPage(
            '/loans?bookId=book-1',
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Complete return',
            }),
        )

        expect(
            screen.queryByTestId('checkin-form'),
        ).not.toBeInTheDocument()
    })

    it('uses targeted loan state when the selected loan is not in the loaded pages', () => {
        mockUseInfiniteLoans.mockReturnValue(
            makeInfiniteLoansResult([
                makeLoanList({
                    items: [],
                    total: 1,
                }),
            ]),
        )

        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeBookList(),
        })

        mockUseLoans.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeLoanList(),
            refetch: vi.fn(),
        })

        renderPage(
            '/loans?bookId=book-1',
        )

        expect(
            mockUseLoans,
        ).toHaveBeenCalledWith({
            bookId: 'book-1',
        })

        expect(
            screen.getByTestId('checkin-form'),
        ).toHaveTextContent(
            'Returning The Left Hand of Darkness',
        )

        expect(
            mockUseBook,
        ).toHaveBeenCalledWith('')
    })

    it('falls back to the book detail query when the selected book is missing from the books cache', () => {
        const bookList = makeBookList()

        mockUseInfiniteLoans.mockReturnValue(
            makeInfiniteLoansResult([
                makeLoanList({
                    items: [],
                    total: 1,
                }),
            ]),
        )

        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                ...bookList,
                items: [],
            },
        })

        mockUseLoans.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeLoanList(),
            refetch: vi.fn(),
        })

        mockUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: bookList.items[0],
            refetch: vi.fn(),
        })

        renderPage(
            '/loans?bookId=book-1',
        )

        expect(
            mockUseLoans,
        ).toHaveBeenCalledWith({
            bookId: 'book-1',
        })

        expect(
            mockUseBook,
        ).toHaveBeenCalledWith(
            'book-1',
        )

        expect(
            screen.getByTestId('checkin-form'),
        ).toHaveTextContent(
            'Returning The Left Hand of Darkness',
        )
    })

    it('shows an ineligible warning when targeted loan state has no active loan', () => {
        mockUseInfiniteLoans.mockReturnValue(
            makeInfiniteLoansResult([
                makeLoanList({
                    items: [],
                    total: 1,
                }),
            ]),
        )

        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeBookList(),
        })

        mockUseLoans.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeLoanList({
                items: [
                    {
                        ...makeLoanList().items[0],
                        returned_at:
                            '2026-08-13T15:30:00Z',
                    },
                ],
            }),
            refetch: vi.fn(),
        })

        renderPage(
            '/loans?bookId=book-1',
        )

        expect(
            screen.getByText(
                'The Left Hand of Darkness does not currently have an active loan.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.queryByTestId(
                'checkin-form',
            ),
        ).not.toBeInTheDocument()
    })

    it('shows a not-found warning when the fallback book query returns 404', () => {
        const bookList = makeBookList()

        mockUseInfiniteLoans.mockReturnValue(
            makeInfiniteLoansResult([
                makeLoanList({
                    items: [],
                    total: 1,
                }),
            ]),
        )

        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                ...bookList,
                items: [],
            },
        })

        mockUseLoans.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeLoanList(),
            refetch: vi.fn(),
        })

        mockUseBook.mockReturnValue({
            isPending: false,
            isError: true,
            error: new ApiError({
                kind: 'http',
                status: 404,
                message: 'Book not found',
                detail: 'Book not found',
            }),
            refetch: vi.fn(),
        })

        renderPage(
            '/loans?bookId=missing-book',
        )

        expect(
            screen.getByText(
                'The selected book could not be found or is no longer eligible for check-in.',
            ),
        ).toBeInTheDocument()
    })

    it('renders returned loans separately from active loans', () => {
        mockUseInfiniteLoans.mockReturnValue(
            makeInfiniteLoansResult([
                makeLoanList({
                    items: [
                        {
                            ...makeLoanList().items[0],
                            id: 'loan-active',
                            borrower: 'Active Reader',
                            returned_at: null,
                        },
                        {
                            ...makeLoanList().items[0],
                            id: 'loan-returned',
                            borrower: 'Past Reader',
                            returned_at:
                                '2026-08-13T15:30:00Z',
                            notes: null,
                        },
                    ],
                    total: 2,
                }),
            ]),
        )

        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeBookList(),
        })

        renderPage()

        expect(
            screen.getByRole('heading', {
                name: 'Active Loans',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('heading', {
                name: 'Returned Loans',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Active Reader'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Past Reader'),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                new Date(
                    '2026-08-13T15:30:00Z',
                ).toLocaleString(),
            ),
        ).toBeInTheDocument()
    })

    it('falls back to the book ID when the book is not in the collection', () => {
        mockUseInfiniteLoans.mockReturnValue(
            makeInfiniteLoansResult([
                makeLoanList({
                    items: [
                        {
                            ...makeLoanList().items[0],
                            book_id: 'deleted-book',
                        },
                    ],
                }),
            ]),
        )

        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeBookList(),
        })

        renderPage()

        expect(
            screen.getByText(
                'Book deleted-book',
            ),
        ).toBeInTheDocument()
    })

    it('does not render the notes field when notes are absent', () => {
        mockUseInfiniteLoans.mockReturnValue(
            makeInfiniteLoansResult([
                makeLoanList({
                    items: [
                        {
                            ...makeLoanList().items[0],
                            notes: null,
                        },
                    ],
                }),
            ]),
        )

        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeBookList(),
        })

        renderPage()

        expect(
            screen.queryByText('Notes'),
        ).not.toBeInTheDocument()
    })

    it('shows an explicit empty active state when only returned history exists', () => {
        mockUseInfiniteLoans.mockReturnValue(
            makeInfiniteLoansResult([
                makeLoanList({
                    items: [
                        {
                            ...makeLoanList().items[0],
                            returned_at:
                                '2026-08-13T15:30:00Z',
                        },
                    ],
                }),
            ]),
        )

        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeBookList(),
        })

        renderPage()

        expect(
            screen.getByText(
                'No books are currently checked out.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('heading', {
                name: 'Returned Loans',
            }),
        ).toBeInTheDocument()
    })

    it('shows an explicit empty returned state when only active loans exist', () => {
        mockUseInfiniteLoans.mockReturnValue(
            makeInfiniteLoansResult([
                makeLoanList(),
            ]),
        )

        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeBookList(),
        })

        renderPage()

        expect(
            screen.getByText(
                'No returned loans yet.',
            ),
        ).toBeInTheDocument()
    })

    it('renders date-only due values without timezone shifting', () => {
        mockUseInfiniteLoans.mockReturnValue(
            makeInfiniteLoansResult([
                makeLoanList({
                    items: [
                        {
                            ...makeLoanList().items[0],
                            due_at: '2026-08-20',
                        },
                    ],
                }),
            ]),
        )

        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeBookList(),
        })

        renderPage()

        const expected =
            new Intl.DateTimeFormat(
                undefined,
                {
                    dateStyle: 'medium',
                },
            ).format(
                new Date(
                    2026,
                    7,
                    20,
                ),
            )

        expect(
            screen.getByText(expected),
        ).toBeInTheDocument()
    })

    it('renders malformed due values safely', () => {
        mockUseInfiniteLoans.mockReturnValue(
            makeInfiniteLoansResult([
                makeLoanList({
                    items: [
                        {
                            ...makeLoanList().items[0],
                            due_at: 'not-a-date',
                        },
                    ],
                }),
            ]),
        )

        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeBookList(),
        })

        renderPage()

        expect(
            screen.getByText(
                'not-a-date (unrecognized date)',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'Active — due date could not be interpreted',
            ),
        ).toBeInTheDocument()
    })

    it('preserves API order within active and returned loan groups', () => {
        mockUseInfiniteLoans.mockReturnValue(
            makeInfiniteLoansResult([
                makeLoanList({
                    items: [
                        {
                            ...makeLoanList().items[0],
                            id: 'active-first',
                            borrower: 'Active First',
                            returned_at: null,
                        },
                        {
                            ...makeLoanList().items[0],
                            id: 'returned-first',
                            borrower: 'Returned First',
                            returned_at:
                                '2026-08-13T15:30:00Z',
                        },
                        {
                            ...makeLoanList().items[0],
                            id: 'active-second',
                            borrower: 'Active Second',
                            returned_at: null,
                        },
                        {
                            ...makeLoanList().items[0],
                            id: 'returned-second',
                            borrower: 'Returned Second',
                            returned_at:
                                '2026-08-12T15:30:00Z',
                        },
                    ],
                    total: 4,
                }),
            ]),
        )

        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeBookList(),
        })

        renderPage()

        const activeList =
            screen.getByRole('list', {
                name: 'Active loans',
            })

        expect(
            activeList.textContent?.indexOf(
                'Active First',
            ),
        ).toBeLessThan(
            activeList.textContent?.indexOf(
                'Active Second',
            ) ?? -1,
        )

        const returnedList =
            screen.getByRole('list', {
                name: 'Returned loans',
            })

        expect(
            returnedList.textContent?.indexOf(
                'Returned First',
            ),
        ).toBeLessThan(
            returnedList.textContent?.indexOf(
                'Returned Second',
            ) ?? -1,
        )
    })

    it('flattens multiple loaded loan pages into sections', () => {
        mockUseInfiniteLoans.mockReturnValue(
            makeInfiniteLoansResult([
                makeLoanList({
                    total: 2,
                    items: [
                        {
                            ...makeLoanList().items[0],
                            id: 'loan-active',
                            borrower: 'Active Reader',
                            returned_at: null,
                        },
                    ],
                }),
                makeLoanList({
                    total: 2,
                    items: [
                        {
                            ...makeLoanList().items[0],
                            id: 'loan-returned',
                            borrower: 'Past Reader',
                            returned_at:
                                '2026-08-13T15:30:00Z',
                        },
                    ],
                }),
            ]),
        )

        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeBookList(),
        })

        renderPage()

        expect(
            screen.getByText('Active Reader'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Past Reader'),
        ).toBeInTheDocument()
    })

    it('shows a bottom loader while fetching the next page', () => {
        mockUseInfiniteLoans.mockReturnValue(
            makeInfiniteLoansResult(
                [makeLoanList({
                    total: 40,
                })],
                {
                    hasNextPage: true,
                    isFetchingNextPage: true,
                },
            ),
        )

        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeBookList(),
        })

        renderPage()

        expect(
            screen.getByText(
                'Loading more loans…',
            ),
        ).toBeInTheDocument()
    })

    it('shows a bottom retry affordance when the next page fails', () => {
        const fetchNextPage = vi.fn()

        mockUseInfiniteLoans.mockReturnValue(
            makeInfiniteLoansResult(
                [makeLoanList({
                    total: 40,
                })],
                {
                    hasNextPage: true,
                    isFetchNextPageError: true,
                    fetchNextPage,
                },
            ),
        )

        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeBookList(),
        })

        renderPage()

        expect(
            screen.getByText('Jane Reader'),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'Unable to load more loans.',
            ),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Retry',
            }),
        )

        expect(fetchNextPage).toHaveBeenCalledOnce()
    })

    it('wires the infinite scroll trigger to loaded loans', () => {
        mockUseInfiniteLoans.mockReturnValue(
            makeInfiniteLoansResult(
                [makeLoanList({
                    total: 40,
                })],
                {
                    hasNextPage: true,
                },
            ),
        )

        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeBookList(),
        })

        renderPage()

        expect(
            mockUseInfiniteScrollTrigger,
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                enabled: true,
                hasNextPage: true,
                itemCount: 1,
            }),
        )
    })

    it('mounts collection ISBN scanning on the loans page', () => {
        mockUseInfiniteLoans.mockReturnValue(
            makeInfiniteLoansResult([
                makeLoanList(),
            ]),
        )

        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeBookList(),
        })

        renderPage()

        expect(
            mockUseCollectionIsbnJump,
        ).toHaveBeenCalled()
    })

    it('keeps collection ISBN scanning mounted while loans are loading', () => {
        mockUseInfiniteLoans.mockReturnValue({
            isPending: true,
            isError: false,
        })

        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
        })

        renderPage()

        expect(
            mockUseCollectionIsbnJump,
        ).toHaveBeenCalled()
    })
})
