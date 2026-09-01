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

export function checkoutFormValuesToRequest(
    values: CheckoutFormValues,
    now: Date,
): CheckoutRequest {
    const request: CheckoutRequest = {
        borrower: values.borrower.trim(),
        checked_out_at: formatUtcIso8601(now),
    }

    if (values.notes.trim()) {
        request.notes = values.notes.trim()
    }

    return request
}
