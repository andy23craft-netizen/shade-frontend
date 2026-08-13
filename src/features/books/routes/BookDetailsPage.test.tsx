import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../test/renderAppTree'
import { BookDetailsPage } from './BookDetailsPage'
import { useBook } from '../../../api/booksQueries'
import type { BookRead } from '../../../api/apiTypes'
import { ApiError } from '../../../api/apiErrors'

vi.mock('../../../api/booksQueries', () => ({
    useBook: vi.fn(),
}))

const mockedUseBook = vi.mocked(useBook)

const completeBook: BookRead = {
    id: 'test-book-id',
    title: 'The Pale Fire',
    authors: 'Vladimir Nabokov',
    isbn13: '9780679723427',
    category: 'fiction',
    shelf: 'a1',
    status: 'available',
    publication_date: '1962',
    publisher: 'Vintage',
    pages: 315,
    acquisition_source: 'Used bookstore',
    purchase_date: '2026-08-01',
    purchase_price: 12.5,
    is_read: true,
    completion_date: '2026-08-10',
    rating: 5,
    review: 'A marvelous book.',
    notes: 'Check the foreword again.',
    tags: ['Nabokov', 'fiction'],
    borrower: null,
    datetime_loaned_out: null,
    last_borrowed_at: '2026-07-01T12:00:00.000Z',
    times_borrowed: 3,
    average_loan_days: 14.5,
    creation_date: '2026-08-01T12:00:00.000Z',
    updated_date: '2026-08-10T12:00:00.000Z',
    deletion_date: null,
}

function renderBookDetails(
    bookId = 'test-book-id',
) {
    return renderWithProviders(
        <MemoryRouter
            initialEntries={[
                `/books/${bookId}`,
            ]}
        >
            <Routes>
                <Route
                    path="/books/:bookId"
                    element={<BookDetailsPage />}
                />
            </Routes>
        </MemoryRouter>,
    )
}

