import type { CheckinRequest } from '../../api/apiTypes'
import {
    formatUtcIso8601,
} from '../../api/dateTime'

function normalizeCheckinDateTime(
    value: string,
): string {
    const match =
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(
            value,
        )

    if (!match) {
        throw new RangeError(
            'Invalid check-in date and time.',
        )
    }

    const year = Number(match[1])
    const month = Number(match[2])
    const day = Number(match[3])
    const hours = Number(match[4])
    const minutes = Number(match[5])

    if (
        hours > 23 ||
        minutes > 59
    ) {
        throw new RangeError(
            'Invalid check-in date and time.',
        )
    }

    const candidate = new Date(
        year,
        month - 1,
        day,
        hours,
        minutes,
    )

    if (
        candidate.getFullYear() !== year ||
        candidate.getMonth() !== month - 1 ||
        candidate.getDate() !== day ||
        candidate.getHours() !== hours ||
        candidate.getMinutes() !== minutes
    ) {
        throw new RangeError(
            'Invalid check-in date and time.',
        )
    }

    return formatUtcIso8601(candidate)
}

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
            normalizeCheckinDateTime(
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
        returned_at:
            normalizeCheckinDateTime(
                values.returned_at,
            ),
    }
}