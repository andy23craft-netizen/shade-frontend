import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import {
    MemoryRouter,
    useLocation,
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
    waitFor,
} from '@testing-library/react'

const mockUseInfiniteBooks = vi.fn()
const mockUseInfiniteIncompleteMetadataBooks =
    vi.fn()
const mockUseInfiniteScrollTrigger = vi.fn()
const mockUseBulkMoveBooksToShelf = vi.fn()

vi.mock('../../../api/booksQueries', () => ({
    useInfiniteBooks: (options: unknown) =>
        mockUseInfiniteBooks(options),

    useBulkMoveBooksToShelf: () =>
        mockUseBulkMoveBooksToShelf(),
}))

vi.mock('../../../api/dashboardQueries', () => ({
    useInfiniteIncompleteMetadataBooks: (
        options: unknown,
    ) =>
        mockUseInfiniteIncompleteMetadataBooks(
            options,
        ),
}))

const mockUseCategories = vi.fn()

vi.mock('../../../api/categoriesQueries', () => ({
    useCategories: () => mockUseCategories(),
}))

vi.mock('../../../hooks/useInfiniteScrollTrigger', () => ({
    useInfiniteScrollTrigger: (
        options: unknown,
    ) =>
        mockUseInfiniteScrollTrigger(options),
}))
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
                Cover for {title}
            </div>
        ),
    }),
)

