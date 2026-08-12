import { fireEvent, render, screen } from '@testing-library/react'
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

    it('renders no returned-loans message when average loan length is null', () => {
        mockUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                ...book,
                average_loan_days: null,
            },
        })

        renderBookDetailsPage()

        expect(
            screen.getByText(
                'No returned loans yet',
            ),
        ).toBeInTheDocument()
    })

    it('renders unknown enum values explicitly', () => {
        mockUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                ...book,
                status: 'archived',
                category: 'biography',
                shelf: 'z99',
            },
        })

        renderBookDetailsPage()

        expect(
            screen.getAllByText('archived (unknown)'),
        ).toHaveLength(2)

        expect(
            screen.getByText('biography (unknown)'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('z99 (unknown)'),
        ).toBeInTheDocument()
    })

    it('renders malformed dates as unrecognized dates', () => {
        mockUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                ...book,
                publication_date: 'not-a-date',
            },
        })

        renderBookDetailsPage()

        expect(
            screen.getByText(
                'not-a-date (unrecognized date)',
            ),
        ).toBeInTheDocument()
    })

    it('renders date-only fields without timezone day-shift', () => {
        mockUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                ...book,
                publication_date: '1969-03-01',
                purchase_date: '2026-08-01',
                completion_date: '2026-08-10',
            },
        })

        renderBookDetailsPage()

        expect(
            screen.getByText('1969-03-01'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('2026-08-01'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('2026-08-10'),
        ).toBeInTheDocument()
    })

    it('renders null optional fields as not provided', () => {
        mockUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                ...book,
                authors: null,
                isbn13: null,
                publisher: null,
                publication_date: null,
                pages: null,
                purchase_date: null,
                purchase_price: null,
                acquisition_source: null,
                notes: null,
                borrower: null,
                datetime_loaned_out: null,
                completion_date: null,
                rating: null,
                review: null,
                last_borrowed_at: null,
            },
        })

        renderBookDetailsPage()

        expect(
            screen.getAllByText('Not provided'),
        ).not.toHaveLength(0)
    })

    it('hides checkout and delete actions for on-loan books', () => {
        mockUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                ...book,
                status: 'on_loan',
                is_read: false,
                borrower: 'Ada',
            },
        })

        renderBookDetailsPage()

        expect(
            screen.getAllByText('on loan'),
        ).not.toHaveLength(0)

        expect(
            screen.queryByRole('link', {
                name: 'Check Out',
            }),
        ).not.toBeInTheDocument()

        expect(
            screen.getByRole('link', {
                name: 'Check In',
            }),
        ).toBeInTheDocument()

        expect(
            screen.queryByRole('button', {
                name: 'Delete',
            }),
        ).not.toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'Mark Read',
            }),
        ).toBeInTheDocument()
    })

    it('renders deleted books without lifecycle actions', () => {
        mockUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                ...book,
                is_read: false,
                deletion_date: '2026-08-11T12:00:00Z',
            },
        })

        renderBookDetailsPage()

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'This book has been deleted',
        )

        expect(
            screen.getByText(
                "The book's history has been retained, but it is no longer part of the active collection.",
            ),
        ).toBeInTheDocument()

        expect(
            screen.queryByRole('link', {
                name: 'Check Out',
            }),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByRole('link', {
                name: 'Check In',
            }),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByRole('link', {
                name: 'Edit',
            }),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByRole('button', {
                name: 'Mark Read',
            }),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByRole('button', {
                name: 'Delete',
            }),
        ).not.toBeInTheDocument()

        expect(
            screen.getByRole('link', {
                name: 'View deleted books',
            }),
        ).toHaveAttribute(
            'href',
            '/admin/deleted',
        )
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
        const refetch = vi.fn()

        mockUseBook.mockReturnValue({
            isPending: false,
            isError: true,
            error: new ApiError({
                kind: 'http',
                status: 404,
                message: 'Book not found',
            }),
            refetch,
        })

        renderBookDetailsPage()

        expect(
            screen.getByText('Book not found'),
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

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Retry',
            }),
        )

        expect(refetch).toHaveBeenCalledOnce()
    })

    it('renders a generic API error with retry', () => {
        const refetch = vi.fn()

        mockUseBook.mockReturnValue({
            isPending: false,
            isError: true,
            error: new Error(
                'Unable to reach the API.',
            ),
            refetch,
        })

        renderBookDetailsPage()

        expect(
            screen.getByText('Unable to load book'),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'Unable to reach the API.',
            ),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Retry',
            }),
        )

        expect(refetch).toHaveBeenCalledOnce()
    })
})
