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
import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'
import { ApiError } from '../../../api/apiErrors'

import { CheckinPage } from './CheckinPage'

import {
    useBook,
    useBooks,
    useCheckinBook,
} from '../../../api/booksQueries'
import {
    useLoans,
} from '../../../api/loansQueries'

vi.mock('../../../api/booksQueries', () => ({
    useBook: vi.fn(),
    useBooks: vi.fn(),
    useCheckinBook: vi.fn(),
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
const mockUseBooks = vi.mocked(useBooks)
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

const returnedLoan = {
    ...activeLoan,
    id: 'returned-loan-id',
    returned_at: '2026-08-13T15:30:00Z',
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
    '/checkin?bookId=test-book-id',
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
                <CheckinPage />
            </MemoryRouter>
        </QueryClientProvider>,
    )

    return {
        ...result,
        queryClient,
    }
}
function setupSuccessfulBook() {
    mockUseBook.mockReturnValue({
        data: book,
        isPending: false,
        isError: false,
        error: null,
    }  as unknown as ReturnType<
    typeof useBook
>)
    mockUseBooks.mockReturnValue({
        data: {
            items: [book],
            total: 1,
        },
        isPending: false,
        isError: false,
        error: null,
    } as ReturnType<typeof useBooks>)

    mockUseLoans.mockReturnValue({
        data: {
            items: [activeLoan],
            total: 1,
        },
        isPending: false,
        isError: false,
        error: null,
    } as ReturnType<typeof useLoans>)
}

function confirmCheckin() {
    fireEvent.click(
        screen
            .getByRole('dialog', {
                name: 'Confirm check-in',
            })
            .querySelector(
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

    it('renders the check-in form for a book with an active loan', () => {
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
            screen.getByText(
                'Vladimir Nabokov',
            ),
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

    it('offers eligible book selection when no book ID is provided', () => {
        mockUseBook.mockReturnValue({
            data: undefined,
            isPending: false,
            isError: false,
            error: null,
        } as unknown as ReturnType<
        typeof useBook
    >)
        renderPage('/checkin')

        expect(
            screen.getByRole('heading', {
                name: 'Check In Book',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'Select a book with an active loan to check in.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('heading', {
                name: 'The Pale Fire',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Jane Reader'),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'Select',
            }),
        ).toBeEnabled()
    })

    it('does not offer books without an active loan in selection', () => {
        mockUseBook.mockReturnValue({
            data: undefined,
            isPending: false,
            isError: false,
            error: null,
        } as unknown as ReturnType<
        typeof useBook
    >)
        mockUseLoans.mockReturnValue({
            data: {
                items: [returnedLoan],
                total: 1,
            },
            isPending: false,
            isError: false,
            error: null,
        } as ReturnType<typeof useLoans>)

        renderPage('/checkin')

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'There are no active loans available for check-in.',
        )

        expect(
            screen.queryByRole('button', {
                name: 'Select',
            }),
        ).not.toBeInTheDocument()
    })

    it('does not offer a deleted book even when it has an active loan', () => {
        mockUseBook.mockReturnValue({
            data: undefined,
            isPending: false,
            isError: false,
            error: null,
        } as unknown as ReturnType<
        typeof useBook
    >)
        mockUseBooks.mockReturnValue({
            data: {
                items: [
                    {
                        ...book,
                        deletion_date:
                            '2026-08-13T12:00:00Z',
                    },
                ],
                total: 1,
            },
            isPending: false,
            isError: false,
            error: null,
        } as ReturnType<typeof useBooks>)

        renderPage('/checkin')

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'There are no active loans available for check-in.',
        )

        expect(
            screen.queryByRole('button', {
                name: 'Select',
            }),
        ).not.toBeInTheDocument()
    })

    it('allows a book with an active loan even when book status is inconsistent', () => {
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
            screen.getByLabelText(
                'Return date and time',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'Check In Book',
            }),
        ).toBeEnabled()
    })

    it('rejects an on-loan book when no active loan exists', () => {
        mockUseLoans.mockReturnValue({
            data: {
                items: [returnedLoan],
                total: 1,
            },
            isPending: false,
            isError: false,
            error: null,
        } as ReturnType<typeof useLoans>)

        renderPage()

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'The Pale Fire does not currently have an active loan.',
        )

        expect(
            screen.getByRole('button', {
                name: 'Refresh eligible books',
            }),
        ).toBeEnabled()

        expect(
            screen.queryByRole('button', {
                name: 'Check In Book',
            }),
        ).not.toBeInTheDocument()
    })

    it('rejects a deleted book even when an active loan exists', () => {
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

        expect(
            screen.queryByRole('button', {
                name: 'Check In Book',
            }),
        ).not.toBeInTheDocument()
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

    it('submits a check-in with no explicit return date', () => {
        const mutate = vi.fn()

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
        } as unknown as ReturnType<
            typeof useCheckinBook
        >)

        renderPage()

        fireEvent.change(
            screen.getByLabelText(
                'Return date and time',
            ),
            {
                target: {
                    value:
                        '2026-08-13T15:30',
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
                        new Date(
                            2026,
                            7,
                            13,
                            15,
                            30,
                        ).toISOString(),
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
            mockNavigate,
        ).toHaveBeenCalledWith(
            '/books/test-book-id',
        )
    })

    it('shows the mutation error when check-in fails', async () => {
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

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Check In Book',
            }),
        )

        confirmCheckin()

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
                    onError?: (
                        error: unknown,
                    ) => void
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

        await waitFor(() => {
            expect(
                screen.getByRole('alert'),
            ).toHaveTextContent(
                'The book could not be checked in.',
            )
        })
    })

    it('cancels by navigating back', () => {
        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Cancel',
            }),
        )

        expect(
            mockNavigate,
        ).toHaveBeenCalledWith(-1)
    })

    it('does not submit when confirmation is cancelled', () => {
        const mutate = vi.fn()

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

        const dialog =
            screen.getByRole('dialog', {
                name: 'Confirm check-in',
            })

        const buttons =
            dialog.querySelectorAll('button')

        fireEvent.click(buttons[0])

        expect(mutate).not.toHaveBeenCalled()
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
                            'Book not found',
                        detail:
                            'Book not found',
                    }),
                )
            },
        )

        mockUseCheckinBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useCheckinBook
        >)

        const {
            queryClient,
        } = renderPage()

        const invalidateSpy = vi.spyOn(
            queryClient,
            'invalidateQueries',
        )

        fireEvent.change(
            screen.getByLabelText(
                'Return date and time',
            ),
            {
                target: {
                    value:
                        '2026-08-13T15:30',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Check In Book',
            }),
        )

        confirmCheckin()

        await waitFor(() => {
            expect(
                screen.getByRole('alert'),
            ).toHaveTextContent(
                'This book or loan could not be found.',
            )
        })

        expect(
            screen.getByLabelText(
                'Return date and time',
            ),
        ).toHaveValue(
            '2026-08-13T15:30',
        )

        expect(
            invalidateSpy,
        ).toHaveBeenCalledTimes(3)

        expect(
            mockNavigate,
        ).not.toHaveBeenCalled()
    })

    it('shows the documented conflict and refreshes stale state after a 409', async () => {
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
                        status: 409,
                        message:
                            'State conflict',
                        detail:
                            'Book is not checked out',
                    }),
                )
            },
        )

        mockUseCheckinBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useCheckinBook
        >)

        const {
            queryClient,
        } = renderPage()

        const invalidateSpy = vi.spyOn(
            queryClient,
            'invalidateQueries',
        )

        fireEvent.change(
            screen.getByLabelText(
                'Return date and time',
            ),
            {
                target: {
                    value:
                        '2026-08-13T15:30',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Check In Book',
            }),
        )

        confirmCheckin()

        await waitFor(() => {
            expect(
                screen.getByRole('alert'),
            ).toHaveTextContent(
                'Book is not checked out.',
            )
        })

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            'The book and loan state were refreshed; your return date was kept.',
        )

        expect(
            screen.getByLabelText(
                'Return date and time',
            ),
        ).toHaveValue(
            '2026-08-13T15:30',
        )

        expect(
            invalidateSpy,
        ).toHaveBeenCalledTimes(3)

        expect(
            mockNavigate,
        ).not.toHaveBeenCalled()

        expect(mutate).toHaveBeenCalledTimes(1)
    })

    it('maps a 422 return-time error to the field and preserves input', async () => {
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
                            'Validation failed',
                        fieldErrors: [
                            {
                                field:
                                    'returned_at',
                                message:
                                    'Invalid return date and time',
                            },
                        ],
                    }),
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

        fireEvent.change(
            screen.getByLabelText(
                'Return date and time',
            ),
            {
                target: {
                    value:
                        '2026-08-13T15:30',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Check In Book',
            }),
        )

        confirmCheckin()

        await waitFor(() => {
            expect(
                screen.getByRole('alert'),
            ).toHaveTextContent(
                'Return date and time: Invalid return date and time',
            )
        })

        expect(
            screen.getByLabelText(
                'Return date and time',
            ),
        ).toHaveValue(
            '2026-08-13T15:30',
        )

        expect(
            screen.getByText(
                'Invalid return date and time',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('alert'),
        ).toHaveFocus()

        expect(
            screen.getByRole('link', {
                name:
                    'Return date and time: Invalid return date and time',
            }),
        ).toHaveAttribute(
            'href',
            '#checkin-returned-at',
        )

        expect(
            mockNavigate,
        ).not.toHaveBeenCalled()
    })

    it('disables the submit button while check-in is pending', () => {
        mockUseCheckinBook.mockReturnValue({
            mutate: vi.fn(),
            isPending: true,
        } as unknown as ReturnType<
            typeof useCheckinBook
        >)

        renderPage()

        expect(
            screen.getByRole('button', {
                name: 'Checking In...',
            }),
        ).toBeDisabled()
    })
})