import { useState } from 'react'
import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query'
import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react'
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import { ApiError } from '../../../api/apiErrors'
import type { BookRead } from '../../../api/apiTypes'
import { useCheckoutBook } from '../../../api/booksQueries'
import { CheckoutDialog } from './CheckoutDialog'

vi.mock('../../../api/booksQueries', () => ({
    useCheckoutBook: vi.fn(),
}))

const mockedUseCheckoutBook =
    vi.mocked(useCheckoutBook)

const mockMutate = vi.fn()

let mockCheckoutPending = false

const availableBook = {
    book_id: 'book-1',
    title: 'The Left Hand of Darkness',
    authors: [
        {
            author_id: 'author-ursula-le-guin',
            first_name: 'Ursula K.',
            surname: 'Le Guin',
        },
    ],
    status: 'available',
} as unknown as BookRead

const displayOnlyBook = {
    ...availableBook,
    book_id: 'book-display-only',
    title: 'Display Only Atlas',
    status: 'display_only',
} as unknown as BookRead

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

function renderDialog({
                          book = availableBook,
                          open = true,
                          onClose = vi.fn(),
                      }: {
    book?: BookRead
    open?: boolean
    onClose?: () => void
} = {}) {
    const queryClient = createQueryClient()

    const invalidateQueries = vi.spyOn(
        queryClient,
        'invalidateQueries',
    )

    const result = render(
        <QueryClientProvider client={queryClient}>
            <CheckoutDialog
                book={book}
                open={open}
                onClose={onClose}
            />
        </QueryClientProvider>,
    )

    return {
        ...result,
        queryClient,
        invalidateQueries,
        onClose,
    }
}

function OpenCloseHarness({
                              book = availableBook,
                          }: {
    book?: BookRead
}) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
            >
                Open checkout
            </button>

            <CheckoutDialog
                book={book}
                open={open}
                onClose={() => setOpen(false)}
            />
        </>
    )
}

function renderHarness() {
    const queryClient = createQueryClient()

    return render(
        <QueryClientProvider client={queryClient}>
            <OpenCloseHarness />
        </QueryClientProvider>,
    )
}

function fillBorrower(
    borrower = 'Jane Reader',
) {
    fireEvent.change(
        screen.getByLabelText('Borrower'),
        {
            target: {
                value: borrower,
            },
        },
    )
}

function submitCheckout() {
    fireEvent.click(
        screen.getByRole('button', {
            name: 'Check Out Book',
        }),
    )
}

function mutationOptions() {
    return mockMutate.mock.calls[0][1]
}

