import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'
import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { ApiError } from '../../../api/apiErrors'
import { CheckoutPage } from './CheckoutPage'

const mockNavigate = vi.fn()
const mockSetSearchParams = vi.fn()
const mockMutate = vi.fn()
const mockInvalidateQueries = vi.fn()
const mockRefetchBooks = vi.fn()
const mockRefetchIsbnSearch = vi.fn()
const mockRefetchAlternateIsbn = vi.fn()
const mockRefetchAlternateAuthorTitle = vi.fn()

type MockBook = {
    id: string
    title: string
    authors: string
    status: string
    deletion_date: string | null
    isbn13?: string | null
}

let mockBooksResponse: {
    items: MockBook[]
}

let mockIsbnSearchResponse:
    | {
          items: MockBook[]
      }
    | undefined

let mockAlternateIsbnResponse:
    | {
    items: MockBook[]
}
    | undefined

let mockAlternateAuthorTitleResponse:
    | {
    items: MockBook[]
}
    | undefined

let mockAlternateIsbnFetching = false
let mockAlternateAuthorTitleFetching = false
let mockAlternateIsbnError = false
let mockAlternateAuthorTitleError = false

let mockBooksPending = false
let mockBooksError = false
let mockCheckoutPending = false
let mockIsbnSearchFetching = false
let mockIsbnSearchError = false
let mockIsbnSearchErrorMessage =
    'ISBN search failed'
type MockBooksOptions = {
    isbn?: string
    author?: string
    title?: string
    enabled?: boolean
}

let lastIsbnSearchOptions:
    | MockBooksOptions
    | undefined

let lastAlternateIsbnOptions:
    | MockBooksOptions
    | undefined

let lastAlternateAuthorTitleOptions:
    | MockBooksOptions
    | undefined
let useBooksCallIndex = 0

vi.mock('react-router-dom', async () => {
    const actual =
        await vi.importActual<
            typeof import('react-router-dom')
        >('react-router-dom')

    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useSearchParams: () => [
            new URLSearchParams(
                window.location.search,
            ),
            mockSetSearchParams,
        ],
    }
})

vi.mock('@tanstack/react-query', async () => {
    const actual =
        await vi.importActual<
            typeof import('@tanstack/react-query')
        >('@tanstack/react-query')

    return {
        ...actual,
        useQueryClient: () => ({
            invalidateQueries: mockInvalidateQueries,
        }),
    }
})

vi.mock('../../../api/booksQueries', () => ({
    useBooks: (
        options: MockBooksOptions = {},
    ) => {
        const callIndex =
            useBooksCallIndex % 4

        useBooksCallIndex += 1

        if (callIndex === 0) {
            return {
                data: mockBooksResponse,
                isPending: mockBooksPending,
                isError: mockBooksError,
                error: mockBooksError
                    ? new Error(
                        'The available books could not be loaded.',
                    )
                    : null,
                refetch: mockRefetchBooks,
            }
        }

        if (callIndex === 1) {
            lastIsbnSearchOptions = options

            return {
                data:
                    options.enabled
                        ? mockIsbnSearchResponse
                        : undefined,
                isPending: false,
                isFetching:
                mockIsbnSearchFetching,
                isError:
                mockIsbnSearchError,
                error:
                    mockIsbnSearchError
                        ? new Error(
                            mockIsbnSearchErrorMessage,
                        )
                        : null,
                refetch:
                mockRefetchIsbnSearch,
            }
        }

        if (callIndex === 2) {
            lastAlternateIsbnOptions =
                options

            return {
                data:
                    options.enabled
                        ? mockAlternateIsbnResponse
                        : undefined,
                isPending: false,
                isFetching:
                mockAlternateIsbnFetching,
                isError:
                mockAlternateIsbnError,
                error:
                    mockAlternateIsbnError
                        ? new Error(
                            'Alternate ISBN search failed',
                        )
                        : null,
                refetch:
                mockRefetchAlternateIsbn,
            }
        }

        lastAlternateAuthorTitleOptions =
            options

        return {
            data:
                options.enabled
                    ? mockAlternateAuthorTitleResponse
                    : undefined,
            isPending: false,
            isFetching:
            mockAlternateAuthorTitleFetching,
            isError:
            mockAlternateAuthorTitleError,
            error:
                mockAlternateAuthorTitleError
                    ? new Error(
                        'Author/title alternate search failed',
                    )
                    : null,
            refetch:
            mockRefetchAlternateAuthorTitle,
        }
    },

    useCheckoutBook: () => ({
        mutate: mockMutate,
        isPending: mockCheckoutPending,
    }),
}))

