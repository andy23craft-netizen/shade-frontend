import {
    describe,
    expect,
    it,
} from 'vitest'

import {
    checkoutFormDefaults,
    checkoutFormValuesToRequest,
    validateCheckoutFormValues,
    type CheckoutFormValues,
} from './checkoutModel'

describe('validateCheckoutFormValues', () => {
    it('requires a borrower', () => {
        const values: CheckoutFormValues = {
            ...checkoutFormDefaults,
        }

        expect(
            validateCheckoutFormValues(values),
        ).toEqual({
            borrower: 'Borrower is required.',
        })
    })

    it('rejects a whitespace-only borrower', () => {
        const values: CheckoutFormValues = {
            ...checkoutFormDefaults,
            borrower: '   ',
        }

        expect(
            validateCheckoutFormValues(values),
        ).toEqual({
            borrower: 'Borrower is required.',
        })
    })

    it('accepts a borrower with optional fields empty', () => {
        const values: CheckoutFormValues = {
            ...checkoutFormDefaults,
            borrower: 'Pat',
        }

        expect(
            validateCheckoutFormValues(values),
        ).toEqual({})
    })

    it('rejects an invalid checkout timestamp', () => {
        const values: CheckoutFormValues = {
            ...checkoutFormDefaults,
            borrower: 'Pat',
            checked_out_at: 'not-a-date',
        }

        expect(
            validateCheckoutFormValues(values),
        ).toEqual({
            checked_out_at:
                'Enter a valid checkout date and time.',
        })
    })

    it('accepts valid timestamps', () => {
        const values: CheckoutFormValues = {
            ...checkoutFormDefaults,
            borrower: 'Pat',
            checked_out_at:
                '2026-08-13T14:30:00Z',
            due_at:
                '2026-08-20',
        }

        expect(
            validateCheckoutFormValues(values),
        ).toEqual({})
    })

    it('accepts a 255-character borrower', () => {
        const values: CheckoutFormValues = {
            ...checkoutFormDefaults,
            borrower: 'a'.repeat(255),
        }

        expect(
            validateCheckoutFormValues(values),
        ).toEqual({})
    })

    it('rejects a 256-character borrower', () => {
        const values: CheckoutFormValues = {
            ...checkoutFormDefaults,
            borrower: 'a'.repeat(256),
        }

        expect(
            validateCheckoutFormValues(values),
        ).toEqual({
            borrower:
                'Borrower must be 255 characters or fewer.',
        })
    })

    it('accepts a date-only due date', () => {
        const values: CheckoutFormValues = {
            ...checkoutFormDefaults,
            borrower: 'Pat',
            due_at: '2026-08-20',
        }

        expect(
            validateCheckoutFormValues(values),
        ).toEqual({})
    })

    it('keeps due dates date-only', () => {
        const values: CheckoutFormValues = {
            ...checkoutFormDefaults,
            borrower: 'Pat',
            due_at: '2026-08-20',
        }

        expect(
            checkoutFormValuesToRequest(values),
        ).toEqual({
            borrower: 'Pat',
            due_at: '2026-08-20',
        })
    })

    it('normalizes checkout timestamp but keeps due date date-only', () => {
        const values: CheckoutFormValues = {
            ...checkoutFormDefaults,
            borrower: 'Pat',
            checked_out_at:
                '2026-08-13T10:30:00-04:00',
            due_at: '2026-08-20',
        }

        expect(
            checkoutFormValuesToRequest(values),
        ).toEqual({
            borrower: 'Pat',
            checked_out_at:
                '2026-08-13T14:30:00.000Z',
            due_at: '2026-08-20',
        })
    })

    it('rejects an invalid due date', () => {
        const values: CheckoutFormValues = {
            ...checkoutFormDefaults,
            borrower: 'Pat',
            due_at: '2026-02-30',
        }

        expect(
            validateCheckoutFormValues(values),
        ).toEqual({
            due_at: 'Enter a valid due date.',
        })
    })


})

describe('checkoutFormValuesToRequest', () => {
    it('includes notes when provided', () => {
        const values: CheckoutFormValues = {
            ...checkoutFormDefaults,
            borrower: 'Pat',
            notes: '  Handle with care  ',
        }

        expect(
            checkoutFormValuesToRequest(values),
        ).toEqual({
            borrower: 'Pat',
            notes: 'Handle with care',
        })
    })
})
