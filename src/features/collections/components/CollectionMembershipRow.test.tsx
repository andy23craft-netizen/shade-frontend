import {
    fireEvent,
    render,
    screen,
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

import type {
    BookRead,
    CollectionBookRead,
} from '../../../api/apiTypes'
import {
    useBook,
} from '../../../api/booksQueries'
import {
    useRemoveCollectionBook,
    useReorderCollectionBook,
} from '../../../api/collectionsQueries'
import {
    CollectionMembershipRow,
} from './CollectionMembershipRow'

vi.mock('../../../api/booksQueries', () => ({
    useBook: vi.fn(),
}))

vi.mock('../../../api/collectionsQueries', () => ({
    useReorderCollectionBook: vi.fn(),
    useRemoveCollectionBook: vi.fn(),
}))

vi.mock(
    '../../books/components/BookCover',
    () => ({
        BookCover: ({
                        bookId,
                        title,
                    }: {
            bookId: string
            title: string
        }) => (
            <div
                data-testid="book-cover"
                data-book-id={bookId}
            >
                Cover for {title}
            </div>
        ),
    }),
)

const mockUseBook =
    vi.mocked(useBook)

const mockUseReorderCollectionBook =
    vi.mocked(useReorderCollectionBook)

const mockUseRemoveCollectionBook =
    vi.mocked(useRemoveCollectionBook)

const book: BookRead = {
    id: 'book-1',
    title: 'The Dispossessed',
    authors: 'Ursula K. Le Guin',
    categories: [{ category_id: 'cat-fiction', name: 'Fiction', slug: 'fiction' }],
    shelf_name: 'a1',
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
    order_num: 2,
    notes: 'Essential reading',
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

function mockBookSuccess(
    value: BookRead = book,
) {
    mockUseBook.mockReturnValue({
        isPending: false,
        isError: false,
        isSuccess: true,
        data: value,
        refetch: vi.fn(),
    } as unknown as ReturnType<
        typeof useBook
    >)
}

function renderRow(
    overrides: Partial<
        CollectionMembershipRowProps
    > = {},
) {
    return render(
        <MemoryRouter>
            <ul>
                <CollectionMembershipRow
                    collectionId="collection-1"
                    membership={membership}
                    isFirst={false}
                    isLast={false}
                    {...overrides}
                />
            </ul>
        </MemoryRouter>,
    )
}

interface CollectionMembershipRowProps {
    collectionId: string
    membership: CollectionBookRead
    isFirst: boolean
    isLast: boolean
}

describe('CollectionMembershipRow', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        mockBookSuccess()

        mockUseReorderCollectionBook.mockReturnValue(
            idleMutation() as unknown as ReturnType<
                typeof useReorderCollectionBook
            >,
        )

        mockUseRemoveCollectionBook.mockReturnValue(
            idleMutation() as unknown as ReturnType<
                typeof useRemoveCollectionBook
            >,
        )
    })

    it('renders title, authors, position, notes, and shelf location', () => {
        renderRow()

        expect(
            screen.getByRole('link', {
                name: 'The Dispossessed',
            }),
        ).toHaveAttribute(
            'href',
            '/books/book-1',
        )

        expect(
            screen.getByText(
                'Ursula K. Le Guin',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText(
                'Position 2',
            ),
        ).toHaveTextContent('2')

        expect(
            screen.getByText('A1'),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'Essential reading',
            ),
        ).toBeInTheDocument()

        const cover =
            screen.getByTestId('book-cover')

        expect(cover).toHaveAttribute(
            'data-book-id',
            'book-1',
        )

        expect(cover).toHaveTextContent(
            'Cover for The Dispossessed',
        )
    })

    it('shows Wishlist for a wishlisted membership', () => {
        renderRow({
            membership: {
                ...membership,
                shelf_name: null,
                on_wishlist: true,
            },
        })

        expect(
            screen.getByText('Wishlist'),
        ).toBeInTheDocument()

        expect(
            screen
                .getByText('Wishlist')
                .closest('li'),
        ).toHaveClass(
            'collection-membership--wishlist',
        )
    })

    it('shows an error row when the joined book cannot be loaded', () => {
        mockUseBook.mockReturnValue({
            isPending: false,
            isError: true,
            error: new Error('Book not found'),
        } as ReturnType<typeof useBook>)

        renderRow()

        expect(
            screen.getByText(
                'Book details could not be loaded.',
            ),
        ).toBeInTheDocument()
    })

    it('disables move up at the beginning', () => {
        renderRow({
            isFirst: true,
        })

        expect(
            screen.getByRole('button', {
                name: 'Move Up',
            }),
        ).toBeDisabled()

        expect(
            screen.getByRole('button', {
                name: 'Move Down',
            }),
        ).toBeEnabled()
    })

    it('disables move down at the end', () => {
        renderRow({
            isLast: true,
        })

        expect(
            screen.getByRole('button', {
                name: 'Move Down',
            }),
        ).toBeDisabled()

        expect(
            screen.getByRole('button', {
                name: 'Move Up',
            }),
        ).toBeEnabled()
    })

    it('moves a membership earlier', () => {
        const mutate = vi.fn()

        mockUseReorderCollectionBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useReorderCollectionBook
        >)

        renderRow()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Move Up',
            }),
        )

        expect(mutate).toHaveBeenCalledWith(
            {
                collectionId:
                    'collection-1',
                collectionBookId:
                    'membership-1',
                orderNum: 1,
            },
            expect.any(Object),
        )
    })

    it('moves a membership later', () => {
        const mutate = vi.fn()

        mockUseReorderCollectionBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useReorderCollectionBook
        >)

        renderRow()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Move Down',
            }),
        )

        expect(mutate).toHaveBeenCalledWith(
            {
                collectionId:
                    'collection-1',
                collectionBookId:
                    'membership-1',
                orderNum: 3,
            },
            expect.any(Object),
        )
    })

    it('confirms before removing membership', () => {
        const mutate = vi.fn()

        mockUseRemoveCollectionBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useRemoveCollectionBook
        >)

        renderRow()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Remove',
            }),
        )

        expect(
            screen.getByRole('dialog'),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                /catalog book will remain/i,
            ),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Remove Book',
            }),
        )

        expect(mutate).toHaveBeenCalledWith(
            {
                collectionId:
                    'collection-1',
                collectionBookId:
                    'membership-1',
            },
            expect.any(Object),
        )
    })

    it('disables row actions while a mutation is pending', () => {
        mockUseReorderCollectionBook.mockReturnValue({
            mutate: vi.fn(),
            isPending: true,
        } as unknown as ReturnType<
            typeof useReorderCollectionBook
        >)

        renderRow()

        expect(
            screen.getByRole('button', {
                name: 'Move Up',
            }),
        ).toBeDisabled()

        expect(
            screen.getByRole('button', {
                name: 'Move Down',
            }),
        ).toBeDisabled()

        expect(
            screen.getByRole('button', {
                name: 'Remove',
            }),
        ).toBeDisabled()
    })

    it('shows loading and retryable book errors', () => {
        mockUseBook.mockReturnValue({
            isPending: true,
            isError: false,
            isSuccess: false,
            data: undefined,
            refetch: vi.fn(),
        } as unknown as ReturnType<
            typeof useBook
        >)

        const {
            unmount,
        } = renderRow()

        expect(
            screen.getByText(
                'Loading collection book…',
            ),
        ).toBeInTheDocument()

        unmount()

        const refetch = vi.fn()

        mockUseBook.mockReturnValue({
            isPending: false,
            isError: true,
            isSuccess: false,
            data: undefined,
            error: new Error('failed'),
            refetch,
        } as unknown as ReturnType<
            typeof useBook
        >)

        renderRow()

        expect(
            screen.getByText('Book book-1'),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Retry',
            }),
        )

        expect(refetch).toHaveBeenCalled()
    })

    it('cancels remove confirmation without mutating', () => {
        const mutate = vi.fn()

        mockUseRemoveCollectionBook.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useRemoveCollectionBook
        >)

        renderRow()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Remove',
            }),
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Cancel',
            }),
        )

        expect(mutate).not.toHaveBeenCalled()

        expect(
            screen.queryByRole('dialog'),
        ).not.toBeInTheDocument()
    })

    it('surfaces reorder errors', () => {
        mockUseReorderCollectionBook.mockReturnValue({
            mutate: vi.fn(
                (
                    _variables,
                    options,
                ) => {
                    options?.onError?.(
                        new Error(
                            'Reorder failed',
                        ),
                    )
                },
            ),
            isPending: false,
        } as unknown as ReturnType<
            typeof useReorderCollectionBook
        >)

        renderRow()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Move Down',
            }),
        )

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            'Reorder failed',
        )
    })

    it('surfaces remove errors', () => {
        mockUseRemoveCollectionBook.mockReturnValue({
            mutate: vi.fn(
                (
                    _variables,
                    options,
                ) => {
                    options?.onError?.(
                        new Error(
                            'Remove failed',
                        ),
                    )
                },
            ),
            isPending: false,
        } as unknown as ReturnType<
            typeof useRemoveCollectionBook
        >)

        renderRow()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Remove',
            }),
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Remove Book',
            }),
        )

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            'Remove failed',
        )
    })

    it('closes remove confirmation after success', () => {
        mockUseRemoveCollectionBook.mockReturnValue({
            mutate: vi.fn(
                (
                    _variables,
                    options,
                ) => {
                    options?.onSuccess?.()
                },
            ),
            isPending: false,
        } as unknown as ReturnType<
            typeof useRemoveCollectionBook
        >)

        renderRow()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Remove',
            }),
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Remove Book',
            }),
        )

        expect(
            screen.queryByRole('dialog'),
        ).not.toBeInTheDocument()
    })
})
