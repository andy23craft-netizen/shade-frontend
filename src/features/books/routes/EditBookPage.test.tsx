import {
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query'
import {
    MemoryRouter,
    Route,
    Routes,
} from 'react-router-dom'
import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import { ApiError } from '../../../api/apiErrors'
import type {
    AuthorRead,
    BookRead,
    CategoryRead,
    ShelfRead,
} from '../../../api/apiTypes'
import {
    useAuthors,
    useCreateAuthor,
    useUpdateAuthor,
} from '../../../api/authorsQueries'
import {
    useBook,
    useUpdateBook,
} from '../../../api/booksQueries'
import {
    useCategories,
    useCreateCategory,
    useUpdateCategory,
} from '../../../api/categoriesQueries'
import {
    useShelves,
} from '../../../api/shelvesQueries'
import { EditBookPage } from './EditBookPage'

vi.mock('../../../api/booksQueries', () => ({
    useBook: vi.fn(),
    useUpdateBook: vi.fn(),
}))

vi.mock('../../../api/shelvesQueries', () => ({
    useShelves: vi.fn(),
}))

vi.mock('../../../api/categoriesQueries', () => ({
    useCategories: vi.fn(),
    useCreateCategory: vi.fn(),
    useUpdateCategory: vi.fn(),
}))

vi.mock('../../../api/authorsQueries', () => ({
    useAuthors: vi.fn(),
    useCreateAuthor: vi.fn(),
    useUpdateAuthor: vi.fn(),
}))

const mockNavigate = vi.fn()

vi.mock(
    'react-router-dom',
    async (importOriginal) => {
        const actual =
            await importOriginal<
                typeof import('react-router-dom')
            >()

        return {
            ...actual,
            useNavigate: () => mockNavigate,
        }
    },
)

const mockUseBook = vi.mocked(useBook)
const mockUseUpdateBook =
    vi.mocked(useUpdateBook)
const mockUseShelves = vi.mocked(useShelves)
const mockUseCategories =
    vi.mocked(useCategories)
const mockUseAuthors =
    vi.mocked(useAuthors)
const mockUseCreateAuthor =
    vi.mocked(useCreateAuthor)
const mockUseUpdateAuthor =
    vi.mocked(useUpdateAuthor)
const mockUseCreateCategory =
    vi.mocked(useCreateCategory)
const mockUseUpdateCategory =
    vi.mocked(useUpdateCategory)

const TEST_SHELVES: ShelfRead[] = [
    {
        shelf_id: 'id-a1',
        common_name: 'a1',
        location: null,
        description: null,
        created_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
    },
    {
        shelf_id: 'id-a2',
        common_name: 'a2',
        location: null,
        description: null,
        created_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
    },
    {
        shelf_id: 'id-unknown',
        common_name: 'unknown',
        location: null,
        description: null,
        created_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
    },
]

const TEST_AUTHORS: AuthorRead[] = [
    {
        author_id: 'author-vladimir-nabokov',
        first_name: 'Vladimir',
        surname: 'Nabokov',
        created_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
    },
    {
        author_id: 'author-ursula-le-guin',
        first_name: 'Ursula K.',
        surname: 'Le Guin',
        created_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
    },
]

const TEST_CATEGORIES: CategoryRead[] = [
    {
        category_id: 'cat-fiction',
        name: 'Fiction',
        slug: 'fiction',
        created_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
    },
]

const book: BookRead = {
    book_id: 'test-book-id',
    title: 'The Pale Fire',
    authors: [
        TEST_AUTHORS[0],
    ],
    isbn13: '9780441172719',
    categories: [{ category_id: 'cat-fiction', name: 'Fiction', slug: 'fiction' }],
    shelf_name: 'a1',
    placement_state: 'shelved',
    status: 'available',
    publication_date: '1962',
    publisher: 'Vintage',
    pages: 315,
    acquisition_source: 'Bookstore',
    purchase_date: '2026-08-01',
    purchase_price: 14.5,
    is_read: true,
    completion_date: '2026-08-10',
    rating: 5,
    review: 'A marvelous book.',
    notes: 'Keep this note.',
    tags: ['novel', 'poetry'],
    last_borrowed_at: null,
    times_borrowed: 0,
    average_loan_days: null,
    creation_date:
        '2026-08-01T12:00:00.000Z',
    updated_date:
        '2026-08-10T12:00:00.000Z',
}

function createQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
            mutations: {
                retry: false,
            },
        },
    })
}

