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
import {
    MemoryRouter,
} from 'react-router-dom'

import type {
    BulkBookLookupResponse,
    ShelfRead,
} from '../../../api/apiTypes'
import { ApiError } from '../../../api/apiErrors'
import { BulkAddPage } from './BulkAddPage'

const mockShelvesRefetch = vi.fn()
const mockCategoriesRefetch = vi.fn()
const mockLookupMutateAsync = vi.fn()
const mockImportMutateAsync = vi.fn()

let shelvesData: ShelfRead[] | undefined
let shelvesPending = false
let shelvesError: unknown = null

let categoriesData:
    | Array<{
    category_id: string
    name: string
}>
    | undefined

let categoriesPending = false
let categoriesError: unknown = null
let lookupPending = false

vi.mock('../../../api/shelvesQueries', () => ({
    useShelves: () => ({
        data: shelvesData,
        isPending: shelvesPending,
        isError: shelvesError !== null,
        error: shelvesError,
        refetch: mockShelvesRefetch,
    }),
}))

vi.mock('../../../api/categoriesQueries', () => ({
    useCategories: () => ({
        data: categoriesData,
        isPending: categoriesPending,
        isError: categoriesError !== null,
        error: categoriesError,
        refetch: mockCategoriesRefetch,
    }),
}))

