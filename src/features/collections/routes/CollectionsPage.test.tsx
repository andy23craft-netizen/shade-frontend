import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
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
    CollectionBookList,
    CollectionList,
    CollectionRead,
} from '../../../api/apiTypes'
import {
    useCollectionBooks,
    useCollections,
    useCreateCollection,
    useDeleteCollection,
    useUpdateCollection,
} from '../../../api/collectionsQueries'
import {
    CollectionsPage,
} from './CollectionsPage'

vi.mock('../../../api/collectionsQueries', () => ({
    useCollections: vi.fn(),
    useCollectionBooks: vi.fn(),
    useCreateCollection: vi.fn(),
    useDeleteCollection: vi.fn(),
    useUpdateCollection: vi.fn(),
}))

vi.mock(
    '../components/AddCollectionBookControl',
    () => ({
        AddCollectionBookControl: () => (
            <div data-testid="add-collection-book">
                Add collection book control
            </div>
        ),
    }),
)

const mockMembershipRow = vi.fn()

vi.mock(
    '../components/CollectionMembershipRow',
    () => ({
        CollectionMembershipRow: (
            props: unknown,
        ) => {
            mockMembershipRow(props)

            const typed = props as {
                membership: {
                    collection_book_id: string
                    book_id: string
                    order_num: number
                }
                isFirst: boolean
                isLast: boolean
            }

            return (
                <li
                    data-testid="collection-membership"
                    data-membership-id={
                        typed.membership
                            .collection_book_id
                    }
                    data-book-id={
                        typed.membership.book_id
                    }
                    data-order-num={
                        typed.membership.order_num
                    }
                    data-first={
                        String(typed.isFirst)
                    }
                    data-last={
                        String(typed.isLast)
                    }
                />
            )
        },
    }),
)

const mockUseCollections =
    vi.mocked(useCollections)

const mockUseCollectionBooks =
    vi.mocked(useCollectionBooks)

const mockUseCreateCollection =
    vi.mocked(useCreateCollection)

const mockUseDeleteCollection =
    vi.mocked(useDeleteCollection)
const mockUseUpdateCollection =
    vi.mocked(useUpdateCollection)

const collection: CollectionRead = {
    collection_id: 'collection-1',
    name: 'Staff Picks',
    description: 'Favorites',
    created_date:
        '2026-08-01T00:00:00Z',
    last_updated_date:
        '2026-08-01T00:00:00Z',
}

const collections: CollectionList = {
    items: [collection],
    total: 1,
}

const memberships: CollectionBookList = {
    items: [
        {
            collection_book_id:
                'membership-2',
            collection_id:
                'collection-1',
            book_id: 'book-2',
            order_num: 2,
            notes: null,
            shelf_name: null,
            on_wishlist: true,
            created_date:
                '2026-08-02T00:00:00Z',
        },
        {
            collection_book_id:
                'membership-1',
            collection_id:
                'collection-1',
            book_id: 'book-1',
            order_num: 1,
            notes: 'First',
            shelf_name: 'a1',
            on_wishlist: false,
            created_date:
                '2026-08-01T00:00:00Z',
        },
    ],
    total: 2,
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
        error: null,
        refetch: vi.fn(),
    } as unknown as ReturnType<
        typeof useCollections
    >)

    mockUseCollectionBooks.mockReturnValue({
        isPending: false,
        isError: false,
        isSuccess: true,
        data: memberships,
        error: null,
        refetch: vi.fn(),
    } as unknown as ReturnType<
        typeof useCollectionBooks
    >)

    mockUseCreateCollection.mockReturnValue(
        idleMutation() as unknown as ReturnType<
            typeof useCreateCollection
        >,
    )

    mockUseDeleteCollection.mockReturnValue(
        idleMutation() as unknown as ReturnType<
            typeof useDeleteCollection
        >,
    )
    mockUseUpdateCollection.mockReturnValue(
        idleMutation() as unknown as ReturnType<
            typeof useUpdateCollection
        >,
    )
}

function renderPage() {
    return render(
        <MemoryRouter
            initialEntries={['/collections']}
        >
            <CollectionsPage />
        </MemoryRouter>,
    )
}

