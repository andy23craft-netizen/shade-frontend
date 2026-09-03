import {
    fireEvent,
    render,
    screen,
    within,
} from '@testing-library/react'
import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import type {
    WishlistBookRead,
    WishlistList,
} from '../../../api/apiTypes'
import {
    MoveWishlistBookError,
    useMoveWishlistBook,
    useWishlists,
} from '../../../api/wishlistsQueries'
import {
    MoveWishlistBookControl,
} from './MoveWishlistBookControl'

vi.mock('../../../api/wishlistsQueries', async () => {
    const actual =
        await vi.importActual<
            typeof import('../../../api/wishlistsQueries')
        >('../../../api/wishlistsQueries')

    return {
        ...actual,
        useWishlists: vi.fn(),
        useMoveWishlistBook: vi.fn(),
    }
})

const mockUseWishlists =
    vi.mocked(useWishlists)

const mockUseMoveWishlistBook =
    vi.mocked(useMoveWishlistBook)

const mockMove = vi.fn()
const mockRefetchWishlists = vi.fn()

const wishlists: WishlistList = {
    items: [
        {
            wishlist_id: 'wishlist-1',
            name: 'Master List',
            description: null,
            created_date:
                '2026-08-01T00:00:00Z',
            last_updated_date:
                '2026-08-01T00:00:00Z',
        },
        {
            wishlist_id: 'wishlist-2',
            name: 'Fiction',
            description: null,
            created_date:
                '2026-08-02T00:00:00Z',
            last_updated_date:
                '2026-08-02T00:00:00Z',
        },
        {
            wishlist_id: 'wishlist-3',
            name: 'Nonfiction',
            description: null,
            created_date:
                '2026-08-03T00:00:00Z',
            last_updated_date:
                '2026-08-03T00:00:00Z',
        },
    ],
    total: 3,
}

const membership: WishlistBookRead = {
    album_id: null,
    wishlist_item_id: 'membership-1',
    wishlist_id: 'wishlist-1',
    book_id: 'book-1',
    book_title: 'The Dispossessed',
    book_status: 'available',
    status: 'wanted',
    priority: 2,
    notes: 'Hardcover if possible',
    url: 'https://example.com/book',
    created_date:
        '2026-08-04T00:00:00Z',
}

function mockLoadedWishlists() {
    mockUseWishlists.mockReturnValue({
        data: wishlists,
        isPending: false,
        isError: false,
        isSuccess: true,
        error: null,
        refetch: mockRefetchWishlists,
    } as unknown as ReturnType<
        typeof useWishlists
    >)
}

function mockIdleMove() {
    mockUseMoveWishlistBook.mockReturnValue({
        mutate: mockMove,
        isPending: false,
    } as unknown as ReturnType<
        typeof useMoveWishlistBook
    >)
}

function renderControl() {
    return render(
        <MoveWishlistBookControl
            sourceWishlistId="wishlist-1"
            membership={membership}
            bookTitle="The Dispossessed"
        />,
    )
}

beforeEach(() => {
    vi.clearAllMocks()

    mockLoadedWishlists()
    mockIdleMove()
})