function renderPage(
    initialEntry =
    '/books/test-book-id/edit',
) {
    const queryClient = createQueryClient()

    const result = render(
        <QueryClientProvider
            client={queryClient}
        >
            <MemoryRouter
                initialEntries={[
                    initialEntry,
                ]}
            >
                <Routes>
                    <Route
                        path="/books/:bookId/edit"
                        element={
                            <EditBookPage />
                        }
                    />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    )

    return {
        ...result,
        queryClient,
    }
}

function setupSuccessfulShelves(
    value: ShelfRead[] = TEST_SHELVES,
) {
    mockUseShelves.mockReturnValue({
        data: value,
        isPending: false,
        isError: false,
        error: null,
        isSuccess: true,
        refetch: vi.fn(),
    } as unknown as ReturnType<
        typeof useShelves
    >)
}

function setupSuccessfulCategories(
    value: CategoryRead[] = TEST_CATEGORIES,
) {
    mockUseCategories.mockReturnValue({
        data: value,
        isPending: false,
        isError: false,
        error: null,
        isSuccess: true,
        refetch: vi.fn(),
    } as unknown as ReturnType<
        typeof useCategories
    >)
}

function setupSuccessfulAuthors(
    value: AuthorRead[] = TEST_AUTHORS,
) {
    mockUseAuthors.mockReturnValue({
        data: {
            items: value,
            total: value.length,
        },
        isPending: false,
        isError: false,
        error: null,
        isSuccess: true,
        refetch: vi.fn(),
    } as unknown as ReturnType<
        typeof useAuthors
    >)
}

function setupSuccessfulBook(
    value: BookRead = book,
) {
    mockUseBook.mockReturnValue({
        data: value,
        isPending: false,
        isError: false,
        error: null,
    } as unknown as ReturnType<
        typeof useBook
    >)
}

