import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { BookRead } from '../../../api/apiTypes'
import { StashPage } from './StashPage'

const mockUseInfiniteBooks = vi.fn()

vi.mock('../../../api/booksQueries', () => ({
    useInfiniteBooks: (options: unknown) => mockUseInfiniteBooks(options),
    useBulkApplyStash: () => ({
        mutate: vi.fn(),
        isPending: false,
    }),
}))

vi.mock('../../../api/shelvesQueries', () => ({
    useShelves: () => ({
        isPending: false,
        isError: false,
        data: [
            { shelf_id: 'unknown', common_name: 'unknown' },
            { shelf_id: 'e3', common_name: 'e3' },
        ],
    }),
}))

const stashedBook = {
    id: 'book-1',
    title: 'Displaced Book',
    authors: [{
        author_id: 'author-1',
        first_name: 'Test',
        surname: 'Author',
    }],
    categories: [],
    shelf_name: null,
    placement_state: 'stashed',
    previous_shelf_name: 'e2',
    status: 'on_loan',
    is_read: false,
    creation_date: '2026-01-01T00:00:00Z',
    updated_date: '2026-01-01T00:00:00Z',
    times_borrowed: 1,
    last_borrowed_at: '2026-01-02T00:00:00Z',
    average_loan_days: null,
} as BookRead

describe('StashPage', () => {
    it('loads the server-backed Stash and shows provenance', () => {
        mockUseInfiniteBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                pages: [{ items: [stashedBook], total: 1 }],
            },
            hasNextPage: false,
            isFetchingNextPage: false,
            fetchNextPage: vi.fn(),
            refetch: vi.fn(),
        })

        render(
            <MemoryRouter>
                <StashPage />
            </MemoryRouter>,
        )

        expect(mockUseInfiniteBooks).toHaveBeenCalledWith({
            placementState: 'stashed',
            sortBy: 'author',
            sortOrder: 'asc',
        })
        expect(screen.getByText('Previous shelf: E2')).toBeInTheDocument()
        expect(screen.getByText('On Loan')).toBeInTheDocument()
        expect(screen.queryByRole('option', { name: 'Unknown' })).not.toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'E3' })).toBeInTheDocument()
    })
})