describe('BookDetailsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('shows a loading state while the book is loading', () => {
        mockedUseBook.mockReturnValue({
            isPending: true,
            isError: false,
        } as ReturnType<typeof useBook>)

        renderBookDetails()

        expect(
            screen.getByRole('heading', {
                name: 'Book Details',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('status'),
        ).toBeInTheDocument()
    })

    it('shows an error when the book fails to load', () => {
        const error = new Error(
            'Unable to load book.',
        )

        mockedUseBook.mockReturnValue({
            isPending: false,
            isError: true,
            error,
        } as ReturnType<typeof useBook>)

        renderBookDetails()

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            'Unable to load book.',
        )
    })

    it('renders the complete book details', () => {
        mockedUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: completeBook,
        } as ReturnType<typeof useBook>)

        renderBookDetails()

        expect(
            screen.getByRole('heading', {
                name: 'The Pale Fire',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'Vladimir Nabokov',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                '9780679723427',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText('fiction'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('a1'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('available'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Publication Date')
        ).toBeInTheDocument()

        expect(
            screen.getByText('Vintage'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('315'),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'Used bookstore',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText('$12.50'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Yes'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('5'),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'A marvelous book.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'Check the foreword again.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                '3',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                '14.5 days',
            ),
        ).toBeInTheDocument()
    })

    it('does not render null or undefined for nullable fields', () => {
        const sparseBook: BookRead = {
            ...completeBook,
            isbn13: null,
            publication_date: null,
            publisher: null,
            pages: null,
            acquisition_source: null,
            purchase_date: null,
            purchase_price: null,
            completion_date: null,
            rating: null,
            review: null,
            notes: null,
            tags: null,
            borrower: null,
            datetime_loaned_out: null,
            last_borrowed_at: null,
            average_loan_days: null,
            deletion_date: null,
        }

        mockedUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: sparseBook,
        } as ReturnType<typeof useBook>)

        renderBookDetails()

        expect(
            screen.queryByText('null'),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByText('undefined'),
        ).not.toBeInTheDocument()
    })

    it('renders unknown enum values safely', () => {
        const bookWithUnknownEnums = {
            ...completeBook,
            category: 'future_category',
            shelf: 'future_shelf',
            status: 'future_status',
        } as unknown as BookRead

        mockedUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: bookWithUnknownEnums,
        } as unknown as ReturnType<typeof useBook>)

        renderBookDetails()

        expect(
            screen.getByText(
                /future_category \(unknown\)/,
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                /future_shelf \(unknown\)/,
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                /future_status \(unknown\)/,
            ),
        ).toBeInTheDocument()
    })

    it('uses the book ID from the route', () => {
        mockedUseBook.mockReturnValue({
            isPending: true,
            isError: false,
        } as ReturnType<typeof useBook>)

        renderBookDetails(
            'test-book-id',
        )

        expect(
            mockedUseBook,
        ).toHaveBeenCalledWith(
            'test-book-id',
        )
    })

    it('shows a not-found state when the book returns 404', () => {
        mockedUseBook.mockReturnValue({
            isPending: false,
            isError: true,
            error: new ApiError({
                status: 404,
                kind: 'http',
                message: 'Book not found.',
            }),
        } as unknown as ReturnType<typeof useBook>)

        renderBookDetails()

        expect(
            screen.getByRole('heading', {
                name: 'Book Not Found',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'This book could not be found',
        )

        expect(
            screen.getByRole('link', {
                name: 'Back to Books',
            }),
        ).toHaveAttribute(
            'href',
            '/books',
        )
    })

    it('formats date-only values without timezone shifting', () => {
        mockedUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                ...completeBook,
                purchase_date: '2026-08-01',
            },
        } as ReturnType<typeof useBook>)

        renderBookDetails()

        expect(
            screen.getByText('Aug 1, 2026'),
        ).toBeInTheDocument()
    })

    it('renders malformed temporal values safely', () => {
        mockedUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                ...completeBook,
                purchase_date: 'not-a-date',
            },
        } as ReturnType<typeof useBook>)

        renderBookDetails()

        expect(
            screen.getByText(
                'not-a-date (unrecognized date)',
            ),
        ).toBeInTheDocument()
    })

    it('explains when there are no returned loans', () => {
        mockedUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                ...completeBook,
                average_loan_days: null,
            },
        } as ReturnType<typeof useBook>)

        renderBookDetails()

        expect(
            screen.getByText(
                'No returned loans yet',
            ),
        ).toBeInTheDocument()
    })
    it('does not offer checkout or delete for an on-loan book', () => {
        mockedUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                ...completeBook,
                status: 'on_loan',
                is_read: false,
            },
        } as ReturnType<typeof useBook>)

        renderBookDetails()

        expect(
            screen.getByRole('link', {
                name: 'Check In',
            }),
        ).toHaveAttribute(
            'href',
            `/books/${completeBook.id}/checkin`,
        )

        expect(
            screen.queryByRole('link', {
                name: 'Check Out',
            }),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByRole('link', {
                name: 'Delete Book',
            }),
        ).not.toBeInTheDocument()
    })

    it('hides lifecycle actions for a soft-deleted book', () => {
        mockedUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                ...completeBook,
                deletion_date:
                    '2026-08-12T12:00:00.000Z',
                status: 'available',
                is_read: false,
            },
        } as ReturnType<typeof useBook>)

        renderBookDetails()

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'This book has been deleted',
        )

        expect(
            screen.queryByRole('navigation', {
                name: 'Book actions',
            }),
        ).not.toBeInTheDocument()
    })

    it('offers the appropriate actions for an active unread book', () => {
        mockedUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                ...completeBook,
                status: 'available',
                is_read: false,
                deletion_date: null,
            },
        } as ReturnType<typeof useBook>)

        renderBookDetails()

        expect(
            screen.getByRole('link', {
                name: 'Edit Book',
            }),
        ).toHaveAttribute(
            'href',
            `/books/${completeBook.id}/edit`,
        )

        expect(
            screen.getByRole('link', {
                name: 'Check Out',
            }),
        ).toHaveAttribute(
            'href',
            `/books/${completeBook.id}/checkout`,
        )

        expect(
            screen.getByRole('link', {
                name: 'Mark Read',
            }),
        ).toHaveAttribute(
            'href',
            `/books/${completeBook.id}/mark-read`,
        )

        expect(
            screen.getByRole('link', {
                name: 'Delete Book',
            }),
        ).toHaveAttribute(
            'href',
            `/books/${completeBook.id}/delete`,
        )

        expect(
            screen.queryByRole('link', {
                name: 'Check In',
            }),
        ).not.toBeInTheDocument()
    })
})
