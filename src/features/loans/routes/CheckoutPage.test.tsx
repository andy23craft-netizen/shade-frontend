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
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { CheckoutPage } from './CheckoutPage'

const mockNavigate = vi.fn()
const mockSetSearchParams = vi.fn()

const mockMutate = vi.fn()

let mockBooksResponse: {
    items: Array<{
        id: string
        title: string
        authors: string[]
        status: string
        deletion_date: string | null
    }>
}

let mockBooksPending = false
let mockBooksError = false
let mockCheckoutPending = false

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

vi.mock('../../../api/booksQueries', () => ({
    useBooks: () => ({
        data: mockBooksResponse,
        isPending: mockBooksPending,
        isError: mockBooksError,
    }),

    useCheckoutBook: () => ({
        mutate: mockMutate,
        isPending: mockCheckoutPending,
    }),
}))

function renderPage(
    initialEntry = '/books/checkout',
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

const availableBook = {
    id: 'book-1',
    title: 'The Left Hand of Darkness',
    authors: ['Ursula K. Le Guin'],
    status: 'available',
    deletion_date: null,
}

const unavailableBook = {
    id: 'book-2',
    title: 'Dune',
    authors: ['Frank Herbert'],
    status: 'on_loan',
    deletion_date: null,
}

const deletedBook = {
    id: 'book-3',
    title: 'Deleted Book',
    authors: ['Someone'],
    status: 'available',
    deletion_date: '2026-08-01T00:00:00Z',
}

describe('CheckoutPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        mockCheckoutPending = false

        mockBooksResponse = {
            items: [
                availableBook,
                unavailableBook,
                deletedBook,
            ],
        }

        mockBooksPending = false
        mockBooksError = false
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
        renderPage('/books/checkout?bookId=book-1')

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
        renderPage('/books/checkout?bookId=book-1')

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

    it('submits the selected book and borrower', () => {
        renderPage('/books/checkout?bookId=book-1')

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

    it('includes notes in the checkout request', () => {
        renderPage('/books/checkout?bookId=book-1')

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

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Check Out Book',
            }),
        )

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

    it('navigates to the book after successful checkout', () => {
        renderPage('/books/checkout?bookId=book-1')

        fireEvent.change(
            screen.getByLabelText('Borrower'),
            {
                target: {
                    value: 'Pat',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Check Out Book',
            }),
        )

        const options =
            mockMutate.mock.calls[0][1]

        options.onSuccess()

        expect(mockNavigate).toHaveBeenCalledWith(
            '/books/book-1',
        )
    })

    it('shows the checkout error when the mutation fails', async () => {
        renderPage('/books/checkout?bookId=book-1')

        fireEvent.change(
            screen.getByLabelText('Borrower'),
            {
                target: {
                    value: 'Pat',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Check Out Book',
            }),
        )

        const options =
            mockMutate.mock.calls[0][1]

        options.onError(
            new Error(
                'Book is already checked out.',
            ),
        )

        await waitFor(() => {
            expect(
                screen.getByText(
                    'Book is already checked out.',
                ),
            ).toBeInTheDocument()
        })
    })

    it('shows a loading state while books are loading', () => {
        mockBooksPending = true

        renderPage()

        expect(
            screen.getByText('Loading books…'),
        ).toBeInTheDocument()
    })

    it('shows an error when books cannot be loaded', () => {
        mockBooksError = true

        renderPage()

        expect(
            screen.getByText(
                'The available books could not be loaded.',
            ),
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

        renderPage('/books/checkout?bookId=book-1')

        expect(
            screen.getByRole('button', {
                name: 'Checking Out…',
            }),
        ).toBeDisabled()
    })

    it('clears the borrower error when the borrower is entered', () => {
        renderPage('/books/checkout?bookId=book-1')

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
            '/books/checkout?bookId=book-2',
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
})