describe('CollectionsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockSuccessState()
    })

    it('explains collections, browse, and wishlists as distinct surfaces', () => {
        renderPage()

        expect(
            screen.getByRole('heading', {
                level: 1,
                name: 'Collections',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                /Curate ordered groups of books/i,
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                /Use Browse for the full shelved catalog/i,
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                /Use Wishlists for books you want to acquire/i,
            ),
        ).toBeInTheDocument()
    })

    it('renders the add-book control', () => {
        renderPage()

        expect(
            screen.getByTestId(
                'add-collection-book',
            ),
        ).toBeInTheDocument()
    })

    it('creates a collection', async () => {
        const mutate = vi.fn(
            (
                _payload: unknown,
                options: {
                    onSuccess?: (
                        result:
                        CollectionRead,
                    ) => void
                },
            ) => {
                options.onSuccess?.(
                    collection,
                )
            },
        )

        mockUseCreateCollection.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useCreateCollection
        >)

        renderPage()

        fireEvent.change(
            screen.getByLabelText('Name'),
            {
                target: {
                    value: '  Exhibitions  ',
                },
            },
        )

        fireEvent.change(
            screen.getByLabelText(
                'Description',
            ),
            {
                target: {
                    value:
                        '  Rotating display  ',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Create Collection',
            }),
        )

        await waitFor(() => {
            expect(mutate).toHaveBeenCalledWith(
                {
                    name: 'Exhibitions',
                    description:
                        'Rotating display',
                },
                expect.any(Object),
            )
        })
    })

    it('shows client validation for a blank collection name', () => {
        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Create Collection',
            }),
        )

        expect(
            screen.getByText(
                'Enter a name for the collection.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText('Name'),
        ).toHaveAttribute(
            'aria-invalid',
            'true',
        )
    })

    it('maps create 422 errors to the name field', async () => {
        mockUseCreateCollection.mockReturnValue({
            mutate: vi.fn(
                (
                    _payload: unknown,
                    options: {
                        onError?: (
                            error: unknown,
                        ) => void
                    },
                ) => {
                    options.onError?.(
                        new ApiError({
                            kind:
                                'validation',
                            status: 422,
                            message:
                                'Validation failed.',
                            fieldErrors: [
                                {
                                    field:
                                        'name',
                                    message:
                                        'Invalid name.',
                                },
                            ],
                        }),
                    )
                },
            ),
            isPending: false,
        } as unknown as ReturnType<
            typeof useCreateCollection
        >)

        renderPage()

        fireEvent.change(
            screen.getByLabelText('Name'),
            {
                target: {
                    value: 'Test',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Create Collection',
            }),
        )

        await waitFor(() => {
            expect(
                screen.getByText(
                    'Invalid name.',
                ),
            ).toBeInTheDocument()
        })

        expect(
            screen.getByLabelText('Name'),
        ).toHaveAttribute(
            'aria-invalid',
            'true',
        )
    })

    it('renders memberships in order_num order', () => {
        renderPage()

        const rows =
            screen.getAllByTestId(
                'collection-membership',
            )

        expect(rows).toHaveLength(2)

        expect(rows[0]).toHaveAttribute(
            'data-membership-id',
            'membership-1',
        )

        expect(rows[0]).toHaveAttribute(
            'data-order-num',
            '1',
        )

        expect(rows[0]).toHaveAttribute(
            'data-first',
            'true',
        )

        expect(rows[0]).toHaveAttribute(
            'data-last',
            'false',
        )

        expect(rows[1]).toHaveAttribute(
            'data-membership-id',
            'membership-2',
        )

        expect(rows[1]).toHaveAttribute(
            'data-order-num',
            '2',
        )

        expect(rows[1]).toHaveAttribute(
            'data-first',
            'false',
        )

        expect(rows[1]).toHaveAttribute(
            'data-last',
            'true',
        )
    })

    it('shows collection name, description, and membership count', () => {
        renderPage()

        expect(
            screen.getByRole('heading', {
                level: 2,
                name: 'Staff Picks',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Favorites'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('2 books'),
        ).toBeInTheDocument()
    })

    it('opens and cancels collection editing without mutating', () => {
        const mutate = vi.fn()

        mockUseUpdateCollection.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useUpdateCollection
        >)

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Edit',
            }),
        )

        const editForm = screen.getByRole('form', {
            name: 'Edit Staff Picks',
        })

        expect(
            screen.getByRole('heading', {
                level: 3,
                name: 'Edit Staff Picks',
            }),
        ).toBeInTheDocument()

        expect(
            within(editForm).getByLabelText('Name'),
        ).toHaveValue('Staff Picks')

        expect(
            within(editForm).getByLabelText('Description'),
        ).toHaveValue('Favorites')

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Cancel',
            }),
        )

        expect(
            screen.queryByRole('heading', {
                level: 3,
                name: 'Edit Staff Picks',
            }),
        ).not.toBeInTheDocument()

        expect(mutate).not.toHaveBeenCalled()
    })

    it('renames an existing collection', async () => {
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

        mockUseUpdateCollection.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useUpdateCollection
        >)

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Edit',
            }),
        )

        const editForm = screen.getByRole('form', {
            name: 'Edit Staff Picks',
        })

        fireEvent.change(
            within(editForm).getByLabelText('Name'),
            {
                target: {
                    value: '  New Staff Picks  ',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Changes',
            }),
        )

        await waitFor(() => {
            expect(mutate).toHaveBeenCalledWith(
                {
                    collectionId: 'collection-1',
                    collection: {
                        name: 'New Staff Picks',
                    },
                },
                expect.any(Object),
            )
        })
    })

    it('clears an existing collection description with explicit null', async () => {
        const mutate = vi.fn()

        mockUseUpdateCollection.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useUpdateCollection
        >)

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Edit',
            }),
        )

        const editForm = screen.getByRole('form', {
            name: 'Edit Staff Picks',
        })

        fireEvent.change(
            within(editForm).getByLabelText('Description'),
            {
                target: {
                    value: '   ',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Changes',
            }),
        )

        await waitFor(() => {
            expect(mutate).toHaveBeenCalledWith(
                {
                    collectionId: 'collection-1',
                    collection: {
                        description: null,
                    },
                },
                expect.any(Object),
            )
        })
    })

    it('shows client validation when an edited name is blank', () => {
        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Edit',
            }),
        )

        const editForm = screen.getByRole('form', {
            name: 'Edit Staff Picks',
        })

        fireEvent.change(
            within(editForm).getByLabelText('Name'),
            {
                target: {
                    value: '   ',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Changes',
            }),
        )

        expect(
            screen.getByText(
                'Enter a name for the collection.',
            ),
        ).toBeInTheDocument()

        expect(
            within(editForm).getByLabelText('Name'),
        ).toHaveAttribute(
            'aria-invalid',
            'true',
        )
    })

    it('maps collection edit 422 errors to the name field', async () => {
        mockUseUpdateCollection.mockReturnValue({
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
                            kind: 'validation',
                            status: 422,
                            message:
                                'Validation failed.',
                            fieldErrors: [
                                {
                                    field: 'name',
                                    message:
                                        'Invalid name.',
                                },
                            ],
                        }),
                    )
                },
            ),
            isPending: false,
        } as unknown as ReturnType<
            typeof useUpdateCollection
        >)

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Edit',
            }),
        )

        const editForm = screen.getByRole('form', {
            name: 'Edit Staff Picks',
        })

        fireEvent.change(
            within(editForm).getByLabelText('Name'),
            {
                target: {
                    value: 'Changed',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Changes',
            }),
        )

        await waitFor(() => {
            expect(
                screen.getByText(
                    'Invalid name.',
                ),
            ).toBeInTheDocument()
        })

        expect(
            within(editForm).getByLabelText('Name')
        ).toHaveAttribute(
            'aria-invalid',
            'true',
        )
    })

    it('shows an empty state when no collections exist', () => {
        mockUseCollections.mockReturnValue({
            isPending: false,
            isError: false,
            isSuccess: true,
            data: {
                items: [],
                total: 0,
            },
            error: null,
            refetch: vi.fn(),
        } as unknown as ReturnType<
            typeof useCollections
        >)

        renderPage()

        expect(
            screen.getByRole('heading', {
                name: 'No collections yet',
            }),
        ).toBeInTheDocument()
    })

    it('shows an empty membership state', () => {
        mockUseCollectionBooks.mockReturnValue({
            isPending: false,
            isError: false,
            isSuccess: true,
            data: {
                items: [],
                total: 0,
            },
            error: null,
            refetch: vi.fn(),
        } as unknown as ReturnType<
            typeof useCollectionBooks
        >)

        renderPage()

        expect(
            screen.getByText(
                /No books have been added to this collection yet/i,
            ),
        ).toBeInTheDocument()
    })

    it('confirms before permanently deleting a collection', () => {
        const mutate = vi.fn()

        mockUseDeleteCollection.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useDeleteCollection
        >)

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Delete Collection',
            }),
        )

        const dialog =
            screen.getByRole('dialog')

        expect(dialog).toBeInTheDocument()

        expect(
            screen.getByText(
                /catalog books remain in the library/i,
            ),
        ).toBeInTheDocument()

        fireEvent.click(
            within(dialog).getByRole('button', {
                name: 'Delete Collection',
            }),
        )

        expect(mutate).toHaveBeenCalledWith(
            'collection-1',
            expect.any(Object),
        )
    })

    it('shows top-level loading and retryable error states', () => {
        mockUseCollections.mockReturnValue({
            isPending: true,
            isError: false,
            isSuccess: false,
            data: undefined,
            error: null,
            refetch: vi.fn(),
        } as unknown as ReturnType<
            typeof useCollections
        >)

        const {
            unmount,
        } = renderPage()

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

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: /retry/i,
            }),
        )

        expect(refetch).toHaveBeenCalled()
    })

    it('shows retryable membership errors', () => {
        const refetch = vi.fn()

        mockUseCollectionBooks.mockReturnValue({
            isPending: false,
            isError: true,
            isSuccess: false,
            data: undefined,
            error: new Error('failed'),
            refetch,
        } as unknown as ReturnType<
            typeof useCollectionBooks
        >)

        renderPage()

        expect(
            screen.getByText(
                'Unable to load Staff Picks',
            ),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: /retry/i,
            }),
        )

        expect(refetch).toHaveBeenCalled()
    })
})
