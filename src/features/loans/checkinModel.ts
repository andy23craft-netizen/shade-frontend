import type { CheckinRequest } from '../../api/apiTypes'
import { normalizeUtcIso8601 } from '../../api/dateTime'

export interface CheckinFormValues {
    returned_at: string
}

export interface CheckinFormFieldErrors {
    returned_at?: string
}

export const checkinFormDefaults: CheckinFormValues = {
    returned_at: '',
}

export function validateCheckinFormValues(
    values: CheckinFormValues,
): CheckinFormFieldErrors {
    const errors: CheckinFormFieldErrors = {}

    if (values.returned_at.trim()) {
        try {
            normalizeUtcIso8601(
                values.returned_at,
            )
        } catch {
            errors.returned_at =
                'Enter a valid return date and time.'
        }
    }

    return errors
}

export function checkinFormValuesToRequest(
    values: CheckinFormValues,
): CheckinRequest | undefined {
    if (!values.returned_at.trim()) {
        return undefined
    }

    return {
        returned_at: normalizeUtcIso8601(
            values.returned_at,
        ),
    }
}