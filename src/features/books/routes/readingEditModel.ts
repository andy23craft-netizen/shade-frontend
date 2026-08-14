import type {
    BookRead,
    BookUpdate,
} from '../../../api/apiTypes'
import { isDateOnlyString } from '../../../api/dateTime'
import { pickBookUpdate } from '../../../api/requestFields'

export type ReadingEditFormValues = {
    completion_date: string
    rating: string
    review: string
}

export type ReadingEditFormFieldErrors = Partial<
    Record<keyof ReadingEditFormValues, string>
>

export function readingEditFormValuesFromBook(
    book: BookRead,
): ReadingEditFormValues {
    return {
        completion_date:
            book.completion_date ?? '',
        rating:
            book.rating === null ||
            book.rating === undefined
                ? ''
                : String(book.rating),
        review:
            book.review ?? '',
    }
}

export function validateReadingEditFormValues(
    values: ReadingEditFormValues,
): ReadingEditFormFieldErrors {
    const errors: ReadingEditFormFieldErrors = {}

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

export function readingEditFormValuesToRequest(
    originalBook: BookRead,
    values: ReadingEditFormValues,
): BookUpdate {
    const request: BookUpdate = {}

    const originalCompletionDate =
        originalBook.completion_date?.trim() ?? ''

    const completionDate =
        values.completion_date.trim()

    if (
        completionDate !==
        originalCompletionDate
    ) {
        request.completion_date =
            completionDate || null
    }

    const originalRating =
        originalBook.rating === null ||
        originalBook.rating === undefined
            ? ''
            : String(originalBook.rating)

    const rating = values.rating.trim()

    if (rating !== originalRating) {
        request.rating =
            rating
                ? Number(rating)
                : null
    }

    const originalReview =
        originalBook.review?.trim() ?? ''

    const review =
        values.review.trim()

    if (review !== originalReview) {
        request.review =
            review || null
    }

    return pickBookUpdate(request)
}

export function hasReadingEditChanges(
    originalBook: BookRead,
    values: ReadingEditFormValues,
): boolean {
    return (
        Object.keys(
            readingEditFormValuesToRequest(
                originalBook,
                values,
            ),
        ).length > 0
    )
}