describe('EditBookPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        setupSuccessfulBook()
        setupSuccessfulShelves()
        setupSuccessfulCategories()
        setupSuccessfulAuthors()

        const idleMetadataMutation = {
            mutateAsync: vi.fn(),
            isPending: false,
        }

        mockUseCreateAuthor.mockReturnValue(
            idleMetadataMutation as unknown as ReturnType<
                typeof useCreateAuthor
            >,
        )
        mockUseUpdateAuthor.mockReturnValue(
            idleMetadataMutation as unknown as ReturnType<
                typeof useUpdateAuthor
            >,
        )
        mockUseCreateCategory.mockReturnValue(
            idleMetadataMutation as unknown as ReturnType<
                typeof useCreateCategory
            >,
        )
        mockUseUpdateCategory.mockReturnValue(
            idleMetadataMutation as unknown as ReturnType<
                typeof useUpdateCategory
            >,
        )

        mockUseUpdateBook.mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        } as unknown as ReturnType<
            typeof useUpdateBook
        >)
    })

    it('shows not found when the book is missing', () => {
        mockUseBook.mockReturnValue({
            isPending: false,
            isError: true,
            error: new ApiError({
                kind: 'http',
                status: 404,
                message: 'Book not found',
                detail: 'Book not found',
            }),
        } as unknown as ReturnType<typeof useBook>)

        renderPage()

        expect(
            screen.getByText(
                'Book not found',
            ),
        ).toBeInTheDocument()
    })

    it('loads existing metadata into the form', () => {
        renderPage()

        expect(
            screen.getByRole('heading', {
                name: 'Edit Book',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText('Title'),
        ).toHaveValue('The Pale Fire')

        expect(
            screen.getByRole('button', {
                name: 'Remove Vladimir Nabokov author',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'Select authors (1)',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText('ISBN'),
        ).toHaveValue('9780441172719')

        expect(
            screen.getByLabelText('Publisher'),
        ).toHaveValue('Vintage')

        expect(
            screen.getByLabelText('Pages'),
        ).toHaveValue(315)

        expect(
            screen.getByLabelText('Shelf'),
        ).toHaveTextContent('A1')

        expect(
            screen.getByLabelText('Tags'),
        ).toHaveValue('novel, poetry')
    })

    it('uses the book ID from the route', () => {
        renderPage(
            '/books/another-book/edit',
        )

        expect(
            mockUseBook,
        ).toHaveBeenCalledWith(
            'another-book',
        )
    })

    it('blocks the page when shelves fail to load', () => {
        mockUseShelves.mockReturnValue({
            data: undefined,
            isPending: false,
            isError: true,
            error: new ApiError({
                kind: 'unreachable',
                message:
                    'The API could not be reached',
            }),
            isSuccess: false,
            refetch: vi.fn(),
        } as unknown as ReturnType<
            typeof useShelves
        >)

        renderPage()

        expect(
            screen.getByText(
                'Unable to load shelves',
            ),
        ).toBeInTheDocument()

        expect(
            screen.queryByRole('button', {
                name: 'Save Book',
            }),
        ).not.toBeInTheDocument()
    })

    it('blocks the page when categories fail to load', () => {
        mockUseCategories.mockReturnValue({
            data: undefined,
            isPending: false,
            isError: true,
            error: new ApiError({
                kind: 'unreachable',
                message:
                    'The API could not be reached',
            }),
            isSuccess: false,
            refetch: vi.fn(),
        } as unknown as ReturnType<
            typeof useCategories
        >)

        renderPage()

        expect(
            screen.getByText(
                'Unable to load categories',
            ),
        ).toBeInTheDocument()

        expect(
            screen.queryByRole('button', {
                name: 'Save Book',
            }),
        ).not.toBeInTheDocument()
    })

    it('blocks the page when authors fail to load', () => {
        mockUseAuthors.mockReturnValue({
            data: undefined,
            isPending: false,
            isError: true,
            error: new ApiError({
                kind: 'unreachable',
                message:
                    'The API could not be reached',
            }),
            isSuccess: false,
            refetch: vi.fn(),
        } as unknown as ReturnType<
            typeof useAuthors
        >)

        renderPage()

        expect(
            screen.getByText(
                'Unable to load authors',
            ),
        ).toBeInTheDocument()

        expect(
            screen.queryByRole('button', {
                name: 'Save Book',
            }),
        ).not.toBeInTheDocument()
    })

    it('does not submit when no metadata changed', async () => {
        const mutate = vi.fn()

        mockUseUpdateBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useUpdateBook
        >)

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Book',
            }),
        )

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'No changes have been made.',
        )

        expect(
            mutate,
        ).not.toHaveBeenCalled()
    })

    it('patches only changed metadata fields', () => {
        const mutate = vi.fn()

        mockUseUpdateBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useUpdateBook
        >)

        renderPage()

        fireEvent.change(
            screen.getByLabelText('Title'),
            {
                target: {
                    value: 'Pale Fire',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Book',
            }),
        )

        expect(mutate).toHaveBeenCalledWith(
            {
                id: 'test-book-id',
                book: {
                    title: 'Pale Fire',
                },
            },
            expect.objectContaining({
                onSuccess: expect.any(Function),
                onError: expect.any(Function),
            }),
        )

        const variables =
            mutate.mock.calls[0][0]

        expect(
            variables.book,
        ).not.toHaveProperty('status')

        expect(
            variables.book,
        ).not.toHaveProperty('is_read')

        expect(
            variables.book,
        ).not.toHaveProperty(
            'completion_date',
        )

        expect(
            variables.book,
        ).not.toHaveProperty('rating')

        expect(
            variables.book,
        ).not.toHaveProperty('review')
    })

    it('sends null when nullable metadata is cleared', () => {
        const mutate = vi.fn()

        mockUseUpdateBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useUpdateBook
        >)

        renderPage()

        fireEvent.change(
            screen.getByLabelText('ISBN'),
            {
                target: {
                    value: '',
                },
            },
        )

        fireEvent.change(
            screen.getByLabelText('Publisher'),
            {
                target: {
                    value: '',
                },
            },
        )

        fireEvent.change(
            screen.getByLabelText('Notes'),
            {
                target: {
                    value: '',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Book',
            }),
        )

        expect(mutate).toHaveBeenCalledWith(
            {
                id: 'test-book-id',
                book: {
                    isbn13: null,
                    publisher: null,
                    notes: null,
                },
            },
            expect.objectContaining({
                onSuccess: expect.any(Function),
                onError: expect.any(Function),
            }),
        )
    })

    it('navigates to the returned book after success', () => {
        const updatedBook: BookRead = {
            ...book,
            title: 'Pale Fire',
        }

        const mutate = vi.fn(
            (
                _variables: unknown,
                options: {
                    onSuccess?: (
                        value: BookRead,
                    ) => void
                },
            ) => {
                options.onSuccess?.(
                    updatedBook,
                )
            },
        )

        mockUseUpdateBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useUpdateBook
        >)

        renderPage()

        fireEvent.change(
            screen.getByLabelText('Title'),
            {
                target: {
                    value: 'Pale Fire',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Book',
            }),
        )

        expect(
            mockNavigate,
        ).toHaveBeenCalledWith(
            '/books/test-book-id',
        )
    })

    it('maps backend 422 errors and preserves the draft', async () => {
        const mutate = vi.fn(
            (
                _variables: unknown,
                options: {
                    onError?: (
                        error: unknown,
                    ) => void
                },
            ) => {
                options.onError?.(
                    new ApiError({
                        kind: 'validation',
                        status: 422,
                        message:
                            'Validation failed.',
                        fieldErrors: [
                            {
                                field: 'title',
                                message:
                                    'Invalid title.',
                            },
                        ],
                    }),
                )
            },
        )

        mockUseUpdateBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useUpdateBook
        >)

        renderPage()

        fireEvent.change(
            screen.getByLabelText('Title'),
            {
                target: {
                    value:
                        'Preserve this draft',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Book',
            }),
        )

        await waitFor(() => {
            expect(
                screen.getByRole('alert'),
            ).toHaveTextContent(
                'Correct the marked fields and try again.',
            )
        })

        expect(
            screen.getByLabelText('Title'),
        ).toHaveValue(
            'Preserve this draft',
        )

        const titleInput =
            screen.getByLabelText('Title')

        const titleErrorLink =
            screen.getByRole('link', {
                name: /Title:/,
            })

        expect(titleInput).toHaveAttribute('id')

        expect(titleErrorLink).toHaveAttribute(
            'href',
            `#${titleInput.getAttribute('id')}`,
        )
    })

    it('preserves the draft after a stale 404', async () => {
        const mutate = vi.fn(
            (
                _variables: unknown,
                options: {
                    onError?: (
                        error: unknown,
                    ) => void
                },
            ) => {
                options.onError?.(
                    new ApiError({
                        kind: 'http',
                        status: 404,
                        message:
                            'Book not found.',
                    }),
                )
            },
        )

        mockUseUpdateBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useUpdateBook
        >)

        renderPage()

        fireEvent.change(
            screen.getByLabelText('Title'),
            {
                target: {
                    value:
                        'Preserve this draft',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Book',
            }),
        )

        await waitFor(() => {
            expect(
                screen.getByRole('alert'),
            ).toHaveTextContent(
                'missing or no longer available',
            )
        })

        expect(
            screen.getByLabelText('Title'),
        ).toHaveValue(
            'Preserve this draft',
        )
    })

    it('maps 412 shelf-vs-wishlist exclusivity onto the shelf field', async () => {
        const mutate = vi.fn(
            (
                _variables: unknown,
                options: {
                    onError?: (
                        error: unknown,
                    ) => void
                },
            ) => {
                options.onError?.(
                    new ApiError({
                        kind: 'http',
                        status: 412,
                        message:
                            'The book must be removed from the wishlist before it can be placed on a shelf',
                        detail:
                            'The book must be removed from the wishlist before it can be placed on a shelf',
                    }),
                )
            },
        )

        mockUseUpdateBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useUpdateBook
        >)

        renderPage()

        fireEvent.click(
            screen.getByLabelText('Shelf'),
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'A2',
            }),
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Book',
            }),
        )

        await waitFor(() => {
            expect(
                screen.getByRole('alert'),
            ).toHaveTextContent(
                'The book must be removed from the wishlist before it can be placed on a shelf',
            )
        })

        expect(
            screen.getByLabelText('Shelf'),
        ).toHaveAttribute('aria-invalid', 'true')
    })

    it('disables submission while an update is pending', () => {
        mockUseUpdateBook.mockReturnValue({
            mutate: vi.fn(),
            isPending: true,
        } as unknown as ReturnType<
            typeof useUpdateBook
        >)

        renderPage()

        expect(
            screen.getByRole('button', {
                name: 'Saving…',
            }),
        ).toBeDisabled()
    })
})
