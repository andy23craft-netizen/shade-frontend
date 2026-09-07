import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSetBulkBookAvailability } from '../../../api/booksQueries'
import { BulkAvailabilityControl } from './BulkAvailabilityControl'

vi.mock('../../../api/booksQueries', () => ({
    useSetBulkBookAvailability: vi.fn(),
}))

const mockedUseSetBulkBookAvailability = vi.mocked(useSetBulkBookAvailability)

describe('BulkAvailabilityControl', () => {
    const mutate = vi.fn()

    beforeEach(() => {
        mutate.mockReset()
        mockedUseSetBulkBookAvailability.mockReturnValue({
            mutate,
            isPending: false,
            isError: false,
        } as unknown as ReturnType<typeof useSetBulkBookAvailability>)
    })

    it('submits all selected copies through one atomic mutation', () => {
        render(<BulkAvailabilityControl selectedBookIds={['book-1', 'book-2']} onSuccess={vi.fn()} />)
        fireEvent.change(screen.getByLabelText('Availability'), {
            target: { value: 'display_only' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Set availability' }))
        fireEvent.click(screen.getByRole('button', { name: 'Update books' }))

        expect(mutate).toHaveBeenCalledTimes(1)
        expect(mutate).toHaveBeenCalledWith(
            { book_ids: ['book-1', 'book-2'], status: 'display_only' },
            expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
        )
    })
})
