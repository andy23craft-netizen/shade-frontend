import {
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'
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
    CategoryRead,
    ShelfRead,
} from '../../../api/apiTypes'
import { NewBookPage } from './NewBookPage'

const mockNavigate = vi.fn()
const mockMutate = vi.fn()
const mockRefetch = vi.fn()
const mockShelvesRefetch = vi.fn()
const mockCategoriesRefetch = vi.fn()
const mockUseBookLookup = vi.fn()

const TEST_SHELVES: ShelfRead[] = [
    {
        shelf_id: 'id-unknown',
        common_name: 'unknown',
        location: null,
        description: null,
        created_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
    },
    {
        shelf_id: 'id-a1',
        common_name: 'a1',
        location: null,
        description: null,
        created_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
    },
]

const TEST_CATEGORIES: CategoryRead[] = [
    {
        category_id: 'cat-fiction',
        name: 'Fiction',
        slug: 'fiction',
        created_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
    },
]

const shelvesState = {
    data: TEST_SHELVES as ShelfRead[] | undefined,
    isPending: false,
    isError: false,
    error: null as unknown,
    isSuccess: true,
}

const categoriesState = {
    data: TEST_CATEGORIES as CategoryRead[] | undefined,
    isPending: false,
    isError: false,
    error: null as unknown,
    isSuccess: true,
}

const lookupState = {
    data: undefined as undefined | {
        found: boolean
        draft: null | {
            isbn13: string
            title: string | null
            authors: string | null
            publisher: string | null
            publication_date: string | null
            pages: number | null
        }
    },
    isPending: false,
    isFetching: false,
    isError: false,
    error: null as unknown,
}

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<
        typeof import('react-router-dom')
    >('react-router-dom')

    return {
        ...actual,
        useNavigate: () => mockNavigate,
    }
})

vi.mock('../../../api/booksQueries', () => ({
    useCreateBook: () => ({
        mutate: mockMutate,
        isPending: false,
        isError: false,
        error: null,
    }),
    useBookLookup: (isbn: string) => {
        mockUseBookLookup(isbn)

        return {
            ...lookupState,
            refetch: mockRefetch,
        }
    },
}))

vi.mock('../../../api/shelvesQueries', () => ({
    useShelves: () => ({
        ...shelvesState,
        refetch: mockShelvesRefetch,
    }),
}))

