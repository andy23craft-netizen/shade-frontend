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
    AuthorRead,
    BookRead,
    WishlistBookRead,
    WishlistList,
} from '../../../api/apiTypes'
import {
    useCreateBook,
    useLookupBook,
} from '../../../api/booksQueries'
import {
    useAuthors,
    useCreateAuthor,
} from '../../../api/authorsQueries'
import {
    useAddWishlistBook,
    useWishlists,
} from '../../../api/wishlistsQueries'
import {
    AddWishlistBookControl,
} from './AddWishlistBookControl'

vi.mock('../../../api/booksQueries', () => ({
    useCreateBook: vi.fn(),
    useLookupBook: vi.fn(),
}))

vi.mock('../../../api/authorsQueries', () => ({
    useAuthors: vi.fn(),
    useCreateAuthor: vi.fn(),
}))

vi.mock('../../../api/wishlistsQueries', () => ({
    useWishlists: vi.fn(),
    useAddWishlistBook: vi.fn(),
}))
vi.mock(
    '../../scanning/IsbnCameraScanner',
    () => ({
        IsbnCameraScanner: ({
                                onDetected,
                                onCancel,
                            }: {
            onDetected: (isbn: string) => void
            onCancel: () => void
        }) => (
            <div data-testid="isbn-camera-scanner">
                <button
                    type="button"
                    onClick={() => {
                        onDetected('9780441172719')
                    }}
                >
                    Detect ISBN
                </button>

                <button
                    type="button"
                    onClick={onCancel}
                >
                    Cancel Scanner
                </button>
            </div>
        ),
    }),
)

const mockUseCreateBook = vi.mocked(useCreateBook)
const mockUseAuthors = vi.mocked(useAuthors)
const mockUseCreateAuthor = vi.mocked(
    useCreateAuthor,
)
const mockUseLookupBook = vi.mocked(useLookupBook)
const mockUseWishlists = vi.mocked(useWishlists)
const mockUseAddWishlistBook = vi.mocked(
    useAddWishlistBook,
)

const wishlists: WishlistList = {
    items: [
        {
            wishlist_id: 'wishlist-1',
            name: 'TBR',
            description: null,
            created_date: '2026-08-01T00:00:00Z',
            last_updated_date: '2026-08-01T00:00:00Z',
        },
    ],
    total: 1,
}


const authors: AuthorRead[] = [
    {
        author_id: 'author-an-author',
        first_name: 'An',
        surname: 'Author',
        created_date: '2026-08-01T00:00:00Z',
        updated_date: '2026-08-01T00:00:00Z',
    },
]

const createdBook: BookRead = {
    id: 'book-99',
    title: 'A Book',
    authors: [
        {
            author_id: 'author-an-author',
            first_name: 'An',
            surname: 'Author',
        },
    ],
    categories: [],
    shelf_name: 'unknown',
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
    creation_date: '2026-08-18T00:00:00Z',
    updated_date: '2026-08-18T00:00:00Z',
}

const membership: WishlistBookRead = {
    wishlist_book_id: 'membership-1',
    wishlist_id: 'wishlist-1',
    book_id: 'book-99',
    book_title: 'A Book',
    book_status: 'available',
    status: 'wanted',
    priority: null,
    notes: null,
    url: null,
    created_date: '2026-08-18T00:00:00Z',
}

function mockQuerySuccess() {
    mockUseAuthors.mockReturnValue({
        isPending: false,
        isError: false,
        isSuccess: true,
        data: {
            items: authors,
            total: authors.length,
        },
        refetch: vi.fn(),
    } as unknown as ReturnType<typeof useAuthors>)

    mockUseCreateAuthor.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
    } as unknown as ReturnType<typeof useCreateAuthor>)

    mockUseWishlists.mockReturnValue({
        isPending: false,
        isError: false,
        isSuccess: true,
        data: wishlists,
        refetch: vi.fn(),
    } as unknown as ReturnType<typeof useWishlists>)

    mockUseLookupBook.mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
    } as unknown as ReturnType<typeof useLookupBook>)

    mockUseCreateBook.mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
    } as unknown as ReturnType<typeof useCreateBook>)

    mockUseAddWishlistBook.mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
    } as unknown as ReturnType<
        typeof useAddWishlistBook
    >)
}

