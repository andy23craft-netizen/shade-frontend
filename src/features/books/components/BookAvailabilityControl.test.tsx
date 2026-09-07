import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { BookRead } from '../../../api/apiTypes'
import { useSetBookAvailability } from '../../../api/booksQueries'
import { BookAvailabilityControl } from './BookAvailabilityControl'

vi.mock('../../../api/booksQueries', () => ({
    useSetBookAvailability: vi.fn(),
}))

const mockedUseSetBookAvailability = vi.mocked(useSetBookAvailability)
const book = {
    book_id: 'book-1',
    title: 'A Book',
    status: 'available',
} as BookRead

describe('BookAvailabilityControl', () => {
    const mutate = vi.fn()

    beforeEach(() => {
        mutate.mockReset()
        mockedUseSetBookAvailability.mockReturnValue({
            mutate,
            isPending: false,
            isError: false,
        } as unknown as ReturnType<typeof useSetBookAvailability>)
    })

    it('uses the dedicated availability mutation', () => {
        render(<BookAvailabilityControl book={book} hasActiveLoan={false} />)
        fireEvent.change(screen.getByLabelText('Set availability'), {
            target: { value: 'missing' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Update availability' }))

        expect(mutate).toHaveBeenCalledWith(
            { id: 'book-1', request: { status: 'missing' } },
            expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
        )
    })

    it('blocks manual changes while a loan is active', () => {
        render(<BookAvailabilityControl book={book} hasActiveLoan />)
        expect(screen.getByText(/cannot be changed while this copy is on loan/i)).toBeInTheDocument()
        expect(screen.queryByLabelText('Set availability')).not.toBeInTheDocument()
    })
})
