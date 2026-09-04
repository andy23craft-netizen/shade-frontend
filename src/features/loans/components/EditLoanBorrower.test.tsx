import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../../../api/apiErrors'
import type { LoanRead } from '../../../api/apiTypes'
import { EditLoanBorrower } from './EditLoanBorrower'

const mockUseUpdateLoan = vi.fn()

vi.mock('../../../api/loansQueries', () => ({
    useUpdateLoan: () => mockUseUpdateLoan(),
}))

const loan = {
    id: 'loan-1',
    book_id: 'book-1',
    album_id: null,
    borrower: 'Original Name',
    checked_out_at: '2026-08-12T14:00:00Z',
    created_date: '2026-08-12T14:00:00Z',
    last_updated_date: '2026-08-12T14:00:00Z',
    due_at: null,
    notes: null,
    returned_at: null,
} satisfies LoanRead

describe('EditLoanBorrower', () => {
    const mutate = vi.fn()

    beforeEach(() => {
        mutate.mockReset()
        mockUseUpdateLoan.mockReset()
        mockUseUpdateLoan.mockReturnValue({
            isPending: false,
            mutate,
        })
    })

    it('submits the corrected borrower through the loan patch', () => {
        render(<EditLoanBorrower loan={loan} />)

        fireEvent.click(screen.getByRole('button', {
            name: 'Edit Borrower',
        }))
        fireEvent.change(screen.getByLabelText('Borrower'), {
            target: {
                value: 'Corrected Name',
            },
        })
        fireEvent.click(screen.getByRole('button', {
            name: 'Save Borrower',
        }))

        expect(mutate).toHaveBeenCalledWith(
            {
                id: 'loan-1',
                update: {
                    borrower: 'Corrected Name',
                },
            },
            expect.objectContaining({
                onSuccess: expect.any(Function),
                onError: expect.any(Function),
            }),
        )
    })

    it('rejects a blank borrower before mutation', () => {
        render(<EditLoanBorrower loan={loan} />)

        fireEvent.click(screen.getByRole('button', {
            name: 'Edit Borrower',
        }))
        fireEvent.change(screen.getByLabelText('Borrower'), {
            target: {
                value: '   ',
            },
        })
        fireEvent.submit(screen.getByLabelText('Borrower').closest('form')!)

        expect(screen.getByText('Enter a borrower name.')).toBeInTheDocument()
        expect(mutate).not.toHaveBeenCalled()
    })

    it('links backend validation errors to the borrower field', () => {
        mutate.mockImplementation((_variables, options) => {
            options.onError(new ApiError({
                kind: 'validation',
                status: 422,
                message: 'Request validation failed.',
                fieldErrors: [{
                    field: 'borrower',
                    message: 'String should have at most 255 characters',
                }],
            }))
        })

        render(<EditLoanBorrower loan={loan} />)
        fireEvent.click(screen.getByRole('button', {
            name: 'Edit Borrower',
        }))
        fireEvent.click(screen.getByRole('button', {
            name: 'Save Borrower',
        }))

        expect(screen.getByLabelText('Borrower')).toHaveAccessibleDescription(
            'String should have at most 255 characters',
        )
    })

    it('explains when the loan no longer exists', () => {
        mutate.mockImplementation((_variables, options) => {
            options.onError(new ApiError({
                kind: 'http',
                status: 404,
                message: 'Loan not found.',
            }))
        })

        render(<EditLoanBorrower loan={loan} />)
        fireEvent.click(screen.getByRole('button', {
            name: 'Edit Borrower',
        }))
        fireEvent.click(screen.getByRole('button', {
            name: 'Save Borrower',
        }))

        expect(screen.getByRole('alert')).toHaveTextContent(
            'This loan could not be found.',
        )
    })

    it('surfaces a malformed loan identifier', () => {
        mutate.mockImplementation((_variables, options) => {
            options.onError(new ApiError({
                kind: 'http',
                status: 400,
                message: 'Bad request',
                detail: 'Malformed or missing identifier',
            }))
        })

        render(<EditLoanBorrower loan={loan} />)
        fireEvent.click(screen.getByRole('button', {
            name: 'Edit Borrower',
        }))
        fireEvent.click(screen.getByRole('button', {
            name: 'Save Borrower',
        }))

        expect(screen.getByRole('alert')).toHaveTextContent(
            'Malformed or missing identifier',
        )
    })

    it('uses the generic authentication message for a 403', () => {
        mutate.mockImplementation((_variables, options) => {
            options.onError(new ApiError({
                kind: 'unauthorized',
                status: 403,
                message: 'Forbidden',
            }))
        })

        render(<EditLoanBorrower loan={loan} />)
        fireEvent.click(screen.getByRole('button', {
            name: 'Edit Borrower',
        }))
        fireEvent.click(screen.getByRole('button', {
            name: 'Save Borrower',
        }))

        expect(screen.getByRole('alert')).toHaveTextContent(
            'API access was rejected.',
        )
    })
})
