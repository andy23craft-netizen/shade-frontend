import {
    fireEvent,
    render,
    screen,
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
    WishlistBookList,
    WishlistBookStatus,
    WishlistList,
    WishlistRead,
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
    useCreateWishlist,
    useDeleteWishlist,
    useInfiniteWishlistBooks,
    useWishlists,
} from '../../../api/wishlistsQueries'
import {
    WishlistsPage,
} from './WishlistsPage'

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
    useInfiniteWishlistBooks: vi.fn(),
    useCreateWishlist: vi.fn(),
    useDeleteWishlist: vi.fn(),
    useAddWishlistBook: vi.fn(),
}))
vi.mock(
    '../components/MoveWishlistBookToShelfControl',
    () => ({
        MoveWishlistBookToShelfControl: ({
                                             wishlistId,
                                             wishlistBookId,
                                             bookId,
                                             bookTitle,
                                         }: {
            wishlistId: string
            wishlistBookId: string
            bookId: string
            bookTitle: string
        }) => (
            <div
                data-testid="move-wishlist-book"
                data-wishlist-id={wishlistId}
                data-membership-id={wishlistBookId}
                data-book-id={bookId}
                data-book-title={bookTitle}
            />
        ),
    }),
)
vi.mock(
    '../components/MoveWishlistBookControl',
    () => ({
        MoveWishlistBookControl: ({
                                      sourceWishlistId,
                                      membership,
                                      bookTitle,
                                  }: {
            sourceWishlistId: string
            membership: {
                wishlist_book_id: string
                wishlist_id: string
                book_id: string
                status: string
                priority: number | null
                notes?: string | null
                url?: string | null
                created_date: string
            }
            bookTitle: string
        }) => (
            <div
                data-testid="move-wishlist-book-to-wishlist"
                data-source-wishlist-id={
                    sourceWishlistId
                }
                data-membership-id={
                    membership.wishlist_book_id
                }
                data-book-id={
                    membership.book_id
                }
                data-status={
                    membership.status
                }
                data-priority={
                    membership.priority ?? ''
                }
                data-notes={
                    membership.notes ?? ''
                }
                data-url={
                    membership.url ?? ''
                }
                data-book-title={
                    bookTitle
                }
            />
        ),
    }),
)
vi.mock(
    '../../../hooks/useInfiniteScrollTrigger',
    () => ({
        useInfiniteScrollTrigger: () => ({
            getRowRef: () => undefined,
        }),
    }),
)

const mockUseAuthors = vi.mocked(useAuthors)
const mockUseCreateAuthor = vi.mocked(
    useCreateAuthor,
)
const mockUseCreateBook = vi.mocked(useCreateBook)
const mockUseLookupBook = vi.mocked(useLookupBook)
const mockUseWishlists = vi.mocked(useWishlists)
const mockUseCreateWishlist = vi.mocked(
    useCreateWishlist,
)
const mockUseDeleteWishlist = vi.mocked(
    useDeleteWishlist,
)
const mockUseAddWishlistBook = vi.mocked(useAddWishlistBook)
const mockUseInfiniteWishlistBooks =
    vi.mocked(useInfiniteWishlistBooks)

const sampleWishlist: WishlistRead = {
    wishlist_id: 'wishlist-1',
    name: 'TBR',
    description: 'To be read',
    created_date: '2026-08-01T00:00:00Z',
    last_updated_date: '2026-08-01T00:00:00Z',
}

const wishlists: WishlistList = {
    items: [sampleWishlist],
    total: 1,
}