vi.mock('../../scanning/IsbnCameraScanner', () => ({
    IsbnCameraScanner: ({
        onDetected,
        onCancel,
    }: {
        onDetected: (isbn: string) => void
        onCancel: () => void
    }) => (
        <div>
            <button
                type="button"
                onClick={() =>
                    onDetected('9780441172719')
                }
            >
                Simulate ISBN scan
            </button>

            <button
                type="button"
                onClick={onCancel}
            >
                Cancel scanner
            </button>
        </div>
    ),
}))

function renderPage(
    initialEntry = '/checkout',
) {
    window.history.pushState(
        {},
        '',
        initialEntry,
    )

    return render(
        <MemoryRouter
            initialEntries={[initialEntry]}
        >
            <CheckoutPage />
        </MemoryRouter>,
    )
}

async function submitAndConfirmCheckout() {
    fireEvent.click(
        screen.getByRole('button', {
            name: 'Check Out Book',
        }),
    )

    const dialog = await screen.findByRole(
        'dialog',
    )

    fireEvent.click(
        within(dialog).getByRole('button', {
            name: 'Confirm checkout',
        }),
    )
}

const availableBook = {
    id: 'book-1',
    title: 'The Left Hand of Darkness',
    authors: 'Ursula K. Le Guin',
    status: 'available',
    deletion_date: null,
}

const unavailableBook = {
    id: 'book-2',
    title: 'Dune',
    authors: 'Frank Herbert',
    status: 'on_loan',
    deletion_date: null,
}

const deletedBook = {
    id: 'book-3',
    title: 'Deleted Book',
    authors: 'Someone',
    status: 'available',
    deletion_date: '2026-08-01T00:00:00Z',
}
const VALID_ISBN_13 = '9780441172719'

const displayOnlyBook = {
    id: 'book-4',
    title: 'Display Only Atlas',
    authors: 'Cartographer',
    status: 'display_only',
    deletion_date: null,
    isbn13: VALID_ISBN_13,
}



