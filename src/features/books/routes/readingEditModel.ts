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

/** Converts only at save time: the draft text is never rewritten while typing. */
export function normalizeCompletionDate(
    value: string,
): string | null {
    const trimmed = value.trim()

    if (trimmed === '') return ''
    if (/^\d{4}$/.test(trimmed)) return `${trimmed}-01-01T00:00:00.000Z`
    if (/^\d{4}-\d{2}$/.test(trimmed)) {
        const [, month] = trimmed.split('-').map(Number)
        if (month < 1 || month > 12) return null
        return `${trimmed}-01T00:00:00.000Z`
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        if (!isDateOnlyString(trimmed)) return null
        const parsedDate = new Date(`${trimmed}T00:00:00.000Z`)
        return parsedDate.toISOString().slice(0, 10) === trimmed
            ? `${trimmed}T00:00:00.000Z`
            : null
    }

    const parsed = new Date(trimmed)
    return Number.isNaN(parsed.valueOf()) ? null : parsed.toISOString()
}

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

    if (completionDate && normalizeCompletionDate(completionDate) === null) {
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

    const originalCompletionDate = normalizeCompletionDate(
        originalBook.completion_date?.trim() ?? '',
    )

    const completionDate =
        values.completion_date.trim()

    const normalizedCompletionDate = normalizeCompletionDate(completionDate)
    if (normalizedCompletionDate !== originalCompletionDate) {
        request.completion_date =
            normalizedCompletionDate || null
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
