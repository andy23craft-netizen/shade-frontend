import { MemoryRouter, Route, Routes } from 'react-router-dom'
import {
    fireEvent,
    screen,
    waitFor,
} from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../test/renderAppTree'
import { BookDetailsPage } from './BookDetailsPage'
import {
    useBook,
    useCheckoutBook,
} from '../../../api/booksQueries'
import { useLoans } from '../../../api/loansQueries'
import type { BookRead } from '../../../api/apiTypes'
import { ApiError } from '../../../api/apiErrors'

vi.mock('../../../api/booksQueries', () => ({
    useBook: vi.fn(),
    useCheckoutBook: vi.fn(),
}))

vi.mock('../../../api/loansQueries', () => ({
    useLoans: vi.fn(),
}))
vi.mock(
    '../../collections/components/AddBookToCollectionDialog',
    () => ({
        AddBookToCollectionDialog: ({
                                        open,
                                    }: {
            open: boolean
        }) =>
            open ? (
                <div role="dialog">
                    Add to Collection Dialog
                </div>
            ) : null,
    }),
)
vi.mock(
    '../components/BookCover',
    () => ({
        BookCover: ({
                        bookId,
                        title,
                        status,
                    }: {
            bookId: string
            title: string
            status: string
        }) => (
            <div
                data-testid="book-cover"
                data-book-id={bookId}
                data-status={status}
            >
                Cover of {title}
            </div>
        ),
    }),
)
vi.mock(
    '../components/BookCoverManager',
    () => ({
        BookCoverManager: ({
                               bookId,
                           }: {
            bookId: string
        }) => (
            <div
                data-testid="book-cover-manager"
                data-book-id={bookId}
            >
                Cover manager
            </div>
        ),
    }),
)

const mockedUseBook = vi.mocked(useBook)

const mockedUseLoans = vi.mocked(useLoans)

const mockedUseCheckoutBook =
    vi.mocked(useCheckoutBook)

const completeBook: BookRead = {
    book_id: 'test-book-id',
    title: 'The Pale Fire',
    authors: [
        {
            author_id: 'author-vladimir-nabokov',
            first_name: 'Vladimir',
            surname: 'Nabokov',
        },
    ],
    isbn13: '9780679723427',
    categories: [{ category_id: 'cat-fiction', name: 'Fiction', slug: 'fiction' }],
    shelf_name: 'a1',
    placement_state: 'shelved',
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
    last_borrowed_at: '2026-07-01T12:00:00.000Z',
    times_borrowed: 3,
    average_loan_days: 14.5,
    creation_date: '2026-08-01T12:00:00.000Z',
    updated_date: '2026-08-10T12:00:00.000Z',
}

const activeLoan = {
    album_id: null,
    id: 'loan-1',
    book_id: completeBook.book_id,
    borrower: 'Jane Reader',
    checked_out_at:
        '2026-08-12T14:00:00Z',
    due_at: null,
    notes: null,
    returned_at: null,
    created_date:
        '2026-08-12T14:00:00Z',
    last_updated_date:
        '2026-08-12T14:00:00Z',
}

