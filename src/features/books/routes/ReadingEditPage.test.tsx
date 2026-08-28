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
    useUpdateBook,
} from '../../../api/booksQueries'
import { ReadingEditPage } from './ReadingEditPage'

vi.mock('../../../api/booksQueries', () => ({
    useBook: vi.fn(),
    useUpdateBook: vi.fn(),
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

const readBook: BookRead = {
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
    is_read: true,
    completion_date: '2026-08-10',
    rating: 5,
    review: 'A marvelous book.',
    notes: null,
    tags: null,
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
        '/books/test-book-id/reading',
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
                        path="/books/:bookId/reading"
                        element={
                            <ReadingEditPage />
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

function setupSuccessfulBook(
    book: BookRead = readBook,
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

function confirmSave() {
    const dialog =
        screen.getByRole('dialog', {
            name: 'Confirm reading changes',
        })

    const buttons =
        dialog.querySelectorAll('button')

    fireEvent.click(buttons[1])
}

describe('ReadingEditPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        setupSuccessfulBook()

        mockUseUpdateBook.mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        } as unknown as ReturnType<
            typeof useUpdateBook
        >)
    })

    it('loads existing reading values into the form', () => {
        renderPage()

        expect(
            screen.getByRole('heading', {
                name: 'Edit Reading',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText(
                'Completion date',
            ),
        ).toHaveValue('2026-08-10')

        expect(
            screen.getByLabelText('Rating'),
        ).toHaveValue('5')

        expect(
            screen.getByLabelText('Review'),
        ).toHaveValue(
            'A marvelous book.',
        )
    })

    it('uses the book ID from the route', () => {
        renderPage(
            '/books/another-book/reading',
        )

        expect(
            mockUseBook,
        ).toHaveBeenCalledWith(
            'another-book',
        )
    })

    it('does not offer reading edits for an unread book', () => {
        setupSuccessfulBook({
            ...readBook,
            is_read: false,
            completion_date: null,
            rating: null,
            review: null,
        })

        renderPage()

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'Mark this book as read before editing its reading details.',
        )

        expect(
            screen.queryByRole('button', {
                name: 'Save Reading',
            }),
        ).not.toBeInTheDocument()
    })

    it('does not submit when no reading fields changed', async () => {
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
                name: 'Save Reading',
            }),
        )

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            'No reading changes have been made.',
        )

        expect(
            mutate,
        ).not.toHaveBeenCalled()

        expect(
            screen.queryByRole('dialog', {
                name: 'Confirm reading changes',
            }),
        ).not.toBeInTheDocument()
    })

    it('patches only changed reading fields', () => {
        const mutate = vi.fn()

        mockUseUpdateBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useUpdateBook
        >)

        renderPage()

        fireEvent.change(
            screen.getByLabelText('Rating'),
            {
                target: {
                    value: '4',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Reading',
            }),
        )

        confirmSave()

        expect(mutate).toHaveBeenCalledWith(
            {
                id: 'test-book-id',
                book: {
                    rating: 4,
                },
            },
            expect.objectContaining({
                onSuccess: expect.any(Function),
                onError: expect.any(Function),
            }),
        )

        const variables =
            mutate.mock.calls[0][0]

        expect(variables.book).not.toHaveProperty(
            'is_read',
        )
        expect(variables.book).not.toHaveProperty(
            'status',
        )
    })

    it('sends null for intentionally cleared reading fields', () => {
        const mutate = vi.fn()

        mockUseUpdateBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useUpdateBook
        >)

        renderPage()

        fireEvent.change(
            screen.getByLabelText(
                'Completion date',
            ),
            {
                target: {
                    value: '',
                },
            },
        )

        fireEvent.change(
            screen.getByLabelText('Rating'),
            {
                target: {
                    value: '',
                },
            },
        )

        fireEvent.change(
            screen.getByLabelText('Review'),
            {
                target: {
                    value: '',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Reading',
            }),
        )

        confirmSave()

        expect(mutate).toHaveBeenCalledWith(
            {
                id: 'test-book-id',
                book: {
                    completion_date: null,
                    rating: null,
                    review: null,
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

        mockUseUpdateBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useUpdateBook
        >)

        renderPage()

        fireEvent.change(
            screen.getByLabelText('Rating'),
            {
                target: {
                    value: '4',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Reading',
            }),
        )

        const dialog =
            screen.getByRole('dialog', {
                name: 'Confirm reading changes',
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
            ...readBook,
            rating: 4,
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

        mockUseUpdateBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useUpdateBook
        >)

        renderPage()

        fireEvent.change(
            screen.getByLabelText('Rating'),
            {
                target: {
                    value: '4',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Reading',
            }),
        )

        confirmSave()

        expect(
            mockNavigate,
        ).toHaveBeenCalledWith(
            '/books/test-book-id',
        )
    })

    it('maps backend 422 errors to fields and preserves the draft', async () => {
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
                                    'Invalid rating.',
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
            screen.getByLabelText('Rating'),
            {
                target: {
                    value: '4',
                },
            },
        )

        fireEvent.change(
            screen.getByLabelText('Review'),
            {
                target: {
                    value:
                        'Preserve this draft.',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Reading',
            }),
        )

        confirmSave()

        await waitFor(() => {
            expect(
                screen.getByRole('alert'),
            ).toHaveTextContent(
                'Correct the marked fields and try again.',
            )
        })

        expect(
            screen.getByLabelText('Rating'),
        ).toHaveValue('4')

        expect(
            screen.getByLabelText('Review'),
        ).toHaveValue(
            'Preserve this draft.',
        )

        expect(
            screen.getByRole('link', {
                name: /Rating:/,
            }),
        ).toHaveAttribute(
            'href',
            '#reading-edit-rating',
        )
    })

    it('refreshes stale state and preserves the draft after a 404', async () => {
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
                        'Preserve after 404.',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Reading',
            }),
        )

        confirmSave()

        await waitFor(() => {
            expect(
                screen.getByRole('alert'),
            ).toHaveTextContent(
                'missing or no longer available',
            )
        })

        expect(
            screen.getByLabelText('Review'),
        ).toHaveValue(
            'Preserve after 404.',
        )

        await waitFor(() => {
            expect(
                invalidateSpy,
            ).toHaveBeenCalled()
        })
    })

    it('preserves the draft and refreshes state after a network failure', async () => {
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

        mockUseUpdateBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useUpdateBook
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
                        'Preserve after failure.',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Reading',
            }),
        )

        confirmSave()

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
            'Preserve after failure.',
        )

        await waitFor(() => {
            expect(
                invalidateSpy,
            ).toHaveBeenCalled()
        })
    })

    it('disables form controls while an update is pending', () => {
        mockUseUpdateBook.mockReturnValue({
            mutate: vi.fn(),
            isPending: true,
        } as unknown as ReturnType<
            typeof useUpdateBook
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
                name: 'Saving…',
            }),
        ).toBeDisabled()
    })
})
