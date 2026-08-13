import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MemoryRouter } from 'react-router-dom'
import { BooksPage } from './BooksPage'
import type { BookList } from '../../../api/apiTypes'
import { renderWithProviders } from '../../../test/renderAppTree'

const mockUseBooks = vi.fn()

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
                status: 'available',
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
                borrower: null,
                datetime_loaned_out: null,
                deletion_date: null,
                completion_date: null,
                rating: null,
                review: null,
                times_borrowed: 0,
                last_borrowed_at: null,
                average_loan_days: null,
                creation_date: '2026-08-12T00:00:00Z',
                updated_date: '2026-08-12T00:00:00Z',
            },
        ],
        total: 1,
        ...overrides,
    }
}

describe('BooksPage', () => {
    beforeEach(() => {
        mockUseBooks.mockReset()
    })

    it('shows a loading state while books are loading', () => {
        mockUseBooks.mockReturnValue({
            isPending: true,
            isError: false,
        })

        renderWithProviders(
            <MemoryRouter>
                <BooksPage />
            </MemoryRouter>,
        )

        expect(
            screen.getByRole('heading', {
                name: 'Books',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'Loading books…',
        )
    })

    it('shows an error when the collection fails', () => {
        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: true,
            error: new Error(
                'Unable to reach the API',
            ),
        })

        renderWithProviders(
            <MemoryRouter>
                <BooksPage />
            </MemoryRouter>,
        )

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            'Unable to reach the API',
        )
    })

    it('shows an empty state when the collection contains no books', () => {
        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                items: [],
                total: 0,
            },
        })

        renderWithProviders(
            <MemoryRouter>
                <BooksPage />
            </MemoryRouter>,
        )

        expect(
            screen.getByRole('heading', {
                name: 'Your library is empty.',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('link', {
                name: 'Add Book',
            }),
        ).toHaveAttribute(
            'href',
            '/books/new',
        )
    })

    it('renders the complete collection result', () => {
        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeBookList({
                items: [
                    makeBookList().items[0],
                    {
                        ...makeBookList().items[0],
                        id: 'book-2',
                        title: 'Pale Fire',
                        authors: 'Vladimir Nabokov',
                        status: 'on_loan',
                        is_read: true,
                    },
                ],
                total: 2,
            }),
        })

        renderWithProviders(
            <MemoryRouter>
                <BooksPage />
            </MemoryRouter>,
        )

        expect(
            screen.getByRole('link', {
                name: 'The Left Hand of Darkness',
            }),
        ).toHaveAttribute(
            'href',
            '/books/book-1',
        )

        expect(
            screen.getByRole('link', {
                name: 'Pale Fire',
            }),
        ).toHaveAttribute(
            'href',
            '/books/book-2',
        )

        expect(
            screen.getByText(
                'Ursula K. Le Guin',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'Vladimir Nabokov',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Available'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('On Loan'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Unread'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Read'),
        ).toBeInTheDocument()
    })

    it('renders unknown enum values safely', () => {
        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeBookList({
                items: [
                    {
                        ...makeBookList().items[0],
                        status: 'future_status' as unknown as BookRead['status'],
                        category: 'future_category' as unknown as BookRead['category'],
                        shelf: 'future_shelf' as unknown as BookRead['shelf'],
                    },
                ],
            }),
        })

        renderWithProviders(
            <MemoryRouter>
                <BooksPage />
            </MemoryRouter>,
        )

        expect(
            screen.getByText(
                'future_status (unknown)',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'future_category (unknown)',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'future_shelf (unknown)',
            ),
        ).toBeInTheDocument()
    })
})
