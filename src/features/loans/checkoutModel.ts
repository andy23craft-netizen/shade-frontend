import type { CheckoutRequest } from '../../api/apiTypes'
import { formatUtcIso8601 } from '../../api/dateTime'

export interface CheckoutFormValues {
    borrower: string
    notes: string
}

export interface CheckoutFormFieldErrors {
    borrower?: string
    notes?: string
}

export const checkoutFormDefaults: CheckoutFormValues = {
    borrower: '',
    notes: '',
}

export function validateCheckoutFormValues(
    values: CheckoutFormValues,
): CheckoutFormFieldErrors {
    const errors: CheckoutFormFieldErrors = {}

    if (!values.borrower.trim()) {
        errors.borrower = 'Borrower is required.'
    } else if (values.borrower.length > 255) {
        errors.borrower =
            'Borrower must be 255 characters or fewer.'
    }

    return errors
}

/**
 * UTC calendar date of noon on the day 366 days after `now`'s UTC checkout day (`YYYY-MM-DD`).
 */
export function dueAtOneYearFrom(now: Date): string {
    const noonUtc = new Date(
        Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            12,
            0,
            0,
            0,
        ),
    )

    noonUtc.setUTCDate(noonUtc.getUTCDate() + 366)

    const year = String(noonUtc.getUTCFullYear()).padStart(
        4,
        '0',
    )
    const month = String(
        noonUtc.getUTCMonth() + 1,
    ).padStart(2, '0')
    const day = String(noonUtc.getUTCDate()).padStart(
        2,
        '0',
    )

    return `${year}-${month}-${day}`
}

export function checkoutFormValuesToRequest(
    values: CheckoutFormValues,
    now: Date,
): CheckoutRequest {
    const request: CheckoutRequest = {
        borrower: values.borrower.trim(),
        checked_out_at: formatUtcIso8601(now),
        due_at: dueAtOneYearFrom(now),
    }

    if (values.notes.trim()) {
        request.notes = values.notes.trim()
    }

    return request
}
