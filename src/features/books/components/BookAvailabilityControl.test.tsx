import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { BookRead } from '../../../api/apiTypes'
import { useSetBookAvailability } from '../../../api/booksQueries'
import { useLibrarySettings } from '../../../api/libraryQueries'
import { BookAvailabilityControl } from './BookAvailabilityControl'

vi.mock('../../../api/booksQueries', () => ({
    useSetBookAvailability: vi.fn(),
}))

vi.mock('../../../api/libraryQueries', () => ({
    useLibrarySettings: vi.fn(),
}))

const mockedUseSetBookAvailability = vi.mocked(useSetBookAvailability)
const mockedUseLibrarySettings = vi.mocked(useLibrarySettings)
const book = {
    book_id: 'book-1',
    title: 'A Book',
    status: 'available',
} as BookRead

describe('BookAvailabilityControl', () => {
    const mutate = vi.fn()

    beforeEach(() => {
        mutate.mockReset()
        mockedUseLibrarySettings.mockReturnValue({
            data: { reserved_shelf_id: 'reserved-shelf' },
            isSuccess: true,
            isError: false,
        } as unknown as ReturnType<typeof useLibrarySettings>)
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

    it('requires and sends reservation details for Reserved availability', () => {
        render(<BookAvailabilityControl book={book} hasActiveLoan={false} />)
        fireEvent.change(screen.getByLabelText('Set availability'), {
            target: { value: 'reserved' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Update availability' }))
        expect(screen.getByRole('status')).toHaveTextContent('pickup name is required')

        fireEvent.change(screen.getByLabelText('Pickup name'), { target: { value: 'Jamie' } })
        fireEvent.change(screen.getByLabelText('Reservation note (optional)'), { target: { value: 'Friday' } })
        fireEvent.click(screen.getByRole('button', { name: 'Update availability' }))

        expect(mutate).toHaveBeenCalledWith(
            { id: 'book-1', request: { status: 'reserved', reservation: { pickup_name: 'Jamie', note: 'Friday' } } },
            expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
        )
    })
})