describe('MoveWishlistBookControl', () => {
    it('lists other wishlists and excludes the source wishlist', () => {
        renderControl()

        const select =
            screen.getByRole('combobox', {
                name:
                    'Destination wishlist for The Dispossessed',
            })

        expect(
            within(select).getByRole('option', {
                name: 'Choose a wishlist',
            }),
        ).toBeInTheDocument()

        expect(
            within(select).getByRole('option', {
                name: 'Fiction',
            }),
        ).toBeInTheDocument()

        expect(
            within(select).getByRole('option', {
                name: 'Nonfiction',
            }),
        ).toBeInTheDocument()

        expect(
            within(select).queryByRole('option', {
                name: 'Master List',
            }),
        ).not.toBeInTheDocument()
    })

    it('keeps Move disabled until a destination is selected', () => {
        renderControl()

        const button =
            screen.getByRole('button', {
                name: 'Move',
            })

        expect(button).toBeDisabled()

        fireEvent.change(
            screen.getByRole('combobox', {
                name:
                    'Destination wishlist for The Dispossessed',
            }),
            {
                target: {
                    value: 'wishlist-2',
                },
            },
        )

        expect(button).toBeEnabled()
    })

    it('confirms the book and destination before moving', () => {
        renderControl()

        fireEvent.change(
            screen.getByRole('combobox', {
                name:
                    'Destination wishlist for The Dispossessed',
            }),
            {
                target: {
                    value: 'wishlist-2',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Move',
            }),
        )

        const dialog =
            screen.getByRole('dialog')

        expect(dialog).toHaveTextContent(
            'The Dispossessed',
        )

        expect(dialog).toHaveTextContent(
            'Fiction',
        )

        fireEvent.click(
            within(dialog).getByRole('button', {
                name: 'Cancel',
            }),
        )

        expect(mockMove).not.toHaveBeenCalled()
    })

    it('moves the membership with all transferable metadata', () => {
        renderControl()

        fireEvent.change(
            screen.getByRole('combobox', {
                name:
                    'Destination wishlist for The Dispossessed',
            }),
            {
                target: {
                    value: 'wishlist-2',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Move',
            }),
        )

        fireEvent.click(
            within(
                screen.getByRole('dialog'),
            ).getByRole('button', {
                name: 'Move Book',
            }),
        )

        expect(mockMove).toHaveBeenCalledWith(
            {
                sourceWishlistId: 'wishlist-1',
                sourceWishlistItemId:
                    'membership-1',
                destinationWishlistId:
                    'wishlist-2',
                wishlistBook: {
                    book_id: 'book-1',
                    status: 'wanted',
                    priority: 2,
                    notes:
                        'Hardcover if possible',
                    url:
                        'https://example.com/book',
                },
                destinationMembershipCreated:
                    false,
            },
            expect.any(Object),
        )
    })

    it('clears the destination after a successful move', () => {
        mockMove.mockImplementation(
            (
                _variables,
                options,
            ) => {
                options?.onSuccess?.(
                    {} as never,
                    {} as never,
                    undefined as never,
                )
            },
        )

        renderControl()

        const select =
            screen.getByRole('combobox', {
                name:
                    'Destination wishlist for The Dispossessed',
            })

        fireEvent.change(select, {
            target: {
                value: 'wishlist-2',
            },
        })

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Move',
            }),
        )

        fireEvent.click(
            within(
                screen.getByRole('dialog'),
            ).getByRole('button', {
                name: 'Move Book',
            }),
        )

        expect(select).toHaveValue('')
    })

    it('disables the controls while the move is pending', () => {
        mockUseMoveWishlistBook.mockReturnValue({
            mutate: mockMove,
            isPending: true,
        } as unknown as ReturnType<
            typeof useMoveWishlistBook
        >)

        renderControl()

        expect(
            screen.getByRole('combobox', {
                name:
                    'Destination wishlist for The Dispossessed',
            }),
        ).toBeDisabled()

        expect(
            screen.getByRole('button', {
                name: 'Moving…',
            }),
        ).toBeDisabled()
    })

    it('shows loading and retryable error states for wishlists', () => {
        mockUseWishlists.mockReturnValue({
            data: undefined,
            isPending: true,
            isError: false,
            isSuccess: false,
            error: null,
            refetch: mockRefetchWishlists,
        } as unknown as ReturnType<
            typeof useWishlists
        >)

        const {
            unmount,
        } = renderControl()

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'Loading wishlists…',
        )

        unmount()

        mockUseWishlists.mockReturnValue({
            data: undefined,
            isPending: false,
            isError: true,
            isSuccess: false,
            error: new Error(
                'Wishlist request failed.',
            ),
            refetch: mockRefetchWishlists,
        } as unknown as ReturnType<
            typeof useWishlists
        >)

        renderControl()

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            'Unable to load wishlists',
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Retry',
            }),
        )

        expect(
            mockRefetchWishlists,
        ).toHaveBeenCalledOnce()
    })

    it('renders nothing when there is no other wishlist destination', () => {
        mockUseWishlists.mockReturnValue({
            data: {
                items: [
                    wishlists.items[0],
                ],
                total: 1,
            },
            isPending: false,
            isError: false,
            isSuccess: true,
            error: null,
            refetch: mockRefetchWishlists,
        } as unknown as ReturnType<
            typeof useWishlists
        >)

        renderControl()

        expect(
            screen.queryByRole('combobox'),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByRole('heading', {
                name: 'Move to Wishlist',
            }),
        ).not.toBeInTheDocument()
    })

    it('remembers destination creation after a partial failure and skips duplicate creation on retry', () => {
        mockMove.mockImplementation(
            (
                _variables,
                options,
            ) => {
                options?.onError?.(
                    new MoveWishlistBookError({
                        cause: new Error(
                            'Source removal failed.',
                        ),
                        destinationMembershipCreated:
                            true,
                    }),
                    {} as never,
                    undefined as never,
                )
            },
        )

        renderControl()

        fireEvent.change(
            screen.getByRole('combobox', {
                name:
                    'Destination wishlist for The Dispossessed',
            }),
            {
                target: {
                    value: 'wishlist-2',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Move',
            }),
        )

        fireEvent.click(
            within(
                screen.getByRole('dialog'),
            ).getByRole('button', {
                name: 'Move Book',
            }),
        )

        expect(
            screen.getByText(
                /added to the destination wishlist/i,
            ),
        ).toBeInTheDocument()

        mockMove.mockClear()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Move',
            }),
        )

        fireEvent.click(
            within(
                screen.getByRole('dialog'),
            ).getByRole('button', {
                name: 'Move Book',
            }),
        )

        expect(mockMove).toHaveBeenCalledWith(
            expect.objectContaining({
                sourceWishlistId:
                    'wishlist-1',
                sourceWishlistItemId:
                    'membership-1',
                destinationWishlistId:
                    'wishlist-2',
                destinationMembershipCreated:
                    true,
            }),
            expect.any(Object),
        )
    })
})
