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
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query'

import {
    ApiError,
} from '../../../api/apiErrors'
import type {
    BookRead,
    CollectionBookRead,
    CollectionList,
} from '../../../api/apiTypes'
import {
    useAddCollectionBook,
    useCollections,
    useCreateCollection,
} from '../../../api/collectionsQueries'
import {
    AddBookToCollectionDialog,
} from './AddBookToCollectionDialog'

vi.mock('../../../api/collectionsQueries', () => ({
    useCollections: vi.fn(),
    useAddCollectionBook: vi.fn(),
    useCreateCollection: vi.fn(),
}))

const mockUseCollections =
    vi.mocked(useCollections)

const mockUseAddCollectionBook =
    vi.mocked(useAddCollectionBook)

const mockUseCreateCollection =
    vi.mocked(useCreateCollection)

const collections: CollectionList = {
    items: [
        {
            collection_id: 'collection-1',
            name: 'Staff Picks',
            description: 'Favorites',
            created_date:
                '2026-08-01T00:00:00Z',
            last_updated_date:
                '2026-08-01T00:00:00Z',
        },
        {
            collection_id: 'collection-2',
            name: 'Science Fiction',
            description: null,
            created_date:
                '2026-08-02T00:00:00Z',
            last_updated_date:
                '2026-08-02T00:00:00Z',
        },
    ],
    total: 2,
}

