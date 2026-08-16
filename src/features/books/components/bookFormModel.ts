import type {
    BookCreate,
    ShelfRead,
} from '../../../api/apiTypes'
import {
    shelfCommonNameById,
} from '../../shelves/shelfDisplay'
import {
    isValidIsbn,
} from '../utils/isbn'
import type {
    BookFormValues,
} from './BookForm'

export type BookFormField =
    | keyof BookFormValues

export type BookFormFieldErrors =
    Partial<Record<BookFormField, string>>

const TITLE_AUTHORS_MAX_LENGTH = 255
const PUBLISHER_MAX_LENGTH = 255

/**
 * Trim tags, drop empties, and remove duplicates while preserving first-seen order.
 */
export function normalizeTags(
    tags: readonly string[],
): string[] {
    const seen = new Set<string>()
    const result: string[] = []

    for (const tag of tags) {
        const trimmed = tag.trim()

        if (
            trimmed === '' ||
            seen.has(trimmed)
        ) {
            continue
        }

        seen.add(trimmed)
        result.push(trimmed)
    }

    return result
}

/**
 * Parse a comma-separated tags input into a normalized tag list.
 */
export function parseTagsInput(
    value: string,
): string[] {
    return normalizeTags(value.split(','))
}

export function validateBookFormValues(
    values: BookFormValues,
): BookFormFieldErrors {
    const errors: BookFormFieldErrors = {}

    const title = values.title.trim()

    if (title === '') {
        errors.title = 'Title is required.'
    } else if (
        title.length > TITLE_AUTHORS_MAX_LENGTH
    ) {
        errors.title =
            `Title must be at most ${TITLE_AUTHORS_MAX_LENGTH} characters.`
    }

    const authors = values.authors.trim()

    if (authors === '') {
        errors.authors =
            'Authors are required.'
    } else if (
        authors.length >
        TITLE_AUTHORS_MAX_LENGTH
    ) {
        errors.authors =
            `Authors must be at most ${TITLE_AUTHORS_MAX_LENGTH} characters.`
    }

    if (values.shelfId.trim() === '') {
        errors.shelfId = 'Shelf is required.'
    }

    const isbn = values.isbn13.trim()

    if (
        isbn !== '' &&
        !isValidIsbn(isbn)
    ) {
        errors.isbn13 =
            'Enter a valid ISBN-10 or ISBN-13.'
    }

    const publisher =
        values.publisher.trim()

    if (
        publisher.length >
        PUBLISHER_MAX_LENGTH
    ) {
        errors.publisher =
            `Publisher must be at most ${PUBLISHER_MAX_LENGTH} characters.`
    }

    const pages = values.pages.trim()

    if (pages !== '') {
        if (
            !/^\d+$/.test(pages) ||
            Number(pages) < 1
        ) {
            errors.pages =
                'Pages must be a positive whole number.'
        }
    }

    const purchasePrice =
        values.purchase_price.trim()

    if (purchasePrice !== '') {
        const number = Number(purchasePrice)

        if (!Number.isFinite(number)) {
            errors.purchase_price =
                'Enter a valid purchase price.'
        }
    }

    return errors
}

export function formValuesToBookCreate(
    values: BookFormValues,
    shelves: readonly ShelfRead[],
): BookCreate {
    const tags = parseTagsInput(values.tags)
    const shelfName = shelfCommonNameById(
        shelves,
        values.shelfId,
    )

    if (shelfName === undefined) {
        throw new Error(
            'A valid shelf must be selected before creating a book.',
        )
    }

    return {
        title: values.title.trim(),
        authors: values.authors.trim(),
        category: values.category,
        shelf_name: shelfName,
        is_read: false,
        status: 'available',

        isbn13:
            values.isbn13.trim() === ''
                ? null
                : values.isbn13.trim(),

        publisher:
            values.publisher.trim() === ''
                ? null
                : values.publisher.trim(),

        publication_date:
            values.publication_date.trim() === ''
                ? null
                : values.publication_date.trim(),

        pages:
            values.pages.trim() === ''
                ? null
                : Number(values.pages),

        acquisition_source:
            values.acquisition_source.trim() === ''
                ? null
                : values.acquisition_source.trim(),

        purchase_date:
            values.purchase_date.trim() === ''
                ? null
                : values.purchase_date.trim(),

        purchase_price:
            values.purchase_price.trim() === ''
                ? null
                : Number(values.purchase_price),

        notes:
            values.notes.trim() === ''
                ? null
                : values.notes.trim(),

        tags:
            tags.length === 0
                ? null
                : tags,
    }
}
