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
import { MemoryRouter } from 'react-router-dom'
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
} from '../../../api/apiTypes'
import {
    useBooks,
    useRestoreBook,
} from '../../../api/booksQueries'
import { DeletedBooksPage } from './DeletedBooksPage'

vi.mock('../../../api/booksQueries', () => ({
    useBooks: vi.fn(),
    useRestoreBook: vi.fn(),
}))

const mockUseBooks = vi.mocked(useBooks)
const mockUseRestoreBook =
    vi.mocked(useRestoreBook)

const deletedBook: BookRead = {
    id: 'deleted-book-id',
    title: 'Pale Fire',
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
    last_borrowed_at:
        '2026-08-01T12:00:00Z',
    times_borrowed: 3,
    average_loan_days: 8,
    creation_date:
        '2026-01-01T12:00:00Z',
    updated_date:
        '2026-08-14T12:00:00Z',
    deletion_date:
        '2026-08-14T12:00:00Z',
}

const activeBook: BookRead = {
    ...deletedBook,
    id: 'active-book-id',
    title: 'Lolita',
    deletion_date: null,
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

function renderPage() {
    const queryClient = createQueryClient()

    return render(
        <QueryClientProvider
            client={queryClient}
        >
            <MemoryRouter>
                <DeletedBooksPage />
            </MemoryRouter>
        </QueryClientProvider>,
    )
}

function setupBooks(
    items: BookRead[] = [
        activeBook,
        deletedBook,
    ],
) {
    mockUseBooks.mockReturnValue({
        data: {
            items,
            total: items.length,
        },
        isPending: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
    } as unknown as ReturnType<
        typeof useBooks
    >)
}

function confirmRestore() {
    const dialog =
        screen.getByRole('dialog', {
            name: 'Confirm book restoration',
        })

    const buttons =
        dialog.querySelectorAll('button')

    fireEvent.click(buttons[1])
}

describe('DeletedBooksPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        setupBooks()

        mockUseRestoreBook.mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        } as unknown as ReturnType<
            typeof useRestoreBook
        >)
    })

    it('requests books including deleted records', () => {
        renderPage()

        expect(
            mockUseBooks,
        ).toHaveBeenCalledWith({
            includeDeleted: true,
        })
    })

    it('shows only deleted books', () => {
        renderPage()

        expect(
            screen.getByRole('link', {
                name: 'Pale Fire',
            }),
        ).toBeInTheDocument()

        expect(
            screen.queryByRole('link', {
                name: 'Lolita',
            }),
        ).not.toBeInTheDocument()

        expect(
            screen.getByText(
                '1 deleted book.',
            ),
        ).toBeInTheDocument()
    })

    it('shows retained reading and borrowing information', () => {
        renderPage()

        expect(
            screen.getByText('Reading: Read'),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'Times borrowed: 3',
            ),
        ).toBeInTheDocument()
    })

    it('shows an empty state when there are no deleted books', () => {
        setupBooks([activeBook])

        renderPage()

        expect(
            screen.getByText(
                'No deleted books.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.queryByRole('button', {
                name: 'Restore Book',
            }),
        ).not.toBeInTheDocument()
    })

    it('does not restore before confirmation', () => {
        const mutate = vi.fn()

        mockUseRestoreBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useRestoreBook
        >)

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Restore Book',
            }),
        )

        expect(
            screen.getByRole('dialog', {
                name:
                    'Confirm book restoration',
            }),
        ).toBeInTheDocument()

        expect(
            mutate,
        ).not.toHaveBeenCalled()
    })

    it('does not restore when confirmation is cancelled', () => {
        const mutate = vi.fn()

        mockUseRestoreBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useRestoreBook
        >)

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Restore Book',
            }),
        )

        const dialog =
            screen.getByRole('dialog', {
                name:
                    'Confirm book restoration',
            })

        const buttons =
            dialog.querySelectorAll('button')

        fireEvent.click(buttons[0])

        expect(
            mutate,
        ).not.toHaveBeenCalled()
    })

    it('restores the selected book after confirmation', () => {
        const mutate = vi.fn()

        mockUseRestoreBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useRestoreBook
        >)

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Restore Book',
            }),
        )

        confirmRestore()

        expect(mutate).toHaveBeenCalledWith(
            'deleted-book-id',
            expect.objectContaining({
                onSuccess: expect.any(Function),
                onError: expect.any(Function),
            }),
        )
    })

    it('closes confirmation after successful restore', async () => {
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

        mockUseRestoreBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useRestoreBook
        >)

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Restore Book',
            }),
        )

        confirmRestore()

        await waitFor(() => {
            expect(
                screen.queryByRole('dialog', {
                    name:
                        'Confirm book restoration',
                }),
            ).not.toBeInTheDocument()
        })
    })

    it('handles a stale restore 404 and refetches books', async () => {
        const refetch = vi.fn()

        mockUseBooks.mockReturnValue({
            data: {
                items: [deletedBook],
                total: 1,
            },
            isPending: false,
            isError: false,
            error: null,
            refetch,
        } as unknown as ReturnType<
            typeof useBooks
        >)

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
                            'Book not found.',
                    }),
                )
            },
        )

        mockUseRestoreBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useRestoreBook
        >)

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Restore Book',
            }),
        )

        confirmRestore()

        await waitFor(() => {
            expect(
                screen.getByRole('alert'),
            ).toHaveTextContent(
                'missing or is no longer deleted',
            )
        })

        expect(refetch).toHaveBeenCalled()
    })

    it('handles a stale restore 409 and refetches books', async () => {
        const refetch = vi.fn()

        mockUseBooks.mockReturnValue({
            data: {
                items: [deletedBook],
                total: 1,
            },
            isPending: false,
            isError: false,
            error: null,
            refetch,
        } as unknown as ReturnType<
            typeof useBooks
        >)

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
                        status: 409,
                        message:
                            'Book is not deleted.',
                    }),
                )
            },
        )

        mockUseRestoreBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useRestoreBook
        >)

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Restore Book',
            }),
        )

        confirmRestore()

        await waitFor(() => {
            expect(
                screen.getByRole('alert'),
            ).toHaveTextContent(
                'missing or is no longer deleted',
            )
        })

        expect(refetch).toHaveBeenCalled()
    })

    it('disables restore while the mutation is pending', () => {
        mockUseRestoreBook.mockReturnValue({
            mutate: vi.fn(),
            isPending: true,
        } as unknown as ReturnType<
            typeof useRestoreBook
        >)

        renderPage()

        expect(
            screen.getByRole('button', {
                name: 'Restore Book',
            }),
        ).toBeDisabled()
    })
})
