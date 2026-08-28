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
import type { BookRead } from '../../../api/apiTypes'
import {
    useBook,
    useMarkBookRead,
} from '../../../api/booksQueries'
import { MarkReadPage } from './MarkReadPage'

vi.mock('../../../api/booksQueries', () => ({
    useBook: vi.fn(),
    useMarkBookRead: vi.fn(),
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
const mockUseMarkBookRead =
    vi.mocked(useMarkBookRead)

const unreadBook: BookRead = {
    id: 'test-book-id',
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
    status: 'available',
    publication_date: '1962',
    publisher: 'Vintage',
    pages: 315,
    acquisition_source: null,
    purchase_date: null,
    purchase_price: null,
    is_read: false,
    completion_date: null,
    rating: null,
    review: null,
    notes: null,
    tags: null,
    last_borrowed_at: null,
    times_borrowed: 0,
    average_loan_days: null,
    creation_date:
        '2026-08-01T12:00:00.000Z',
    updated_date:
        '2026-08-01T12:00:00.000Z',
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
        '/books/test-book-id/mark-read',
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
                        path="/books/:bookId/mark-read"
                        element={<MarkReadPage />}
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

function setupSuccessfulBook(
    book: BookRead = unreadBook,
) {
    mockUseBook.mockReturnValue({
        data: book,
        isPending: false,
        isError: false,
        error: null,
    } as unknown as ReturnType<
        typeof useBook
    >)
}

function confirmMarkRead() {
    const dialog =
        screen.getByRole('dialog', {
            name: 'Confirm reading completion',
        })

    const buttons =
        dialog.querySelectorAll('button')

    fireEvent.click(buttons[1])
}

describe('MarkReadPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        setupSuccessfulBook()

        mockUseMarkBookRead.mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        } as unknown as ReturnType<
            typeof useMarkBookRead
        >)
    })

    it('renders the mark-read form for an active unread book', () => {
        renderPage()

        expect(
            screen.getByRole('heading', {
                name: 'Mark Book Read',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getAllByText(
                'The Pale Fire',
                {
                    selector: 'strong',
                },
            ),
        ).toHaveLength(2)

        expect(
            screen.getByLabelText(
                'Completion date',
            ),
        ).toHaveValue('')

        expect(
            screen.getByLabelText('Rating'),
        ).toHaveValue('')

        expect(
            screen.getByLabelText('Review'),
        ).toHaveValue('')

        expect(
            screen.getByRole('button', {
                name: 'Mark Read',
            }),
        ).toBeEnabled()
    })

    it('uses the book ID from the route', () => {
        renderPage(
            '/books/another-book/mark-read',
        )

        expect(
            mockUseBook,
        ).toHaveBeenCalledWith(
            'another-book',
        )
    })

    it('shows a loading state while the book loads', () => {
        mockUseBook.mockReturnValue({
            data: undefined,
            isPending: true,
            isError: false,
            error: null,
        } as unknown as ReturnType<
            typeof useBook
        >)

        renderPage()

        expect(
            screen.getByRole('status'),
        ).toBeInTheDocument()
    })

    it('shows a not-found state when the book returns 404', () => {
        mockUseBook.mockReturnValue({
            data: undefined,
            isPending: false,
            isError: true,
            error: new ApiError({
                kind: 'http',
                status: 404,
                message: 'Book not found.',
            }),
        } as unknown as ReturnType<
            typeof useBook
        >)

        renderPage()

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'This book could not be found.',
        )

        expect(
            screen.queryByRole('button', {
                name: 'Mark Read',
            }),
        ).not.toBeInTheDocument()
    })

    it('does not offer initial mark-read for an already-read book', () => {
        setupSuccessfulBook({
            ...unreadBook,
            is_read: true,
            completion_date: '2026-08-14',
        })

        renderPage()

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'Initial reading completion has already been recorded',
        )

        expect(
            screen.queryByRole('button', {
                name: 'Mark Read',
            }),
        ).not.toBeInTheDocument()
    })

    it('submits an empty request when all optional fields are blank', () => {
        const mutate = vi.fn()

        mockUseMarkBookRead.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useMarkBookRead
        >)

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Mark Read',
            }),
        )

        expect(
            screen.getByRole('dialog', {
                name: 'Confirm reading completion',
            }),
        ).toBeInTheDocument()

        confirmMarkRead()

        expect(mutate).toHaveBeenCalledWith(
            {
                id: 'test-book-id',
                request: {},
            },
            expect.objectContaining({
                onSuccess: expect.any(Function),
                onError: expect.any(Function),
            }),
        )
    })

    it('submits supplied reading fields', () => {
        const mutate = vi.fn()

        mockUseMarkBookRead.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useMarkBookRead
        >)

        renderPage()

        fireEvent.change(
            screen.getByLabelText(
                'Completion date',
            ),
            {
                target: {
                    value: '2026-08-14',
                },
            },
        )

        fireEvent.change(
            screen.getByLabelText('Rating'),
            {
                target: {
                    value: '5',
                },
            },
        )

        fireEvent.change(
            screen.getByLabelText('Review'),
            {
                target: {
                    value:
                        'A marvelous book.',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Mark Read',
            }),
        )

        confirmMarkRead()

        expect(mutate).toHaveBeenCalledWith(
            {
                id: 'test-book-id',
                request: {
                    completion_date:
                        '2026-08-14',
                    rating: 5,
                    review:
                        'A marvelous book.',
                },
            },
            expect.objectContaining({
                onSuccess: expect.any(Function),
                onError: expect.any(Function),
            }),
        )
    })

    it('does not submit when confirmation is cancelled', () => {
        const mutate = vi.fn()

        mockUseMarkBookRead.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useMarkBookRead
        >)

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Mark Read',
            }),
        )

        const dialog =
            screen.getByRole('dialog', {
                name: 'Confirm reading completion',
            })

        const buttons =
            dialog.querySelectorAll('button')

        fireEvent.click(buttons[0])

        expect(
            mutate,
        ).not.toHaveBeenCalled()
    })

    it('navigates to the returned book after success', () => {
        const updatedBook: BookRead = {
            ...unreadBook,
            is_read: true,
            completion_date: '2026-08-14',
        }

        const mutate = vi.fn(
            (
                _variables: unknown,
                options: {
                    onSuccess?: (
                        book: BookRead,
                    ) => void
                },
            ) => {
                options.onSuccess?.(
                    updatedBook,
                )
            },
        )

        mockUseMarkBookRead.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useMarkBookRead
        >)

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Mark Read',
            }),
        )

        confirmMarkRead()

        expect(
            mockNavigate,
        ).toHaveBeenCalledWith(
            '/books/test-book-id',
        )
    })

    it('maps backend 422 errors to fields and preserves input', async () => {
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
                                field: 'rating',
                                message:
                                    'Input should be less than or equal to 5',
                            },
                        ],
                    }),
                )
            },
        )

        mockUseMarkBookRead.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useMarkBookRead
        >)

        renderPage()

        fireEvent.change(
            screen.getByLabelText('Review'),
            {
                target: {
                    value:
                        'Keep this draft.',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Mark Read',
            }),
        )

        confirmMarkRead()

        await waitFor(() => {
            expect(
                screen.getByRole('alert'),
            ).toHaveTextContent(
                'Correct the marked fields and try again.',
            )
        })

        expect(
            screen.getByLabelText('Rating'),
        ).toHaveAccessibleDescription(
            'Optional. Choose a rating from 1 through 5. Input should be less than or equal to 5',
        )

        expect(
            screen.getByLabelText('Review'),
        ).toHaveValue(
            'Keep this draft.',
        )

        expect(
            screen.getByRole('link', {
                name: /Rating:/,
            }),
        ).toHaveAttribute(
            'href',
            '#mark-read-rating',
        )
    })

    it('refreshes stale state and preserves input after a 404', async () => {
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

        mockUseMarkBookRead.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useMarkBookRead
        >)

        const {
            queryClient,
        } = renderPage()

        const invalidateSpy = vi.spyOn(
            queryClient,
            'invalidateQueries',
        )

        fireEvent.change(
            screen.getByLabelText('Review'),
            {
                target: {
                    value:
                        'Preserve this review.',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Mark Read',
            }),
        )

        confirmMarkRead()

        await waitFor(() => {
            expect(
                screen.getByRole('alert'),
            ).toHaveTextContent(
                'missing, deleted, or no longer available',
            )
        })

        expect(
            screen.getByLabelText('Review'),
        ).toHaveValue(
            'Preserve this review.',
        )

        await waitFor(() => {
            expect(
                invalidateSpy,
            ).toHaveBeenCalled()
        })
    })

    it('preserves input and refreshes state after a network failure', async () => {
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
                        kind: 'unreachable',
                        message:
                            'Unable to reach the API.',
                    }),
                )
            },
        )

        mockUseMarkBookRead.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useMarkBookRead
        >)

        const {
            queryClient,
        } = renderPage()

        const invalidateSpy = vi.spyOn(
            queryClient,
            'invalidateQueries',
        )

        fireEvent.change(
            screen.getByLabelText('Review'),
            {
                target: {
                    value:
                        'Still here after failure.',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Mark Read',
            }),
        )

        confirmMarkRead()

        await waitFor(() => {
            expect(
                screen.getByRole('alert'),
            ).toHaveTextContent(
                'Unable to reach the API.',
            )
        })

        expect(
            screen.getByLabelText('Review'),
        ).toHaveValue(
            'Still here after failure.',
        )

        await waitFor(() => {
            expect(
                invalidateSpy,
            ).toHaveBeenCalled()
        })
    })

    it('disables form controls while the mutation is pending', () => {
        mockUseMarkBookRead.mockReturnValue({
            mutate: vi.fn(),
            isPending: true,
        } as unknown as ReturnType<
            typeof useMarkBookRead
        >)

        renderPage()

        expect(
            screen.getByLabelText(
                'Completion date',
            ),
        ).toBeDisabled()

        expect(
            screen.getByLabelText('Rating'),
        ).toBeDisabled()

        expect(
            screen.getByLabelText('Review'),
        ).toBeDisabled()

        expect(
            screen.getByRole('button', {
                name: 'Marking Read…',
            }),
        ).toBeDisabled()
    })
})
