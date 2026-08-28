import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'
import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import type {
    BulkShelfMoveResponse,
    ShelfRead,
} from '../../../api/apiTypes'
import {
    useBulkMoveBooksToShelf,
} from '../../../api/booksQueries'
import {
    useShelves,
} from '../../../api/shelvesQueries'
import {
    BulkMoveToShelfControl,
} from './BulkMoveToShelfControl'

vi.mock('../../../api/booksQueries', () => ({
    useBulkMoveBooksToShelf: vi.fn(),
}))

vi.mock('../../../api/shelvesQueries', () => ({
    useShelves: vi.fn(),
}))

const mockUseBulkMoveBooksToShelf =
    vi.mocked(useBulkMoveBooksToShelf)

const mockUseShelves =
    vi.mocked(useShelves)

const shelves: ShelfRead[] = [
    {
        shelf_id: 'shelf-a1',
        common_name: 'a1',
        location: null,
        description: null,
        created_date: '2026-08-01T00:00:00Z',
        updated_date: '2026-08-01T00:00:00Z',
    },
    {
        shelf_id: 'shelf-unknown',
        common_name: 'unknown',
        location: null,
        description: null,
        created_date: '2026-08-01T00:00:00Z',
        updated_date: '2026-08-01T00:00:00Z',
    },
    {
        shelf_id: 'shelf-removed',
        common_name: 'removed',
        location: null,
        description: null,
        created_date: '2026-08-01T00:00:00Z',
        updated_date: '2026-08-01T00:00:00Z',
    },
]

function mockShelvesSuccess() {
    mockUseShelves.mockReturnValue({
        data: shelves,
        isPending: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
    } as unknown as ReturnType<typeof useShelves>)
}

function mockMoveMutation({
                              mutate = vi.fn(),
                              isPending = false,
                          }: {
    mutate?: ReturnType<typeof vi.fn>
    isPending?: boolean
} = {}) {
    mockUseBulkMoveBooksToShelf.mockReturnValue({
        mutate,
        isPending,
    } as unknown as ReturnType<
        typeof useBulkMoveBooksToShelf
    >)

    return mutate
}

function renderControl({
                           selectedBookIds = [
                               'book-1',
                               'book-2',
                           ],
                           onSuccess = vi.fn(),
                       }: {
    selectedBookIds?: readonly string[]
    onSuccess?: (response: BulkShelfMoveResponse) => void
} = {}) {
    render(
        <BulkMoveToShelfControl
            selectedBookIds={selectedBookIds}
            onSuccess={onSuccess}
        />,
    )

    return {
        onSuccess,
    }
}

function chooseA1() {
    fireEvent.change(
        screen.getByLabelText(
            'Destination shelf',
        ),
        {
            target: {
                value: 'shelf-a1',
            },
        },
    )
}

function openConfirmation() {
    fireEvent.click(
        screen.getByRole('button', {
            name: 'Move to Shelf',
        }),
    )
}

function confirmMove() {
    fireEvent.click(
        screen.getByRole('button', {
            name: 'Move books',
        }),
    )
}