const memberships: WishlistBookList = {
    items: [
        {
            wishlist_book_id: 'membership-1',
            wishlist_id: 'wishlist-1',
            book_id: 'book-1',
            book_title: 'The Dispossessed',
            book_authors: [
                {
                    author_id: 'author-ursula-le-guin',
                    first_name: 'Ursula K.',
                    surname: 'Le Guin',
                },
            ],
            book_status: 'available',
            status: 'wanted',
            priority: 2,
            notes: 'Hardcover if possible',
            url: 'https://example.com/book',
            created_date: '2026-08-02T00:00:00Z',
        },
        {
            wishlist_book_id: 'membership-2',
            wishlist_id: 'wishlist-1',
            book_id: 'missing-book',
            book_title: 'Book missing-book',
            book_status: 'unknown',
            status: 'mystery' as WishlistBookStatus,
            priority: null,
            notes: null,
            url: 'javascript:alert(1)',
            created_date: '2026-08-03T00:00:00Z',
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

function mockIdleWrites() {
    mockUseCreateBook.mockReturnValue(
        idleMutation() as unknown as ReturnType<
            typeof useCreateBook
        >,
    )
    mockUseLookupBook.mockReturnValue(
        idleMutation() as unknown as ReturnType<
            typeof useLookupBook
        >,
    )
    mockUseCreateWishlist.mockReturnValue(
        idleMutation() as unknown as ReturnType<
            typeof useCreateWishlist
        >,
    )
    mockUseDeleteWishlist.mockReturnValue(
        idleMutation() as unknown as ReturnType<
            typeof useDeleteWishlist
        >,
    )
    mockUseAddWishlistBook.mockReturnValue(
        idleMutation() as unknown as ReturnType<
            typeof useAddWishlistBook
        >,
    )
    mockUseInfiniteWishlistBooks.mockReturnValue({
        data: {
            pages: [
                memberships,
            ],
            pageParams: [
                0,
            ],
        },
        isPending: false,
        isLoadingError: false,
        isSuccess: true,
        isFetchingNextPage: false,
        isFetchNextPageError: false,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        refetch: vi.fn(),
        error: null,
    } as unknown as ReturnType<
        typeof useInfiniteWishlistBooks
    >)
}

function renderPage() {
    return render(
        <MemoryRouter
            initialEntries={['/wishlists']}
        >
            <WishlistsPage />
        </MemoryRouter>,
    )
}

describe('WishlistsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockIdleWrites()

        mockUseAuthors.mockReturnValue({
            isPending: false,
            isError: false,
            isSuccess: true,
            data: {
                items: [
                    {
                        author_id: 'author-an-author',
                        first_name: 'An',
                        surname: 'Author',
                        created_date: '2026-08-01T00:00:00Z',
                        updated_date: '2026-08-01T00:00:00Z',
                    },
                ],
                total: 1,
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
            error: null,
        } as unknown as ReturnType<typeof useWishlists>)


    })

    it('shows a loading state while wishlists load', () => {
        mockUseWishlists.mockReturnValue({
            isPending: true,
            isError: false,
            isSuccess: false,
            data: undefined,
            refetch: vi.fn(),
            error: null,
        } as unknown as ReturnType<typeof useWishlists>)

        renderPage()

        expect(
            screen.getByText('Loading wishlists…'),
        ).toBeInTheDocument()
    })

    it('shows a retryable error when wishlists fail to load', () => {
        const refetch = vi.fn()

        mockUseWishlists.mockReturnValue({
            isPending: false,
            isError: true,
            isSuccess: false,
            data: undefined,
            refetch,
            error: new ApiError({
                kind: 'unreachable',
                message: 'The API could not be reached',
            }),
        } as unknown as ReturnType<typeof useWishlists>)

        renderPage()

        expect(
            screen.getByText('Unable to load wishlists'),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Retry',
            }),
        )

        expect(refetch).toHaveBeenCalled()
    })

    it('shows an empty state when there are no wishlists', () => {
        mockUseWishlists.mockReturnValue({
            isPending: false,
            isError: false,
            isSuccess: true,
            data: {
                items: [],
                total: 0,
            },
            refetch: vi.fn(),
            error: null,
        } as unknown as ReturnType<typeof useWishlists>)

        renderPage()

        expect(
            screen.getByText('No wishlists yet'),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                /Create a wishlist before adding/,
            ),
        ).toBeInTheDocument()
    })

    it('creates a wishlist from the page form', () => {
        const mutate = vi.fn()

        mockUseCreateWishlist.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useCreateWishlist
        >)

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Manage wishlists',
            }),
        )

        fireEvent.change(
            screen.getByLabelText('Name'),
            {
                target: {
                    value: 'Later',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Create Wishlist',
            }),
        )

        expect(mutate).toHaveBeenCalledWith(
            {
                name: 'Later',
                description: null,
            },
            expect.any(Object),
        )
    })

    it('renders enriched membership identity without per-book detail requests', () => {
        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Expand',
            }),
        )

        expect(
            screen.getByRole('heading', {
                name: 'TBR',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByText('2 books'),
        ).toBeInTheDocument()

        const foundLink = screen.getByRole('link', {
            name: 'The Dispossessed',
        })

        expect(foundLink).toHaveAttribute(
            'href',
            '/books/book-1',
        )
        expect(
            screen.getByText('Ursula K. Le Guin'),
        ).toBeInTheDocument()
        expect(screen.getByText('Wanted')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument()
        expect(
            screen.getByText('Hardcover if possible'),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('link', {
                name: 'https://example.com/book',
            }),
        ).toHaveAttribute(
            'href',
            'https://example.com/book',
        )

        expect(
            screen.getByRole('link', {
                name: 'Book missing-book',
            }),
        ).toHaveAttribute(
            'href',
            '/books/missing-book',
        )
        expect(
            screen.getByText('mystery (unknown)'),
        ).toBeInTheDocument()
        expect(screen.getByText('—')).toBeInTheDocument()
        expect(
            screen.queryByRole('link', {
                name: 'javascript:alert(1)',
            }),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByRole('button', {
                name: /remove/i,
            }),
        ).not.toBeInTheDocument()
    })

    it('shows distinct empty-membership copy', () => {

        mockUseInfiniteWishlistBooks.mockReturnValue({
            data: {
                pages: [
                    {
                        items: [],
                        total: 0,
                    },
                ],
                pageParams: [0],
            },
            isPending: false,
            isLoadingError: false,
            isSuccess: true,
            isFetchingNextPage: false,
            isFetchNextPageError: false,
            hasNextPage: false,
            fetchNextPage: vi.fn(),
            refetch: vi.fn(),
            error: null,
        } as unknown as ReturnType<
            typeof useInfiniteWishlistBooks
        >)

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Expand',
            }),
        )

        expect(
            screen.getByText(
                'No books have been added to this wishlist yet.',
            ),
        ).toBeInTheDocument()
    })

    it('omits shelf_name when adding a book from the page', () => {
        const createMutate = vi.fn()

        mockUseCreateBook.mockReturnValue({
            mutate: createMutate,
            isPending: false,
        } as unknown as ReturnType<typeof useCreateBook>)

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Manage wishlists',
            }),
        )

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

        expect(createMutate).toHaveBeenCalled()

        const payload = createMutate.mock
            .calls[0]?.[0] as Record<string, unknown>

        expect(payload).not.toHaveProperty(
            'shelf_name',
        )
        expect(payload).toMatchObject({
            title: 'A Book',
            author_ids: [
                'author-an-author',
            ],
        })
    })

    it('confirms permanent wishlist delete without inventing membership delete', () => {
        const mutate = vi.fn()

        mockUseDeleteWishlist.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useDeleteWishlist
        >)

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Delete Wishlist',
            }),
        )

        const dialog = screen.getByRole('dialog')

        expect(dialog).toHaveTextContent(
            'catalog books remain',
        )

        fireEvent.click(
            within(dialog).getByRole('button', {
                name: 'Delete Wishlist',
            }),
        )

        expect(mutate).toHaveBeenCalledWith(
            'wishlist-1',
            expect.any(Object),
        )
    })

    it('shows membership loading and retryable errors without blocking the page', () => {
        const refetch = vi.fn()

        mockUseInfiniteWishlistBooks.mockReturnValue({
            data: undefined,
            isPending: true,
            isLoadingError: false,
            isSuccess: false,
            isFetchingNextPage: false,
            isFetchNextPageError: false,
            hasNextPage: false,
            fetchNextPage: vi.fn(),
            refetch: vi.fn(),
            error: null,
        } as unknown as ReturnType<
            typeof useInfiniteWishlistBooks
        >)

        const {
            unmount,
        } = renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Expand',
            }),
        )

        expect(
            screen.getByText('Loading TBR…'),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('heading', {
                name: 'TBR',
            }),
        ).toBeInTheDocument()

        unmount()

        mockUseInfiniteWishlistBooks.mockReturnValue({
            data: undefined,
            isPending: false,
            isLoadingError: true,
            isSuccess: false,
            isFetchingNextPage: false,
            isFetchNextPageError: false,
            hasNextPage: false,
            fetchNextPage: vi.fn(),
            refetch,
            error: new ApiError({
                kind: 'unreachable',
                message: 'The API could not be reached',
            }),
        } as unknown as ReturnType<
            typeof useInfiniteWishlistBooks
        >)

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Expand',
            }),
        )

        expect(
            screen.getByText(
                'Unable to load TBR',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('heading', {
                name: 'TBR',
            }),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Retry',
            }),
        )

        expect(refetch).toHaveBeenCalled()
    })
    it('links create 422 errors to the name field', () => {
        const mutate = vi.fn(
            (
                _body: unknown,
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
                                field: 'name',
                                message: 'Name too long.',
                            },
                        ],
                    }),
                )
            },
        )

        mockUseCreateWishlist.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useCreateWishlist
        >)

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Manage wishlists',
            }),
        )

        fireEvent.change(
            screen.getByLabelText('Name'),
            {
                target: {
                    value: 'Later',
                },
            },
        )
        fireEvent.change(
            screen.getByLabelText('Description'),
            {
                target: {
                    value: 'Notes',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Create Wishlist',
            }),
        )

        expect(
            screen.getByText('Name too long.'),
        ).toBeInTheDocument()
        expect(
            screen.getByLabelText('Name'),
        ).toHaveAttribute('aria-invalid', 'true')
    })

    it('rejects a blank wishlist name without calling the API', () => {
        const mutate = vi.fn()

        mockUseCreateWishlist.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useCreateWishlist
        >)

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Manage wishlists',
            }),
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Create Wishlist',
            }),
        )

        expect(mutate).not.toHaveBeenCalled()
        expect(
            screen.getByText(
                'Enter a name for the wishlist.',
            ),
        ).toBeInTheDocument()
    })

    it('closes the delete dialog on cancel and surfaces delete errors', () => {
        const mutate = vi.fn(
            (
                _id: string,
                options: {
                    onError?: (error: unknown) => void
                },
            ) => {
                options.onError?.(
                    new ApiError({
                        kind: 'http',
                        status: 404,
                        message: 'Not found',
                        detail: 'Not found',
                    }),
                )
            },
        )

        mockUseDeleteWishlist.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useDeleteWishlist
        >)

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Delete Wishlist',
            }),
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Cancel',
            }),
        )

        expect(mutate).not.toHaveBeenCalled()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Delete Wishlist',
            }),
        )

        fireEvent.click(
            within(screen.getByRole('dialog')).getByRole(
                'button',
                {
                    name: 'Delete Wishlist',
                },
            ),
        )

        expect(
            screen.getByText('Not found'),
        ).toBeInTheDocument()
    })

    it('clears pending delete after a successful deletion', () => {
        const mutate = vi.fn(
            (
                _id: string,
                options: {
                    onSuccess?: () => void
                },
            ) => {
                options.onSuccess?.()
            },
        )

        mockUseDeleteWishlist.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useDeleteWishlist
        >)

        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Delete Wishlist',
            }),
        )

        fireEvent.click(
            within(screen.getByRole('dialog')).getByRole(
                'button',
                {
                    name: 'Delete Wishlist',
                },
            ),
        )

        expect(mutate).toHaveBeenCalled()
        expect(
            screen.queryByRole('dialog'),
        ).not.toBeInTheDocument()
    })

    it('provides wishlist membership identity to the move control', () => {
        renderPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Expand',
            }),
        )

        const membershipRow =
            document.querySelector(
                '[data-membership-id="membership-1"]',
            )

        expect(membershipRow).not.toBeNull()

        const moveControl =
            within(
                membershipRow as HTMLElement,
            ).getByTestId(
                'move-wishlist-book',
            )

        expect(moveControl).toHaveAttribute(
            'data-wishlist-id',
            'wishlist-1',
        )

        expect(moveControl).toHaveAttribute(
            'data-membership-id',
            'membership-1',
        )

        expect(moveControl).toHaveAttribute(
            'data-book-id',
            'book-1',
        )

        expect(moveControl).toHaveAttribute(
            'data-book-title',
            'The Dispossessed',
        )
    })

    it('keeps wishlist memberships collapsed until explicitly expanded', () => {
        renderPage()

        expect(
            screen.queryByText('2 books'),
        ).not.toBeInTheDocument()

        expect(
            document.querySelector(
                '[data-membership-id="membership-1"]',
            ),
        ).toBeNull()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Expand',
            }),
        )

        expect(
            screen.getByText('2 books'),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'Collapse',
            }),
        ).toBeInTheDocument()
    })

    it('keeps only one wishlist expanded at a time', () => {
        mockUseWishlists.mockReturnValue({
            isPending: false,
            isError: false,
            isSuccess: true,
            data: {
                items: [
                    sampleWishlist,
                    {
                        wishlist_id: 'wishlist-2',
                        name: 'Fiction',
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
        } as unknown as ReturnType<
            typeof useWishlists
        >)

        renderPage()

        const expandButtons =
            screen.getAllByRole('button', {
                name: 'Expand',
            })

        expect(expandButtons).toHaveLength(2)

        fireEvent.click(expandButtons[0])

        expect(
            screen.getByRole('button', {
                name: 'Collapse',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getAllByRole('button', {
                name: 'Expand',
            }),
        ).toHaveLength(1)

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Expand',
            }),
        )

        expect(
            screen.getByRole('button', {
                name: 'Collapse',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getAllByRole('button', {
                name: 'Expand',
            }),
        ).toHaveLength(1)

        expect(
            screen.getByRole('heading', {
                name: 'Fiction',
            }),
        ).toBeInTheDocument()
    })
})