describe('CheckoutDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        mockCheckoutPending = false

        mockedUseCheckoutBook.mockImplementation(
            () =>
                ({
                    mutate: mockMutate,
                    isPending: mockCheckoutPending,
                }) as unknown as ReturnType<
                    typeof useCheckoutBook
                >,
        )
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('renders borrower and notes only', async () => {
        renderDialog()

        const dialog = await screen.findByRole(
            'dialog',
            {
                name: 'Check Out',
            },
        )

        expect(
            within(dialog).getByText(
                'The Left Hand of Darkness',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText('Borrower'),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText('Notes'),
        ).toBeInTheDocument()

        expect(
            screen.queryByLabelText(/book/i),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByLabelText(
                /checkout date/i,
            ),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByLabelText(/due date/i),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByText(/isbn/i),
        ).not.toBeInTheDocument()
    })

    it('requires a borrower before submitting', async () => {
        renderDialog()

        submitCheckout()

        expect(mockMutate).not.toHaveBeenCalled()

        expect(
            await screen.findByText(
                'Borrower is required.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('alert'),
        ).toHaveFocus()
    })

    it('submits borrower, checkout time, and notes without a due date', () => {
        const now = new Date(
            '2026-08-19T15:30:45.123Z',
        )

        vi.useFakeTimers()
        vi.setSystemTime(now)

        renderDialog()

        fillBorrower('  Jane Reader  ')

        fireEvent.change(
            screen.getByLabelText('Notes'),
            {
                target: {
                    value: '  Handle with care  ',
                },
            },
        )

        submitCheckout()

        expect(mockMutate).toHaveBeenCalledTimes(1)

        const [
            variables,
        ] = mockMutate.mock.calls[0]

        expect(variables).toEqual({
            id: 'book-1',
            request: {
                borrower: 'Jane Reader',
                checked_out_at:
                    '2026-08-19T15:30:45.123Z',
                notes: 'Handle with care',
            },
        })
    })

    it('omits blank notes from the request', () => {
        vi.useFakeTimers()
        vi.setSystemTime(
            new Date(
                '2026-08-19T15:30:45.123Z',
            ),
        )

        renderDialog()

        fillBorrower()

        fireEvent.change(
            screen.getByLabelText('Notes'),
            {
                target: {
                    value: '   ',
                },
            },
        )

        submitCheckout()

        const [
            variables,
        ] = mockMutate.mock.calls[0]

        expect(variables.request).toEqual({
            borrower: 'Jane Reader',
            checked_out_at:
                '2026-08-19T15:30:45.123Z',
        })

        expect(
            variables.request,
        ).not.toHaveProperty('notes')
    })

    it('closes and resets after successful checkout', async () => {
        const onClose = vi.fn()

        renderDialog({
            onClose,
        })

        fillBorrower()

        submitCheckout()

        const options = mutationOptions()

        options.onSuccess()

        expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('cancels without checking out', async () => {
        const onClose = vi.fn()

        renderDialog({
            onClose,
        })

        fillBorrower()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Cancel',
            }),
        )

        expect(mockMutate).not.toHaveBeenCalled()
        expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('cancels on Escape and restores focus to the opener', async () => {
        renderHarness()

        const opener = screen.getByRole(
            'button',
            {
                name: 'Open checkout',
            },
        )

        opener.focus()
        fireEvent.click(opener)

        const dialog = await screen.findByRole(
            'dialog',
            {
                name: 'Check Out',
            },
        )

        await waitFor(() => {
            expect(
                screen.getByLabelText('Borrower'),
            ).toHaveFocus()
        })

        dialog.dispatchEvent(
            new Event('cancel', {
                cancelable: true,
            }),
        )

        await waitFor(() => {
            expect(opener).toHaveFocus()
        })

        expect(mockMutate).not.toHaveBeenCalled()
    })

    it('maps borrower validation errors from the API', async () => {
        renderDialog()

        fillBorrower()
        submitCheckout()

        const options = mutationOptions()

        options.onError(
            new ApiError({
                kind: 'validation',
                status: 422,
                message: 'Validation failed',
                fieldErrors: [
                    {
                        field: 'borrower',
                        message:
                            'Borrower is invalid.',
                    },
                ],
            }),
        )

        expect(
            await screen.findByText(
                'Borrower is invalid.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText('Borrower'),
        ).toHaveAccessibleDescription(
            'Borrower is invalid.',
        )
    })

    it('shows computed-field validation errors in the summary', async () => {
        renderDialog()

        fillBorrower()
        submitCheckout()

        const options = mutationOptions()

        options.onError(
            new ApiError({
                kind: 'validation',
                status: 422,
                message: 'Validation failed',
                fieldErrors: [
                    {
                        field: 'checked_out_at',
                        message:
                            'Checkout timestamp is invalid.',
                    },
                ],
            }),
        )

        expect(
            await screen.findByText(
                'Checkout timestamp is invalid.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.queryByLabelText(
                /checkout date/i,
            ),
        ).not.toBeInTheDocument()
    })

    it('refreshes stale state after a 409 and preserves typed values', async () => {
        const { invalidateQueries } =
            renderDialog()

        fillBorrower('Jane Reader')

        fireEvent.change(
            screen.getByLabelText('Notes'),
            {
                target: {
                    value: 'Please return someday',
                },
            },
        )

        submitCheckout()

        const options = mutationOptions()

        options.onError(
            new ApiError({
                kind: 'http',
                status: 409,
                message:
                    'Book is already checked out',
                detail:
                    'Book is already checked out',
            }),
        )

        expect(
            await screen.findByText(
                /Book is already checked out/,
            ),
        ).toBeInTheDocument()

        expect(
            invalidateQueries,
        ).toHaveBeenCalled()

        expect(
            screen.getByLabelText('Borrower'),
        ).toHaveValue('Jane Reader')

        expect(
            screen.getByLabelText('Notes'),
        ).toHaveValue(
            'Please return someday',
        )
    })

    it('refreshes stale state after a 404 and preserves typed values', async () => {
        const { invalidateQueries } =
            renderDialog()

        fillBorrower('Jane Reader')
        submitCheckout()

        const options = mutationOptions()

        options.onError(
            new ApiError({
                kind: 'http',
                status: 404,
                message: 'Book not found',
                detail: 'Book not found',
            }),
        )

        expect(
            await screen.findByText(
                /missing or no longer available for checkout/i,
            ),
        ).toBeInTheDocument()

        expect(
            invalidateQueries,
        ).toHaveBeenCalled()

        expect(
            screen.getByLabelText('Borrower'),
        ).toHaveValue('Jane Reader')
    })

    it('refreshes stale state after a 412 without offering alternate copies', async () => {
        const { invalidateQueries } =
            renderDialog()

        fillBorrower('Jane Reader')
        submitCheckout()

        const options = mutationOptions()

        options.onError(
            new ApiError({
                kind: 'http',
                status: 412,
                message:
                    'Book is display only',
                detail:
                    'Book is display only',
            }),
        )

        expect(
            await screen.findByText(
                /Book is display only/,
            ),
        ).toBeInTheDocument()

        expect(
            invalidateQueries,
        ).toHaveBeenCalled()

        expect(
            screen.getByLabelText('Borrower'),
        ).toHaveValue('Jane Reader')

        expect(
            screen.queryByText(
                /alternate cop/i,
            ),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByText(
                /find by isbn/i,
            ),
        ).not.toBeInTheDocument()
    })

    it('shows a generic checkout error', async () => {
        renderDialog()

        fillBorrower()
        submitCheckout()

        const options = mutationOptions()

        options.onError(
            new ApiError({
                kind: 'unreachable',
                message:
                    'The API could not be reached.',
            }),
        )

        expect(
            await screen.findByText(
                'The API could not be reached.',
            ),
        ).toBeInTheDocument()
    })

    it('disables form actions while checkout is pending', async () => {
        mockCheckoutPending = true

        renderDialog()

        expect(
            await screen.findByRole('button', {
                name: 'Checking Out…',
            }),
        ).toBeDisabled()

        expect(
            screen.getByRole('button', {
                name: 'Cancel',
            }),
        ).toBeDisabled()

        expect(
            screen.getByLabelText('Borrower'),
        ).toBeDisabled()

        expect(
            screen.getByLabelText('Notes'),
        ).toBeDisabled()
    })

    it('does not submit an ineligible book', async () => {
        renderDialog({
            book: displayOnlyBook,
        })

        fillBorrower()

        expect(
            screen.getByRole('button', {
                name: 'Check Out Book',
            }),
        ).toBeDisabled()

        fireEvent.submit(
            screen
                .getByRole('button', {
                    name: 'Check Out Book',
                })
                .closest('form') as HTMLFormElement,
        )

        expect(mockMutate).not.toHaveBeenCalled()

        expect(
            await screen.findByText(
                'This book is no longer available for checkout.',
            ),
        ).toBeInTheDocument()
    })
})
