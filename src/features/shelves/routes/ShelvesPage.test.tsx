import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'
import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react'

import type {
    ShelfRead,
} from '../../../api/apiTypes'
import { ApiError } from '../../../api/apiErrors'
import { ShelvesPage } from './ShelvesPage'

const mockRefetch = vi.fn()
const mockCreateMutate = vi.fn()
const mockUpdateMutate = vi.fn()
const mockDeleteMutate = vi.fn()

let mockShelvesPending = false
let mockShelvesError: unknown = null
let mockShelvesData: ShelfRead[] | undefined
let mockCreatePending = false
let mockUpdatePending = false
let mockDeletePending = false

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
    })

    it('shows a loading state while shelves load', () => {
        mockShelvesPending = true
        mockShelvesData = undefined

        render(<ShelvesPage />)

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

        render(<ShelvesPage />)

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

    it('lists shelves with Title Case labels, system badges, and write controls', () => {
        render(<ShelvesPage />)

        expect(
            screen.getByRole('heading', {
                name: 'Unknown',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('heading', {
                name: 'Removed',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('heading', {
                name: 'Liz Tbr',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getAllByText('System shelf'),
        ).toHaveLength(2)

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
                name: 'Add Shelf',
            }),
        ).toBeInTheDocument()

        const lizRow = screen
            .getByRole('heading', {
                name: 'Liz Tbr',
            })
            .closest('article')

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
    })

    it('does not offer delete for system shelves', () => {
        render(<ShelvesPage />)

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

        const nameInput = row.getByRole(
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

        render(<ShelvesPage />)

        const addForm = screen
            .getByRole('heading', {
                name: 'Add shelf',
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

        render(<ShelvesPage />)

        const addForm = screen
            .getByRole('heading', {
                name: 'Add shelf',
            })
            .closest('form')

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

        render(<ShelvesPage />)

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

        const locationInput = row.getByRole(
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
            row.getByRole('button', {
                name: 'Save Shelf',
            }),
        )

        expect(mockUpdateMutate).toHaveBeenCalledWith(
            {
                shelfId: 'shelf-liz',
                shelf: {
                    location: 'Basement',
                },
            },
            expect.any(Object),
        )

        await waitFor(() => {
            expect(
                screen.getByText('Shelf saved.'),
            ).toBeInTheDocument()
        })
    })

    it('deletes a non-system shelf after confirmation', async () => {
        mockDeleteMutate.mockImplementation(
            (_id, options) => {
                options?.onSuccess?.()
            },
        )

        render(<ShelvesPage />)

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

        render(<ShelvesPage />)

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

        render(<ShelvesPage />)

        expect(
            screen.getByText('No shelves yet'),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'Add Shelf',
            }),
        ).toBeInTheDocument()
    })
})
