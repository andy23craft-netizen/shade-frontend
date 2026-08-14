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
} from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CheckinPage } from './CheckinPage'

import {
    useBook,
    useCheckinBook,
} from '../../../api/booksQueries'
import { useLoans } from '../../../api/loansQueries'

vi.mock('../../../api/booksQueries', () => ({
    useBook: vi.fn(),
    useCheckinBook: vi.fn(),
}))

vi.mock('../../../api/loansQueries', () => ({
    useLoans: vi.fn(),
}))

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async (importOriginal) => {
    const actual =
        await importOriginal<typeof import('react-router-dom')>()

    return {
        ...actual,
        useNavigate: () => mockNavigate,
    }
})

const mockUseBook = vi.mocked(useBook)
const mockUseLoans = vi.mocked(useLoans)
const mockUseCheckinBook = vi.mocked(
    useCheckinBook,
)

const book = {
    id: 'test-book-id',
    title: 'The Pale Fire',
    authors: 'Vladimir Nabokov',
    status: 'on_loan' as const,
    deletion_date: null,
}

const activeLoan = {
    id: 'test-loan-id',
    book_id: 'test-book-id',
    borrower: 'Jane Reader',
    checked_out_at: '2026-08-12T14:00:00Z',
    due_at: null,
    returned_at: null,
    notes: null,
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
    initialEntry = '/loans/checkin?bookId=test-book-id',
) {
    const queryClient = createQueryClient()

    return render(
        <QueryClientProvider
            client={queryClient}
        >
            <MemoryRouter
                initialEntries={[initialEntry]}
            >
                <CheckinPage />
            </MemoryRouter>
        </QueryClientProvider>,
    )
}

function setupSuccessfulBook() {
    mockUseBook.mockReturnValue({
        data: book,
        isPending: false,
        isError: false,
        error: null,
    } as ReturnType<typeof useBook>)

    mockUseLoans.mockReturnValue({
        data: {
            items: [activeLoan],
        },
        isPending: false,
        isError: false,
        error: null,
    } as ReturnType<typeof useLoans>)
}

function confirmCheckin() {
    fireEvent.click(
        screen.getByRole('dialog', {
            name: 'Confirm check-in',
        }).querySelector(
            'button.button--danger',
        )!,
    )
}

describe('CheckinPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        setupSuccessfulBook()

        mockUseCheckinBook.mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        } as unknown as ReturnType<
            typeof useCheckinBook
        >)
    })

    it('renders the check-in form', () => {
        renderPage()

        expect(
            screen.getByRole('heading', {
                name: 'Check In Book',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('heading', {
                name: 'The Pale Fire',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Vladimir Nabokov'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Jane Reader'),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText(
                'Return date and time',
            ),
        ).toHaveValue('')

        expect(
            screen.getByRole('button', {
                name: 'Check In Book',
            }),
        ).toBeEnabled()
    })

    it('shows a warning when no book ID is provided', () => {
        renderPage('/loans/checkin')

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            'No book ID was provided.',
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

    it('shows an error when the book cannot be loaded', () => {
        const error = new Error(
            'Book could not be loaded.',
        )

        mockUseBook.mockReturnValue({
            data: undefined,
            isPending: false,
            isError: true,
            error,
        } as ReturnType<typeof useBook>)

        renderPage()

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            'Book could not be loaded.',
        )
    })

    it('shows a warning when the book is not on loan', () => {
        mockUseBook.mockReturnValue({
            data: {
                ...book,
                status: 'available',
            },
            isPending: false,
            isError: false,
            error: null,
        } as ReturnType<typeof useBook>)

        renderPage()

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'The Pale Fire does not currently have an active loan.',
        )
    })

    it('shows a warning when the book has been deleted', () => {
        mockUseBook.mockReturnValue({
            data: {
                ...book,
                deletion_date:
                    '2026-08-13T12:00:00Z',
            },
            isPending: false,
            isError: false,
            error: null,
        } as ReturnType<typeof useBook>)

        renderPage()

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'The Pale Fire does not currently have an active loan.',
        )
    })

    it('submits a check-in with no explicit return date', () => {
        const mutate = vi.fn()

        mockUseCheckinBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<typeof useCheckinBook>)

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Check In Book',
            }),
        )

        confirmCheckin()

        expect(mutate).toHaveBeenCalledWith(
            {
                id: 'test-book-id',
                request: undefined,
            },
            expect.objectContaining({
                onSuccess: expect.any(Function),
                onError: expect.any(Function),
            }),
        )
    })

    it('submits a check-in with an explicit return date', () => {
        const mutate = vi.fn()

        mockUseCheckinBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<typeof useCheckinBook>)

        renderPage()

        fireEvent.change(
            screen.getByLabelText(
                'Return date and time',
            ),
            {
                target: {
                    value: '2026-08-13T15:30',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Check In Book',
            }),
        )

        confirmCheckin()

        expect(mutate).toHaveBeenCalledWith(
            {
                id: 'test-book-id',
                request: {
                    returned_at:
                        '2026-08-13T20:30:00.000Z',
                },
            },
            expect.objectContaining({
                onSuccess: expect.any(Function),
                onError: expect.any(Function),
            }),
        )
    })

    it('navigates to the book after successful check-in', () => {
        const mutate = vi.fn(
            (
                _variables: unknown,
                options: {
                    onSuccess?: () => void
                },
            ) => {
                options.onSuccess?.()
            },
        )

        mockUseCheckinBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<typeof useCheckinBook>)

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Check In Book',
            }),
        )

        confirmCheckin()

        expect(mockNavigate).toHaveBeenCalledWith(
            '/books/test-book-id',
        )
    })

    it('shows the mutation error when check-in fails', async () => {
        const mutate = vi.fn(
            (
                _variables: unknown,
                options: {
                    onError?: (error: unknown) => void
                },
            ) => {
                options.onError?.(
                    new Error(
                        'Book is not on loan.',
                    ),
                )
            },
        )

        mockUseCheckinBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useCheckinBook
        >)

        renderPage()

        fireEvent.submit(
            screen.getByRole('button', {
                name: 'Check In Book',
            }).closest('form')!,
        )

        fireEvent.click(
            screen.getByRole('dialog', {
                name: 'Confirm check-in',
            }).querySelector(
                'button.button--danger',
            )!,
        )

        await waitFor(() => {
            expect(
                screen.getByRole('alert'),
            ).toHaveTextContent(
                'Book is not on loan.',
            )
        })
    })

    it('shows the generic mutation error when the error is not an Error', async () => {
        const mutate = vi.fn(
            (
                _variables: unknown,
                options: {
                    onError?: (error: unknown) => void
                },
            ) => {
                options.onError?.(
                    'unexpected error',
                )
            },
        )

        mockUseCheckinBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useCheckinBook
        >)

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Check In Book',
            }),
        )

        confirmCheckin()

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            'The book could not be checked in.',
        )
    })

    it('cancels by navigating back', async () => {
        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Cancel',
            }),
        )

        expect(mockNavigate).toHaveBeenCalledWith(
            -1,
        )
    })

    it('disables the submit button while check-in is pending', () => {
        mockUseCheckinBook.mockReturnValue({
            mutate: vi.fn(),
            isPending: true,
        } as unknown as ReturnType<typeof useCheckinBook>)

        renderPage()

        expect(
            screen.getByRole('button', {
                name: 'Checking In...',
            }),
        ).toBeDisabled()
    })
})
