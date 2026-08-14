import {
    fireEvent,
    screen,
} from '@testing-library/react'
import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import {
    MemoryRouter,
} from 'react-router-dom'
import { BooksPage } from './BooksPage'
import type {
    BookList,
    BookRead,
} from '../../../api/apiTypes'
import { ApiError } from '../../../api/apiErrors'
import { renderWithProviders } from '../../../test/renderAppTree'

const mockUseBooks = vi.fn()

vi.mock('../../../api/booksQueries', () => ({
    useBooks: (options: unknown) =>
        mockUseBooks(options),
}))

function makeBook(
    overrides: Partial<BookRead> = {},
): BookRead {
    return {
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
        deletion_date: null,
        completion_date: null,
        rating: null,
        review: null,
        times_borrowed: 0,
        last_borrowed_at: null,
        average_loan_days: null,
        creation_date: '2026-08-12T00:00:00Z',
        updated_date: '2026-08-12T00:00:00Z',
        ...overrides,
    }
}

function makeBookList(
    overrides: Partial<BookList> = {},
): BookList {
    return {
        items: [makeBook()],
        total: 1,
        ...overrides,
    }
}

function renderBooksPage(
    initialEntry = '/books',
) {
    return renderWithProviders(
        <MemoryRouter
            initialEntries={[initialEntry]}
        >
            <BooksPage />
        </MemoryRouter>,
    )
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

        renderBooksPage()

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

        renderBooksPage()

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            'Unable to reach the API',
        )

        expect(
            screen.getByRole('button', {
                name: 'Retry',
            }),
        ).toBeInTheDocument()
    })

    it(
        'shows a rejected-access message without retry when the API returns 403',
        () => {
            mockUseBooks.mockReturnValue({
                isPending: false,
                isError: true,
                error: new ApiError({
                    kind: 'unauthorized',
                    status: 403,
                    message:
                        'API access was rejected.',
                }),
            })

            renderBooksPage()

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

    it('shows an empty state when the collection contains no books', () => {
        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                items: [],
                total: 0,
            },
        })

        renderBooksPage()

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

        expect(
            screen.queryByRole('button', {
                name: 'Previous',
            }),
        ).not.toBeInTheDocument()
    })

    it('requests the default paginated first page with author ascending sort', () => {
        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeBookList({
                total: 237,
                items: Array.from(
                    {
                        length: 50,
                    },
                    (_, index) =>
                        makeBook({
                            id: `book-${index}`,
                            title: `Book ${index}`,
                        }),
                ),
            }),
        })

        renderBooksPage()

        expect(mockUseBooks).toHaveBeenCalledWith({
            skip: 0,
            take: 50,
            sortBy: 'author',
            sortOrder: 'asc',
        })

        expect(
            screen.getByText(
                'Showing 1-50 of 237 books',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'Previous',
            }),
        ).toBeDisabled()

        expect(
            screen.getByRole('button', {
                name: 'Next',
            }),
        ).toBeEnabled()
    })

    it('honors URL search params for page and sort', () => {
        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeBookList({
                total: 237,
                items: Array.from(
                    {
                        length: 50,
                    },
                    (_, index) =>
                        makeBook({
                            id: `book-${index + 50}`,
                            title: `Book ${index + 50}`,
                        }),
                ),
            }),
        })

        renderBooksPage(
            '/books?page=2&sortBy=title&sortOrder=desc',
        )

        expect(mockUseBooks).toHaveBeenCalledWith({
            skip: 50,
            take: 50,
            sortBy: 'title',
            sortOrder: 'desc',
        })

        expect(
            screen.getByText(
                'Showing 51-100 of 237 books',
            ),
        ).toBeInTheDocument()
    })

    it('resets page to 1 when sort field changes', () => {
        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeBookList({
                total: 237,
                items: Array.from(
                    {
                        length: 50,
                    },
                    (_, index) =>
                        makeBook({
                            id: `book-${index + 50}`,
                            title: `Book ${index + 50}`,
                        }),
                ),
            }),
        })

        renderBooksPage('/books?page=2')

        fireEvent.change(
            screen.getByLabelText('Sort by'),
            {
                target: {
                    value: 'title',
                },
            },
        )

        expect(
            screen.getByLabelText('Sort by'),
        ).toHaveValue('title')

        expect(mockUseBooks).toHaveBeenLastCalledWith({
            skip: 0,
            take: 50,
            sortBy: 'title',
            sortOrder: 'asc',
        })
    })

    it('disables Next on the last page', () => {
        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeBookList({
                total: 75,
                items: Array.from(
                    {
                        length: 25,
                    },
                    (_, index) =>
                        makeBook({
                            id: `book-${index + 50}`,
                            title: `Book ${index + 50}`,
                        }),
                ),
            }),
        })

        renderBooksPage('/books?page=2')

        expect(
            screen.getByText(
                'Showing 51-75 of 75 books',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'Previous',
            }),
        ).toBeEnabled()

        expect(
            screen.getByRole('button', {
                name: 'Next',
            }),
        ).toBeDisabled()
    })

    it('renders the current page of books', () => {
        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: makeBookList({
                items: [
                    makeBook(),
                    makeBook({
                        id: 'book-2',
                        title: 'Pale Fire',
                        authors: 'Vladimir Nabokov',
                        status: 'on_loan',
                        is_read: true,
                    }),
                ],
                total: 2,
            }),
        })

        renderBooksPage()

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
                    makeBook({
                        status: 'future_status' as unknown as BookRead['status'],
                        category: 'future_category' as unknown as BookRead['category'],
                        shelf: 'future_shelf' as unknown as BookRead['shelf'],
                    }),
                ],
            }),
        })

        renderBooksPage()

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
