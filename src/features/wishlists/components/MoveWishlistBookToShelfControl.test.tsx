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

import {
    ApiError,
} from '../../../api/apiErrors'
import type {
    ShelfRead,
} from '../../../api/apiTypes'
import {
    useShelves,
} from '../../../api/shelvesQueries'
import {
    MoveWishlistBookToShelfError,
    useMoveWishlistBookToShelf,
} from '../../../api/wishlistsQueries'
import {
    MoveWishlistBookToShelfControl,
} from './MoveWishlistBookToShelfControl'

const mockNavigate = vi.fn()
const mockInvalidateQueries = vi.fn()
const mockMove = vi.fn()
const mockRefetchShelves = vi.fn()

vi.mock('react-router-dom', async () => {
    const actual =
        await vi.importActual<
            typeof import('react-router-dom')
        >('react-router-dom')

    return {
        ...actual,
        useNavigate: () => mockNavigate,
    }
})

vi.mock('@tanstack/react-query', async () => {
    const actual =
        await vi.importActual<
            typeof import('@tanstack/react-query')
        >('@tanstack/react-query')

    return {
        ...actual,
        useQueryClient: () => ({
            invalidateQueries:
            mockInvalidateQueries,
        }),
    }
})

vi.mock('../../../api/shelvesQueries', () => ({
    useShelves: vi.fn(),
}))

vi.mock('../../../api/wishlistsQueries', async () => {
    const actual =
        await vi.importActual<
            typeof import('../../../api/wishlistsQueries')
        >('../../../api/wishlistsQueries')

    return {
        ...actual,
        useMoveWishlistBookToShelf: vi.fn(),
    }
})

const mockUseShelves =
    vi.mocked(useShelves)

const mockUseMoveWishlistBookToShelf =
    vi.mocked(useMoveWishlistBookToShelf)

const shelves: ShelfRead[] = [
    {
        shelf_id: 'shelf-a1',
        common_name: 'a1',
        description: null,
        location: null,
        created_date:
            '2026-08-01T00:00:00Z',
        updated_date:
            '2026-08-01T00:00:00Z',
    },
    {
        shelf_id: 'shelf-unknown',
        common_name: 'unknown',
        description: null,
        location: null,
        created_date:
            '2026-08-01T00:00:00Z',
        updated_date:
            '2026-08-01T00:00:00Z',
    },
    {
        shelf_id: 'shelf-removed',
        common_name: 'removed',
        description: null,
        location: null,
        created_date:
            '2026-08-01T00:00:00Z',
        updated_date:
            '2026-08-01T00:00:00Z',
    },
]

function renderControl() {
    render(
        <MoveWishlistBookToShelfControl
            wishlistId="wishlist-1"
            wishlistItemId="membership-1"
            bookId="book-1"
            bookTitle="The Dispossessed"
        />,
    )
}

function mockLoadedShelves() {
    mockUseShelves.mockReturnValue({
        data: shelves,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetchShelves,
    } as unknown as ReturnType<
        typeof useShelves
    >)
}

function mockIdleMove() {
    mockUseMoveWishlistBookToShelf.mockReturnValue({
        mutate: mockMove,
        isPending: false,
    } as unknown as ReturnType<
        typeof useMoveWishlistBookToShelf
    >)
}

beforeEach(() => {
    vi.clearAllMocks()

    mockLoadedShelves()
    mockIdleMove()
})

