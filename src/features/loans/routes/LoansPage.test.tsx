import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { LoansPage } from './LoansPage'
import type {
    BookList,
    LoanList,
} from '../../../api/apiTypes'
import { renderWithProviders } from '../../../test/renderAppTree'

const mockUseLoans = vi.fn()
const mockUseBooks = vi.fn()

vi.mock('../../../api/loansQueries', () => ({
    useLoans: () => mockUseLoans(),
}))

vi.mock('../../../api/booksQueries', () => ({
    useBooks: () => mockUseBooks(),
}))

function makeBookList(
    overrides: Partial<BookList> = {},
): BookList {
    return {
        items: [
            {
                id: 'book-1',
                title: 'The Left Hand of Darkness',
                authors: 'Ursula K. Le Guin',
                category: 'fiction',
                shelf: 'liz_tbr',
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
                deletion_date: null,
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

function renderPage() {
    return renderWithProviders(
        <MemoryRouter>
            <LoansPage />
        </MemoryRouter>,
    )
}

describe('LoansPage', () => {
    beforeEach(() => {
        mockUseLoans.mockReset()
        mockUseBooks.mockReset()
    })

    it('shows a loading state while loans are loading', () => {
        mockUseLoans.mockReturnValue({
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
        mockUseLoans.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeLoanList(),
        })

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
        mockUseLoans.mockReturnValue({
            isPending: false,
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

    it('shows an error when the book collection fails', () => {
        mockUseLoans.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeLoanList(),
        })

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
        mockUseLoans.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                items: [],
                total: 0,
            },
        })

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
            '/checkout',
        )
    })

    it('renders an active loan with its book details', () => {
        mockUseLoans.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeLoanList(),
        })

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

    it('renders returned loans separately from active loans', () => {
        mockUseLoans.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeLoanList({
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
        })

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
        mockUseLoans.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeLoanList({
                items: [
                    {
                        ...makeLoanList().items[0],
                        book_id: 'deleted-book',
                    },
                ],
            }),
        })

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
        mockUseLoans.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeLoanList({
                items: [
                    {
                        ...makeLoanList().items[0],
                        notes: null,
                    },
                ],
            }),
        })

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
        })

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
        mockUseLoans.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeLoanList(),
        })

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
        mockUseLoans.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeLoanList({
                items: [
                    {
                        ...makeLoanList().items[0],
                        due_at: '2026-08-20',
                    },
                ],
            }),
        })

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
        mockUseLoans.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeLoanList({
                items: [
                    {
                        ...makeLoanList().items[0],
                        due_at: 'not-a-date',
                    },
                ],
            }),
        })

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
        mockUseLoans.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeLoanList({
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
        })

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
})
