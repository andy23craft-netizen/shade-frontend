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

    it('accepts a borrower with notes empty', () => {
        const values: CheckoutFormValues = {
            ...checkoutFormDefaults,
            borrower: 'Pat',
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
})

describe('checkoutFormValuesToRequest', () => {
    const now = new Date(
        '2026-08-19T15:30:45.123Z',
    )

    it('trims borrower and records checkout time without a due date', () => {
        const values: CheckoutFormValues = {
            ...checkoutFormDefaults,
            borrower: '  Pat  ',
        }

        expect(
            checkoutFormValuesToRequest(values, now),
        ).toEqual({
            borrower: 'Pat',
            checked_out_at:
                '2026-08-19T15:30:45.123Z',
        })
    })

    it('includes trimmed notes when provided', () => {
        const values: CheckoutFormValues = {
            ...checkoutFormDefaults,
            borrower: 'Pat',
            notes: '  Handle with care  ',
        }

        expect(
            checkoutFormValuesToRequest(values, now),
        ).toEqual({
            borrower: 'Pat',
            checked_out_at:
                '2026-08-19T15:30:45.123Z',
            notes: 'Handle with care',
        })
    })

    it('omits blank notes', () => {
        const values: CheckoutFormValues = {
            ...checkoutFormDefaults,
            borrower: 'Pat',
            notes: '   ',
        }

        const request =
            checkoutFormValuesToRequest(values, now)

        expect(request).toEqual({
            borrower: 'Pat',
            checked_out_at:
                '2026-08-19T15:30:45.123Z',
        })

        expect(request).not.toHaveProperty('notes')
    })

    it('uses the supplied checkout time on a leap-day', () => {
        const leapDayNow = new Date(
            '2024-02-29T08:00:00.000Z',
        )
        const values: CheckoutFormValues = {
            ...checkoutFormDefaults,
            borrower: 'Pat',
        }

        expect(
            checkoutFormValuesToRequest(
                values,
                leapDayNow,
            ),
        ).toEqual({
            borrower: 'Pat',
            checked_out_at:
                '2024-02-29T08:00:00.000Z',
        })
    })
})
