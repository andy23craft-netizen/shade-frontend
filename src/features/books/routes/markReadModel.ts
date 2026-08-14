import type {
    MarkReadRequest,
} from '../../../api/apiTypes'
import { isDateOnlyString } from '../../../api/dateTime'
import { pickMarkReadRequest } from '../../../api/requestFields'

export type MarkReadFormValues = {
    completion_date: string
    rating: string
    review: string
}

export type MarkReadFormFieldErrors = Partial<
    Record<keyof MarkReadFormValues, string>
>

export const markReadFormDefaults: MarkReadFormValues = {
    completion_date: '',
    rating: '',
    review: '',
}

export function validateMarkReadFormValues(
    values: MarkReadFormValues,
): MarkReadFormFieldErrors {
    const errors: MarkReadFormFieldErrors = {}

    const completionDate =
        values.completion_date.trim()

    if (
        completionDate &&
        !isDateOnlyString(completionDate)
    ) {
        errors.completion_date =
            'Enter a valid completion date.'
    }

    const rating = values.rating.trim()

    if (rating) {
        if (!/^\d+$/.test(rating)) {
            errors.rating =
                'Rating must be a whole number from 1 through 5.'
        } else {
            const numericRating = Number(rating)

            if (
                numericRating < 1 ||
                numericRating > 5
            ) {
                errors.rating =
                    'Rating must be from 1 through 5.'
            }
        }
    }

    return errors
}

export function markReadFormValuesToRequest(
    values: MarkReadFormValues,
): MarkReadRequest {
    const request: MarkReadRequest = {}

    const completionDate =
        values.completion_date.trim()

    const rating = values.rating.trim()

    const review = values.review.trim()

    if (completionDate) {
        request.completion_date =
            completionDate
    }

    if (rating) {
        request.rating = Number(rating)
    }

    if (review) {
        request.review = review
    }

    return pickMarkReadRequest(request)
}