function renderControl() {
    return render(
        <MemoryRouter
            initialEntries={['/wishlists']}
        >
            <AddWishlistBookControl />
        </MemoryRouter>,
    )
}

describe('AddWishlistBookControl', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockQuerySuccess()
    })

    it('points at the create form when no wishlists exist', () => {
        mockUseWishlists.mockReturnValue({
            isPending: false,
            isError: false,
            isSuccess: true,
            data: {
                items: [],
                total: 0,
            },
            refetch: vi.fn(),
        } as unknown as ReturnType<typeof useWishlists>)

        mockUseCreateBook.mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        } as unknown as ReturnType<typeof useCreateBook>)

        mockUseAddWishlistBook.mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        } as unknown as ReturnType<
            typeof useAddWishlistBook
        >)

        renderControl()

        expect(
            screen.getByText(
                /Create a wishlist before adding/,
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('link', {
                name: 'Create a wishlist',
            }),
        ).toHaveAttribute(
            'href',
            '/wishlists#create-wishlist',
        )
    })

    it('creates an unshelved catalog row then adds membership', async () => {
        const createMutate = vi.fn(
            (
                book: unknown,
                options: {
                    onSuccess?: (
                        result: BookRead,
                    ) => void
                },
            ) => {
                options.onSuccess?.(createdBook)
            },
        )

        const addMutate = vi.fn(
            (
                _variables: unknown,
                options: {
                    onSuccess?: (
                        result: WishlistBookRead,
                    ) => void
                },
            ) => {
                options.onSuccess?.(membership)
            },
        )

        mockUseCreateBook.mockReturnValue({
            mutate: createMutate,
            isPending: false,
        } as unknown as ReturnType<typeof useCreateBook>)

        mockUseAddWishlistBook.mockReturnValue({
            mutate: addMutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useAddWishlistBook
        >)

        renderControl()

        fireEvent.change(
            screen.getByLabelText('Title'),
            {
                target: {
                    value: 'A Book',
                },
            },
        )
        fireEvent.change(
            screen.getByLabelText('Authors'),
            {
                target: {
                    value: 'An Author',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Add Book to Wishlist',
            }),
        )

        await waitFor(() => {
            expect(createMutate).toHaveBeenCalled()
        })

        const createPayload = createMutate.mock
            .calls[0]?.[0] as Record<string, unknown>

        expect(createPayload).toMatchObject({
            title: 'A Book',
            author_ids: ['author-an-author'],
            category_ids: [],
            is_read: false,
            status: 'available',
        })
        expect(createPayload).not.toHaveProperty(
            'shelf_name',
        )

        expect(addMutate).toHaveBeenCalledWith(
            {
                wishlistId: 'wishlist-1',
                wishlistBook: {
                    book_id: 'book-99',
                    status: 'wanted',
                },
            },
            expect.any(Object),
        )

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'Book added to the wishlist.',
        )
    })

    it('surfaces 412 exclusivity errors without retrying with a shelf', async () => {
        const createMutate = vi.fn(
            (
                _book: unknown,
                options: {
                    onSuccess?: (
                        result: BookRead,
                    ) => void
                },
            ) => {
                options.onSuccess?.(createdBook)
            },
        )

        const addMutate = vi.fn(
            (
                _variables: unknown,
                options: {
                    onError?: (error: unknown) => void
                },
            ) => {
                options.onError?.(
                    new ApiError({
                        kind: 'http',
                        status: 412,
                        message:
                            'Existing books cannot be added to a wishlist',
                        detail:
                            'Existing books cannot be added to a wishlist',
                    }),
                )
            },
        )

        mockUseCreateBook.mockReturnValue({
            mutate: createMutate,
            isPending: false,
        } as unknown as ReturnType<typeof useCreateBook>)

        mockUseAddWishlistBook.mockReturnValue({
            mutate: addMutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useAddWishlistBook
        >)

        renderControl()

        fireEvent.change(
            screen.getByLabelText('Title'),
            {
                target: {
                    value: 'A Book',
                },
            },
        )
        fireEvent.change(
            screen.getByLabelText('Authors'),
            {
                target: {
                    value: 'An Author',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Add Book to Wishlist',
            }),
        )

        await waitFor(() => {
            expect(
                screen.getByRole('alert'),
            ).toHaveTextContent(
                'Existing books cannot be added to a wishlist',
            )
        })

        expect(createMutate.mock.calls[0]?.[0])
            .not.toHaveProperty('shelf_name')
    })

    it('refetches wishlists after a 404 add failure', async () => {
        const refetch = vi.fn()

        mockUseWishlists.mockReturnValue({
            isPending: false,
            isError: false,
            isSuccess: true,
            data: wishlists,
            refetch,
        } as unknown as ReturnType<typeof useWishlists>)

        const createMutate = vi.fn(
            (
                _book: unknown,
                options: {
                    onSuccess?: (
                        result: BookRead,
                    ) => void
                },
            ) => {
                options.onSuccess?.(createdBook)
            },
        )

        mockUseCreateBook.mockReturnValue({
            mutate: createMutate,
            isPending: false,
        } as unknown as ReturnType<typeof useCreateBook>)

        mockUseAddWishlistBook.mockReturnValue({
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
                            message: 'Not found',
                        }),
                    )
                },
            ),
            isPending: false,
        } as unknown as ReturnType<
            typeof useAddWishlistBook
        >)

        renderControl()

        fireEvent.change(
            screen.getByLabelText('Title'),
            {
                target: {
                    value: 'A Book',
                },
            },
        )
        fireEvent.change(
            screen.getByLabelText('Authors'),
            {
                target: {
                    value: 'An Author',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Add Book to Wishlist',
            }),
        )

        await waitFor(() => {
            expect(refetch).toHaveBeenCalled()
        })

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            'could not be found',
        )
    })

    it('links 422 add errors to the status field', async () => {
        const createMutate = vi.fn(
            (
                _book: unknown,
                options: {
                    onSuccess?: (
                        result: BookRead,
                    ) => void
                },
            ) => {
                options.onSuccess?.(createdBook)
            },
        )

        mockUseCreateBook.mockReturnValue({
            mutate: createMutate,
            isPending: false,
        } as unknown as ReturnType<typeof useCreateBook>)

        mockUseAddWishlistBook.mockReturnValue({
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
                                    field: 'status',
                                    message:
                                        'Unsupported status.',
                                },
                            ],
                        }),
                    )
                },
            ),
            isPending: false,
        } as unknown as ReturnType<
            typeof useAddWishlistBook
        >)

        renderControl()

        fireEvent.change(
            screen.getByLabelText('Title'),
            {
                target: {
                    value: 'A Book',
                },
            },
        )
        fireEvent.change(
            screen.getByLabelText('Authors'),
            {
                target: {
                    value: 'An Author',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Add Book to Wishlist',
            }),
        )

        await waitFor(() => {
            expect(
                screen.getByText('Unsupported status.'),
            ).toBeInTheDocument()
        })

        expect(
            screen.getByLabelText('Status'),
        ).toHaveAttribute('aria-invalid', 'true')
    })

    it('disables controls while create or add is pending', () => {
        mockUseCreateBook.mockReturnValue({
            mutate: vi.fn(),
            isPending: true,
        } as unknown as ReturnType<typeof useCreateBook>)

        mockUseAddWishlistBook.mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        } as unknown as ReturnType<
            typeof useAddWishlistBook
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

    it('shows loading and retryable error states for wishlists', () => {
        mockUseWishlists.mockReturnValue({
            isPending: true,
            isError: false,
            isSuccess: false,
            data: undefined,
            refetch: vi.fn(),
        } as unknown as ReturnType<typeof useWishlists>)

        const { unmount } = renderControl()

        expect(
            screen.getByText('Loading wishlists…'),
        ).toBeInTheDocument()

        unmount()

        const refetch = vi.fn()

        mockUseWishlists.mockReturnValue({
            isPending: false,
            isError: true,
            isSuccess: false,
            data: undefined,
            refetch,
            error: new Error('failed'),
        } as unknown as ReturnType<typeof useWishlists>)

        renderControl()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Retry',
            }),
        )

        expect(refetch).toHaveBeenCalled()
    })

    it('looks up ISBN metadata and applies title and authors', async () => {
        const lookupMutate = vi.fn(
            (
                isbn: string,
                options: {
                    onSuccess?: (result: {
                        found: boolean
                        draft: {
                            title: string
                            authors: string
                            isbn13: string
                        } | null
                    }) => void
                },
            ) => {
                options.onSuccess?.({
                    found: true,
                    draft: {
                        title: 'Looked Up Title',
                        authors: 'Looked Up Author',
                        isbn13: isbn,
                    },
                })
            },
        )

        mockUseLookupBook.mockReturnValue({
            mutate: lookupMutate,
            isPending: false,
        } as unknown as ReturnType<typeof useLookupBook>)

        renderControl()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Look up ISBN',
            }),
        )

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'Enter an ISBN to look up.',
        )

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
                name: 'Look up ISBN',
            }),
        )

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'Enter a valid ISBN-10 or ISBN-13.',
        )

        fireEvent.change(
            screen.getByLabelText('ISBN'),
            {
                target: {
                    value: '9780441172719',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Look up ISBN',
            }),
        )

        await waitFor(() => {
            expect(
                screen.getByLabelText('Title'),
            ).toHaveValue('Looked Up Title')
        })

        expect(
            screen.getByLabelText('Authors'),
        ).toHaveValue('Looked Up Author')
    })

    it('keeps manual entry usable when lookup finds nothing or fails', async () => {
        const lookupMutate = vi.fn(
            (
                _isbn: string,
                options: {
                    onSuccess?: (result: {
                        found: boolean
                        draft: null
                    }) => void
                    onError?: (error: unknown) => void
                },
            ) => {
                options.onSuccess?.({
                    found: false,
                    draft: null,
                })
            },
        )

        mockUseLookupBook.mockReturnValue({
            mutate: lookupMutate,
            isPending: false,
        } as unknown as ReturnType<typeof useLookupBook>)

        renderControl()

        fireEvent.change(
            screen.getByLabelText('ISBN'),
            {
                target: {
                    value: '9780441172719',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Look up ISBN',
            }),
        )

        await waitFor(() => {
            expect(
                screen.getByRole('status'),
            ).toHaveTextContent(
                'No metadata was found',
            )
        })

        lookupMutate.mockImplementationOnce(
            (
                _isbn: string,
                options: {
                    onError?: (error: unknown) => void
                },
            ) => {
                options.onError?.(new Error('failed'))
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Look up ISBN',
            }),
        )

        await waitFor(() => {
            expect(
                screen.getByRole('status'),
            ).toHaveTextContent(
                'ISBN lookup failed',
            )
        })
    })

    it('maps create 422 errors and generic create failures', async () => {
        const createMutate = vi.fn(
            (
                _book: unknown,
                options: {
                    onError?: (error: unknown) => void
                },
            ) => {
                options.onError?.(
                    new ApiError({
                        kind: 'validation',
                        status: 422,
                        message: 'Validation failed.',
                        fieldErrors: [
                            {
                                field: 'title',
                                message: 'Invalid title.',
                            },
                        ],
                    }),
                )
            },
        )

        mockUseCreateBook.mockReturnValue({
            mutate: createMutate,
            isPending: false,
        } as unknown as ReturnType<typeof useCreateBook>)

        renderControl()

        fireEvent.change(
            screen.getByLabelText('Title'),
            {
                target: {
                    value: 'A Book',
                },
            },
        )
        fireEvent.change(
            screen.getByLabelText('Authors'),
            {
                target: {
                    value: 'An Author',
                },
            },
        )
        fireEvent.change(
            screen.getByLabelText('Status'),
            {
                target: {
                    value: 'ordered',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Add Book to Wishlist',
            }),
        )

        await waitFor(() => {
            expect(
                screen.getByText('Invalid title.'),
            ).toBeInTheDocument()
        })

        createMutate.mockImplementationOnce(
            (
                _book: unknown,
                options: {
                    onError?: (error: unknown) => void
                },
            ) => {
                options.onError?.(new Error('create failed'))
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Add Book to Wishlist',
            }),
        )

        await waitFor(() => {
            expect(
                screen.getByRole('alert'),
            ).toHaveTextContent('create failed')
        })
    })

    it('surfaces a generic add failure after a successful create', async () => {
        const createMutate = vi.fn(
            (
                _book: unknown,
                options: {
                    onSuccess?: (
                        result: BookRead,
                    ) => void
                },
            ) => {
                options.onSuccess?.(createdBook)
            },
        )

        mockUseCreateBook.mockReturnValue({
            mutate: createMutate,
            isPending: false,
        } as unknown as ReturnType<typeof useCreateBook>)

        mockUseAddWishlistBook.mockReturnValue({
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
                        new Error('add failed'),
                    )
                },
            ),
            isPending: false,
        } as unknown as ReturnType<
            typeof useAddWishlistBook
        >)

        renderControl()

        fireEvent.change(
            screen.getByLabelText('Title'),
            {
                target: {
                    value: 'A Book',
                },
            },
        )
        fireEvent.change(
            screen.getByLabelText('Authors'),
            {
                target: {
                    value: 'An Author',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Add Book to Wishlist',
            }),
        )

        await waitFor(() => {
            expect(
                screen.getByRole('alert'),
            ).toHaveTextContent(
                'add failed',
            )
        })
    })

    it('requires a wishlist when more than one exists', () => {
        mockUseWishlists.mockReturnValue({
            isPending: false,
            isError: false,
            isSuccess: true,
            data: {
                items: [
                    ...wishlists.items,
                    {
                        wishlist_id: 'wishlist-2',
                        name: 'Later',
                        description: null,
                        created_date:
                            '2026-08-02T00:00:00Z',
                        last_updated_date:
                            '2026-08-02T00:00:00Z',
                    },
                ],
                total: 2,
            },
            refetch: vi.fn(),
        } as unknown as ReturnType<typeof useWishlists>)

        renderControl()

        fireEvent.change(
            screen.getByLabelText('Title'),
            {
                target: {
                    value: 'A Book',
                },
            },
        )
        fireEvent.change(
            screen.getByLabelText('Authors'),
            {
                target: {
                    value: 'An Author',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Add Book to Wishlist',
            }),
        )

        expect(
            screen.getByText('Choose a wishlist.'),
        ).toBeInTheDocument()

        fireEvent.change(
            screen.getByLabelText('Wishlist'),
            {
                target: {
                    value: 'wishlist-2',
                },
            },
        )

        expect(
            screen.getByLabelText('Wishlist'),
        ).toHaveValue('wishlist-2')
    })

    it('hands a camera-scanned ISBN into the existing lookup flow', async () => {
        const lookupMutate = vi.fn(
            (
                isbn: string,
                options: {
                    onSuccess?: (result: {
                        found: boolean
                        draft: {
                            title: string
                            authors: string
                        } | null
                    }) => void
                },
            ) => {
                options.onSuccess?.({
                    found: true,
                    draft: {
                        title: 'Dune',
                        authors: 'Frank Herbert',
                    },
                })
            },
        )

        mockUseLookupBook.mockReturnValue({
            mutate: lookupMutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useLookupBook
        >)

        renderControl()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Scan ISBN',
            }),
        )

        expect(
            await screen.findByTestId(
                'isbn-camera-scanner',
            ),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Detect ISBN',
            }),
        )

        expect(
            lookupMutate,
        ).toHaveBeenCalledWith(
            '9780441172719',
            expect.any(Object),
        )

        expect(
            screen.getByLabelText('ISBN'),
        ).toHaveValue('9780441172719')

        expect(
            screen.getByLabelText('Title'),
        ).toHaveValue('Dune')

        expect(
            screen.getByLabelText('Authors'),
        ).toHaveValue('Frank Herbert')

        expect(
            screen.queryByTestId(
                'isbn-camera-scanner',
            ),
        ).not.toBeInTheDocument()
    })

    it('closes the camera scanner without changing the form when cancelled', async () => {
        renderControl()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Scan ISBN',
            }),
        )

        expect(
            await screen.findByTestId(
                'isbn-camera-scanner',
            ),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Cancel Scanner',
            }),
        )

        expect(
            screen.queryByTestId(
                'isbn-camera-scanner',
            ),
        ).not.toBeInTheDocument()

        expect(
            screen.getByLabelText('ISBN'),
        ).toHaveValue('')
    })
})
