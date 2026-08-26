import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'
import {
    act,
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react'
import {
    MemoryRouter,
} from 'react-router-dom'
import type {
    ShelfRead,
} from '../../../api/apiTypes'
import { ApiError } from '../../../api/apiErrors'
import { ShelvesPage } from './ShelvesPage'

const mockRefetch = vi.fn()
const mockCreateMutate = vi.fn()
const mockUpdateMutate = vi.fn()
const mockDeleteMutate = vi.fn()
const mockBreakdownsRefetch = vi.fn()
const mockUseBooks = vi.fn()
const mockUseInfiniteScrollTrigger = vi.fn()
const mockGetRowRef = vi.fn()

let mockShelvesPending = false
let mockShelvesError: unknown = null
let mockShelvesData: ShelfRead[] | undefined
let mockCreatePending = false
let mockUpdatePending = false
let mockDeletePending = false
let mockBreakdownsPending = false
let mockBreakdownsError: unknown = null

vi.mock('../../../api/shelvesQueries', () => ({
    useShelves: () => ({
        isPending: mockShelvesPending,
        isError: mockShelvesError !== null,
        error: mockShelvesError,
        data: mockShelvesData,
        refetch: mockRefetch,
    }),
    useCreateShelf: () => ({
        isPending: mockCreatePending,
        mutate: mockCreateMutate,
    }),
    useUpdateShelf: () => ({
        isPending: mockUpdatePending,
        mutate: mockUpdateMutate,
    }),
    useDeleteShelf: () => ({
        isPending: mockDeletePending,
        mutate: mockDeleteMutate,
    }),
}))

vi.mock('../../../api/booksQueries', () => ({
    useBooks: (options: unknown) =>
        mockUseBooks(options),
}))

vi.mock('../../../api/dashboardQueries', () => ({
    useDashboardBreakdowns: () => ({
        isPending: mockBreakdownsPending,
        isLoadingError:
            mockBreakdownsError !== null,
        error: mockBreakdownsError,
        data: {
            total_books: 3,
            on_loan: 0,
            by_category: [],
            by_shelf: [
                {
                    key: 'unknown',
                    count: 2,
                },
                {
                    key: 'liz_tbr',
                    count: 1,
                },
            ],
            by_creation_year: [],
        },
        refetch: mockBreakdownsRefetch,
    }),
}))

vi.mock('../../../hooks/useInfiniteScrollTrigger', () => ({
    useInfiniteScrollTrigger: (
        options: unknown,
    ) => {
        mockUseInfiniteScrollTrigger(options)

        const itemCount = (
            options as {
                itemCount: number
            }
        ).itemCount

        return {
            sentinelIndex: Math.max(
                0,
                itemCount - 1,
            ),
            getRowRef: (index: number) => {
                mockGetRowRef(index)

                return () => undefined
            },
        }
    },
}))

const sampleShelves: ShelfRead[] = [
    {
        shelf_id: 'shelf-unknown',
        common_name: 'unknown',
        location: null,
        description: null,
        created_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
    },
    {
        shelf_id: 'shelf-removed',
        common_name: 'removed',
        location: null,
        description: null,
        created_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
    },
    {
        shelf_id: 'shelf-liz',
        common_name: 'liz_tbr',
        location: 'Office',
        description: 'To be read',
        created_date: '2026-01-02T00:00:00Z',
        updated_date: '2026-01-02T00:00:00Z',
    },
]

function makeShelf(
    commonName: string,
    index: number,
): ShelfRead {
    return {
        shelf_id: `shelf-${index}`,
        common_name: commonName,
        location: null,
        description: null,
        created_date:
            '2026-01-01T00:00:00Z',
        updated_date:
            '2026-01-01T00:00:00Z',
    }
}

const incrementalShelves: ShelfRead[] = [
    makeShelf('removed', 0),
    makeShelf('shelf_1', 1),
    makeShelf('shelf_2', 2),
    makeShelf('shelf_3', 3),
    makeShelf('shelf_4', 4),
    makeShelf('shelf_5', 5),
    makeShelf('shelf_6', 6),
    makeShelf('shelf_7', 7),
    makeShelf('shelf_8', 8),
    makeShelf('shelf_9', 9),
    makeShelf('shelf_10', 10),
    makeShelf('shelf_11', 11),
    makeShelf('shelf_12', 12),
    makeShelf('shelf_13', 13),
]

function renderShelvesPage() {
    return render(
        <MemoryRouter>
            <ShelvesPage />
        </MemoryRouter>,
    )
}

function getLatestInfiniteScrollOptions() {
    const latestCall =
        mockUseInfiniteScrollTrigger.mock.calls.at(
            -1,
        )

    expect(latestCall).toBeDefined()

    return latestCall?.[0] as {
        enabled: boolean
        hasNextPage: boolean
        isFetchingNextPage: boolean
        fetchNextPage: () => void
        itemCount: number
    }
}

describe('ShelvesPage', () => {
    beforeEach(() => {
        mockShelvesPending = false
        mockShelvesError = null
        mockShelvesData = sampleShelves
        mockCreatePending = false
        mockUpdatePending = false
        mockDeletePending = false
        mockRefetch.mockReset()
        mockCreateMutate.mockReset()
        mockUpdateMutate.mockReset()
        mockDeleteMutate.mockReset()
        mockBreakdownsPending = false
        mockBreakdownsError = null
        mockBreakdownsRefetch.mockReset()
        mockUseBooks.mockReset()
        mockUseInfiniteScrollTrigger.mockReset()
        mockGetRowRef.mockReset()

        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                items: [],
                total: 0,
            },
        })
    })

    it('shows a loading state while shelves load', () => {
        mockShelvesPending = true
        mockShelvesData = undefined

        renderShelvesPage()

        expect(
            screen.getByText(
                'Loading shelves…',
            ),
        ).toBeInTheDocument()
    })

    it('shows a retryable error when shelves fail to load', () => {
        mockShelvesError = new ApiError({
            kind: 'unreachable',
            message:
                'The API could not be reached',
        })
        mockShelvesData = undefined

        renderShelvesPage()

        expect(
            screen.getByText(
                'Unable to load shelves',
            ),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Retry',
            }),
        )

        expect(mockRefetch).toHaveBeenCalled()
    })

    it('shows a retryable error when shelf counts fail to load', () => {
        mockBreakdownsError = new ApiError({
            kind: 'unreachable',
            message:
                'The API could not be reached',
        })

        renderShelvesPage()

        expect(
            screen.getByText(
                'Unable to load shelf counts',
            ),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Retry',
            }),
        )

        expect(
            mockBreakdownsRefetch,
        ).toHaveBeenCalled()
    })

    it('lists shelves with Title Case labels, system badges, and write controls', () => {
        renderShelvesPage()

        expect(
            screen.getByRole('heading', {
                name: 'Unknown',
            }),
        ).toBeInTheDocument()

        const unknownRow = screen
            .getByRole('heading', {
                name: 'Unknown',
            })
            .closest('article')

        expect(unknownRow).not.toBeNull()

        expect(
            within(
                unknownRow as HTMLElement,
            ).getByRole('link', {
                name: '2 books',
            }),
        ).toHaveAttribute(
            'href',
            '/books?shelf_name=unknown',
        )

        const lizRow = screen
            .getByRole('heading', {
                name: 'Liz Tbr',
            })
            .closest('article')

        expect(lizRow).not.toBeNull()

        expect(
            within(
                lizRow as HTMLElement,
            ).getByRole('link', {
                name: '1 book',
            }),
        ).toHaveAttribute(
            'href',
            '/books?shelf_name=liz_tbr',
        )

        expect(
            screen.getByRole('heading', {
                name: 'Liz Tbr',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getAllByText('System shelf'),
        ).toHaveLength(1)

        expect(
            screen.getByText('Office'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('To be read'),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                /Manage the shelf catalog/,
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'Add shelf',
            }),
        ).toBeInTheDocument()

        expect(
            screen.queryByRole('button', {
                name: 'Add Shelf',
            }),
        ).not.toBeInTheDocument()

        expect(lizRow).not.toBeNull()

        expect(
            within(lizRow as HTMLElement).getByRole(
                'button',
                {
                    name: 'Edit',
                },
            ),
        ).toBeInTheDocument()

        expect(
            within(lizRow as HTMLElement).getByRole(
                'button',
                {
                    name: 'Delete',
                },
            ),
        ).toBeInTheDocument()

        expect(
            screen.queryByRole('heading', {
                name: 'Removed',
            }),
        ).not.toBeInTheDocument()
    })

    it('does not offer delete for system shelves', () => {
        renderShelvesPage()

        const unknownRow = screen
            .getByRole('heading', {
                name: 'Unknown',
            })
            .closest('article')

        expect(unknownRow).not.toBeNull()

        const row = within(
            unknownRow as HTMLElement,
        )

        expect(
            row.queryByRole('button', {
                name: 'Delete',
            }),
        ).not.toBeInTheDocument()

        fireEvent.click(
            row.getByRole('button', {
                name: 'Edit',
            }),
        )

        const editForm = screen
            .getByRole('heading', {
                name: 'Edit Unknown',
            })
            .closest('form')

        expect(editForm).not.toBeNull()

        const edit = within(
            editForm as HTMLElement,
        )

        const nameInput = edit.getByRole(
            'textbox',
            {
                name: 'Name',
            },
        ) as HTMLInputElement

        expect(nameInput).toBeDisabled()
        expect(nameInput.value).toBe('unknown')
    })

    it('creates a shelf with normalized common_name', async () => {
        mockCreateMutate.mockImplementation(
            (_body, options) => {
                options?.onSuccess?.({
                    shelf_id: 'shelf-new',
                    common_name: 'new_shelf',
                    location: null,
                    description: null,
                    created_date:
                        '2026-01-03T00:00:00Z',
                    updated_date:
                        '2026-01-03T00:00:00Z',
                })
            },
        )

        renderShelvesPage()
        fireEvent.click(
            screen.getByRole('button', {
                name: 'Add shelf',
            }),
        )
        const addForm = screen
            .getByRole('button', {
                name: 'Add Shelf',
            })
            .closest('form')

        expect(addForm).not.toBeNull()

        const form = within(
            addForm as HTMLElement,
        )

        expect(addForm).not.toBeNull()

        fireEvent.change(
            form.getByRole('textbox', {
                name: 'Name',
            }),
            {
                target: {
                    value: ' New_Shelf ',
                },
            },
        )

        fireEvent.click(
            form.getByRole('button', {
                name: 'Add Shelf',
            }),
        )

        expect(mockCreateMutate).toHaveBeenCalledWith(
            {
                common_name: 'new_shelf',
            },
            expect.any(Object),
        )

        await waitFor(() => {
            expect(
                screen.getByText('Shelf added.'),
            ).toBeInTheDocument()
        })
    })

    it('maps create 409 duplicates onto the form summary', async () => {
        mockCreateMutate.mockImplementation(
            (_body, options) => {
                options?.onError?.(
                    new ApiError({
                        kind: 'http',
                        message:
                            'Shelf already exists',
                        status: 409,
                        detail:
                            'Shelf already exists',
                    }),
                )
            },
        )

        renderShelvesPage()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Add shelf',
            }),
        )

        const addForm = screen
            .getByRole('button', {
                name: 'Add Shelf',
            })
            .closest('form')

        expect(addForm).not.toBeNull()

        const form = within(
            addForm as HTMLElement,
        )


        fireEvent.change(
            form.getByRole('textbox', {
                name: 'Name',
            }),
            {
                target: {
                    value: 'a1',
                },
            },
        )

        fireEvent.click(
            form.getByRole('button', {
                name: 'Add Shelf',
            }),
        )

        await waitFor(() => {
            expect(
                form.getAllByText(
                    'Shelf already exists',
                ).length,
            ).toBeGreaterThan(0)
        })
    })

    it('edits shelf metadata and saves a minimal patch', async () => {
        mockUpdateMutate.mockImplementation(
            (_vars, options) => {
                options?.onSuccess?.({
                    ...sampleShelves[2]!,
                    location: 'Basement',
                })
            },
        )

        renderShelvesPage()

        const lizRow = screen
            .getByRole('heading', {
                name: 'Liz Tbr',
            })
            .closest('article')

        const row = within(
            lizRow as HTMLElement,
        )

        fireEvent.click(
            row.getByRole('button', {
                name: 'Edit',
            }),
        )

        const editForm = screen
            .getByRole('heading', {
                name: 'Edit Liz Tbr',
            })
            .closest('form')

        expect(editForm).not.toBeNull()

        const edit = within(
            editForm as HTMLElement,
        )

        const locationInput = edit.getByRole(
            'textbox',
            {
                name: 'Location',
            },
        )

        fireEvent.change(locationInput, {
            target: {
                value: 'Basement',
            },
        })

        fireEvent.click(
            edit.getByRole('button', {
                name: 'Save Shelf',
            }),
        )
    })

    it('deletes a non-system shelf after confirmation', async () => {
        mockDeleteMutate.mockImplementation(
            (_id, options) => {
                options?.onSuccess?.()
            },
        )

        renderShelvesPage()

        const lizRow = screen
            .getByRole('heading', {
                name: 'Liz Tbr',
            })
            .closest('article')

        fireEvent.click(
            within(lizRow as HTMLElement).getByRole(
                'button',
                {
                    name: 'Delete',
                },
            ),
        )

        expect(
            screen.getByRole('heading', {
                name: 'Delete shelf?',
            }),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Delete Shelf',
            }),
        )

        expect(mockDeleteMutate).toHaveBeenCalledWith(
            'shelf-liz',
            expect.any(Object),
        )

        await waitFor(() => {
            expect(
                screen.getByText(
                    'Liz Tbr was deleted.',
                ),
            ).toBeInTheDocument()
        })
    })

    it('surfaces delete 409 conflicts', async () => {
        mockDeleteMutate.mockImplementation(
            (_id, options) => {
                options?.onError?.(
                    new ApiError({
                        kind: 'http',
                        message:
                            'Shelf still has books',
                        status: 409,
                        detail:
                            'Shelf still has books',
                    }),
                )
            },
        )

        renderShelvesPage()

        const lizRow = screen
            .getByRole('heading', {
                name: 'Liz Tbr',
            })
            .closest('article')

        fireEvent.click(
            within(lizRow as HTMLElement).getByRole(
                'button',
                {
                    name: 'Delete',
                },
            ),
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Delete Shelf',
            }),
        )

        await waitFor(() => {
            expect(
                screen.getByText(
                    'Shelf still has books',
                ),
            ).toBeInTheDocument()
        })

        expect(mockRefetch).toHaveBeenCalled()
    })

    it('shows an empty state when the catalog is empty', () => {
        mockShelvesData = []

        renderShelvesPage()

        expect(
            screen.getByText('No shelves yet'),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'Add shelf',
            }),
        ).toBeInTheDocument()
    })

    it('opens and cancels the Add shelf dialog', () => {
        renderShelvesPage()

        expect(
            screen.queryByRole('button', {
                name: 'Add Shelf',
            }),
        ).not.toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Add shelf',
            }),
        )

        expect(
            screen.getByRole('button', {
                name: 'Add Shelf',
            }),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Cancel',
            }),
        )

        expect(
            screen.queryByRole('button', {
                name: 'Add Shelf',
            }),
        ).not.toBeInTheDocument()
    })

    it('renders only the initial shelf batch', () => {
        mockShelvesData = incrementalShelves

        renderShelvesPage()

        expect(
            screen.getByRole('heading', {
                name: 'Shelf 1',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('heading', {
                name: 'Shelf 6',
            }),
        ).toBeInTheDocument()

        expect(
            screen.queryByRole('heading', {
                name: 'Shelf 7',
            }),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByRole('heading', {
                name: 'Removed',
            }),
        ).not.toBeInTheDocument()

        expect(
            getLatestInfiniteScrollOptions(),
        ).toMatchObject({
            enabled: true,
            hasNextPage: true,
            itemCount: 6,
        })
    })

    it('exposes the next shelf batch when infinite scroll triggers', () => {
        mockShelvesData = incrementalShelves

        renderShelvesPage()

        act(() => {
            getLatestInfiniteScrollOptions()
                .fetchNextPage()
        })

        expect(
            screen.getByRole('heading', {
                name: 'Shelf 12',
            }),
        ).toBeInTheDocument()

        expect(
            screen.queryByRole('heading', {
                name: 'Shelf 13',
            }),
        ).not.toBeInTheDocument()

        expect(
            getLatestInfiniteScrollOptions(),
        ).toMatchObject({
            enabled: true,
            hasNextPage: true,
            itemCount: 12,
        })
    })

    it('continues exposing shelf batches until the complete catalog is rendered', () => {
        mockShelvesData = incrementalShelves

        renderShelvesPage()

        act(() => {
            getLatestInfiniteScrollOptions()
                .fetchNextPage()
        })

        act(() => {
            getLatestInfiniteScrollOptions()
                .fetchNextPage()
        })

        expect(
            screen.getByRole('heading', {
                name: 'Shelf 13',
            }),
        ).toBeInTheDocument()

        expect(
            screen.queryByRole('heading', {
                name: 'Removed',
            }),
        ).not.toBeInTheDocument()

        expect(
            getLatestInfiniteScrollOptions(),
        ).toMatchObject({
            enabled: false,
            hasNextPage: false,
            itemCount: 13,
        })
    })

    it('does not expose shelves beyond the complete catalog', () => {
        mockShelvesData = incrementalShelves

        renderShelvesPage()

        act(() => {
            getLatestInfiniteScrollOptions()
                .fetchNextPage()
        })

        act(() => {
            getLatestInfiniteScrollOptions()
                .fetchNextPage()
        })

        expect(
            getLatestInfiniteScrollOptions()
                .itemCount,
        ).toBe(13)

        act(() => {
            getLatestInfiniteScrollOptions()
                .fetchNextPage()
        })

        expect(
            getLatestInfiniteScrollOptions()
                .itemCount,
        ).toBe(13)
    })

    it('does not reset the visible shelf batch while editing', () => {
        mockShelvesData = incrementalShelves

        renderShelvesPage()

        act(() => {
            getLatestInfiniteScrollOptions()
                .fetchNextPage()
        })

        expect(
            screen.getByRole('heading', {
                name: 'Shelf 12',
            }),
        ).toBeInTheDocument()

        const shelfEight = screen
            .getByRole('heading', {
                name: 'Shelf 8',
            })
            .closest('article')

        expect(shelfEight).not.toBeNull()

        fireEvent.click(
            within(
                shelfEight as HTMLElement,
            ).getByRole('button', {
                name: 'Edit',
            }),
        )

        expect(
            screen.getByRole('heading', {
                name: 'Edit Shelf 8',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('heading', {
                name: 'Shelf 12',
            }),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Cancel',
            }),
        )

        expect(
            screen.getByRole('heading', {
                name: 'Shelf 12',
            }),
        ).toBeInTheDocument()

        expect(
            getLatestInfiniteScrollOptions()
                .itemCount,
        ).toBe(12)
    })
})