vi.mock('../../../api/categoriesQueries', () => ({
    useCategories: () => ({
        ...categoriesState,
        refetch: mockCategoriesRefetch,
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


function renderNewBookPage(
    initialEntry = '/books/new',
) {
    return render(
        <MemoryRouter
            initialEntries={[initialEntry]}
        >
            <NewBookPage />
        </MemoryRouter>,
    )
}

describe('NewBookPage', () => {
    beforeEach(() => {
        mockNavigate.mockReset()
        mockMutate.mockReset()
        mockRefetch.mockReset()
        mockShelvesRefetch.mockReset()
        mockCategoriesRefetch.mockReset()
        mockUseBookLookup.mockReset()
        shelvesState.data = TEST_SHELVES
        shelvesState.isPending = false
        shelvesState.isError = false
        shelvesState.error = null
        shelvesState.isSuccess = true
        categoriesState.data = TEST_CATEGORIES
        categoriesState.isPending = false
        categoriesState.isError = false
        categoriesState.error = null
        categoriesState.isSuccess = true
        lookupState.data = undefined
        lookupState.isPending = false
        lookupState.isFetching = false
        lookupState.isError = false
        lookupState.error = null
    })

    it('renders the add book page', () => {
        renderNewBookPage()

        expect(
            screen.getByRole('heading', {
                level: 1,
                name: 'Add Book',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                /Add a book manually or use ISBN lookup to prefill its metadata/,
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText('Title'),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText('Authors'),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText('Lookup ISBN'),
        ).toBeInTheDocument()
    })

    it('blocks the page when shelves fail to load', () => {
        shelvesState.data = undefined
        shelvesState.isPending = false
        shelvesState.isError = true
        shelvesState.isSuccess = false
        shelvesState.error = new ApiError({
            kind: 'unreachable',
            message:
                'The API could not be reached',
        })

        renderNewBookPage()

        expect(
            screen.getByText(
                'Unable to load shelves',
            ),
        ).toBeInTheDocument()

        expect(
            screen.queryByLabelText('Title'),
        ).not.toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Retry',
            }),
        )

        expect(
            mockShelvesRefetch,
        ).toHaveBeenCalled()
    })

    it('blocks the page when categories fail to load', () => {
        categoriesState.data = undefined
        categoriesState.isPending = false
        categoriesState.isError = true
        categoriesState.isSuccess = false
        categoriesState.error = new ApiError({
            kind: 'unreachable',
            message:
                'The API could not be reached',
        })

        renderNewBookPage()

        expect(
            screen.getByText(
                'Unable to load categories',
            ),
        ).toBeInTheDocument()

        expect(
            screen.queryByLabelText('Title'),
        ).not.toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Retry',
            }),
        )

        expect(
            mockCategoriesRefetch,
        ).toHaveBeenCalled()
    })

    it('submits the book through the create mutation', () => {
        renderNewBookPage()

        fireEvent.change(
            screen.getByLabelText('Title'),
            {
                target: {
                    value: 'Dune',
                },
            },
        )

        fireEvent.change(
            screen.getByLabelText('Authors'),
            {
                target: {
                    value: 'Frank Herbert',
                },
            },
        )

        fireEvent.click(
            screen.getByLabelText('Shelf'),
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Unknown',
            }),
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Book',
            }),
        )

        expect(mockMutate).toHaveBeenCalledOnce()
        expect(mockMutate).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Dune',
                authors: 'Frank Herbert',
                category_ids: [],
                shelf_name: 'unknown',
                status: 'available',
                is_read: false,
            }),
            expect.objectContaining({
                onSuccess: expect.any(Function),
                onError: expect.any(Function),
            }),
        )
    })

    it('navigates to the created book after success', () => {
        renderNewBookPage()

        fireEvent.change(
            screen.getByLabelText('Title'),
            {
                target: {
                    value: 'Dune',
                },
            },
        )

        fireEvent.change(
            screen.getByLabelText('Authors'),
            {
                target: {
                    value: 'Frank Herbert',
                },
            },
        )

        fireEvent.click(
            screen.getByLabelText('Shelf'),
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Unknown',
            }),
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Book',
            }),
        )

        const options = mockMutate.mock.calls[0][1]

        options.onSuccess({
            id: 'book-123',
        })

        expect(mockNavigate).toHaveBeenCalledWith(
            '/books/book-123',
        )
    })

    it('navigates back to books when Cancel is clicked', () => {
        renderNewBookPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Cancel',
            }),
        )

        expect(mockNavigate).toHaveBeenCalledWith(
            '/books',
        )
    })

    it('rejects invalid ISBN check digits before lookup', () => {
        renderNewBookPage()

        fireEvent.change(
            screen.getByLabelText('Lookup ISBN'),
            {
                target: {
                    value: '0441172718',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Look Up ISBN',
            }),
        )

        expect(
            screen.getByText(
                'Enter a valid ISBN-10 or ISBN-13.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText('ISBN'),
        ).toHaveValue('')
    })

    it('hands a scanned ISBN into the existing lookup flow', async () => {
        renderNewBookPage()

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

        expect(
            screen.getByLabelText('Lookup ISBN'),
        ).toHaveValue('9780441172719')

        expect(
            screen.queryByRole('button', {
                name: 'Simulate ISBN scan',
            }),
        ).not.toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Look Up ISBN',
            }),
        )

        expect(
            screen.getByLabelText('ISBN'),
        ).toHaveValue('9780441172719')
    })

    it('hands a hardware-scanned ISBN into the existing lookup flow', () => {
        renderNewBookPage()

        for (const key of '9780441172719') {
            fireEvent.keyDown(window, { key })
        }

        fireEvent.keyDown(window, {
            key: 'Enter',
        })

        expect(
            screen.getByLabelText('Lookup ISBN'),
        ).toHaveValue('9780441172719')

        expect(
            screen.getByLabelText('ISBN'),
        ).toHaveValue('9780441172719')

        expect(mockMutate).not.toHaveBeenCalled()
    })

    it('starts ISBN lookup from the scanned ISBN in the route', () => {
        renderNewBookPage(
            '/books/new?isbn=9780441172719',
        )

        expect(
            screen.getByLabelText('Lookup ISBN'),
        ).toHaveValue('9780441172719')

        expect(
            screen.getByLabelText('ISBN'),
        ).toHaveValue('9780441172719')

        expect(
            mockUseBookLookup,
        ).toHaveBeenCalledWith(
            '9780441172719',
        )
    })

    it('does not start lookup for an invalid ISBN in the route', () => {
        renderNewBookPage(
            '/books/new?isbn=not-an-isbn',
        )

        expect(
            screen.getByLabelText('Lookup ISBN'),
        ).toHaveValue('not-an-isbn')

        expect(
            screen.getByLabelText('ISBN'),
        ).toHaveValue('')

        expect(
            mockUseBookLookup,
        ).toHaveBeenCalledWith('')
    })

    it('closes the scanner when scanner cancel is clicked', () => {
        renderNewBookPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Scan ISBN',
            }),
        )

        expect(
            screen.getByRole('button', {
                name: 'Simulate ISBN scan',
            }),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Cancel scanner',
            }),
        )

        expect(
            screen.queryByRole('button', {
                name: 'Simulate ISBN scan',
            }),
        ).not.toBeInTheDocument()

        expect(
            screen.getByLabelText('Lookup ISBN'),
        ).toBeInTheDocument()
    })

    it('applies lookup metadata without replacing the typed ISBN', () => {
        lookupState.data = {
            found: true,
            draft: {
                isbn13: '9780441172719',
                title: 'Dune',
                authors: 'Frank Herbert',
                publisher: 'Ace',
                publication_date: '1965',
                pages: 412,
            },
        }

        renderNewBookPage()

        fireEvent.change(
            screen.getByLabelText('Lookup ISBN'),
            {
                target: {
                    value: '978-0-441-17271-9',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Look Up ISBN',
            }),
        )

        expect(
            screen.getByLabelText('ISBN'),
        ).toHaveValue('978-0-441-17271-9')

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Apply Lookup',
            }),
        )

        expect(
            screen.getByLabelText('Title'),
        ).toHaveValue('Dune')

        expect(
            screen.getByLabelText('Authors'),
        ).toHaveValue('Frank Herbert')

        expect(
            screen.getByLabelText('Publisher'),
        ).toHaveValue('Ace')

        expect(
            screen.getByLabelText(
                'Publication date',
            ),
        ).toHaveValue('1965')

        expect(
            screen.getByLabelText('Pages'),
        ).toHaveValue(412)

        expect(
            screen.getByLabelText('ISBN'),
        ).toHaveValue('978-0-441-17271-9')
    })

    it('keeps the ISBN editable when lookup returns found: false', () => {
        lookupState.data = {
            found: false,
            draft: null,
        }

        renderNewBookPage()

        fireEvent.change(
            screen.getByLabelText('Lookup ISBN'),
            {
                target: {
                    value: '9780441172719',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Look Up ISBN',
            }),
        )

        expect(
            screen.getByText(
                /No metadata was found for this ISBN/,
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText('ISBN'),
        ).toHaveValue('9780441172719')

        expect(
            screen.getByLabelText('Title'),
        ).not.toBeDisabled()
    })

    it('shows provider failure with retry and manual fallback', () => {
        lookupState.isError = true
        lookupState.error = new ApiError({
            kind: 'server',
            status: 502,
            message: 'Bad gateway',
        })

        renderNewBookPage()

        fireEvent.change(
            screen.getByLabelText('Lookup ISBN'),
            {
                target: {
                    value: '9780441172719',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Look Up ISBN',
            }),
        )

        expect(
            screen.getByText(
                /The metadata provider failed/,
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText('ISBN'),
        ).toHaveValue('9780441172719')

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Retry lookup',
            }),
        )

        expect(mockRefetch).toHaveBeenCalled()
    })

    it('maps create 422 field errors into the form summary', async () => {
        renderNewBookPage()

        fireEvent.change(
            screen.getByLabelText('Title'),
            {
                target: {
                    value: 'Dune',
                },
            },
        )

        fireEvent.change(
            screen.getByLabelText('Authors'),
            {
                target: {
                    value: 'Frank Herbert',
                },
            },
        )

        fireEvent.click(
            screen.getByLabelText('Shelf'),
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Unknown',
            }),
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Book',
            }),
        )

        const options = mockMutate.mock.calls[0][1]

        options.onError(
            new ApiError({
                kind: 'validation',
                status: 422,
                message: 'Validation failed',
                fieldErrors: [
                    {
                        field: 'title',
                        message:
                            'ensure this value has at most 255 characters',
                    },
                ],
            }),
        )

        await waitFor(() => {
            expect(
                screen.getByRole('alert'),
            ).toHaveTextContent(
                'ensure this value has at most 255 characters',
            )
        })

        expect(
            screen.getByLabelText('Title'),
        ).toHaveValue('Dune')
    })
})
