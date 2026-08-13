import type { CheckoutRequest } from '../../api/apiTypes'
import {
    isDateOnlyString,
    normalizeUtcIso8601,
} from '../../api/dateTime'

export interface CheckoutFormValues {
    borrower: string
    checked_out_at: string
    due_at: string
    notes: string
}

export interface CheckoutFormFieldErrors {
    borrower?: string
    checked_out_at?: string
    due_at?: string
    notes?: string
}

export const checkoutFormDefaults: CheckoutFormValues = {
    borrower: '',
    checked_out_at: '',
    due_at: '',
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

    if (values.checked_out_at.trim()) {
        try {
            normalizeUtcIso8601(
                values.checked_out_at,
            )
        } catch {
            errors.checked_out_at =
                'Enter a valid checkout date and time.'
        }
    }

    if (values.due_at.trim()) {
        if (!isDateOnlyString(values.due_at.trim())) {
            errors.due_at =
                'Enter a valid due date.'
        }
    }

    return errors
}

export function checkoutFormValuesToRequest(
    values: CheckoutFormValues,
): CheckoutRequest {
    const request: CheckoutRequest = {
        borrower: values.borrower.trim(),
    }

    if (values.checked_out_at.trim()) {
        request.checked_out_at =
            normalizeUtcIso8601(
                values.checked_out_at,
            )
    }

    if (values.due_at.trim()) {
        request.due_at =
            values.due_at.trim()
    }

    if (values.notes.trim()) {
        request.notes = values.notes.trim()
    }

    return request
}