vi.mock('../../../api/booksQueries', () => ({
    useBulkBookLookup: () => ({
        mutateAsync: mockLookupMutateAsync,
        isPending: lookupPending,
    }),
    useBulkBookImport: () => ({
        mutateAsync: mockImportMutateAsync,
        isPending: false,
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
                onClick={() => {
                    onDetected('9780679720201')
                }}
            >
                Simulate camera scan
            </button>

            <button
                type="button"
                onClick={onCancel}
            >
                Cancel camera
            </button>
        </div>
    ),
}))

const shelves: ShelfRead[] = [
    {
        shelf_id: 'shelf-a3',
        common_name: 'a3',
        location: null,
        description: null,
        created_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
    },
    {
        shelf_id: 'shelf-unknown',
        common_name: 'unknown',
        location: null,
        description: null,
        created_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
    },
    {
        shelf_id: 'shelf-removed',
        common_name: 'removed',
        location: null,
        description: null,
        created_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
    },
]

function renderPage() {
    return render(
        <MemoryRouter>
            <BulkAddPage />
        </MemoryRouter>,
    )
}

function startShelf() {
    fireEvent.change(
        screen.getByLabelText('Destination shelf'),
        {
            target: { value: 'a3' },
        },
    )

    fireEvent.change(
        screen.getByLabelText('Acquisition source'),
        {
            target: { value: 'Shelf intake' },
        },
    )

    fireEvent.click(
        screen.getByRole('button', {
            name: 'Start Shelf',
        }),
    )
}

function scanIsbn(isbn: string) {
    const input =
        screen.getByLabelText('ISBN')

    fireEvent.change(input, {
        target: { value: isbn },
    })

    fireEvent.submit(
        input.closest('form')!,
    )
}

describe('BulkAddPage', () => {
    beforeEach(() => {
        shelvesData = shelves
        shelvesPending = false
        shelvesError = null

        categoriesData = [
            {
                category_id: 'category-classics',
                name: 'Classics',
            },
            {
                category_id: 'category-fiction',
                name: 'Fiction',
            },
        ]
        categoriesPending = false
        categoriesError = null

        lookupPending = false

        mockShelvesRefetch.mockReset()
        mockCategoriesRefetch.mockReset()
        mockLookupMutateAsync.mockReset()
        mockImportMutateAsync.mockReset()

        vi.restoreAllMocks()
    })

    it('loads the shelf-first setup and excludes removed', () => {
        renderPage()

        expect(
            screen.getByRole('heading', {
                level: 1,
                name: 'Bulk Add',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('option', {
                name: 'A3',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('option', {
                name: 'Unknown',
            }),
        ).toBeInTheDocument()

        expect(
            screen.queryByRole('option', {
                name: 'Removed',
            }),
        ).not.toBeInTheDocument()
    })

    it('shows loading and retryable shelf errors', () => {
        shelvesData = undefined
        shelvesPending = true

        const view = renderPage()

        expect(
            screen.getByText(
                'Loading shelves…',
            ),
        ).toBeInTheDocument()

        view.unmount()

        shelvesPending = false
        shelvesError = new ApiError({
            kind: 'unreachable',
            message: 'API unavailable',
        })

        renderPage()

        expect(
            screen.getByText(
                'Unable to load shelves',
            ),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Retry',
            }),
        )

        expect(
            mockShelvesRefetch,
        ).toHaveBeenCalledOnce()
    })

    it('starts a shelf session and classifies a lookup result', async () => {
        const response: BulkBookLookupResponse = {
            items: [
                {
                    client_item_id: 'bulk-add-1',
                    status: 'found',
                    catalog_state: 'new',
                    isbn13: '9780140449266',
                    draft: {
                        title: 'The Odyssey',
                        authors: 'Homer',
                        isbn13: '9780140449266',
                    },
                    missing_fields: [],
                },
            ],
        }

        mockLookupMutateAsync.mockResolvedValue(
            response,
        )

        renderPage()
        startShelf()

        expect(
            screen.getByText((_, element) =>
                element?.textContent ===
                'Shelf A3 · Shelf intake',
            ),
        ).toBeInTheDocument()

        scanIsbn('978-0-14-044926-6')

        await waitFor(() => {
            expect(
                mockLookupMutateAsync,
            ).toHaveBeenCalledWith({
                items: [
                    {
                        client_item_id:
                            'bulk-add-1',
                        isbn: '9780140449266',
                    },
                ],
            })
        })

        expect(
            await screen.findByDisplayValue(
                'The Odyssey',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Ready'),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText('ISBN'),
        ).toHaveFocus()
    })

    it('prevents duplicate scans after ISBN normalization', async () => {
        mockLookupMutateAsync.mockImplementation(
            () =>
                new Promise(
                    () => undefined,
                ),
        )

        renderPage()
        startShelf()

        scanIsbn('978-0-14-044926-6')
        scanIsbn('9780140449266')

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            '9780140449266 is already in this Bulk Add session.',
        )

        expect(
            screen.getByText(
                /1 book scanned/,
            ),
        ).toBeInTheDocument()
    })

    it('accepts ISBNs from the existing camera scanner', async () => {
        mockLookupMutateAsync.mockImplementation(
            () =>
                new Promise(
                    () => undefined,
                ),
        )

        renderPage()
        startShelf()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Use Camera',
            }),
        )

        fireEvent.click(
            await screen.findByRole(
                'button',
                {
                    name: 'Simulate camera scan',
                },
            ),
        )

        expect(
            screen.getByText(
                '9780679720201',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                /1 book scanned/,
            ),
        ).toBeInTheDocument()
    })

    it('edits lookup metadata and saves a create item with categories', async () => {
        mockLookupMutateAsync.mockResolvedValue({
            items: [
                {
                    client_item_id: 'bulk-add-1',
                    status: 'found',
                    catalog_state: 'new',
                    isbn13: '9780140449266',
                    draft: {
                        title: 'The Odyssey',
                        authors: '',
                        isbn13: '9780140449266',
                    },
                    missing_fields: ['authors'],
                },
            ],
        })

        mockImportMutateAsync.mockResolvedValue({
            items: [
                {
                    client_item_id: 'bulk-add-1',
                    status: 'created',
                    book_id: 'book-1',
                },
            ],
        })

        renderPage()
        startShelf()
        scanIsbn('9780140449266')

        const authorInput =
            await screen.findByLabelText(
                'Authors',
            )

        expect(
            screen.getByText(
                'At least one author is required before this book can be saved.',
            ),
        ).toBeInTheDocument()

        fireEvent.change(authorInput, {
            target: { value: 'Homer' },
        })

        fireEvent.click(
            screen.getByRole('checkbox', {
                name: 'Classics',
            }),
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Shelf (1)',
            }),
        )

        await waitFor(() => {
            expect(
                mockImportMutateAsync,
            ).toHaveBeenCalledWith({
                shelf_name: 'a3',
                acquisition_source:
                    'Shelf intake',
                items: [
                    {
                        client_item_id:
                            'bulk-add-1',
                        action: 'create',
                        book: {
                            title:
                                'The Odyssey',
                            isbn13:
                                '9780140449266',
                            authors: [
                                {
                                    first_name:
                                        null,
                                    surname:
                                        'Homer',
                                },
                            ],
                            publisher: null,
                            publication_date:
                                null,
                            pages: null,
                            category_ids: [
                                'category-classics',
                            ],
                        },
                    },
                ],
            })
        })

        expect(
            await screen.findByText(
                'Saved',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                '1 book saved successfully.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'Start Next Shelf',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'Finish Bulk Add',
            }),
        ).toBeInTheDocument()
    })

    it('acquires an explicitly selected wishlist book by existing book id', async () => {
        mockLookupMutateAsync.mockResolvedValue({
            items: [
                {
                    client_item_id: 'bulk-add-1',
                    status: 'found',
                    catalog_state: 'wishlist',
                    catalog_book_ids: [
                        'wishlist-book-1',
                    ],
                    isbn13: '9780679720201',
                    draft: {
                        title:
                            'The Stranger',
                        authors:
                            'Albert Camus',
                        isbn13:
                            '9780679720201',
                    },
                    missing_fields: [],
                },
            ],
        })

        mockImportMutateAsync.mockResolvedValue({
            items: [
                {
                    client_item_id: 'bulk-add-1',
                    status:
                        'wishlist_acquired',
                    book_id:
                        'wishlist-book-1',
                },
            ],
        })

        renderPage()
        startShelf()
        scanIsbn('9780679720201')

        const acquireCheckbox =
            await screen.findByRole(
                'checkbox',
                {
                    name: /Acquire the existing wishlist copy/,
                },
            )

        expect(
            screen.queryByRole('button', {
                name: 'Save Shelf (1)',
            }),
        ).not.toBeInTheDocument()

        fireEvent.click(acquireCheckbox)

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Shelf (1)',
            }),
        )

        await waitFor(() => {
            expect(
                mockImportMutateAsync,
            ).toHaveBeenCalledWith({
                shelf_name: 'a3',
                acquisition_source:
                    'Shelf intake',
                items: [
                    {
                        client_item_id:
                            'bulk-add-1',
                        action:
                            'acquire_wishlist',
                        existing_book_id:
                            'wishlist-book-1',
                        book: {
                            title:
                                'The Stranger',
                            isbn13:
                                '9780679720201',
                            publisher: null,
                            publication_date:
                                null,
                            pages: null,
                        },
                    },
                ],
            })
        })

        expect(
            await screen.findByText(
                'Saved',
            ),
        ).toBeInTheDocument()
    })

    it('keeps failed imports editable and does not resubmit saved rows', async () => {
        mockLookupMutateAsync.mockResolvedValue({
            items: [
                {
                    client_item_id: 'bulk-add-1',
                    status: 'found',
                    catalog_state: 'new',
                    isbn13: '9780140449266',
                    draft: {
                        title: 'The Odyssey',
                        authors: 'Homer',
                        isbn13: '9780140449266',
                    },
                    missing_fields: [],
                },
                {
                    client_item_id: 'bulk-add-2',
                    status: 'found',
                    catalog_state: 'new',
                    isbn13: '9780679720201',
                    draft: {
                        title: 'The Stranger',
                        authors: 'Albert Camus',
                        isbn13: '9780679720201',
                    },
                    missing_fields: [],
                },
            ],
        })

        mockImportMutateAsync
            .mockResolvedValueOnce({
                items: [
                    {
                        client_item_id:
                            'bulk-add-1',
                        status: 'created',
                        book_id: 'book-1',
                    },
                    {
                        client_item_id:
                            'bulk-add-2',
                        status:
                            'validation_failed',
                        error_code:
                            'invalid_book',
                    },
                ],
            })
            .mockResolvedValueOnce({
                items: [
                    {
                        client_item_id:
                            'bulk-add-2',
                        status: 'created',
                        book_id: 'book-2',
                    },
                ],
            })

        renderPage()
        startShelf()

        scanIsbn('9780140449266')
        scanIsbn('9780679720201')

        await screen.findByDisplayValue(
            'The Odyssey',
        )
        await screen.findByDisplayValue(
            'The Stranger',
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Shelf (2)',
            }),
        )

        await waitFor(() => {
            expect(
                mockImportMutateAsync,
            ).toHaveBeenCalledTimes(1)
        })

        expect(
            screen.getByText(
                /1 book saved successfully. 1 item still need attention./,
            ),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Shelf (1)',
            }),
        )

        await waitFor(() => {
            expect(
                mockImportMutateAsync,
            ).toHaveBeenCalledTimes(2)
        })

        const secondRequest =
            mockImportMutateAsync.mock.calls[1][0]

        expect(
            secondRequest.items,
        ).toHaveLength(1)

        expect(
            secondRequest.items[0]
                .client_item_id,
        ).toBe('bulk-add-2')
    })

    it('confirms before Start Next Shelf discards unresolved scans', async () => {
        mockLookupMutateAsync.mockResolvedValue({
            items: [
                {
                    client_item_id: 'bulk-add-1',
                    status: 'found',
                    catalog_state: 'new',
                    isbn13: '9780140449266',
                    draft: {
                        title: 'The Odyssey',
                        authors: 'Homer',
                        isbn13: '9780140449266',
                    },
                    missing_fields: [],
                },
                {
                    client_item_id: 'bulk-add-2',
                    status: 'found',
                    catalog_state: 'new',
                    isbn13: '9780679720201',
                    draft: {
                        title: 'The Stranger',
                        authors: '',
                        isbn13: '9780679720201',
                    },
                    missing_fields: ['authors'],
                },
            ],
        })

        mockImportMutateAsync.mockResolvedValue({
            items: [
                {
                    client_item_id: 'bulk-add-1',
                    status: 'created',
                    book_id: 'book-1',
                },
            ],
        })

        renderPage()
        startShelf()

        scanIsbn('9780140449266')
        scanIsbn('9780679720201')

        await screen.findByDisplayValue(
            'The Odyssey',
        )
        await screen.findByDisplayValue(
            'The Stranger',
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Shelf (1)',
            }),
        )

        await screen.findByText(
            '1 book saved successfully.',
        )

        const confirmSpy = vi
            .spyOn(window, 'confirm')
            .mockReturnValue(false)

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Start Next Shelf',
            }),
        )

        expect(
            confirmSpy,
        ).toHaveBeenCalledWith(
            'Some scanned books have not been saved. Discard those unresolved items and leave this shelf?',
        )

        expect(
            screen.getByDisplayValue(
                'The Stranger',
            ),
        ).toBeInTheDocument()

        confirmSpy.mockReturnValue(true)

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Start Next Shelf',
            }),
        )

        expect(
            screen.getByLabelText(
                'Destination shelf',
            ),
        ).toBeInTheDocument()

        expect(
            screen.queryByDisplayValue(
                'The Stranger',
            ),
        ).not.toBeInTheDocument()
    })
})