function makeBook(
    overrides: Partial<BookRead> = {},
): BookRead {
    return {
        id: 'book-1',
        title: 'The Left Hand of Darkness',
        authors: 'Ursula K. Le Guin',
        categories: [
            {
                category_id: 'cat-fiction',
                name: 'Fiction',
                slug: 'fiction',
            },
        ],
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

function LocationProbe() {
    const location = useLocation()

    return (
        <div data-testid="location">
            {location.pathname}
            {location.search}
        </div>
    )
}

function renderBooksPage(
    initialEntry = '/books',
) {
    return renderWithProviders(
        <MemoryRouter
            initialEntries={[initialEntry]}
        >
            <BooksPage />
            <LocationProbe />
        </MemoryRouter>,
    )
}

function openCategoryPicker() {
    fireEvent.click(
        screen.getByRole('button', {
            name: /^Categories(?: \(\d+\))?$/,
        }),
    )
}

describe('BooksPage', () => {
    beforeEach(() => {
        mockUseInfiniteBooks.mockReset()
        mockUseInfiniteIncompleteMetadataBooks.mockReset()
        mockUseInfiniteScrollTrigger.mockReset()
        mockUseCategories.mockReset()
        mockUseBulkMoveBooksToShelf.mockReset()

        mockUseBulkMoveBooksToShelf.mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        })

        mockUseInfiniteScrollTrigger.mockReturnValue({
            getRowRef: () => undefined,
        })

        mockUseCategories.mockReturnValue({
            data: [
                {
                    category_id: 'cat-fiction',
                    name: 'Fiction',
                    slug: 'fiction',
                    created_date: '2026-01-01T00:00:00Z',
                    updated_date: '2026-01-01T00:00:00Z',
                },
                {
                    category_id: 'cat-nonfiction',
                    name: 'Nonfiction',
                    slug: 'nonfiction',
                    created_date: '2026-01-01T00:00:00Z',
                    updated_date: '2026-01-01T00:00:00Z',
                },
            ],
            isPending: false,
            isError: false,
            isSuccess: true,
            error: null,
            refetch: vi.fn(),
        })

        mockUseInfiniteIncompleteMetadataBooks.mockReturnValue(
            makeInfiniteBooksResult([
                {
                    items: [],
                    total: 0,
                },
            ]),
        )
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

    it('renders a reusable cover for each catalog book', () => {
        mockUseInfiniteBooks.mockReturnValue(
            makeInfiniteBooksResult([
                {
                    items: [
                        makeBook({
                            id: 'book-cover-test',
                            title: 'Pale Fire',
                            status: 'available',
                        }),
                    ],
                    total: 1,
                },
            ]),
        )

        renderBooksPage()

        const cover =
            screen.getByTestId('book-cover')

        expect(cover).toHaveTextContent(
            'Cover for Pale Fire',
        )

        expect(cover).toHaveAttribute(
            'data-book-id',
            'book-cover-test',
        )

        expect(cover).toHaveAttribute(
            'data-status',
            'available',
        )
    })

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
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                sortBy: 'author',
                sortOrder: 'asc',
            }),
        )

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
        ).toHaveBeenCalledWith(
            expect.objectContaining({
            sortBy: 'title',
            sortOrder: 'desc',
        }),
        )
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
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                sortBy: 'shelf',
                sortOrder: 'asc',
            }),
        )
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
            '/books?category_id=cat-fiction&author=Le%20Guin&title=Left%20Hand',
        )

        expect(
            mockUseInfiniteBooks,
        ).toHaveBeenCalledWith(
            expect.objectContaining({
            categoryIds: ['cat-fiction'],
            author: 'Le Guin',
            title: 'Left Hand',
            sortBy: 'author',
            sortOrder: 'asc',
        }),
        )

        openCategoryPicker()

        expect(
            screen.getByLabelText('Fiction'),
        ).toBeChecked()

        expect(
            screen.getByLabelText(
                'Search author or title',
            ),
        ).toHaveValue('Le Guin')
    })

    it('uses the cleanup books query for a cleanup-field URL', () => {
        mockUseInfiniteBooks.mockReturnValue(
            makeInfiniteBooksResult([
                {
                    total: 0,
                    items: [],
                },
            ]),
        )

        mockUseInfiniteIncompleteMetadataBooks.mockReturnValue(
            makeInfiniteBooksResult([
                {
                    total: 1,
                    items: [
                        makeBook({
                            isbn13: null,
                        }),
                    ],
                },
            ]),
        )

        renderBooksPage(
            '/books?cleanup_field=isbn',
        )

        expect(
            mockUseInfiniteBooks,
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                enabled: false,
            }),
        )

        expect(
            mockUseInfiniteIncompleteMetadataBooks,
        ).toHaveBeenCalledWith({
            field: 'isbn',
            enabled: true,
        })

        expect(
            screen.getByText(
                /Showing books missing/i,
            ),
        ).toHaveTextContent(
            'Showing books missing ISBN.',
        )

        expect(
            screen.queryByLabelText('Author'),
        ).not.toBeInTheDocument()

        expect(
            screen.getByRole('link', {
                name: 'The Left Hand of Darkness',
            }),
        ).toHaveAttribute(
            'href',
            '/books/book-1',
        )
    })

    it('clears a cleanup-field URL filter', () => {
        mockUseInfiniteBooks.mockReturnValue(
            makeInfiniteBooksResult([
                {
                    total: 0,
                    items: [],
                },
            ]),
        )

        mockUseInfiniteIncompleteMetadataBooks.mockReturnValue(
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
            '/books?cleanup_field=publisher',
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Clear cleanup filter',
            }),
        )

        expect(
            screen.getByTestId('location'),
        ).toHaveTextContent('/books')
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
            '/books?category_id=%20%20&author=%20%20%20&title=%20',
        )

        expect(
            mockUseInfiniteBooks,
        ).toHaveBeenCalledWith(
            expect.objectContaining({
            categoryIds: undefined,
            author: undefined,
            title: undefined,
            sortBy: 'author',
            sortOrder: 'asc',
        }),
        )

        openCategoryPicker()

        expect(
            screen.getByLabelText('Fiction'),
        ).not.toBeChecked()

        expect(
            screen.getByLabelText(
                'Search author or title',
            ),
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

        openCategoryPicker()

        fireEvent.click(
            screen.getByLabelText('Fiction'),
        )

        expect(
            screen.getByLabelText('Fiction'),
        ).toBeChecked()

        expect(
            mockUseInfiniteBooks,
        ).toHaveBeenLastCalledWith(
            expect.objectContaining({
            categoryIds: ['cat-fiction'],
            author: undefined,
            title: undefined,
            isbn: undefined,
            sortBy: 'author',
            sortOrder: 'asc',
        }),
    )
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
            '/books?category_id=cat-fiction',
        )

        openCategoryPicker()

        fireEvent.click(
            screen.getByLabelText('Fiction'),
        )

        expect(
            screen.getByLabelText('Fiction'),
        ).not.toBeChecked()

        expect(
            mockUseInfiniteBooks,
        ).toHaveBeenLastCalledWith(
            expect.objectContaining({
            categoryIds: undefined,
            author: undefined,
            title: undefined,
            isbn: undefined,
            sortBy: 'author',
            sortOrder: 'asc',
        }),
    )
    })

    it('applies a trimmed unified search as an author filter', () => {
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

        renderBooksPage('/books?category_id=cat-fiction')

        fireEvent.change(
            screen.getByLabelText(
                'Search author or title',
            ),
            {
                target: {
                    value: '  Le Guin  ',
                },
            },
        )

        expect(
            mockUseInfiniteBooks,
        ).toHaveBeenLastCalledWith(
            expect.objectContaining({
                categoryIds: ['cat-fiction'],
                author: undefined,
                title: undefined,
                sortBy: 'author',
                sortOrder: 'asc',
            }),
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Search',
            }),
        )

        expect(
            mockUseInfiniteBooks,
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                categoryIds: ['cat-fiction'],
                author: 'Le Guin',
                title: undefined,
                sortBy: 'author',
                sortOrder: 'asc',
                enabled: true,
            }),
        )

        expect(
            mockUseInfiniteBooks,
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                categoryIds: ['cat-fiction'],
                author: undefined,
                title: 'Le Guin',
                sortBy: 'author',
                sortOrder: 'asc',
                enabled: false,
            }),
        )
    })

    it('falls back to title search when author search returns no matches', async () => {
        mockUseInfiniteBooks.mockImplementation(
            (options) => {
                if (
                    options.author === 'Dune' &&
                    options.title === undefined
                ) {
                    return {
                        isPending: false,
                        isLoadingError: false,
                        isSuccess: true,
                        hasNextPage: false,
                        isFetchingNextPage: false,
                        isFetchNextPageError: false,
                        fetchNextPage: vi.fn(),
                        refetch: vi.fn(),
                        data: {
                            pages: [
                                {
                                    items: [],
                                    total: 0,
                                },
                            ],
                        },
                    }
                }

                if (
                    options.author === undefined &&
                    options.title === 'Dune'
                ) {
                    return {
                        isPending: false,
                        isLoadingError: false,
                        isSuccess: true,
                        hasNextPage: false,
                        isFetchingNextPage: false,
                        isFetchNextPageError: false,
                        fetchNextPage: vi.fn(),
                        refetch: vi.fn(),
                        data: {
                            pages: [
                                {
                                    items: [
                                        makeBook({
                                            id: 'book-dune',
                                            title: 'Dune',
                                            authors:
                                                'Frank Herbert',
                                        }),
                                    ],
                                    total: 1,
                                },
                            ],
                        },
                    }
                }

                return makeInfiniteBooksResult()
            },
        )

        renderBooksPage(
            '/books?author=Dune',
        )

        expect(
            mockUseInfiniteBooks,
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                author: 'Dune',
                title: undefined,
                enabled: true,
            }),
        )

        expect(
            mockUseInfiniteBooks,
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                author: undefined,
                title: 'Dune',
                enabled: true,
            }),
        )

        expect(
            await screen.findByRole('link', {
                name: 'Dune',
            }),
        ).toHaveAttribute(
            'href',
            '/books/book-dune',
        )
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
            '/books?category_id=cat-fiction&author=Le%20Guin',
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
            screen.getByRole('button', {
                name: 'Categories (1)',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText(
                'Search author or title',
            ),
        ).toHaveValue('Le Guin')

        expect(
            screen.getByLabelText(
                'Search author or title',
            ),
        ).toHaveValue('Le Guin')


        fireEvent.click(
            screen.getByRole('button', {
                name: 'Clear filters',
            }),
        )

        expect(
            mockUseInfiniteBooks,
        ).toHaveBeenLastCalledWith(
            expect.objectContaining({
            categoryIds: undefined,
            author: undefined,
            title: undefined,
            sortBy: 'author',
            sortOrder: 'asc',
        }),
        )
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
            '/books?category_id=cat-fiction&author=Le%20Guin&title=Left%20Hand&sortBy=shelf&sortOrder=desc',
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Clear',
            }),
        )

        expect(
            screen.queryByRole('button', {
                name: 'Remove Fiction category filter',
            }),
        ).not.toBeInTheDocument()


        expect(
            screen.getByLabelText(
                'Search author or title',
            ),
        ).toHaveValue('')

        expect(
            screen.getByRole('button', {
                name: 'Categories',
            }),
        ).toBeInTheDocument()

        expect(
            mockUseInfiniteBooks,
        ).toHaveBeenLastCalledWith(
            expect.objectContaining({
            categoryIds: undefined,
            author: undefined,
            title: undefined,
            sortBy: 'shelf',
            sortOrder: 'desc',
        }),
        )
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

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Title sort: None',
            }),
        )

        expect(
            screen.getByRole('button', {
                name: 'Title sort: Asc',
            }),
        ).toBeInTheDocument()

        expect(
            mockUseInfiniteBooks,
        ).toHaveBeenLastCalledWith(
            expect.objectContaining({
                sortBy: 'title',
                sortOrder: 'asc',
            }),
        )
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
            screen.getByText('Unread', {
                selector: 'dd',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Read', {
                selector: 'dd',
            }),
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
                            categories: [
                                {
                                    category_id: 'cat-future',
                                    name: 'Future Category',
                                    slug: 'future-category',
                                },
                            ],
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
                'Future Category',
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

    it('passes the ISBN URL filter to the books query', () => {
        mockUseInfiniteBooks.mockReturnValue(
            makeInfiniteBooksResult([
                {
                    total: 2,
                    items: [
                        makeBook({
                            id: 'book-1',
                        }),
                        makeBook({
                            id: 'book-2',
                            title: 'Second Copy',
                        }),
                    ],
                },
            ]),
        )

        renderBooksPage(
            '/books?isbn=978-0-441-17271-9',
        )

        expect(
            mockUseInfiniteBooks,
        ).toHaveBeenCalledWith(
            expect.objectContaining({
            categoryIds: undefined,
            author: undefined,
            title: undefined,
            isbn: '9780441172719',
            sortBy: 'author',
            sortOrder: 'asc',
        }),
        )
    })

    it('opens a unique valid ISBN result from the URL', async () => {
        mockUseInfiniteBooks.mockReturnValue(
            makeInfiniteBooksResult([
                {
                    total: 1,
                    items: [
                        makeBook({
                            id: 'unique-book',
                            isbn13: '9780441172719',
                        }),
                    ],
                },
            ]),
        )

        renderBooksPage(
            '/books?isbn=9780441172719',
        )

        await waitFor(() => {
            expect(
                screen.getByTestId('location'),
            ).toHaveTextContent(
                '/books/unique-book',
            )
        })
    })

    it('shows a filtered empty state for an ISBN with no matches', () => {
        mockUseInfiniteBooks.mockReturnValue(
            makeInfiniteBooksResult([
                {
                    total: 0,
                    items: [],
                },
            ]),
        )

        renderBooksPage(
            '/books?isbn=9780441172719',
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
            screen.getByRole('button', {
                name: 'Clear ISBN',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                /Showing books matching ISBN/,
            ),
        ).toBeInTheDocument()
    })

    it('keeps multiple ISBN matches on the filtered list', () => {
        mockUseInfiniteBooks.mockReturnValue(
            makeInfiniteBooksResult([
                {
                    total: 2,
                    items: [
                        makeBook({
                            id: 'copy-1',
                            title: 'First Copy',
                        }),
                        makeBook({
                            id: 'copy-2',
                            title: 'Second Copy',
                        }),
                    ],
                },
            ]),
        )

        renderBooksPage(
            '/books?isbn=9780441172719',
        )

        expect(
            screen.getByRole('link', {
                name: 'First Copy',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('link', {
                name: 'Second Copy',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByTestId('location'),
        ).toHaveTextContent(
            '/books?isbn=9780441172719',
        )
    })

    it('filters by a partial ISBN without unique-opening', () => {
        mockUseInfiniteBooks.mockReturnValue(
            makeInfiniteBooksResult([
                {
                    total: 1,
                    items: [
                        makeBook({
                            id: 'book-1',
                        }),
                    ],
                },
            ]),
        )

        renderBooksPage(
            '/books?isbn=978044',
        )

        expect(
            mockUseInfiniteBooks,
        ).toHaveBeenCalledWith(
            expect.objectContaining({
            categoryIds: undefined,
            author: undefined,
            title: undefined,
            isbn: '978044',
            sortBy: 'author',
            sortOrder: 'asc',
        }),
        )

        expect(
            screen.getByTestId('location'),
        ).toHaveTextContent(
            '/books?isbn=978044',
        )

        expect(
            screen.getByRole('link', {
                name: 'The Left Hand of Darkness',
            }),
        ).toBeInTheDocument()
    })

    it('clears only the ISBN filter and preserves sort', () => {
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

        renderBooksPage(
            '/books?isbn=9780441172719&sortBy=title&sortOrder=desc',
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Clear ISBN',
            }),
        )

        expect(
            screen.getByTestId('location'),
        ).toHaveTextContent(
            '/books?sortBy=title&sortOrder=desc',
        )

        expect(
            mockUseInfiniteBooks,
        ).toHaveBeenLastCalledWith(
            expect.objectContaining({
            categoryIds: undefined,
            author: undefined,
            title: undefined,
            isbn: undefined,
            sortBy: 'title',
            sortOrder: 'desc',
        }),
        )
    })

    it('does not unique-open while an ISBN query is loading', () => {
        mockUseInfiniteBooks.mockReturnValue({
            isPending: true,
            isSuccess: false,
            isError: false,
        })

        renderBooksPage(
            '/books?isbn=9780441172719',
        )

        expect(
            screen.getByTestId('location'),
        ).toHaveTextContent(
            '/books?isbn=9780441172719',
        )
    })

    it('does not unique-open when an ISBN query fails', () => {
        mockUseInfiniteBooks.mockReturnValue({
            isPending: false,
            isSuccess: false,
            isLoadingError: true,
            isError: true,
            error: new Error('Unable to reach the API'),
        })

        renderBooksPage(
            '/books?isbn=9780441172719',
        )

        expect(
            screen.getByTestId('location'),
        ).toHaveTextContent(
            '/books?isbn=9780441172719',
        )
    })

    it('enters and exits bulk-selection mode', () => {
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

        renderBooksPage()

        expect(
            screen.getByRole('button', {
                name: 'Select',
            }),
        ).toBeInTheDocument()

        expect(
            screen.queryByRole('region', {
                name: 'Bulk selection',
            }),
        ).not.toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Select',
            }),
        )

        expect(
            screen.getByRole('region', {
                name: 'Bulk selection',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByText('0 books selected'),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'Clear selection',
            }),
        ).toBeDisabled()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Exit selection',
            }),
        )

        expect(
            screen.queryByRole('region', {
                name: 'Bulk selection',
            }),
        ).not.toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'Select',
            }),
        ).toBeInTheDocument()
    })

    it('selects all currently loaded books and clears the selection', () => {
        mockUseInfiniteBooks.mockReturnValue(
            makeInfiniteBooksResult([
                {
                    total: 8,
                    items: [
                        makeBook({
                            id: 'book-1',
                        }),
                        makeBook({
                            id: 'book-2',
                            title: 'Pale Fire',
                        }),
                        makeBook({
                            id: 'book-3',
                            title: 'Invisible Cities',
                        }),
                    ],
                },
            ]),
        )

        renderBooksPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Select',
            }),
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Select all loaded books',
            }),
        )

        expect(
            screen.getByText('3 books selected'),
        ).toBeInTheDocument()

        /*
         * total is 8, but only three books have actually
         * been loaded into the infinite list.
         */
        expect(
            screen.queryByText('8 books selected'),
        ).not.toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Clear selection',
            }),
        )

        expect(
            screen.getByText('0 books selected'),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'Clear selection',
            }),
        ).toBeDisabled()
    })

    it('clears selected books when the catalog filter identity changes', async () => {
        mockUseInfiniteBooks.mockReturnValue(
            makeInfiniteBooksResult([
                {
                    total: 2,
                    items: [
                        makeBook({
                            id: 'book-1',
                        }),
                        makeBook({
                            id: 'book-2',
                            title: 'Pale Fire',
                        }),
                    ],
                },
            ]),
        )

        renderBooksPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Select',
            }),
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Select all loaded books',
            }),
        )

        expect(
            screen.getByText('2 books selected'),
        ).toBeInTheDocument()

        fireEvent.change(
            screen.getByLabelText(
                'Search author or title',
            ),
            {
                target: {
                    value: 'Le Guin',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Search',
            }),
        )

        await waitFor(() => {
            expect(
                screen.getByText('0 books selected'),
            ).toBeInTheDocument()
        })

        /*
         * Changing a filter clears selection, but does not
         * force the user out of selection mode.
         */
        expect(
            screen.getByRole('region', {
                name: 'Bulk selection',
            }),
        ).toBeInTheDocument()
    })

    it('preserves selected books when only sorting changes', async () => {
        mockUseInfiniteBooks.mockReturnValue(
            makeInfiniteBooksResult([
                {
                    total: 2,
                    items: [
                        makeBook({
                            id: 'book-1',
                        }),
                        makeBook({
                            id: 'book-2',
                            title: 'Pale Fire',
                        }),
                    ],
                },
            ]),
        )

        renderBooksPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Select',
            }),
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Select all loaded books',
            }),
        )

        expect(
            screen.getByText('2 books selected'),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Title sort: None',
            }),
        )

        await waitFor(() => {
            expect(
                screen.getByText('2 books selected'),
            ).toBeInTheDocument()
        })

        expect(
            screen.getByRole('button', {
                name: 'Title sort: Asc',
            }),
        ).toBeInTheDocument()
    })

    it('clears selection when exiting and does not restore it on re-entry', () => {
        mockUseInfiniteBooks.mockReturnValue(
            makeInfiniteBooksResult([
                {
                    total: 2,
                    items: [
                        makeBook({
                            id: 'book-1',
                        }),
                        makeBook({
                            id: 'book-2',
                            title: 'Pale Fire',
                        }),
                    ],
                },
            ]),
        )

        renderBooksPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Select',
            }),
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Select all loaded books',
            }),
        )

        expect(
            screen.getByText('2 books selected'),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Exit selection',
            }),
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Select',
            }),
        )

        expect(
            screen.getByText('0 books selected'),
        ).toBeInTheDocument()
    })

    it('selects and deselects an individual visible book', () => {
        mockUseInfiniteBooks.mockReturnValue(
            makeInfiniteBooksResult([
                {
                    total: 2,
                    items: [
                        makeBook({
                            id: 'book-1',
                            title:
                                'The Left Hand of Darkness',
                        }),
                        makeBook({
                            id: 'book-2',
                            title: 'Pale Fire',
                        }),
                    ],
                },
            ]),
        )

        renderBooksPage()

        expect(
            screen.queryByRole('checkbox', {
                name: 'Select The Left Hand of Darkness',
            }),
        ).not.toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Select',
            }),
        )

        const firstBook =
            screen.getByRole('checkbox', {
                name: 'Select The Left Hand of Darkness',
            })

        const secondBook =
            screen.getByRole('checkbox', {
                name: 'Select Pale Fire',
            })

        expect(firstBook).not.toBeChecked()
        expect(secondBook).not.toBeChecked()

        fireEvent.click(firstBook)

        expect(firstBook).toBeChecked()
        expect(secondBook).not.toBeChecked()

        expect(
            screen.getByText('1 book selected'),
        ).toBeInTheDocument()

        fireEvent.click(firstBook)

        expect(firstBook).not.toBeChecked()

        expect(
            screen.getByText('0 books selected'),
        ).toBeInTheDocument()
    })

    it('checks every loaded eligible row when selecting all', () => {
        mockUseInfiniteBooks.mockReturnValue(
            makeInfiniteBooksResult([
                {
                    total: 5,
                    items: [
                        makeBook({
                            id: 'book-1',
                            title:
                                'The Left Hand of Darkness',
                        }),
                        makeBook({
                            id: 'book-2',
                            title: 'Pale Fire',
                        }),
                    ],
                },
            ]),
        )

        renderBooksPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Select',
            }),
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Select all loaded books',
            }),
        )

        expect(
            screen.getByRole('checkbox', {
                name: 'Select The Left Hand of Darkness',
            }),
        ).toBeChecked()

        expect(
            screen.getByRole('checkbox', {
                name: 'Select Pale Fire',
            }),
        ).toBeChecked()

        expect(
            screen.getByText('2 books selected'),
        ).toBeInTheDocument()
    })

    it('unchecks selected rows when clearing selection', () => {
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

        renderBooksPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Select',
            }),
        )

        const checkbox =
            screen.getByRole('checkbox', {
                name: 'Select The Left Hand of Darkness',
            })

        fireEvent.click(checkbox)

        expect(checkbox).toBeChecked()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Clear selection',
            }),
        )

        expect(checkbox).not.toBeChecked()
    })

    it('removes row selection controls when selection mode exits', () => {
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

        renderBooksPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Select',
            }),
        )

        expect(
            screen.getByRole('checkbox', {
                name: 'Select The Left Hand of Darkness',
            }),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Exit selection',
            }),
        )

        expect(
            screen.queryByRole('checkbox', {
                name: 'Select The Left Hand of Darkness',
            }),
        ).not.toBeInTheDocument()

        expect(
            screen.getByRole('link', {
                name: 'The Left Hand of Darkness',
            }),
        ).toBeInTheDocument()
    })
})
