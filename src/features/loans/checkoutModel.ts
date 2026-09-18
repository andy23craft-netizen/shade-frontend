import type { BookCheckoutRequest } from '../../api/apiTypes'
import { formatUtcIso8601 } from '../../api/dateTime'

export interface CheckoutFormValues {
    borrower: string
    borrowerEmail: string
    notes: string
}

export interface CheckoutFormFieldErrors {
    borrower?: string
    borrowerEmail?: string
    notes?: string
}

export const checkoutFormDefaults: CheckoutFormValues = {
    borrower: '',
    borrowerEmail: '',
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

    const borrowerEmail = values.borrowerEmail.trim()

    if (borrowerEmail.length > 254) {
        errors.borrowerEmail =
            'Email address must be 254 characters or fewer.'
    } else if (
        borrowerEmail &&
        !/^[^\s@]+@[^\s@]+$/.test(borrowerEmail)
    ) {
        errors.borrowerEmail =
            'Enter a valid email address.'
    }

    return errors
}

export function checkoutFormValuesToRequest(
    values: CheckoutFormValues,
    now: Date,
): BookCheckoutRequest {
    const request: BookCheckoutRequest = {
        borrower: values.borrower.trim(),
        checked_out_at: formatUtcIso8601(now),
    }

    if (values.notes.trim()) {
        request.notes = values.notes.trim()
    }

    if (values.borrowerEmail.trim()) {
        request.borrower_email = values.borrowerEmail.trim()
    }

    return request
}
