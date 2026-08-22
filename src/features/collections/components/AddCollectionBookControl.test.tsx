import {
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'
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

import {
    ApiError,
} from '../../../api/apiErrors'
import type {
    BookList,
    BookRead,
    CollectionBookRead,
    CollectionList,
} from '../../../api/apiTypes'
import {
    useBooks,
} from '../../../api/booksQueries'
import {
    useAddCollectionBook,
    useCollections,
} from '../../../api/collectionsQueries'
import {
    AddCollectionBookControl,
} from './AddCollectionBookControl'

vi.mock('../../../api/booksQueries', () => ({
    useBooks: vi.fn(),
}))

vi.mock('../../../api/collectionsQueries', () => ({
    useCollections: vi.fn(),
    useAddCollectionBook: vi.fn(),
}))

const mockUseBooks =
    vi.mocked(useBooks)

const mockUseCollections =
    vi.mocked(useCollections)

const mockUseAddCollectionBook =
    vi.mocked(useAddCollectionBook)

const collections: CollectionList = {
    items: [
        {
            collection_id: 'collection-1',
            name: 'Staff Picks',
            description: null,
            created_date:
                '2026-08-01T00:00:00Z',
            last_updated_date:
                '2026-08-01T00:00:00Z',
        },
    ],
    total: 1,
}

const catalogBook: BookRead = {
    id: 'book-1',
    title: 'The Dispossessed',
    authors: 'Ursula K. Le Guin',
    categories: [{ category_id: 'cat-fiction', name: 'Fiction', slug: 'fiction' }],
    shelf_name: 'a1',
    status: 'available',
    is_read: false,
    isbn13: '9780061054884',
    publisher: null,
    publication_date: null,
    pages: null,
    tags: null,
    purchase_date: null,
    purchase_price: null,
    acquisition_source: null,
    notes: null,
    deletion_date: null,
    completion_date: null,
    rating: null,
    review: null,
    times_borrowed: 0,
    last_borrowed_at: null,
    average_loan_days: null,
    creation_date:
        '2026-08-01T00:00:00Z',
    updated_date:
        '2026-08-01T00:00:00Z',
}

const bookList: BookList = {
    items: [catalogBook],
    total: 1,
}

const membership: CollectionBookRead = {
    collection_book_id: 'membership-1',
    collection_id: 'collection-1',
    book_id: 'book-1',
    order_num: 1,
    notes: null,
    shelf_name: 'a1',
    on_wishlist: false,
    created_date:
        '2026-08-01T00:00:00Z',
}

function idleMutation() {
    return {
        mutate: vi.fn(),
        isPending: false,
    }
}

function mockSuccessState() {
    mockUseCollections.mockReturnValue({
        isPending: false,
        isError: false,
        isSuccess: true,
        data: collections,
        refetch: vi.fn(),
    } as unknown as ReturnType<
        typeof useCollections
    >)

    mockUseBooks.mockReturnValue({
        isPending: false,
        isFetching: false,
        isError: false,
        isSuccess: false,
        data: undefined,
        refetch: vi.fn(),
    } as unknown as ReturnType<
        typeof useBooks
    >)

    mockUseAddCollectionBook.mockReturnValue(
        idleMutation() as unknown as ReturnType<
            typeof useAddCollectionBook
        >,
    )
}

function renderControl() {
    return render(
        <MemoryRouter
            initialEntries={['/collections']}
        >
            <AddCollectionBookControl />
        </MemoryRouter>,
    )
}

function exposeBookMatches() {
    mockUseBooks.mockReturnValue({
        isPending: false,
        isFetching: false,
        isError: false,
        isSuccess: true,
        data: bookList,
        refetch: vi.fn(),
    } as unknown as ReturnType<
        typeof useBooks
    >)
}

describe('AddCollectionBookControl', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockSuccessState()
    })

    it('explains that add search is for shelved books and links to wishlists', () => {
        renderControl()

        expect(
            screen.getByText(
                /Find a shelved book already in the catalog/i,
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('link', {
                name: 'Wishlists',
            }),
        ).toHaveAttribute(
            'href',
            '/wishlists',
        )
    })

    it('requires search input before searching', () => {
        renderControl()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Find Books',
            }),
        )

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'Enter an ISBN, title, or author',
        )
    })

    it('rejects an invalid ISBN before searching', () => {
        renderControl()

        fireEvent.change(
            screen.getByLabelText('ISBN'),
            {
                target: {
                    value: '123',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Find Books',
            }),
        )

        expect(
            screen.getByText(
                'Enter a valid ISBN-10 or ISBN-13.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText('ISBN'),
        ).toHaveAttribute(
            'aria-invalid',
            'true',
        )
    })

    it('searches existing books by title without creating a catalog row', () => {
        const {
            rerender,
        } = renderControl()

        fireEvent.change(
            screen.getByLabelText('Title'),
            {
                target: {
                    value: 'Dispossessed',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Find Books',
            }),
        )

        expect(mockUseBooks).toHaveBeenLastCalledWith(
            expect.objectContaining({
                title: 'Dispossessed',
                enabled: true,
            }),
        )

        exposeBookMatches()

        rerender(
            <MemoryRouter
                initialEntries={['/collections']}
            >
                <AddCollectionBookControl />
            </MemoryRouter>,
        )

        expect(
            screen.getByRole('option', {
                name:
                    'The Dispossessed — Ursula K. Le Guin',
            }),
        ).toBeInTheDocument()
    })

    it('adds the selected existing book membership with notes', async () => {
        exposeBookMatches()

        const addMutate = vi.fn(
            (
                _variables: unknown,
                options: {
                    onSuccess?: (
                        result:
                        CollectionBookRead,
                    ) => void
                },
            ) => {
                options.onSuccess?.(
                    membership,
                )
            },
        )

        mockUseAddCollectionBook.mockReturnValue({
            mutate: addMutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useAddCollectionBook
        >)

        renderControl()

        fireEvent.change(
            screen.getByLabelText('Title'),
            {
                target: {
                    value: 'Dispossessed',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Find Books',
            }),
        )

        fireEvent.change(
            screen.getByLabelText('Book'),
            {
                target: {
                    value: 'book-1',
                },
            },
        )

        fireEvent.change(
            screen.getByLabelText('Notes'),
            {
                target: {
                    value: '  Featured title  ',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name:
                    'Add Book to Collection',
            }),
        )

        await waitFor(() => {
            expect(
                addMutate,
            ).toHaveBeenCalledWith(
                {
                    collectionId:
                        'collection-1',
                    collectionBook: {
                        book_id: 'book-1',
                        notes:
                            'Featured title',
                    },
                },
                expect.any(Object),
            )
        })

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'Book added to the collection.',
        )
    })

    it('requires a book selection before add', () => {
        exposeBookMatches()

        renderControl()

        fireEvent.change(
            screen.getByLabelText('Title'),
            {
                target: {
                    value: 'Dispossessed',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Find Books',
            }),
        )

        expect(
            screen.getByLabelText('Book'),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name:
                    'Add Book to Collection',
            }),
        )

        expect(
            screen.getByText(
                'Choose a book to add.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText('Book'),
        ).toHaveAttribute(
            'aria-invalid',
            'true',
        )
    })

    it('surfaces duplicate 409 errors honestly', async () => {
        exposeBookMatches()

        mockUseAddCollectionBook.mockReturnValue({
            mutate: vi.fn(
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
                                'Book is already in this collection',
                            detail:
                                'Book is already in this collection',
                        }),
                    )
                },
            ),
            isPending: false,
        } as unknown as ReturnType<
            typeof useAddCollectionBook
        >)

        renderControl()

        fireEvent.change(
            screen.getByLabelText('Title'),
            {
                target: {
                    value: 'Dispossessed',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Find Books',
            }),
        )

        fireEvent.change(
            screen.getByLabelText('Book'),
            {
                target: {
                    value: 'book-1',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name:
                    'Add Book to Collection',
            }),
        )

        await waitFor(() => {
            expect(
                screen.getByRole('alert'),
            ).toHaveTextContent(
                'Book is already in this collection',
            )
        })
    })

    it('surfaces soft-deleted 412 errors and refetches search', async () => {
        const refetchBooks = vi.fn()

        mockUseBooks.mockReturnValue({
            isPending: false,
            isFetching: false,
            isError: false,
            isSuccess: true,
            data: bookList,
            refetch: refetchBooks,
        } as unknown as ReturnType<
            typeof useBooks
        >)

        mockUseAddCollectionBook.mockReturnValue({
            mutate: vi.fn(
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
                            status: 412,
                            message:
                                'Soft-deleted books cannot be added to a collection',
                            detail:
                                'Soft-deleted books cannot be added to a collection',
                        }),
                    )
                },
            ),
            isPending: false,
        } as unknown as ReturnType<
            typeof useAddCollectionBook
        >)

        renderControl()

        fireEvent.change(
            screen.getByLabelText('Title'),
            {
                target: {
                    value: 'Dispossessed',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Find Books',
            }),
        )

        fireEvent.change(
            screen.getByLabelText('Book'),
            {
                target: {
                    value: 'book-1',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name:
                    'Add Book to Collection',
            }),
        )

        await waitFor(() => {
            expect(
                screen.getByRole('alert'),
            ).toHaveTextContent(
                'Soft-deleted books cannot be added to a collection',
            )
        })

        expect(
            refetchBooks,
        ).toHaveBeenCalled()
    })

    it('refetches collections and search after a stale 404', async () => {
        const refetchCollections =
            vi.fn()

        const refetchBooks =
            vi.fn()

        mockUseCollections.mockReturnValue({
            isPending: false,
            isError: false,
            isSuccess: true,
            data: collections,
            refetch:
            refetchCollections,
        } as unknown as ReturnType<
            typeof useCollections
        >)

        mockUseBooks.mockReturnValue({
            isPending: false,
            isFetching: false,
            isError: false,
            isSuccess: true,
            data: bookList,
            refetch: refetchBooks,
        } as unknown as ReturnType<
            typeof useBooks
        >)

        mockUseAddCollectionBook.mockReturnValue({
            mutate: vi.fn(
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
                        }),
                    )
                },
            ),
            isPending: false,
        } as unknown as ReturnType<
            typeof useAddCollectionBook
        >)

        renderControl()

        fireEvent.change(
            screen.getByLabelText('Title'),
            {
                target: {
                    value: 'Dispossessed',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Find Books',
            }),
        )

        fireEvent.change(
            screen.getByLabelText('Book'),
            {
                target: {
                    value: 'book-1',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name:
                    'Add Book to Collection',
            }),
        )

        await waitFor(() => {
            expect(
                refetchCollections,
            ).toHaveBeenCalled()
        })

        expect(
            refetchBooks,
        ).toHaveBeenCalled()
    })

    it('disables controls while add is pending', () => {
        mockUseAddCollectionBook.mockReturnValue({
            mutate: vi.fn(),
            isPending: true,
        } as unknown as ReturnType<
            typeof useAddCollectionBook
        >)

        renderControl()

        expect(
            screen.getByRole('button', {
                name: 'Adding…',
            }),
        ).toBeDisabled()

        expect(
            screen.getByLabelText('Title'),
        ).toBeDisabled()
    })

    it('shows loading and retryable collection errors', () => {
        mockUseCollections.mockReturnValue({
            isPending: true,
            isError: false,
            isSuccess: false,
            data: undefined,
            refetch: vi.fn(),
        } as unknown as ReturnType<
            typeof useCollections
        >)

        const {
            unmount,
        } = renderControl()

        expect(
            screen.getByText(
                'Loading collections…',
            ),
        ).toBeInTheDocument()

        unmount()

        const refetch = vi.fn()

        mockUseCollections.mockReturnValue({
            isPending: false,
            isError: true,
            isSuccess: false,
            data: undefined,
            error: new Error('failed'),
            refetch,
        } as unknown as ReturnType<
            typeof useCollections
        >)

        renderControl()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Retry',
            }),
        )

        expect(refetch).toHaveBeenCalled()
    })
})
