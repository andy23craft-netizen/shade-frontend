import {
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import {
    MemoryRouter,
    Route,
    Routes,
    useLocation,
    useNavigate,
} from 'react-router-dom'
import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import {
    createBooksApi,
} from '../../api/booksApi'
import {
    useCollectionIsbnJump,
} from './useCollectionIsbnJump'

const mockList = vi.fn()

vi.mock('../../api/booksApi', () => ({
    createBooksApi: vi.fn(),
}))

vi.mock('../connection/useConnection', () => ({
    useConnection: () => ({
        apiClient: {},
    }),
}))

function LocationDisplay() {
    const location = useLocation()

    return (
        <output data-testid="location">
            {location.pathname}
    {location.search}
    </output>
)
}

function ScanPage() {
    useCollectionIsbnJump()

    return (
        <>
            <h1>Scan page</h1>
    <LocationDisplay />
    </>
)
}

function BookPage() {
    const navigate = useNavigate()

    return (
        <>
            <h1>Book detail</h1>

    <button
    type="button"
    onClick={() => {
        navigate(-1)
    }}
>
    Back
    </button>

    <LocationDisplay />
    </>
)
}

function renderScannerRoute(
    initialEntry: string,
) {
    return render(
        <MemoryRouter
            initialEntries={[initialEntry]}
        >
        <Routes>
            <Route
                path="/dashboard"
    element={<ScanPage />}
    />

    <Route
    path="/loans"
    element={<ScanPage />}
    />

    <Route
    path="/books"
    element={<ScanPage />}
    />

    <Route
    path="/books/:bookId"
    element={<BookPage />}
    />
    </Routes>
    </MemoryRouter>,
)
}

function scan(
    isbn = '9780441172719',
) {
    for (const key of isbn) {
        fireEvent.keyDown(window, {
            key,
        })
    }

    fireEvent.keyDown(window, {
        key: 'Enter',
    })
}

describe('useCollectionIsbnJump', () => {
    beforeEach(() => {
        mockList.mockReset()

        vi.mocked(
            createBooksApi,
        ).mockReturnValue({
            list: mockList,
        } as unknown as ReturnType<
            typeof createBooksApi
        >)
    })

    it('navigates directly to detail for one match', async () => {
        mockList.mockResolvedValue({
            items: [
                {
                    book_id: 'book-1',
                },
            ],
            total: 1,
        })

        renderScannerRoute('/dashboard')

        scan()

        await waitFor(() => {
            expect(
                screen.getByTestId('location'),
            ).toHaveTextContent(
                '/books/book-1',
            )
        })

        expect(mockList).toHaveBeenCalledWith({
            isbn: '9780441172719',
        })
    })

    it('keeps the original page immediately behind detail in history', async () => {
        mockList.mockResolvedValue({
            items: [
                {
                    book_id: 'book-1',
                },
            ],
            total: 1,
        })

        renderScannerRoute('/dashboard')

        scan()

        await waitFor(() => {
            expect(
                screen.getByTestId('location'),
            ).toHaveTextContent(
                '/books/book-1',
            )
        })

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Back',
            }),
        )

        await waitFor(() => {
            expect(
                screen.getByTestId('location'),
            ).toHaveTextContent(
                '/dashboard',
            )
        })
    })

    it('navigates to Add Book with the ISBN for zero matches', async () => {
        mockList.mockResolvedValue({
            items: [],
            total: 0,
        })

        renderScannerRoute('/loans')

        scan()

        await waitFor(() => {
            expect(
                screen.getByTestId('location'),
            ).toHaveTextContent(
                '/books/new?isbn=9780441172719',
            )
        })
    })

    it('navigates to the books list with the ISBN for multiple matches', async () => {
        mockList.mockResolvedValue({
            items: [
                {
                    book_id: 'book-1',
                },
                {
                    book_id: 'book-2',
                },
            ],
            total: 2,
        })

        renderScannerRoute('/dashboard')

        scan()

        await waitFor(() => {
            expect(
                screen.getByTestId('location'),
            ).toHaveTextContent(
                '/books?isbn=9780441172719',
            )
        })
    })

    it('does not carry Books filters into the Add Book route', async () => {
        mockList.mockResolvedValue({
            items: [],
            total: 0,
        })

        renderScannerRoute(
            '/books?sortBy=title&category=fiction',
        )

        scan()

        await waitFor(() => {
            const location =
                screen.getByTestId('location')

            expect(location).toHaveTextContent(
                '/books/new?isbn=9780441172719',
            )

            expect(location).not.toHaveTextContent(
                'sortBy=title',
            )

            expect(location).not.toHaveTextContent(
                'category=fiction',
            )
        })
    })

    it('compacts a hyphenated ISBN before requesting the list', async () => {
        mockList.mockResolvedValue({
            items: [],
            total: 0,
        })

        renderScannerRoute('/dashboard')

        scan('978-0-441-17271-9')

        await waitFor(() => {
            expect(mockList).toHaveBeenCalledWith({
                isbn: '9780441172719',
            })
        })
    })

    it('does not navigate for an invalid ISBN', () => {
        renderScannerRoute('/dashboard')

        scan('9780441172718')

        expect(mockList).not.toHaveBeenCalled()

        expect(
            screen.getByTestId('location'),
        ).toHaveTextContent('/dashboard')
    })

    it('ignores scans while an input is focused', () => {
        renderScannerRoute('/dashboard')

        const input =
            document.createElement('input')

        document.body.appendChild(input)
        input.focus()

        for (const key of '9780441172719') {
            fireEvent.keyDown(input, {
                key,
            })
        }

        fireEvent.keyDown(input, {
            key: 'Enter',
        })

        expect(mockList).not.toHaveBeenCalled()

        input.remove()
    })
})