const returnedLoan = {
    ...activeLoan,
    id: 'loan-returned',
    returned_at:
        '2026-08-13T15:30:00Z',
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

        mockedUseCheckoutBook.mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        } as unknown as ReturnType<
            typeof useCheckoutBook
        >)
        mockedUseLoans.mockReturnValue({
            data: {
                items: [],
                total: 0,
            },
            isPending: false,
            isError: false,
            error: null,
        } as unknown as ReturnType<
            typeof useLoans
        >)
    })

    it('offers Mark Read for an active unread book', () => {
        mockedUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                ...completeBook,
                is_read: false,
                completion_date: null,
                rating: null,
                review: null,
            },
        } as ReturnType<typeof useBook>)

        renderBookDetails()

        expect(
            screen.getByRole('link', {
                name: 'Mark Read',
            }),
        ).toHaveAttribute(
            'href',
            '/books/test-book-id/mark-read',
        )
    })

    it('does not offer Mark Read for an already-read book', () => {
        mockedUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: completeBook,
        } as ReturnType<typeof useBook>)

        renderBookDetails()

        expect(
            screen.queryByRole('link', {
                name: 'Mark Read',
            }),
        ).not.toBeInTheDocument()
    })

    it('renders the reusable cover for the current book', () => {
        mockedUseBook.mockReturnValue({
            data: completeBook,
            isPending: false,
            isError: false,
            isSuccess: true,
        } as ReturnType<typeof useBook>)

        renderBookDetails()

        const cover =
            screen.getByTestId('book-cover')

        expect(cover).toHaveTextContent(
            'Cover of The Pale Fire',
        )

        expect(cover).toHaveAttribute(
            'data-book-id',
            'test-book-id',
        )

        expect(cover).toHaveAttribute(
            'data-status',
            'available',
        )

        const coverManager =
            screen.getByTestId(
                'book-cover-manager',
            )

        expect(coverManager).toHaveAttribute(
            'data-book-id',
            'test-book-id',
        )
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
            screen.getByText('Fiction'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('A1'),
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

    it('renders multiple authors in book order', () => {
        mockedUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                ...completeBook,
                authors: [
                    ...(completeBook.authors ?? []),
                    {
                        author_id: 'author-mary-mccarthy',
                        first_name: 'Mary',
                        surname: 'McCarthy',
                    },
                ],
            },
        } as ReturnType<typeof useBook>)

        renderBookDetails()

        expect(
            screen.getByText(
                'Vladimir Nabokov, Mary McCarthy',
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
            last_borrowed_at: null,
            average_loan_days: null,
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
            categories: [
                {
                    category_id: 'cat-future',
                    name: 'Future Category',
                    slug: 'future-category',
                },
            ],
            shelf_name: 'future_shelf',
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
                'Future Category',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                /Future Shelf/,
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

    it('returns to the filtered books URL when opened from the list', () => {
        mockedUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: completeBook,
        } as ReturnType<typeof useBook>)

        renderWithProviders(
            <MemoryRouter
                initialEntries={[
                    {
                        pathname: '/books/test-book-id',
                        state: {
                            booksReturnTo:
                                '/books?category_id=cat-fiction&author=Le%20Guin&sortBy=title&sortOrder=desc',
                        },
                    },
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

        expect(
            screen.getByRole('link', {
                name: '← Back to Books',
            }),
        ).toHaveAttribute(
            'href',
            '/books?category_id=cat-fiction&author=Le%20Guin&sortBy=title&sortOrder=desc',
        )
    })

    it('falls back to the unfiltered books list without list-origin state', () => {
        mockedUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: completeBook,
        } as ReturnType<typeof useBook>)

        renderBookDetails()

        expect(
            screen.getByRole('link', {
                name: '← Back to Books',
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
        mockedUseLoans.mockReturnValue({
            data: {
                items: [activeLoan],
                total: 1,
            },
            isPending: false,
            isError: false,
            error: null,
        } as ReturnType<typeof useLoans>)

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
            `/loans?bookId=${encodeURIComponent(
                completeBook.book_id,
            )}`
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

    it('does not offer checkout for a non-available book', () => {
        mockedUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                ...completeBook,
                status: 'reserved',
                is_read: false,
            },
        } as ReturnType<typeof useBook>)

        renderBookDetails()

        expect(
            screen.queryByRole('link', {
                name: 'Check Out',
            }),
        ).not.toBeInTheDocument()
    })

    it('does not offer checkout for a display-only book', () => {
        mockedUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                ...completeBook,
                status: 'display_only',
                is_read: false,
            },
        } as ReturnType<typeof useBook>)

        renderBookDetails()

        expect(
            screen.queryByRole('link', {
                name: 'Check Out',
            }),
        ).not.toBeInTheDocument()
    })

    it('does not offer checkout for a display-only book', () => {
        mockedUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                ...completeBook,
                status: 'available',
            },
        } as ReturnType<typeof useBook>)

        mockedUseLoans.mockReturnValue({
            data: {
                items: [activeLoan],
                total: 1,
            },
            isPending: false,
            isError: false,
            error: null,
        } as ReturnType<typeof useLoans>)

        renderBookDetails()

        expect(
            screen.getByRole('link', {
                name: 'Check In',
            }),
        ).toHaveAttribute(
            'href',
            `/loans?bookId=${encodeURIComponent(
                completeBook.book_id,
            )}`
        )
    })

    it('does not offer check-in when an on-loan book has no active loan', () => {
        mockedUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                ...completeBook,
                status: 'on_loan',
            },
        } as ReturnType<typeof useBook>)

        mockedUseLoans.mockReturnValue({
            data: {
                items: [returnedLoan],
                total: 1,
            },
            isPending: false,
            isError: false,
            error: null,
        } as ReturnType<typeof useLoans>)

        renderBookDetails()

        expect(
            screen.queryByRole('link', {
                name: 'Check In',
            }),
        ).not.toBeInTheDocument()
    })

    it('does not offer delete when an active loan exists even if book status is available', () => {
        mockedUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                ...completeBook,
                status: 'available',
            },
        } as ReturnType<typeof useBook>)

        mockedUseLoans.mockReturnValue({
            data: {
                items: [activeLoan],
                total: 1,
            },
            isPending: false,
            isError: false,
            error: null,
        } as ReturnType<typeof useLoans>)

        renderBookDetails()

        expect(
            screen.queryByRole('link', {
                name: 'Delete Book',
            }),
        ).not.toBeInTheDocument()
    })

    it('does not offer delete when book status is on_loan even without an active loan', () => {
        mockedUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                ...completeBook,
                status: 'on_loan',
            },
        } as ReturnType<typeof useBook>)

        mockedUseLoans.mockReturnValue({
            data: {
                items: [returnedLoan],
                total: 1,
            },
            isPending: false,
            isError: false,
            error: null,
        } as ReturnType<typeof useLoans>)

        renderBookDetails()

        expect(
            screen.queryByRole('link', {
                name: 'Delete Book',
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
            },
        } as ReturnType<typeof useBook>)

        renderBookDetails()

        expect(
            screen.getByRole('link', {
                name: 'Edit Book',
            }),
        ).toHaveAttribute(
            'href',
            `/books/${completeBook.book_id}/edit`,
        )

        expect(
            screen.getByRole('button', {
                name: 'Check Out',
            }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('link', {
                name: 'Mark Read',
            }),
        ).toHaveAttribute(
            'href',
            `/books/${completeBook.book_id}/mark-read`,
        )

        expect(
            screen.getByRole('link', {
                name: 'Delete Book',
            }),
        ).toHaveAttribute(
            'href',
            `/books/${completeBook.book_id}/delete`,
        )

        expect(
            screen.queryByRole('link', {
                name: 'Check In',
            }),
        ).not.toBeInTheDocument()
    })

    it('offers Edit Reading for an active read book', () => {
        mockedUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                ...completeBook,
                is_read: true,
            },
        } as ReturnType<typeof useBook>)

        renderBookDetails()

        expect(
            screen.getByRole('link', {
                name: 'Edit Reading',
            }),
        ).toHaveAttribute(
            'href',
            `/books/${completeBook.book_id}/reading`,
        )

        expect(
            screen.queryByRole('link', {
                name: 'Mark Read',
            }),
        ).not.toBeInTheDocument()
    })

    it('does not offer Edit Reading for an unread book', () => {
        mockedUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                ...completeBook,
                is_read: false,
                completion_date: null,
                rating: null,
                review: null,
            },
        } as ReturnType<typeof useBook>)

        renderBookDetails()

        expect(
            screen.queryByRole('link', {
                name: 'Edit Reading',
            }),
        ).not.toBeInTheDocument()

        expect(
            screen.getByRole('link', {
                name: 'Mark Read',
            }),
        ).toBeInTheDocument()
    })

    it('opens the checkout dialog for an eligible book', async () => {
        mockedUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                ...completeBook,
                is_read: false,
            },
        } as ReturnType<typeof useBook>)

        renderBookDetails()

        const checkoutButton = screen.getByRole('button', {
            name: 'Check Out',
        })

        checkoutButton.focus()
        checkoutButton.click()

        const dialog = await screen.findByRole('dialog', {
            name: 'Check Out',
        })

        expect(dialog).toBeInTheDocument()

        await waitFor(() => {
            expect(
                screen.getByLabelText('Borrower'),
            ).toHaveFocus()
        })

        expect(
            screen.getByLabelText('Notes'),
        ).toBeInTheDocument()

        expect(
            screen.queryByLabelText(/due date/i),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByLabelText(/checkout date/i),
        ).not.toBeInTheDocument()
    })

    it('opens checkout from the checkout query flag for an eligible book', async () => {
        mockedUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: completeBook,
        } as ReturnType<typeof useBook>)

        renderWithProviders(
            <MemoryRouter
                initialEntries={[
                    '/books/test-book-id?checkout=1',
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

        expect(
            await screen.findByRole('dialog', {
                name: 'Check Out',
            }),
        ).toBeInTheDocument()

        await waitFor(() => {
            expect(
                window.location.search,
            ).not.toContain('checkout')
        })
    })

    it('does not open checkout from the checkout query flag for an ineligible book', async () => {
        mockedUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                ...completeBook,
                status: 'display_only',
            },
        } as ReturnType<typeof useBook>)

        renderWithProviders(
            <MemoryRouter
                initialEntries={[
                    '/books/test-book-id?checkout=1',
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

        expect(
            screen.queryByRole('dialog', {
                name: 'Check Out',
            }),
        ).not.toBeInTheDocument()

        await waitFor(() => {
            expect(
                window.location.search,
            ).not.toContain('checkout')
        })
    })

    it('offers Add to Collection for an active book', () => {
        mockedUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: completeBook,
        } as ReturnType<typeof useBook>)

        renderBookDetails()

        expect(
            screen.getByRole('button', {
                name: 'Add to Collection',
            }),
        ).toBeInTheDocument()
    })

    it('opens Add to Collection from Book Details', () => {
        mockedUseBook.mockReturnValue({
            isPending: false,
            isError: false,
            data: completeBook,
        } as ReturnType<typeof useBook>)

        renderBookDetails()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Add to Collection',
            }),
        )

        expect(
            screen.getByRole('dialog'),
        ).toHaveTextContent(
            'Add to Collection Dialog',
        )
    })

})
