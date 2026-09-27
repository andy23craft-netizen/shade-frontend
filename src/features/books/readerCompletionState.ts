import type { BookRead } from '../../api/apiTypes'

export type BookCompletionState = {
    hasRecord: boolean
    isComplete: boolean
    completionDate: string | null | undefined
    rating: number | null | undefined
    review: string | null | undefined
}

/**
 * Project a book's completion fields for a selected household reader. The API
 * intentionally keeps the top-level fields as the owner's values, including
 * when a list was filtered with profile_id.
 */
export function bookCompletionState(
    book: BookRead,
    profileId?: string,
): BookCompletionState {
    if (profileId === undefined) {
        return {
            hasRecord: book.is_read,
            isComplete: book.is_read,
            completionDate: book.completion_date,
            rating: book.rating,
            review: book.review,
        }
    }

    const state = book.reader_states?.find(
        (item) => item.profile_id === profileId,
    )

    return {
        hasRecord: state?.has_record ?? false,
        isComplete: state?.is_complete === true,
        completionDate: state?.completion_date,
        rating: state?.rating,
        review: state?.review,
    }
}