describe('BulkMoveToShelfControl', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockShelvesSuccess()
        mockMoveMutation()
    })

    it('disables moving when no books are selected', () => {
        renderControl({
            selectedBookIds: [],
        })

        expect(
            screen.getByRole('button', {
                name: 'Move to Shelf',
            }),
        ).toBeDisabled()

        expect(mockUseShelves).toHaveBeenCalledWith({
            enabled: false,
        })
    })

    it('loads assignable destinations from the shelf catalog', () => {
        renderControl()

        const select =
            screen.getByLabelText(
                'Destination shelf',
            )

        expect(
            screen.getByRole('option', {
                name: 'A1',
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

        expect(select).toHaveValue('')
    })

    it('requires an explicit destination before moving', () => {
        renderControl()

        expect(
            screen.getByRole('button', {
                name: 'Move to Shelf',
            }),
        ).toBeDisabled()

        chooseA1()

        expect(
            screen.getByRole('button', {
                name: 'Move to Shelf',
            }),
        ).toBeEnabled()
    })

    it('confirms the selected count and destination', () => {
        renderControl({
            selectedBookIds: [
                'book-1',
                'book-2',
                'book-3',
            ],
        })

        chooseA1()
        openConfirmation()

        const dialog =
            screen.getByRole('dialog', {
                name: 'Confirm shelf move',
            })

        expect(dialog).toHaveTextContent(
            'Move 3 books to A1?',
        )
    })

    it('submits every selected book in one bulk mutation', () => {
        const mutate = vi.fn()

        mockMoveMutation({
            mutate,
        })

        renderControl({
            selectedBookIds: [
                'book-1',
                'book-2',
                'book-3',
            ],
        })

        chooseA1()
        openConfirmation()
        confirmMove()

        expect(mutate).toHaveBeenCalledTimes(1)

        expect(mutate).toHaveBeenCalledWith(
            {
                book_ids: [
                    'book-1',
                    'book-2',
                    'book-3',
                ],
                shelf_name: 'a1',
            },
            expect.objectContaining({
                onSuccess: expect.any(Function),
                onError: expect.any(Function),
            }),
        )
    })

    it('disables dialog actions while the mutation is pending', () => {
        mockMoveMutation({
            isPending: false,
        })

        const { rerender } = render(
            <BulkMoveToShelfControl
                selectedBookIds={[
                    'book-1',
                    'book-2',
                ]}
                onSuccess={() => {}}
            />,
        )

        chooseA1()
        openConfirmation()

        mockMoveMutation({
            isPending: true,
        })

        rerender(
            <BulkMoveToShelfControl
                selectedBookIds={[
                    'book-1',
                    'book-2',
                ]}
                onSuccess={() => {}}
            />,
        )

        expect(
            screen.getByRole('button', {
                name: 'Moving…',
            }),
        ).toBeDisabled()

        expect(
            screen.getByRole('button', {
                name: 'Cancel',
            }),
        ).toBeDisabled()
    })

    it('reports success and clears completed selection through onSuccess', () => {
        const response: BulkShelfMoveResponse = {
            book_ids: [
                'book-1',
                'book-2',
            ],
            moved_count: 2,
            shelf_name: 'a1',
        }

        const mutate = vi.fn(
            (
                _request,
                options: {
                    onSuccess?: (
                        response:
                        BulkShelfMoveResponse,
                    ) => void
                },
            ) => {
                options.onSuccess?.(
                    response,
                )
            },
        )

        mockMoveMutation({
            mutate,
        })

        const onSuccess = vi.fn()

        renderControl({
            onSuccess,
        })

        chooseA1()
        openConfirmation()
        confirmMove()

        expect(onSuccess).toHaveBeenCalledWith(
            response,
        )

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            '2 books moved to A1.',
        )

        expect(
            screen.queryByRole('dialog', {
                name: 'Confirm shelf move',
            }),
        ).not.toBeInTheDocument()
    })

    it('keeps the destination and selection recoverable after an atomic failure', () => {
        const mutate = vi.fn(
            (
                _request,
                options: {
                    onError?: (
                        error: unknown,
                    ) => void
                },
            ) => {
                options.onError?.(
                    new Error(
                        'Book not found',
                    ),
                )
            },
        )

        mockMoveMutation({
            mutate,
        })

        const onSuccess = vi.fn()

        renderControl({
            selectedBookIds: [
                'book-1',
                'book-2',
            ],
            onSuccess,
        })

        chooseA1()
        openConfirmation()
        confirmMove()

        expect(onSuccess).not.toHaveBeenCalled()

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            'Book not found',
        )

        expect(
            screen.getByLabelText(
                'Destination shelf',
            ),
        ).toHaveValue('shelf-a1')

        expect(
            screen.getByRole('dialog', {
                name: 'Confirm shelf move',
            }),
        ).toBeInTheDocument()
    })
})
