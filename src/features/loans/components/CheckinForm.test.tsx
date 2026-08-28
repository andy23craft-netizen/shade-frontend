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
    useCheckinBook,
} from '../../../api/booksQueries'
import { CheckinForm } from './CheckinForm'

vi.mock('../../../api/booksQueries', () => ({
    useCheckinBook: vi.fn(),
}))

const mockUseCheckinBook = vi.mocked(
    useCheckinBook,
)

const book = {
    id: 'test-book-id',
    title: 'The Pale Fire',
    authors: [
        {
            author_id: 'author-vladimir-nabokov',
            first_name: 'Vladimir',
            surname: 'Nabokov',
        },
    ],
    status: 'on_loan',
} as BookRead

const activeLoan = {
    id: 'test-loan-id',
    book_id: 'test-book-id',
    borrower: 'Jane Reader',
    checked_out_at: '2026-08-12T14:00:00Z',
    due_at: null,
    returned_at: null,
    notes: null,
} as LoanRead

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

function renderForm(
    options: {
        book?: BookRead
        loans?: readonly LoanRead[]
        onCancel?: () => void
        onSuccess?: () => void
    } = {},
) {
    const queryClient = createQueryClient()
    const onCancel =
        options.onCancel ?? vi.fn()
    const onSuccess =
        options.onSuccess ?? vi.fn()

    const result = render(
        <QueryClientProvider
            client={queryClient}
        >
            <CheckinForm
                book={options.book ?? book}
                loans={
                    options.loans ?? [activeLoan]
                }
                onCancel={onCancel}
                onSuccess={onSuccess}
            />
        </QueryClientProvider>,
    )

    return {
        ...result,
        queryClient,
        onCancel,
        onSuccess,
    }
}

function submitForm() {
    fireEvent.click(
        screen.getByRole('button', {
            name: 'Check In Book',
        }),
    )
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

describe('CheckinForm', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        mockUseCheckinBook.mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        } as unknown as ReturnType<
            typeof useCheckinBook
        >)
    })

    it('renders the return card for the selected book and active loan', () => {
        renderForm()

        expect(
            screen.getByRole('heading', {
                name: 'Return Card',
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

    it('submits a check-in with no explicit return date', () => {
        const mutate = vi.fn()

        mockUseCheckinBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useCheckinBook
        >)

        renderForm()

        submitForm()
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

        renderForm()

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

        submitForm()
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

    it('calls onSuccess after successful check-in', () => {
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

        const { onSuccess } = renderForm()

        submitForm()
        confirmCheckin()

        expect(onSuccess).toHaveBeenCalledTimes(1)
    })

    it('calls onCancel when cancel is selected', () => {
        const { onCancel } = renderForm()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Cancel',
            }),
        )

        expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it('does not submit when confirmation is cancelled', () => {
        const mutate = vi.fn()

        mockUseCheckinBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useCheckinBook
        >)

        renderForm()

        submitForm()

        const dialog =
            screen.getByRole('dialog', {
                name: 'Confirm check-in',
            })

        const buttons =
            dialog.querySelectorAll('button')

        fireEvent.click(buttons[0])

        expect(mutate).not.toHaveBeenCalled()
    })

    it('shows a mutation error when check-in fails', async () => {
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

        renderForm()

        submitForm()
        confirmCheckin()

        await waitFor(() => {
            expect(
                screen.getByRole('alert'),
            ).toHaveTextContent(
                'Book is not on loan.',
            )
        })
    })

    it('shows the generic mutation error for an unknown failure', async () => {
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

        renderForm()

        submitForm()
        confirmCheckin()

        await waitFor(() => {
            expect(
                screen.getByRole('alert'),
            ).toHaveTextContent(
                'The book could not be checked in.',
            )
        })
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
            onSuccess,
        } = renderForm()

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

        submitForm()
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
            onSuccess,
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
            onSuccess,
        } = renderForm()

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

        submitForm()
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
            onSuccess,
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

        renderForm()

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

        submitForm()
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
    })

    it('does not submit when the book is no longer eligible', () => {
        const mutate = vi.fn()

        mockUseCheckinBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useCheckinBook
        >)

        renderForm({
            loans: [],
        })

        submitForm()

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            'This book does not currently have an active loan.',
        )

        expect(mutate).not.toHaveBeenCalled()
    })

    it('disables actions while check-in is pending', () => {
        mockUseCheckinBook.mockReturnValue({
            mutate: vi.fn(),
            isPending: true,
        } as unknown as ReturnType<
            typeof useCheckinBook
        >)

        renderForm()

        expect(
            screen.getByRole('button', {
                name: 'Checking In...',
            }),
        ).toBeDisabled()

        expect(
            screen.getByRole('button', {
                name: 'Cancel',
            }),
        ).toBeDisabled()
    })
})
