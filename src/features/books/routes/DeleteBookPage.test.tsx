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
    BookRead,
    LoanRead,
} from '../../../api/apiTypes'
import {
    useBook,
    useDeleteBook,
} from '../../../api/booksQueries'
import { useLoans } from '../../../api/loansQueries'
import { DeleteBookPage } from './DeleteBookPage'

vi.mock('../../../api/booksQueries', () => ({
    useBook: vi.fn(),
    useDeleteBook: vi.fn(),
}))

vi.mock('../../../api/loansQueries', () => ({
    useLoans: vi.fn(),
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
const mockUseDeleteBook =
    vi.mocked(useDeleteBook)
const mockUseLoans = vi.mocked(useLoans)

const book: BookRead = {
    id: 'test-book-id',
    title: 'The Pale Fire',
    authors: 'Vladimir Nabokov',
    isbn13: null,
    category: 'fiction',
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
    deletion_date: null,
}

const activeLoan: LoanRead = {
    id: 'loan-1',
    book_id: book.id,
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

const returnedLoan: LoanRead = {
    ...activeLoan,
    id: 'loan-returned',
    returned_at:
        '2026-08-13T15:30:00Z',
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
    '/books/test-book-id/delete',
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
                        path="/books/:bookId/delete"
                        element={
                            <DeleteBookPage />
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

function setupBook(
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

function setupLoans(
    items: LoanRead[] = [],
) {
    mockUseLoans.mockReturnValue({
        data: {
            items,
            total: items.length,
        },
        isPending: false,
        isError: false,
        error: null,
    } as unknown as ReturnType<
        typeof useLoans
    >)
}

function confirmDelete() {
    const dialog =
        screen.getByRole('dialog', {
            name: 'Confirm book deletion',
        })

    const buttons =
        dialog.querySelectorAll('button')

    fireEvent.click(buttons[1])
}

describe('DeleteBookPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        setupBook()
        setupLoans()

        mockUseDeleteBook.mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        } as unknown as ReturnType<
            typeof useDeleteBook
        >)
    })

    it('renders the soft-delete explanation', () => {
        renderPage()

        expect(
            screen.getByRole('heading', {
                name: 'Delete Book',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'This is a soft deletion',
        )

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'reading history',
        )
    })

    it('uses the book ID from the route', () => {
        renderPage(
            '/books/another-book/delete',
        )

        expect(
            mockUseBook,
        ).toHaveBeenCalledWith(
            'another-book',
        )

        expect(
            mockUseLoans,
        ).toHaveBeenCalledWith({
            bookId: 'another-book',
        })
    })

    it('does not allow deleting an already-deleted book', () => {
        setupBook({
            ...book,
            deletion_date:
                '2026-08-14T12:00:00Z',
        })

        renderPage()

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'This book has already been deleted',
        )

        expect(
            screen.queryByRole('button', {
                name: 'Delete Book',
            }),
        ).not.toBeInTheDocument()
    })

    it('blocks deletion when status is on_loan even without an active loan', () => {
        setupBook({
            ...book,
            status: 'on_loan',
        })

        setupLoans([returnedLoan])

        renderPage()

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'This book cannot be deleted',
        )

        expect(
            screen.queryByRole('button', {
                name: 'Delete Book',
            }),
        ).not.toBeInTheDocument()
    })

    it('blocks deletion when an active loan exists even if status is available', () => {
        setupBook({
            ...book,
            status: 'available',
        })

        setupLoans([activeLoan])

        renderPage()

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'This book cannot be deleted',
        )

        expect(
            screen.queryByRole('button', {
                name: 'Delete Book',
            }),
        ).not.toBeInTheDocument()
    })

    it('does not delete when confirmation is cancelled', () => {
        const mutate = vi.fn()

        mockUseDeleteBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useDeleteBook
        >)

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Delete Book',
            }),
        )

        const dialog =
            screen.getByRole('dialog', {
                name: 'Confirm book deletion',
            })

        const buttons =
            dialog.querySelectorAll('button')

        fireEvent.click(buttons[0])

        expect(
            mutate,
        ).not.toHaveBeenCalled()
    })

    it('deletes the book after confirmation', () => {
        const mutate = vi.fn()

        mockUseDeleteBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useDeleteBook
        >)

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Delete Book',
            }),
        )

        confirmDelete()

        expect(mutate).toHaveBeenCalledWith(
            'test-book-id',
            expect.objectContaining({
                onSuccess: expect.any(Function),
                onError: expect.any(Function),
            }),
        )
    })

    it('navigates to active browsing after successful deletion', () => {
        const mutate = vi.fn(
            (
                _id: string,
                options: {
                    onSuccess?: () => void
                },
            ) => {
                options.onSuccess?.()
            },
        )

        mockUseDeleteBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useDeleteBook
        >)

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Delete Book',
            }),
        )

        confirmDelete()

        expect(
            mockNavigate,
        ).toHaveBeenCalledWith('/books')
    })

    it('handles stale 404 and explains the changed state', async () => {
        const mutate = vi.fn(
            (
                _id: string,
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
                            'Book already deleted.',
                    }),
                )
            },
        )

        mockUseDeleteBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useDeleteBook
        >)

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Delete Book',
            }),
        )

        confirmDelete()

        await waitFor(() => {
            expect(
                screen.getByRole('alert'),
            ).toHaveTextContent(
                'missing or has already been deleted',
            )
        })
    })

    it('disables destructive submission while pending', () => {
        mockUseDeleteBook.mockReturnValue({
            mutate: vi.fn(),
            isPending: true,
        } as unknown as ReturnType<
            typeof useDeleteBook
        >)

        renderPage()

        expect(
            screen.getByRole('button', {
                name: 'Delete Book',
            }),
        ).toBeDisabled()
    })
})