describe('MoveWishlistBookToShelfControl', () => {
    it('renders assignable shelves and excludes removed', () => {
        renderControl()

        const select =
            screen.getByRole('combobox', {
                name: 'Shelf for The Dispossessed',
            })

        expect(
            within(select).getByRole('option', {
                name: 'Choose a shelf',
            }),
        ).toBeInTheDocument()

        expect(
            within(select).getByRole('option', {
                name: 'A1',
            }),
        ).toBeInTheDocument()

        expect(
            within(select).getByRole('option', {
                name: 'Unknown',
            }),
        ).toBeInTheDocument()

        expect(
            within(select).queryByRole('option', {
                name: 'Removed',
            }),
        ).not.toBeInTheDocument()
    })

    it('requires an explicit shelf selection', () => {
        renderControl()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Add to Collection',
            }),
        )

        expect(
            screen.getByText(
                'Choose a shelf.',
            ),
        ).toBeInTheDocument()

        expect(mockMove).not.toHaveBeenCalled()
    })

    it('confirms the selected book and shelf before mutating', () => {
        renderControl()

        fireEvent.change(
            screen.getByRole('combobox', {
                name: 'Shelf for The Dispossessed',
            }),
            {
                target: {
                    value: 'shelf-a1',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Add to Collection',
            }),
        )

        const dialog =
            screen.getByRole('dialog')

        expect(dialog).toHaveTextContent(
            'The Dispossessed',
        )
        expect(dialog).toHaveTextContent('A1')

        fireEvent.click(
            within(dialog).getByRole(
                'button',
                {
                    name: 'Cancel',
                },
            ),
        )

        expect(mockMove).not.toHaveBeenCalled()
    })

    it('moves the book and navigates to its detail page on success', () => {
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

        fireEvent.change(
            screen.getByRole('combobox', {
                name: 'Shelf for The Dispossessed',
            }),
            {
                target: {
                    value: 'shelf-a1',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Add to Collection',
            }),
        )

        fireEvent.click(
            within(
                screen.getByRole('dialog'),
            ).getByRole('button', {
                name: 'Add to Collection',
            }),
        )

        expect(mockMove).toHaveBeenCalledWith(
            {
                wishlistId: 'wishlist-1',
                wishlistItemId: 'membership-1',
                bookId: 'book-1',
                shelfName: 'a1',
                membershipRemoved: false,
            },
            expect.any(Object),
        )

        expect(mockNavigate).toHaveBeenCalledWith(
            '/books/book-1',
        )
    })

    it('disables the controls while the move is pending', () => {
        mockUseMoveWishlistBookToShelf.mockReturnValue({
            mutate: mockMove,
            isPending: true,
        } as unknown as ReturnType<
            typeof useMoveWishlistBookToShelf
        >)

        renderControl()

        expect(
            screen.getByRole('combobox', {
                name: 'Shelf for The Dispossessed',
            }),
        ).toBeDisabled()

        expect(
            screen.getByRole('button', {
                name: 'Adding…',
            }),
        ).toBeDisabled()
    })

    it('shows shelf loading state before rendering the picker', () => {
        mockUseShelves.mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
            error: null,
            refetch: mockRefetchShelves,
        } as unknown as ReturnType<
            typeof useShelves
        >)

        renderControl()

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'Loading shelves…',
        )

        expect(
            screen.queryByRole('combobox'),
        ).not.toBeInTheDocument()
    })

    it('blocks the move control when shelves fail to load and allows retry', () => {
        mockUseShelves.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
            error: new Error(
                'Shelf request failed.',
            ),
            refetch: mockRefetchShelves,
        } as unknown as ReturnType<
            typeof useShelves
        >)

        renderControl()

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            'Unable to load shelves',
        )

        expect(
            screen.queryByRole('combobox'),
        ).not.toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Retry',
            }),
        )

        expect(
            mockRefetchShelves,
        ).toHaveBeenCalledOnce()
    })

    it('remembers a removed membership after shelf assignment fails', () => {
        mockMove.mockImplementation(
            (
                _variables,
                options,
            ) => {
                options?.onError?.(
                    new MoveWishlistBookToShelfError({
                        cause: new Error(
                            'Shelf update failed.',
                        ),
                        membershipRemoved: true,
                    }),
                    {} as never,
                    undefined as never,
                )
            },
        )

        renderControl()

        const select =
            screen.getByRole('combobox', {
                name: 'Shelf for The Dispossessed',
            })

        fireEvent.change(select, {
            target: {
                value: 'shelf-a1',
            },
        })

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Add to Collection',
            }),
        )

        fireEvent.click(
            within(
                screen.getByRole('dialog'),
            ).getByRole('button', {
                name: 'Add to Collection',
            }),
        )

        expect(
            screen.getByText(
                /removed from the wishlist/i,
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'Finish Adding to Collection',
            }),
        ).toBeInTheDocument()

        mockMove.mockClear()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Finish Adding to Collection',
            }),
        )

        fireEvent.click(
            within(
                screen.getByRole('dialog'),
            ).getByRole('button', {
                name: 'Add to Collection',
            }),
        )

        expect(mockMove).toHaveBeenCalledWith(
            expect.objectContaining({
                membershipRemoved: true,
                shelfName: 'a1',
            }),
            expect.any(Object),
        )
    })

    it('refreshes wishlist and book state after a stale 412', () => {
        mockMove.mockImplementation(
            (
                _variables,
                options,
            ) => {
                options?.onError?.(
                    new MoveWishlistBookToShelfError({
                        cause: new ApiError({
                            kind: 'http',
                            status: 412,
                            message:
                                'The book must be removed from the wishlist before it can be placed on a shelf',
                        }),
                        membershipRemoved: true,
                    }),
                    {} as never,
                    undefined as never,
                )
            },
        )

        renderControl()

        fireEvent.change(
            screen.getByRole('combobox', {
                name: 'Shelf for The Dispossessed',
            }),
            {
                target: {
                    value: 'shelf-a1',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Add to Collection',
            }),
        )

        fireEvent.click(
            within(
                screen.getByRole('dialog'),
            ).getByRole('button', {
                name: 'Add to Collection',
            }),
        )

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            /still recorded on a wishlist/i,
        )

        expect(
            mockInvalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: [
                'wishlists',
                'wishlist-1',
                'books',
            ],
        })

        expect(
            mockInvalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: [
                'books',
                'book-1',
            ],
        })
    })

    it('refreshes wishlist and book state after a stale 404', () => {
        mockMove.mockImplementation(
            (
                _variables,
                options,
            ) => {
                options?.onError?.(
                    new MoveWishlistBookToShelfError({
                        cause: new ApiError({
                            kind: 'http',
                            status: 404,
                            message: 'Book not found.',
                        }),
                        membershipRemoved: true,
                    }),
                    {} as never,
                    undefined as never,
                )
            },
        )

        renderControl()

        fireEvent.change(
            screen.getByRole('combobox', {
                name: 'Shelf for The Dispossessed',
            }),
            {
                target: {
                    value: 'shelf-a1',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Add to Collection',
            }),
        )

        fireEvent.click(
            within(
                screen.getByRole('dialog'),
            ).getByRole('button', {
                name: 'Add to Collection',
            }),
        )

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            /membership was removed.*book could not be found/i,
        )

        expect(
            mockInvalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: [
                'wishlists',
                'wishlist-1',
                'books',
            ],
        })

        expect(
            mockInvalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: [
                'books',
                'book-1',
            ],
        })
    })
})