const book: BookRead = {
    id: 'book-1',
    title: 'The Left Hand of Darkness',
    authors: [
        {
            author_id: 'author-ursula-le-guin',
            first_name: 'Ursula K.',
            surname: 'Le Guin',
        },
    ],
    categories: [{ category_id: 'cat-fiction', name: 'Fiction', slug: 'fiction' }],
    shelf_name: 'a1',
    placement_state: 'shelved',
    status: 'available',
    is_read: false,
    isbn13: null,
    publisher: null,
    publication_date: null,
    pages: null,
    tags: null,
    purchase_date: null,
    purchase_price: null,
    acquisition_source: null,
    notes: null,
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

const membership: CollectionBookRead = {
    collection_book_id: 'membership-1',
    collection_id: 'collection-1',
    book_id: 'book-1',
    book_title: 'The Left Hand of Darkness',
    book_status: 'available',
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


    mockUseAddCollectionBook.mockReturnValue(
        idleMutation() as unknown as ReturnType<
            typeof useAddCollectionBook
        >,
    )

    mockUseCreateCollection.mockReturnValue(
        idleMutation() as unknown as ReturnType<
            typeof useCreateCollection
        >,
    )
}

function renderDialog({
                          open = true,
                          onClose = vi.fn(),
                      }: {
    open?: boolean
    onClose?: () => void
} = {}) {
    const queryClient = createQueryClient()

    const invalidateQueries = vi.spyOn(
        queryClient,
        'invalidateQueries',
    )

    const result = render(
        <MemoryRouter>
            <QueryClientProvider client={queryClient}>
                <AddBookToCollectionDialog
                    book={book}
                    open={open}
                    onClose={onClose}
                />
            </QueryClientProvider>
        </MemoryRouter>,
    )

    return {
        ...result,
        onClose,
        invalidateQueries,
    }
}

describe('AddBookToCollectionDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockSuccessState()
    })

    it('shows the current book and available collections', async () => {
        renderDialog()

        const dialog =
            await screen.findByRole('dialog', {
                name: 'Add to Collection',
            })

        expect(
            within(dialog).getByText(
                'The Left Hand of Darkness',
            ),
        ).toBeInTheDocument()

        expect(
            within(dialog).getByRole('option', {
                name: 'Staff Picks',
            }),
        ).toBeInTheDocument()

        expect(
            within(dialog).getByRole('option', {
                name: 'Science Fiction',
            }),
        ).toBeInTheDocument()

        expect(
            within(dialog).getByLabelText('Notes'),
        ).toBeInTheDocument()
    })

    it('requires a collection before submitting', async () => {
        renderDialog()

        const dialog =
            await screen.findByRole('dialog', {
                name: 'Add to Collection',
            })

        fireEvent.click(
            within(dialog).getByRole('button', {
                name: 'Add to Collection',
            }),
        )

        expect(
            within(dialog).getByText(
                'Choose a collection.',
            ),
        ).toBeInTheDocument()

        expect(
            within(dialog).getByLabelText(
                'Collection',
            ),
        ).toHaveAttribute(
            'aria-invalid',
            'true',
        )
    })

    it('adds the current book directly with notes', async () => {
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

        const onClose = vi.fn()

        renderDialog({
            onClose,
        })

        const dialog =
            await screen.findByRole('dialog', {
                name: 'Add to Collection',
            })

        fireEvent.change(
            within(dialog).getByLabelText(
                'Collection',
            ),
            {
                target: {
                    value: 'collection-2',
                },
            },
        )

        fireEvent.change(
            within(dialog).getByLabelText('Notes'),
            {
                target: {
                    value:
                        '  Read this again next winter  ',
                },
            },
        )

        fireEvent.click(
            within(dialog).getByRole('button', {
                name: 'Add to Collection',
            }),
        )

        await waitFor(() => {
            expect(
                addMutate,
            ).toHaveBeenCalledWith(
                {
                    collectionId:
                        'collection-2',
                    collectionBook: {
                        book_id: 'book-1',
                        notes:
                            'Read this again next winter',
                    },
                },
                expect.any(Object),
            )
        })

        expect(
            onClose,
        ).toHaveBeenCalledTimes(1)
    })

    it('omits blank membership notes', async () => {
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

        renderDialog()

        const dialog =
            await screen.findByRole('dialog', {
                name: 'Add to Collection',
            })

        fireEvent.change(
            within(dialog).getByLabelText(
                'Collection',
            ),
            {
                target: {
                    value: 'collection-1',
                },
            },
        )

        fireEvent.change(
            within(dialog).getByLabelText('Notes'),
            {
                target: {
                    value: '   ',
                },
            },
        )

        fireEvent.click(
            within(dialog).getByRole('button', {
                name: 'Add to Collection',
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
                    },
                },
                expect.any(Object),
            )
        })
    })

    it('cancels without adding the book', async () => {
        const onClose = vi.fn()

        renderDialog({
            onClose,
        })

        const dialog =
            await screen.findByRole('dialog', {
                name: 'Add to Collection',
            })

        fireEvent.click(
            within(dialog).getByRole('button', {
                name: 'Cancel',
            }),
        )

        expect(
            onClose,
        ).toHaveBeenCalledTimes(1)
    })

    it('surfaces duplicate 409 errors honestly', async () => {
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

        renderDialog()

        const dialog =
            await screen.findByRole('dialog', {
                name: 'Add to Collection',
            })

        fireEvent.change(
            within(dialog).getByLabelText(
                'Collection',
            ),
            {
                target: {
                    value: 'collection-1',
                },
            },
        )

        fireEvent.click(
            within(dialog).getByRole('button', {
                name: 'Add to Collection',
            }),
        )

        await waitFor(() => {
            expect(
                within(dialog).getByRole(
                    'alert',
                ),
            ).toHaveTextContent(
                'Book is already in this collection',
            )
        })

        expect(
            within(dialog).getByLabelText(
                'Collection',
            ),
        ).toHaveValue('collection-1')
    })

    it('provides inline collection creation when none exist', async () => {
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

        renderDialog()

        const dialog =
            await screen.findByRole('dialog', {
                name: 'Add to Collection',
            })

        expect(
            within(dialog).getByText(
                /do not have any collections yet/i,
            ),
        ).toBeInTheDocument()

        expect(
            within(dialog).getByRole('heading', {
                name: 'Create a collection',
            }),
        ).toBeInTheDocument()

        expect(
            within(dialog).getByLabelText('Name'),
        ).toBeInTheDocument()

        expect(
            within(dialog).getByRole('button', {
                name: 'Create Collection',
            }),
        ).toBeEnabled()

        expect(
            within(dialog).queryByLabelText(
                'Collection',
            ),
        ).not.toBeInTheDocument()
    })

    it('disables form controls while add is pending', async () => {
        mockUseAddCollectionBook.mockReturnValue({
            mutate: vi.fn(),
            isPending: true,
        } as unknown as ReturnType<
            typeof useAddCollectionBook
        >)

        renderDialog()

        const dialog =
            await screen.findByRole('dialog', {
                name: 'Add to Collection',
            })

        expect(
            within(dialog).getByLabelText(
                'Collection',
            ),
        ).toBeDisabled()

        expect(
            within(dialog).getByLabelText(
                'Notes',
            ),
        ).toBeDisabled()

        expect(
            within(dialog).getByRole('button', {
                name: 'Adding…',
            }),
        ).toBeDisabled()

        expect(
            within(dialog).getByRole('button', {
                name: 'Cancel',
            }),
        ).toBeDisabled()
    })

    it('shows loading and retryable collection errors', async () => {
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
        } = renderDialog()

        expect(
            await screen.findByText(
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

        renderDialog()

        const dialog =
            await screen.findByRole('dialog', {
                name: 'Add to Collection',
            })

        fireEvent.click(
            within(dialog).getByRole('button', {
                name: 'Retry',
            }),
        )

        expect(
            refetch,
        ).toHaveBeenCalled()
    })

    it('surfaces collection validation errors from 422 responses', async () => {
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
                            kind: 'validation',
                            status: 422,
                            message:
                                'Validation failed.',
                            fieldErrors: [
                                {
                                    field:
                                        'collection_id',
                                    message:
                                        'Choose a valid collection.',
                                },
                            ],
                        }),
                    )
                },
            ),
            isPending: false,
        } as unknown as ReturnType<
            typeof useAddCollectionBook
        >)

        renderDialog()

        const dialog =
            await screen.findByRole('dialog', {
                name: 'Add to Collection',
            })

        fireEvent.change(
            within(dialog).getByLabelText(
                'Collection',
            ),
            {
                target: {
                    value: 'collection-1',
                },
            },
        )

        fireEvent.click(
            within(dialog).getByRole('button', {
                name: 'Add to Collection',
            }),
        )

        await waitFor(() => {
            expect(
                within(dialog).getByText(
                    'Choose a valid collection.',
                ),
            ).toBeInTheDocument()
        })

        expect(
            within(dialog).getByLabelText(
                'Collection',
            ),
        ).toHaveAttribute(
            'aria-invalid',
            'true',
        )
    })

    it('surfaces unexpected add failures', async () => {
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
                            status: 500,
                            message:
                                'Internal server error',
                            detail:
                                'The collection service is unavailable.',
                        }),
                    )
                },
            ),
            isPending: false,
        } as unknown as ReturnType<
            typeof useAddCollectionBook
        >)

        renderDialog()

        const dialog =
            await screen.findByRole('dialog', {
                name: 'Add to Collection',
            })

        fireEvent.change(
            within(dialog).getByLabelText(
                'Collection',
            ),
            {
                target: {
                    value: 'collection-1',
                },
            },
        )

        fireEvent.click(
            within(dialog).getByRole('button', {
                name: 'Add to Collection',
            }),
        )

        await waitFor(() => {
            expect(
                within(dialog).getByRole('alert'),
            ).toHaveTextContent(
                'The collection service is unavailable.',
            )
        })
    })

    it('clears collection validation after choosing a collection', async () => {
        renderDialog()

        const dialog =
            await screen.findByRole('dialog', {
                name: 'Add to Collection',
            })

        fireEvent.click(
            within(dialog).getByRole('button', {
                name: 'Add to Collection',
            }),
        )

        expect(
            within(dialog).getByText(
                'Choose a collection.',
            ),
        ).toBeInTheDocument()

        fireEvent.change(
            within(dialog).getByLabelText(
                'Collection',
            ),
            {
                target: {
                    value: 'collection-1',
                },
            },
        )

        expect(
            within(dialog).queryByText(
                'Choose a collection.',
            ),
        ).not.toBeInTheDocument()

        expect(
            within(dialog).getByLabelText(
                'Collection',
            ),
        ).not.toHaveAttribute(
            'aria-invalid',
            'true',
        )
    })

    it('does not expose the dialog when closed', () => {
        renderDialog({
            open: false,
        })

        expect(
            screen.queryByRole('dialog', {
                name: 'Add to Collection',
            }),
        ).not.toBeInTheDocument()
    })

    it('surfaces unexpected non-API errors', async () => {
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
                        new Error(
                            'Something went wrong locally.',
                        ),
                    )
                },
            ),
            isPending: false,
        } as unknown as ReturnType<
            typeof useAddCollectionBook
        >)

        renderDialog()

        const dialog =
            await screen.findByRole('dialog', {
                name: 'Add to Collection',
            })

        fireEvent.change(
            within(dialog).getByLabelText(
                'Collection',
            ),
            {
                target: {
                    value: 'collection-1',
                },
            },
        )

        fireEvent.click(
            within(dialog).getByRole('button', {
                name: 'Add to Collection',
            }),
        )

        await waitFor(() => {
            expect(
                within(dialog).getByRole('alert'),
            ).toHaveTextContent(
                'Something went wrong locally.',
            )
        })
    })
})
