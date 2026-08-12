import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { BookDetailsPage } from './BookDetailsPage'
import { ApiError } from '../../../api/apiErrors'

const mockUseBook = vi.fn()
const mockInvalidateQueries = vi.fn()

vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({
        invalidateQueries: mockInvalidateQueries,
    }),
}))

vi.mock('../../../api/booksQueries', () => ({
    useBook: (bookId: string) => mockUseBook(bookId),
}))
function renderBookDetailsPage(
    bookId = 'book-1',
) {
    return render(
        <MemoryRouter
            initialEntries={[
                `/books/${bookId}`,
            ]}
        >
            <BookDetailsPage />
        </MemoryRouter>,
    )
}

const book = {
    id: 'book-1',
    title: 'The Left Hand of Darkness',
    authors: 'Ursula K. Le Guin',
    status: 'available',
    is_read: true,
    category: 'fiction',
    shelf: 'liz_tbr',
    deletion_date: null,
    isbn13: '9780441478125',
    publisher: 'Ace',
    publication_date: '1969-03-01',
    pages: 304,
    tags: ['science fiction'],
    purchase_date: '2026-08-01',
    purchase_price: 12.5,
    acquisition_source: 'Used bookstore',
    notes: 'First edition in the collection.',
    borrower: null,
    datetime_loaned_out: null,
    completion_date: '2026-08-10',
    rating: 5,
    review: 'Excellent.',
    times_borrowed: 3,
    last_borrowed_at: '2026-07-20',
    average_loan_days: 14,
    creation_date: '2026-07-01T12:00:00Z',
    updated_date: '2026-08-10T12:00:00Z',
}

describe('BookDetailsPage', () => {
    it('renders book details and metadata', () => {
        mockUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: book,
        })

        renderBookDetailsPage()

        expect(
            screen.getByRole('heading', {
                level: 1,
                name: 'The Left Hand of Darkness',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Ursula K. Le Guin'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('9780441478125'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('fiction'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('liz tbr'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Read', {
                selector: 'strong',
            }),
        ).toBeInTheDocument()
    })

    it('renders a loading state', () => {
        mockUseBook.mockReturnValue({
            isPending: true,
            isError: false,
        })

        renderBookDetailsPage()

        expect(
            screen.getByRole('status'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Loading book…'),
        ).toBeInTheDocument()
    })

    it('renders a not-found state', () => {
        mockUseBook.mockReturnValue({
            isPending: false,
            isError: true,
            error: new ApiError({
                kind: 'http',
                status: 404,
                message: 'Book not found',
            }),
        })

        renderBookDetailsPage()

        expect(
            screen.getByText('Book not found')
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'This book is no longer available from the API.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('link', {
                name: 'Back to Books',
            }),
        ).toHaveAttribute(
            'href',
            '/books',
        )
        expect(
            mockInvalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: ['books'],
        })
    })

    it('renders a generic API error', () => {
        mockUseBook.mockReturnValue({
            isPending: false,
            isError: true,
            error: new Error(
                'Unable to reach the API.',
            ),
        })

        renderBookDetailsPage()

        expect(
            screen.getByText('Unable to load book')
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'Unable to reach the API.',
            ),
        ).toBeInTheDocument()
    })
})