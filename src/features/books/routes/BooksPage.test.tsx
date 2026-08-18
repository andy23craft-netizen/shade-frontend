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
import {
    fireEvent,
    screen,
    within,
} from '@testing-library/react'

const mockUseInfiniteBooks = vi.fn()
const mockUseInfiniteScrollTrigger = vi.fn()

vi.mock('../../../api/booksQueries', () => ({
    useInfiniteBooks: (options: unknown) =>
        mockUseInfiniteBooks(options),
}))

vi.mock('../../../hooks/useInfiniteScrollTrigger', () => ({
    useInfiniteScrollTrigger: (
        options: unknown,
    ) =>
        mockUseInfiniteScrollTrigger(options),
}))

function makeBook(
    overrides: Partial<BookRead> = {},
): BookRead {
    return {
        id: 'book-1',
        title: 'The Left Hand of Darkness',
        authors: 'Ursula K. Le Guin',
        category: 'fiction',
        shelf_name: 'liz_tbr',
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

function makeInfiniteBooksResult(
    pages: BookList[],
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
        mockUseInfiniteBooks.mockReset()
        mockUseInfiniteScrollTrigger.mockReset()

        mockUseInfiniteScrollTrigger.mockReturnValue({
            getRowRef: () => undefined,
        })
    })

    it('shows a loading state while books are loading', () => {
        mockUseInfiniteBooks.mockReturnValue({
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
        mockUseInfiniteBooks.mockReturnValue({
            isPending: false,
            isLoadingError: true,
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
            mockUseInfiniteBooks.mockReturnValue({
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
        mockUseInfiniteBooks.mockReturnValue(
            makeInfiniteBooksResult([
                {
                    items: [],
                    total: 0,
                },
            ]),
        )

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

    it('requests the default infinite first batch with author ascending sort', () => {
        mockUseInfiniteBooks.mockReturnValue(
            makeInfiniteBooksResult([
                {
                    total: 237,
                    items: Array.from(
                        {
                            length: 30,
                        },
                        (_, index) =>
                            makeBook({
                                id: `book-${index}`,
                                title: `Book ${index}`,
                            }),
                    ),
                },
            ]),
        )

        renderBooksPage()

        expect(
            mockUseInfiniteBooks,
        ).toHaveBeenCalledWith({
            sortBy: 'author',
            sortOrder: 'asc',
        })

        expect(
            screen.getByText(
                '237 books in the library.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.queryByText(/Showing /),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByRole('button', {
                name: 'Previous',
            }),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByRole('button', {
                name: 'Next',
            }),
        ).not.toBeInTheDocument()
    })

    it('honors URL search params for sort without page', () => {
        mockUseInfiniteBooks.mockReturnValue(
            makeInfiniteBooksResult([
                {
                    total: 237,
                    items: Array.from(
                        {
                            length: 30,
                        },
                        (_, index) =>
                            makeBook({
                                id: `book-${index}`,
                                title: `Book ${index}`,
                            }),
                    ),
                },
            ]),
        )

        renderBooksPage(
            '/books?page=2&sortBy=title&sortOrder=desc',
        )

        expect(
            mockUseInfiniteBooks,
        ).toHaveBeenCalledWith({
            sortBy: 'title',
            sortOrder: 'desc',
        })
    })

    it('honors URL search params for shelf sort', () => {
        mockUseInfiniteBooks.mockReturnValue(
            makeInfiniteBooksResult([
                {
                    total: 237,
                    items: Array.from(
                        {
                            length: 30,
                        },
                        (_, index) =>
                            makeBook({
                                id: `book-${index}`,
                                title: `Book ${index}`,
                            }),
                    ),
                },
            ]),
        )

        renderBooksPage(
            '/books?sortBy=shelf&sortOrder=asc',
        )

        expect(
            mockUseInfiniteBooks,
        ).toHaveBeenCalledWith({
            sortBy: 'shelf',
            sortOrder: 'asc',
        })

        expect(
            screen.getByLabelText('Sort by'),
        ).toHaveValue('shelf')

        expect(
            screen.getByRole('option', {
                name: 'Shelf',
            }),
        ).toBeInTheDocument()
    })

    it('honors URL search params for catalog filters', () => {
        mockUseInfiniteBooks.mockReturnValue(
            makeInfiniteBooksResult([
                {
                    total: 1,
                    items: [
                        makeBook(),
                    ],
                },
            ]),
        )

        renderBooksPage(
            '/books?category=fiction&author=Le%20Guin&title=Left%20Hand',
        )

        expect(
            mockUseInfiniteBooks,
        ).toHaveBeenCalledWith({
            category: 'fiction',
            author: 'Le Guin',
            title: 'Left Hand',
            sortBy: 'author',
            sortOrder: 'asc',
        })

        expect(
            screen.getByLabelText('Category'),
        ).toHaveValue('fiction')

        expect(
            screen.getByLabelText('Author'),
        ).toHaveValue('Le Guin')

        expect(
            screen.getByLabelText('Title'),
        ).toHaveValue('Left Hand')
    })

    it('normalizes invalid or blank catalog filter params', () => {
        mockUseInfiniteBooks.mockReturnValue(
            makeInfiniteBooksResult([
                {
                    total: 1,
                    items: [
                        makeBook(),
                    ],
                },
            ]),
        )

        renderBooksPage(
            '/books?category=invalid&author=%20%20%20&title=%20',
        )

        expect(
            mockUseInfiniteBooks,
        ).toHaveBeenCalledWith({
            category: undefined,
            author: undefined,
            title: undefined,
            sortBy: 'author',
            sortOrder: 'asc',
        })

        expect(
            screen.getByLabelText('Category'),
        ).toHaveValue('')

        expect(
            screen.getByLabelText('Author'),
        ).toHaveValue('')

        expect(
            screen.getByLabelText('Title'),
        ).toHaveValue('')
    })

    it('issues a fresh first batch when category changes', () => {
        mockUseInfiniteBooks.mockReturnValue(
            makeInfiniteBooksResult([
                {
                    total: 2,
                    items: [
                        makeBook(),
                        makeBook({
                            id: 'book-2',
                            title: 'Pale Fire',
                        }),
                    ],
                },
            ]),
        )

        renderBooksPage('/books?page=2')

        fireEvent.change(
            screen.getByLabelText('Category'),
            {
                target: {
                    value: 'fiction',
                },
            },
        )

        expect(
            screen.getByLabelText('Category'),
        ).toHaveValue('fiction')

        expect(
            mockUseInfiniteBooks,
        ).toHaveBeenLastCalledWith({
            category: 'fiction',
            author: undefined,
            title: undefined,
            sortBy: 'author',
            sortOrder: 'asc',
        })
    })

    it('clears the category filter', () => {
        mockUseInfiniteBooks.mockReturnValue(
            makeInfiniteBooksResult([
                {
                    total: 1,
                    items: [
                        makeBook(),
                    ],
                },
            ]),
        )

        renderBooksPage(
            '/books?category=fiction',
        )

        fireEvent.change(
            screen.getByLabelText('Category'),
            {
                target: {
                    value: '',
                },
            },
        )

        expect(
            screen.getByLabelText('Category'),
        ).toHaveValue('')

        expect(
            mockUseInfiniteBooks,
        ).toHaveBeenLastCalledWith({
            category: undefined,
            author: undefined,
            title: undefined,
            sortBy: 'author',
            sortOrder: 'asc',
        })
    })

    it('applies trimmed author and title filters', () => {
        mockUseInfiniteBooks.mockReturnValue(
            makeInfiniteBooksResult([
                {
                    total: 1,
                    items: [
                        makeBook(),
                    ],
                },
            ]),
        )

        renderBooksPage('/books?category=fiction')

        fireEvent.change(
            screen.getByLabelText('Author'),
            {
                target: {
                    value: '  Le Guin  ',
                },
            },
        )

        fireEvent.change(
            screen.getByLabelText('Title'),
            {
                target: {
                    value: '  Left Hand  ',
                },
            },
        )

        expect(
            mockUseInfiniteBooks,
        ).toHaveBeenLastCalledWith({
            category: 'fiction',
            author: undefined,
            title: undefined,
            sortBy: 'author',
            sortOrder: 'asc',
        })

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Apply',
            }),
        )

        expect(
            mockUseInfiniteBooks,
        ).toHaveBeenLastCalledWith({
            category: 'fiction',
            author: 'Le Guin',
            title: 'Left Hand',
            sortBy: 'author',
            sortOrder: 'asc',
        })
    })

    it('shows a filtered empty state and clears filters', () => {
        mockUseInfiniteBooks.mockReturnValue(
            makeInfiniteBooksResult([
                {
                    total: 0,
                    items: [],
                },
            ]),
        )

        renderBooksPage(
            '/books?category=fiction&author=Le%20Guin',
        )

        expect(
            screen.getByRole('heading', {
                name: 'No books match these filters.',
            }),
        ).toBeInTheDocument()

        expect(
            screen.queryByRole('heading', {
                name: 'Your library is empty.',
            }),
        ).not.toBeInTheDocument()

        expect(
            screen.getByLabelText('Category'),
        ).toHaveValue('fiction')

        expect(
            screen.getByLabelText('Author'),
        ).toHaveValue('Le Guin')

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Clear filters',
            }),
        )

        expect(
            mockUseInfiniteBooks,
        ).toHaveBeenLastCalledWith({
            category: undefined,
            author: undefined,
            title: undefined,
            sortBy: 'author',
            sortOrder: 'asc',
        })
    })

    it('clears catalog filters while preserving sort', () => {
        mockUseInfiniteBooks.mockReturnValue(
            makeInfiniteBooksResult([
                {
                    total: 1,
                    items: [
                        makeBook(),
                    ],
                },
            ]),
        )

        renderBooksPage(
            '/books?category=fiction&author=Le%20Guin&title=Left%20Hand&sortBy=shelf&sortOrder=desc',
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Clear',
            }),
        )

        expect(
            screen.getByLabelText('Category'),
        ).toHaveValue('')

        expect(
            screen.getByLabelText('Author'),
        ).toHaveValue('')

        expect(
            screen.getByLabelText('Title'),
        ).toHaveValue('')

        expect(
            screen.getByLabelText('Sort by'),
        ).toHaveValue('shelf')

        expect(
            screen.getByLabelText('Sort direction'),
        ).toHaveValue('desc')

        expect(
            mockUseInfiniteBooks,
        ).toHaveBeenLastCalledWith({
            category: undefined,
            author: undefined,
            title: undefined,
            sortBy: 'shelf',
            sortOrder: 'desc',
        })
    })

    it('issues a fresh first batch when sort field changes', () => {
        mockUseInfiniteBooks.mockReturnValue(
            makeInfiniteBooksResult([
                {
                    total: 237,
                    items: Array.from(
                        {
                            length: 30,
                        },
                        (_, index) =>
                            makeBook({
                                id: `book-${index}`,
                                title: `Book ${index}`,
                            }),
                    ),
                },
            ]),
        )

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

        expect(
            mockUseInfiniteBooks,
        ).toHaveBeenLastCalledWith({
            sortBy: 'title',
            sortOrder: 'asc',
        })
    })

    it('flattens multiple loaded pages for rendering', () => {
        mockUseInfiniteBooks.mockReturnValue(
            makeInfiniteBooksResult([
                {
                    total: 65,
                    items: Array.from(
                        {
                            length: 30,
                        },
                        (_, index) =>
                            makeBook({
                                id: `book-${index}`,
                                title: `Book ${index}`,
                            }),
                    ),
                },
                {
                    total: 65,
                    items: Array.from(
                        {
                            length: 30,
                        },
                        (_, index) =>
                            makeBook({
                                id: `book-${index + 30}`,
                                title: `Book ${index + 30}`,
                            }),
                    ),
                },
            ]),
        )

        renderBooksPage()

        expect(
            screen.getByRole('link', {
                name: 'Book 0',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('link', {
                name: 'Book 59',
            }),
        ).toBeInTheDocument()
    })

    it('shows a bottom loader while fetching the next page', () => {
        mockUseInfiniteBooks.mockReturnValue(
            makeInfiniteBooksResult(
                [
                    {
                        total: 65,
                        items: Array.from(
                            {
                                length: 30,
                            },
                            (_, index) =>
                                makeBook({
                                    id: `book-${index}`,
                                    title: `Book ${index}`,
                                }),
                        ),
                    },
                ],
                {
                    hasNextPage: true,
                    isFetchingNextPage: true,
                },
            ),
        )

        renderBooksPage()

        expect(
            screen.getByText(
                'Loading more books…',
            ),
        ).toBeInTheDocument()
    })

    it('shows a bottom retry affordance when the next page fails', () => {
        const fetchNextPage = vi.fn()

        mockUseInfiniteBooks.mockReturnValue(
            makeInfiniteBooksResult(
                [
                    {
                        total: 65,
                        items: Array.from(
                            {
                                length: 30,
                            },
                            (_, index) =>
                                makeBook({
                                    id: `book-${index}`,
                                    title: `Book ${index}`,
                                }),
                        ),
                    },
                ],
                {
                    hasNextPage: true,
                    isFetchNextPageError: true,
                    fetchNextPage,
                },
            ),
        )

        renderBooksPage()

        expect(
            screen.getByRole('link', {
                name: 'Book 0',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'Unable to load more books.',
            ),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Retry',
            }),
        )

        expect(fetchNextPage).toHaveBeenCalledOnce()
    })

    it('wires the infinite scroll trigger to loaded rows', () => {
        mockUseInfiniteBooks.mockReturnValue(
            makeInfiniteBooksResult([
                {
                    total: 65,
                    items: Array.from(
                        {
                            length: 30,
                        },
                        (_, index) =>
                            makeBook({
                                id: `book-${index}`,
                                title: `Book ${index}`,
                            }),
                    ),
                },
            ], {
                hasNextPage: true,
            }),
        )

        renderBooksPage()

        expect(
            mockUseInfiniteScrollTrigger,
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                enabled: true,
                hasNextPage: true,
                itemCount: 30,
            }),
        )
    })

    it('renders the current page of books', () => {
        mockUseInfiniteBooks.mockReturnValue(
            makeInfiniteBooksResult([
                {
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
                },
            ]),
        )

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

        expect(
            screen.queryByRole('button', {
                name: 'Add to wishlist',
            }),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByLabelText('Add to wishlist'),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByText('Add to wishlist'),
        ).not.toBeInTheDocument()
    })

    it('renders unknown enum values safely', () => {
        mockUseInfiniteBooks.mockReturnValue(
            makeInfiniteBooksResult([
                {
                    items: [
                        makeBook({
                            status: 'future_status' as unknown as BookRead['status'],
                            category: 'future_category' as unknown as BookRead['category'],
                            shelf_name: 'future_shelf',
                        }),
                    ],
                    total: 1,
                },
            ]),
        )

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
                'Future Shelf',
            ),
        ).toBeInTheDocument()
    })

    it('shows reading state and rating in collection cards', () => {
        mockUseInfiniteBooks.mockReturnValue(
            makeInfiniteBooksResult([
                {
                    total: 2,
                    items: [
                        makeBook({
                            id: 'rated-book',
                            title: 'Rated Book',
                            is_read: true,
                            rating: 5,
                        }),
                        makeBook({
                            id: 'unrated-book',
                            title: 'Unrated Book',
                            is_read: false,
                            rating: null,
                        }),
                    ],
                },
            ]),
        )

        renderBooksPage()

        const ratedCard =
            screen
                .getByRole('link', {
                    name: 'Rated Book',
                })
                .closest('article')

        const unratedCard =
            screen
                .getByRole('link', {
                    name: 'Unrated Book',
                })
                .closest('article')

        expect(ratedCard).not.toBeNull()
        expect(unratedCard).not.toBeNull()

        expect(
            within(ratedCard!).getByText('Read'),
        ).toBeInTheDocument()

        expect(
            within(ratedCard!).getByText('5 / 5'),
        ).toBeInTheDocument()

        expect(
            within(unratedCard!).getByText('Unread'),
        ).toBeInTheDocument()

        expect(
            within(unratedCard!).getByText('—'),
        ).toBeInTheDocument()
    })
})
