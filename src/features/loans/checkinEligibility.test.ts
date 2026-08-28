import {
    describe,
    expect,
    it,
} from 'vitest'

import type {
    BookRead,
    LoanRead,
} from '../../api/apiTypes'
import {
    findActiveLoan,
    isCheckinEligible,
} from './checkinEligibility'

const book = {
    id: 'book-1',
    title: 'Pale Fire',
    authors: [
        {
            author_id: 'author-vladimir-nabokov',
            first_name: 'Vladimir',
            surname: 'Nabokov',
        },
    ],
    status: 'on_loan',
} as BookRead

const activeLoan = {
    id: 'loan-active',
    book_id: 'book-1',
    borrower: 'Jane Reader',
    checked_out_at: '2026-08-12T14:00:00Z',
    due_at: null,
    returned_at: null,
    notes: null,
    created_date: '2026-08-12T14:00:00Z',
    last_updated_date: '2026-08-12T14:00:00Z',
} as LoanRead

const returnedLoan = {
    ...activeLoan,
    id: 'loan-returned',
    returned_at: '2026-08-13T14:00:00Z',
} as LoanRead

describe('checkinEligibility', () => {
    it('finds the active loan for a book', () => {
        expect(
            findActiveLoan(
                'book-1',
                [
                    returnedLoan,
                    activeLoan,
                ],
            ),
        ).toBe(activeLoan)
    })

    it('does not treat a returned loan as active', () => {
        expect(
            findActiveLoan(
                'book-1',
                [returnedLoan],
            ),
        ).toBeUndefined()
    })

    it('ignores loans belonging to another book', () => {
        expect(
            findActiveLoan(
                'different-book',
                [activeLoan],
            ),
        ).toBeUndefined()
    })

    it('allows a non-deleted book with an active loan', () => {
        expect(
            isCheckinEligible(
                book,
                [activeLoan],
            ),
        ).toBe(true)
    })

    it('allows an active loan even when book status is inconsistent', () => {
        expect(
            isCheckinEligible(
                {
                    ...book,
                    status: 'available',
                },
                [activeLoan],
            ),
        ).toBe(true)
    })

    it('rejects an on-loan book without an active loan', () => {
        expect(
            isCheckinEligible(
                book,
                [returnedLoan],
            ),
        ).toBe(false)
    })

})
