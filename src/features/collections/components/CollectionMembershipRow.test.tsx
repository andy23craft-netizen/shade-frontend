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
    CollectionBookRead,
} from '../../../api/apiTypes'
import {
    useRemoveCollectionBook,
    useReorderCollectionBook,
} from '../../../api/collectionsQueries'
import {
    CollectionMembershipRow,
} from './CollectionMembershipRow'


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


const mockUseReorderCollectionBook =
    vi.mocked(useReorderCollectionBook)

const mockUseRemoveCollectionBook =
    vi.mocked(useRemoveCollectionBook)

const membership: CollectionBookRead = {
    collection_book_id: 'membership-1',
    collection_id: 'collection-1',
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
