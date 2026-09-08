import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const mockReviews = vi.fn()
const mockPutFeedback = vi.fn()

vi.mock('../../../api/loansQueries', () => ({
    useInfiniteBookBorrowerReviews: () => mockReviews(),
    usePutLoanFeedback: () => mockPutFeedback(),
}))

import { BorrowerReviews } from './BorrowerReviews'

const feedback = {
    feedback_id: 'feedback-1', loan_id: 'loan-1', work_id: 'work-1',
    borrower_display_name: 'Ada Lovelace', rating: 5, review: 'A wonderful read.',
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
}

describe('BorrowerReviews', () => {
    it('uses initials, shows review text, and saves an idempotent edit', () => {
        const mutate = vi.fn((_variables, options) => options.onSuccess())
        mockReviews.mockReturnValue({
            isPending: false, isError: false, hasNextPage: false,
            data: { pages: [{ items: [feedback], total: 1 }] },
        })
        mockPutFeedback.mockReturnValue({ mutate, isPending: false })

        render(<BorrowerReviews bookId="book-1" />)

        expect(screen.getByText('A. L.')).toBeInTheDocument()
        expect(screen.getByText('A wonderful read.')).toBeVisible()
        fireEvent.click(screen.getByRole('button', { name: 'Edit feedback' }))
        fireEvent.click(screen.getByRole('button', { name: 'Save feedback' }))

        expect(mutate).toHaveBeenCalledWith({
            id: 'loan-1', feedback: { rating: 5, review: 'A wonderful read.' },
        }, expect.any(Object))
    })

    it('offers a retry without blanking the rest of the book details page', () => {
        const refetch = vi.fn()
        mockReviews.mockReturnValue({ isPending: false, isError: true, refetch })
        mockPutFeedback.mockReturnValue({ mutate: vi.fn(), isPending: false })

        render(<BorrowerReviews bookId="book-1" />)
        fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
        expect(refetch).toHaveBeenCalledOnce()
    })
})
