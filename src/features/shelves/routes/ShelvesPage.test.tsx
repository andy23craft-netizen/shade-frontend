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
} from '@testing-library/react'

import type {
    ShelfRead,
} from '../../../api/apiTypes'
import { ApiError } from '../../../api/apiErrors'
import { ShelvesPage } from './ShelvesPage'

const mockRefetch = vi.fn()

let mockShelvesPending = false
let mockShelvesError: unknown = null
let mockShelvesData: ShelfRead[] | undefined

vi.mock('../../../api/shelvesQueries', () => ({
    useShelves: () => ({
        isPending: mockShelvesPending,
        isError: mockShelvesError !== null,
        error: mockShelvesError,
        data: mockShelvesData,
        refetch: mockRefetch,
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
        mockRefetch.mockReset()
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

    it('lists shelves with Title Case labels and system-shelf badges', () => {
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
                /Catalog edits are unavailable/,
            ),
        ).toBeInTheDocument()

        expect(
            screen.queryByRole('button', {
                name: /add shelf/i,
            }),
        ).not.toBeInTheDocument()
    })

    it('shows an empty state when the catalog is empty', () => {
        mockShelvesData = []

        render(<ShelvesPage />)

        expect(
            screen.getByText('No shelves yet'),
        ).toBeInTheDocument()
    })
})
