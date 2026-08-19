import {
    describe,
    expect,
    it,
} from 'vitest'

import {
    checkoutFormDefaults,
    checkoutFormValuesToRequest,
    dueAtOneYearFrom,
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

describe('dueAtOneYearFrom', () => {
    it('is noon UTC 366 days after a non-leap checkout day', () => {
        expect(
            dueAtOneYearFrom(
                new Date('2026-01-15T15:30:45.123Z'),
            ),
        ).toBe('2027-01-16')
    })

    it('accounts for a leap-day checkout day', () => {
        expect(
            dueAtOneYearFrom(
                new Date('2024-02-29T23:45:00.000Z'),
            ),
        ).toBe('2025-03-01')
    })
})

describe('checkoutFormValuesToRequest', () => {
    const now = new Date(
        '2026-08-19T15:30:45.123Z',
    )

    it('trims borrower and records checkout time and due date', () => {
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
            due_at: '2027-08-20',
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
            due_at: '2027-08-20',
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
            due_at: '2027-08-20',
        })

        expect(request).not.toHaveProperty('notes')
    })

    it('uses the same now for checkout time and due date on a leap-day', () => {
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
            due_at: dueAtOneYearFrom(leapDayNow),
        })

        expect(dueAtOneYearFrom(leapDayNow)).toBe(
            '2025-03-01',
        )
    })
})