describe('CheckoutPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        mockCheckoutPending = false
        mockInvalidateQueries.mockResolvedValue(
            undefined,
        )
        mockRefetchBooks.mockResolvedValue(
            undefined,
        )
        mockRefetchIsbnSearch.mockResolvedValue(
            undefined,
        )

        mockBooksResponse = {
            items: [
                availableBook,
                unavailableBook,
                deletedBook,
                displayOnlyBook,
            ],
        }

        mockIsbnSearchResponse = undefined
        mockBooksPending = false
        mockBooksError = false
        mockIsbnSearchFetching = false
        mockIsbnSearchError = false
        mockIsbnSearchErrorMessage =
            'ISBN search failed'
        lastIsbnSearchOptions = undefined
        useBooksCallIndex = 0

        mockRefetchAlternateIsbn.mockResolvedValue(
            undefined,
        )
        mockRefetchAlternateAuthorTitle.mockResolvedValue(
            undefined,
        )

        mockAlternateIsbnResponse = undefined
        mockAlternateAuthorTitleResponse = undefined

        mockAlternateIsbnFetching = false
        mockAlternateAuthorTitleFetching = false
        mockAlternateIsbnError = false
        mockAlternateAuthorTitleError = false

        lastAlternateIsbnOptions = undefined
        lastAlternateAuthorTitleOptions = undefined
    })

    it('renders the checkout page', () => {
        renderPage()

        expect(
            screen.getByRole('heading', {
                name: 'Check Out Book',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText('Book'),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText('Borrower'),
        ).toBeInTheDocument()
    })

    it('shows only eligible books in the book selector', () => {
        renderPage()

        const select =
            screen.getByLabelText('Book')

        expect(
            screen.getByRole('option', {
                name: /The Left Hand of Darkness/,
            }),
        ).toBeInTheDocument()

        expect(
            screen.queryByRole('option', {
                name: /Dune/,
            }),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByRole('option', {
                name: /Deleted Book/,
            }),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByRole('option', {
                name: /Display Only Atlas/,
            }),
        ).not.toBeInTheDocument()

        expect(select).toBeInTheDocument()
    })

    it('selects a book and updates the search params', () => {
        renderPage()

        fireEvent.change(
            screen.getByLabelText('Book'),
            {
                target: {
                    value: 'book-1',
                },
            },
        )

        expect(
            mockSetSearchParams,
        ).toHaveBeenCalledWith({
            bookId: 'book-1',
        })
    })

    it('clears the selected book from the search params', () => {
        renderPage('/checkout?bookId=book-1')

        fireEvent.change(
            screen.getByLabelText('Book'),
            {
                target: {
                    value: '',
                },
            },
        )

        expect(
            mockSetSearchParams,
        ).toHaveBeenCalledWith({})
    })

    it('requires a borrower before submitting', () => {
        renderPage('/checkout?bookId=book-1')

        fireEvent.submit(
            screen.getByRole('button', {
                name: 'Check Out Book',
            }),
        )

        expect(
            screen.getByText(
                'Borrower is required.',
            ),
        ).toBeInTheDocument()

        expect(mockMutate).not.toHaveBeenCalled()
        expect(
            screen.queryByRole('dialog'),
        ).not.toBeInTheDocument()
    })

    it('does not submit when no eligible book is selected', () => {
        renderPage()

        fireEvent.change(
            screen.getByLabelText('Borrower'),
            {
                target: {
                    value: 'Pat',
                },
            },
        )

        fireEvent.submit(
            screen.getByRole('button', {
                name: 'Check Out Book',
            }),
        )

        expect(mockMutate).not.toHaveBeenCalled()

        expect(
            screen.getByText(
                'Select an available book before checking it out.',
            ),
        ).toBeInTheDocument()
    })

    it('opens confirmation with book and borrower before mutating', async () => {
        renderPage('/checkout?bookId=book-1')

        fireEvent.change(
            screen.getByLabelText('Borrower'),
            {
                target: {
                    value: '  Pat Smith  ',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Check Out Book',
            }),
        )

        expect(mockMutate).not.toHaveBeenCalled()

        const dialog = await screen.findByRole(
            'dialog',
        )

        expect(
            within(dialog).getByText(
                /The Left Hand of Darkness/,
            ),
        ).toBeInTheDocument()

        expect(
            within(dialog).getByText(/Pat Smith/),
        ).toBeInTheDocument()
    })

    it('cancels confirmation without mutating and keeps form values', async () => {
        renderPage('/checkout?bookId=book-1')

        fireEvent.change(
            screen.getByLabelText('Borrower'),
            {
                target: {
                    value: 'Pat',
                },
            },
        )

        fireEvent.change(
            screen.getByLabelText('Notes'),
            {
                target: {
                    value: 'Handle with care',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Check Out Book',
            }),
        )

        const dialog = await screen.findByRole(
            'dialog',
        )

        fireEvent.click(
            within(dialog).getByRole('button', {
                name: 'Cancel',
            }),
        )

        await waitFor(() => {
            expect(
                screen.queryByRole('dialog'),
            ).not.toBeInTheDocument()
        })

        expect(mockMutate).not.toHaveBeenCalled()

        expect(
            screen.getByLabelText('Borrower'),
        ).toHaveValue('Pat')

        expect(
            screen.getByLabelText('Notes'),
        ).toHaveValue('Handle with care')
    })

    it('submits the selected book and borrower after confirmation', async () => {
        renderPage('/checkout?bookId=book-1')

        fireEvent.change(
            screen.getByLabelText('Borrower'),
            {
                target: {
                    value: '  Pat Smith  ',
                },
            },
        )

        await submitAndConfirmCheckout()

        expect(mockMutate).toHaveBeenCalledTimes(1)

        expect(mockMutate).toHaveBeenCalledWith(
            {
                id: 'book-1',
                request: {
                    borrower: 'Pat Smith',
                },
            },
            expect.objectContaining({
                onSuccess: expect.any(Function),
                onError: expect.any(Function),
            }),
        )
    })

    it('includes notes in the checkout request', async () => {
        renderPage('/checkout?bookId=book-1')

        fireEvent.change(
            screen.getByLabelText('Borrower'),
            {
                target: {
                    value: 'Pat',
                },
            },
        )

        fireEvent.change(
            screen.getByLabelText('Notes'),
            {
                target: {
                    value: '  Handle with care  ',
                },
            },
        )

        await submitAndConfirmCheckout()

        expect(mockMutate).toHaveBeenCalledWith(
            {
                id: 'book-1',
                request: {
                    borrower: 'Pat',
                    notes: 'Handle with care',
                },
            },
            expect.objectContaining({
                onSuccess: expect.any(Function),
                onError: expect.any(Function),
            }),
        )
    })

    it('navigates to the book after successful checkout', async () => {
        renderPage('/checkout?bookId=book-1')

        fireEvent.change(
            screen.getByLabelText('Borrower'),
            {
                target: {
                    value: 'Pat',
                },
            },
        )

        await submitAndConfirmCheckout()

        const options =
            mockMutate.mock.calls[0][1]

        options.onSuccess()

        expect(mockNavigate).toHaveBeenCalledWith(
            '/books/book-1',
        )
    })

    it('maps 422 field errors into the summary and linked fields', async () => {
        renderPage('/checkout?bookId=book-1')

        fireEvent.change(
            screen.getByLabelText('Borrower'),
            {
                target: {
                    value: 'Pat',
                },
            },
        )

        await submitAndConfirmCheckout()

        const options =
            mockMutate.mock.calls[0][1]

        options.onError(
            new ApiError({
                kind: 'validation',
                status: 422,
                message: 'Validation failed',
                fieldErrors: [
                    {
                        field: 'borrower',
                        message:
                            'String should have at most 255 characters',
                    },
                    {
                        field: 'due_at',
                        message:
                            'Invalid due date',
                    },
                ],
            }),
        )

        await waitFor(() => {
            expect(
                screen.getByRole('alert'),
            ).toBeInTheDocument()
        })

        const summary = screen.getByRole('alert')

        expect(
            within(summary).getByRole('link', {
                name: /Borrower:/,
            }),
        ).toHaveAttribute(
            'href',
            '#checkout-borrower',
        )

        expect(
            within(summary).getByRole('link', {
                name: /Due date:/,
            }),
        ).toHaveAttribute(
            'href',
            '#checkout-due-at',
        )

        expect(
            screen.getByLabelText('Borrower'),
        ).toHaveValue('Pat')
    })

    it('explains 409 when the book is already on loan and refetches', async () => {
        renderPage('/checkout?bookId=book-1')

        fireEvent.change(
            screen.getByLabelText('Borrower'),
            {
                target: {
                    value: 'Pat',
                },
            },
        )

        fireEvent.change(
            screen.getByLabelText('Notes'),
            {
                target: {
                    value: 'Keep notes',
                },
            },
        )

        await submitAndConfirmCheckout()

        const options =
            mockMutate.mock.calls[0][1]

        await options.onError(
            new ApiError({
                kind: 'http',
                status: 409,
                message:
                    'Book is already checked out',
                detail:
                    'Book is already checked out',
            }),
        )

        await waitFor(() => {
            expect(
                screen.getByText(
                    /Book is already checked out/,
                ),
            ).toBeInTheDocument()
        })

        expect(
            mockInvalidateQueries,
        ).toHaveBeenCalled()

        expect(
            screen.getByLabelText('Borrower'),
        ).toHaveValue('Pat')

        expect(
            screen.getByLabelText('Notes'),
        ).toHaveValue('Keep notes')

        expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('explains 409 when an active loan already exists and refetches', async () => {
        renderPage('/checkout?bookId=book-1')

        fireEvent.change(
            screen.getByLabelText('Borrower'),
            {
                target: {
                    value: 'Pat',
                },
            },
        )

        await submitAndConfirmCheckout()

        const options =
            mockMutate.mock.calls[0][1]

        await options.onError(
            new ApiError({
                kind: 'http',
                status: 409,
                message:
                    'Book is already checked out',
                detail:
                    'Book is already checked out',
            }),
        )

        await waitFor(() => {
            expect(
                screen.getByText(
                    /state changed since this form was opened/,
                ),
            ).toBeInTheDocument()
        })

        expect(
            mockInvalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: ['books'],
        })

        expect(
            mockInvalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: ['books', 'book-1'],
        })

        expect(
            mockInvalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: ['loans'],
        })
    })

    it('handles 404 for missing or soft-deleted targets without success navigation', async () => {
        renderPage('/checkout?bookId=book-1')

        fireEvent.change(
            screen.getByLabelText('Borrower'),
            {
                target: {
                    value: 'Pat',
                },
            },
        )

        await submitAndConfirmCheckout()

        const options =
            mockMutate.mock.calls[0][1]

        await options.onError(
            new ApiError({
                kind: 'http',
                status: 404,
                message: 'Book not found',
                detail: 'Book not found',
            }),
        )

        await waitFor(() => {
            expect(
                screen.getByText(
                    /missing or no longer available for checkout/,
                ),
            ).toBeInTheDocument()
        })

        expect(
            mockInvalidateQueries,
        ).toHaveBeenCalled()

        expect(
            screen.getByLabelText('Borrower'),
        ).toHaveValue('Pat')

        expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('preserves form values on network failure', async () => {
        renderPage('/checkout?bookId=book-1')

        fireEvent.change(
            screen.getByLabelText('Borrower'),
            {
                target: {
                    value: 'Pat',
                },
            },
        )

        await submitAndConfirmCheckout()

        const options =
            mockMutate.mock.calls[0][1]

        options.onError(
            new ApiError({
                kind: 'unreachable',
                message:
                    'The API could not be reached.',
            }),
        )

        await waitFor(() => {
            expect(
                screen.getByText(
                    'The API could not be reached.',
                ),
            ).toBeInTheDocument()
        })

        expect(
            screen.getByLabelText('Borrower'),
        ).toHaveValue('Pat')

        expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('offers retry when books cannot be loaded', () => {
        mockBooksError = true

        renderPage()

        expect(
            screen.getByText(
                'The available books could not be loaded.',
            ),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Retry',
            }),
        )

        expect(
            mockRefetchBooks,
        ).toHaveBeenCalledTimes(1)
    })

    it('offers a refresh path for an unavailable deep-linked book', () => {
        renderPage(
            '/checkout?bookId=book-2',
        )

        expect(
            screen.getByText(
                /cannot be checked out because its current status is on_loan/,
            ),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Refresh eligible books',
            }),
        )

        expect(
            mockRefetchBooks,
        ).toHaveBeenCalledTimes(1)
    })

    it('explains display-only deep links without offering checkout', () => {
        renderPage(
            '/checkout?bookId=book-4',
        )

        expect(
            screen.getByText(
                /is marked display only and cannot be checked out/,
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'Check Out Book',
            }),
        ).toBeDisabled()
    })

    it('looks for alternates for a display-only deep link', async () => {
        mockAlternateIsbnResponse = {
            items: [],
        }

        mockAlternateAuthorTitleResponse = {
            items: [],
        }

        renderPage(
            '/checkout?bookId=book-4',
        )

        await waitFor(() => {
            expect(
                lastAlternateIsbnOptions,
            ).toEqual({
                isbn: VALID_ISBN_13,
                enabled: true,
            })
        })

        expect(
            lastAlternateAuthorTitleOptions,
        ).toEqual({
            author: 'Cartographer',
            title: 'Display Only Atlas',
            enabled: true,
        })

        expect(
            screen.getByText(
                'No other available copy or edition was found in the library.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'Check Out Book',
            }),
        ).toBeDisabled()
    })

    it('offers an available ISBN alternate for a display-only book', async () => {
        const alternate = {
            ...availableBook,
            id: 'alternate-copy',
            title: 'Display Only Atlas',
            authors: 'Cartographer',
            isbn13: VALID_ISBN_13,
            shelf_name: 'a1',
        }

        mockAlternateIsbnResponse = {
            items: [
                displayOnlyBook,
                alternate,
            ],
        }

        mockAlternateAuthorTitleResponse = {
            items: [],
        }

        renderPage(
            '/checkout?bookId=book-4',
        )

        expect(
            await screen.findByText(
                'Available alternatives',
            ),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: /Display Only Atlas — Cartographer — A1/,
            }),
        )

        expect(
            mockSetSearchParams,
        ).toHaveBeenCalledWith({
            bookId: 'alternate-copy',
        })
    })

    it('keeps checkout form values when selecting an alternate', async () => {
        const alternate = {
            ...availableBook,
            id: 'alternate-copy',
            title: 'Display Only Atlas',
            authors: 'Cartographer',
            isbn13: VALID_ISBN_13,
        }

        mockAlternateIsbnResponse = {
            items: [alternate],
        }

        mockAlternateAuthorTitleResponse = {
            items: [],
        }

        renderPage(
            '/checkout?bookId=book-4',
        )

        fireEvent.change(
            screen.getByLabelText('Borrower'),
            {
                target: {
                    value: 'Pat',
                },
            },
        )

        fireEvent.change(
            screen.getByLabelText('Notes'),
            {
                target: {
                    value: 'Keep these notes',
                },
            },
        )

        const alternateButton =
            await screen.findByRole(
                'button',
                {
                    name: /Display Only Atlas — Cartographer/,
                },
            )

        fireEvent.click(alternateButton)

        expect(
            screen.getByLabelText('Borrower'),
        ).toHaveValue('Pat')

        expect(
            screen.getByLabelText('Notes'),
        ).toHaveValue('Keep these notes')

        expect(
            mockSetSearchParams,
        ).toHaveBeenCalledWith({
            bookId: 'alternate-copy',
        })
    })

    it('offers an author and title alternate when ISBN has no eligible result', async () => {
        const otherEdition = {
            ...availableBook,
            id: 'other-edition',
            title: 'Display Only Atlas',
            authors: 'Cartographer',
            isbn13: '9780000000002',
        }

        mockAlternateIsbnResponse = {
            items: [],
        }

        mockAlternateAuthorTitleResponse = {
            items: [otherEdition],
        }

        renderPage(
            '/checkout?bookId=book-4',
        )

        await waitFor(() => {
            expect(
                lastAlternateAuthorTitleOptions,
            ).toEqual({
                author: 'Cartographer',
                title: 'Display Only Atlas',
                enabled: true,
            })
        })

        expect(
            screen.getByRole('button', {
                name: /Display Only Atlas — Cartographer/,
            }),
        ).toBeInTheDocument()
    })

    it('prefers ISBN alternates and does not duplicate overlapping matches', async () => {
        const shared = {
            ...availableBook,
            id: 'shared-match',
            title: 'Display Only Atlas',
            authors: 'Cartographer',
            isbn13: VALID_ISBN_13,
        }

        const otherEdition = {
            ...availableBook,
            id: 'other-edition',
            title: 'Display Only Atlas',
            authors: 'Cartographer',
            isbn13: '9780000000002',
        }

        mockAlternateIsbnResponse = {
            items: [shared],
        }

        mockAlternateAuthorTitleResponse = {
            items: [
                shared,
                otherEdition,
            ],
        }

        renderPage(
            '/checkout?bookId=book-4',
        )

        const buttons =
            await screen.findAllByRole(
                'button',
                {
                    name: /Display Only Atlas — Cartographer/,
                },
            )

        expect(buttons).toHaveLength(2)
    })

    it('explains 412 when the book is display only and refetches', async () => {
        mockAlternateIsbnResponse = {
            items: [],
        }

        mockAlternateAuthorTitleResponse = {
            items: [],
        }
        renderPage('/checkout?bookId=book-1')

        fireEvent.change(
            screen.getByLabelText('Borrower'),
            {
                target: {
                    value: 'Pat',
                },
            },
        )

        fireEvent.change(
            screen.getByLabelText('Notes'),
            {
                target: {
                    value: 'Keep notes',
                },
            },
        )

        await submitAndConfirmCheckout()

        const options =
            mockMutate.mock.calls[0][1]

        await options.onError(
            new ApiError({
                kind: 'http',
                status: 412,
                message:
                    'Book is display only',
                detail:
                    'Book is display only',
            }),
        )

        await waitFor(() => {
            expect(
                screen.getByText(
                    /Book is display only/,
                ),
            ).toBeInTheDocument()
        })

        await waitFor(() => {
            expect(
                lastAlternateAuthorTitleOptions,
            ).toEqual({
                author:
                availableBook.authors,
                title:
                availableBook.title,
                enabled: true,
            })
        })

        expect(
            mockInvalidateQueries,
        ).toHaveBeenCalled()

        expect(
            screen.getByLabelText('Borrower'),
        ).toHaveValue('Pat')

        expect(
            screen.getByLabelText('Notes'),
        ).toHaveValue('Keep notes')

        expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('offers a refresh path for a missing deep-linked book', () => {
        renderPage(
            '/checkout?bookId=missing-book',
        )

        expect(
            screen.getByText(
                'The requested book could not be found. Please select another book or refresh the eligible list.',
            ),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Refresh eligible books',
            }),
        )

        expect(
            mockRefetchBooks,
        ).toHaveBeenCalledTimes(1)
    })

    it('shows a loading state while books are loading', () => {
        mockBooksPending = true

        renderPage()

        expect(
            screen.getByText('Loading books…'),
        ).toBeInTheDocument()
    })

    it('disables the checkout button until an eligible book is selected', () => {
        renderPage()

        expect(
            screen.getByRole('button', {
                name: 'Check Out Book',
            }),
        ).toBeDisabled()
    })

    it('disables the checkout button while checkout is pending', () => {
        mockCheckoutPending = true

        renderPage('/checkout?bookId=book-1')

        expect(
            screen.getByRole('button', {
                name: 'Checking Out…',
            }),
        ).toBeDisabled()
    })

    it('clears the borrower error when the borrower is entered', () => {
        renderPage('/checkout?bookId=book-1')

        fireEvent.submit(
            screen.getByRole('button', {
                name: 'Check Out Book',
            }),
        )

        expect(
            screen.getByText('Borrower is required.'),
        ).toBeInTheDocument()

        fireEvent.change(
            screen.getByLabelText('Borrower'),
            {
                target: {
                    value: 'Pat',
                },
            },
        )

        expect(
            screen.queryByText('Borrower is required.'),
        ).not.toBeInTheDocument()
    })

    it('shows a warning when the requested book is unavailable', () => {
        renderPage(
            '/checkout?bookId=book-2',
        )

        fireEvent.change(
            screen.getByLabelText('Borrower'),
            {
                target: {
                    value: 'Pat',
                },
            },
        )

        fireEvent.submit(
            screen.getByRole('button', {
                name: 'Check Out Book',
            }),
        )

        expect(
            screen.getByText(
                'Select an available book before checking it out.',
            ),
        ).toBeInTheDocument()

        expect(mockMutate).not.toHaveBeenCalled()
    })

    it('selects a single eligible ISBN match via Find', async () => {
        mockIsbnSearchResponse = {
            items: [
                {
                    ...availableBook,
                    isbn13: VALID_ISBN_13,
                },
            ],
        }

        renderPage()

        fireEvent.change(
            screen.getByLabelText('ISBN'),
            {
                target: {
                    value: '978-0-441-17271-9',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Find',
            }),
        )

        await waitFor(() => {
            expect(
                lastIsbnSearchOptions,
            ).toEqual({
                isbn: VALID_ISBN_13,
                enabled: true,
            })
        })

        await waitFor(() => {
            expect(
                mockSetSearchParams,
            ).toHaveBeenCalledWith({
                bookId: 'book-1',
            })
        })

        expect(
            screen.getByLabelText('ISBN'),
        ).toHaveValue(VALID_ISBN_13)
    })

    it('explains when ISBN Find returns zero matches', async () => {
        mockIsbnSearchResponse = {
            items: [],
        }

        renderPage()

        fireEvent.change(
            screen.getByLabelText('Borrower'),
            {
                target: {
                    value: 'Pat',
                },
            },
        )

        fireEvent.change(
            screen.getByLabelText('ISBN'),
            {
                target: {
                    value: VALID_ISBN_13,
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Find',
            }),
        )

        expect(
            await screen.findByText(
                'No book in the library matched that ISBN.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText('Borrower'),
        ).toHaveValue('Pat')

        expect(
            screen.getByLabelText('Book'),
        ).toBeInTheDocument()
    })

    it('explains when ISBN matches exist but none are eligible', async () => {
        mockIsbnSearchResponse = {
            items: [
                {
                    ...unavailableBook,
                    isbn13: VALID_ISBN_13,
                },
                {
                    ...deletedBook,
                    isbn13: VALID_ISBN_13,
                },
            ],
        }

        renderPage()

        fireEvent.change(
            screen.getByLabelText('ISBN'),
            {
                target: {
                    value: VALID_ISBN_13,
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Find',
            }),
        )

        expect(
            await screen.findByText(
                'A matching book was found, but it is not available for checkout.',
            ),
        ).toBeInTheDocument()

        expect(
            mockSetSearchParams,
        ).not.toHaveBeenCalled()
    })

    it('rejects an invalid ISBN checksum without searching', () => {
        renderPage()

        fireEvent.change(
            screen.getByLabelText('ISBN'),
            {
                target: {
                    value: '9780441172718',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Find',
            }),
        )

        expect(
            screen.getByText(
                'Enter a valid ISBN-10 or ISBN-13.',
            ),
        ).toBeInTheDocument()

        expect(
            lastIsbnSearchOptions?.enabled,
        ).toBe(false)
    })

    it('does not search for a blank ISBN', () => {
        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Find',
            }),
        )

        expect(
            screen.getByText(
                'Enter an ISBN to find a book.',
            ),
        ).toBeInTheDocument()

        expect(
            lastIsbnSearchOptions?.enabled,
        ).toBe(false)
    })

    it('does not search for whitespace-only ISBN', () => {
        renderPage()

        fireEvent.change(
            screen.getByLabelText('ISBN'),
            {
                target: {
                    value: '   ',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Find',
            }),
        )

        expect(
            screen.getByText(
                'Enter an ISBN to find a book.',
            ),
        ).toBeInTheDocument()

        expect(
            lastIsbnSearchOptions?.enabled,
        ).toBe(false)
    })

    it('hands a camera-scanned ISBN into Find', async () => {
        mockIsbnSearchResponse = {
            items: [
                {
                    ...availableBook,
                    isbn13: VALID_ISBN_13,
                },
            ],
        }

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Scan ISBN',
            }),
        )

        expect(
            await screen.findByRole('button', {
                name: 'Simulate ISBN scan',
            }),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Simulate ISBN scan',
            }),
        )

        await waitFor(() => {
            expect(
                lastIsbnSearchOptions,
            ).toEqual({
                isbn: VALID_ISBN_13,
                enabled: true,
            })
        })

        await waitFor(() => {
            expect(
                mockSetSearchParams,
            ).toHaveBeenCalledWith({
                bookId: 'book-1',
            })
        })

        expect(mockMutate).not.toHaveBeenCalled()
    })

    it('hands a hardware-scanned ISBN into Find', async () => {
        mockIsbnSearchResponse = {
            items: [
                {
                    ...availableBook,
                    isbn13: VALID_ISBN_13,
                },
            ],
        }

        renderPage()

        for (const key of VALID_ISBN_13) {
            fireEvent.keyDown(window, { key })
        }

        fireEvent.keyDown(window, {
            key: 'Enter',
        })

        await waitFor(() => {
            expect(
                lastIsbnSearchOptions,
            ).toEqual({
                isbn: VALID_ISBN_13,
                enabled: true,
            })
        })

        await waitFor(() => {
            expect(
                mockSetSearchParams,
            ).toHaveBeenCalledWith({
                bookId: 'book-1',
            })
        })

        expect(mockMutate).not.toHaveBeenCalled()
    })

    it('checks out after selecting a book via ISBN Find', async () => {
        mockIsbnSearchResponse = {
            items: [
                {
                    ...availableBook,
                    isbn13: VALID_ISBN_13,
                },
            ],
        }

        renderPage('/checkout?bookId=book-1')

        fireEvent.change(
            screen.getByLabelText('ISBN'),
            {
                target: {
                    value: VALID_ISBN_13,
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Find',
            }),
        )

        await waitFor(() => {
            expect(
                lastIsbnSearchOptions?.isbn,
            ).toBe(VALID_ISBN_13)
        })

        fireEvent.change(
            screen.getByLabelText('Borrower'),
            {
                target: {
                    value: 'Pat',
                },
            },
        )

        await submitAndConfirmCheckout()

        expect(mockMutate).toHaveBeenCalledWith(
            {
                id: 'book-1',
                request: {
                    borrower: 'Pat',
                },
            },
            expect.any(Object),
        )
    })

    it('lets the user choose when multiple eligible ISBN matches exist', async () => {
        mockIsbnSearchResponse = {
            items: [
                {
                    ...availableBook,
                    isbn13: VALID_ISBN_13,
                },
                {
                    id: 'book-4',
                    title: 'Another Match',
                    authors: 'Other Author',
                    status: 'available',
                    deletion_date: null,
                    isbn13: VALID_ISBN_13,
                },
            ],
        }

        renderPage()

        fireEvent.change(
            screen.getByLabelText('ISBN'),
            {
                target: {
                    value: VALID_ISBN_13,
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Find',
            }),
        )

        expect(
            await screen.findByText(
                'Multiple matches',
            ),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: /Another Match/,
            }),
        )

        expect(
            mockSetSearchParams,
        ).toHaveBeenCalledWith({
            bookId: 'book-4',
        })
    })
})
