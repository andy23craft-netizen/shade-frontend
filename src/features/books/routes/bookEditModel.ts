import type {
    BookRead,
    BookUpdate,
} from '../../../api/apiTypes'
import type {
    BookFormValues,
} from '../components/BookForm'
import {
    parseTagsInput,
} from '../components/bookFormModel'

export function bookFormValuesFromBook(
    book: BookRead,
): BookFormValues {
    return {
        title: book.title,
        authors: book.authors,
        isbn13: book.isbn13 ?? '',
        publisher: book.publisher ?? '',
        publication_date:
            book.publication_date ?? '',
        pages:
            book.pages === null ||
            book.pages === undefined
                ? ''
                : String(book.pages),
        category: book.category,
        shelf: book.shelf,
        tags: book.tags?.join(', ') ?? '',
        acquisition_source:
            book.acquisition_source ?? '',
        purchase_date:
            book.purchase_date ?? '',
        purchase_price:
            book.purchase_price === null ||
            book.purchase_price === undefined
                ? ''
                : String(book.purchase_price),
        notes: book.notes ?? '',
    }
}

function nullableString(
    value: string,
): string | null {
    const trimmed = value.trim()

    return trimmed === ''
        ? null
        : trimmed
}

function nullableNumber(
    value: string,
): number | null {
    const trimmed = value.trim()

    return trimmed === ''
        ? null
        : Number(trimmed)
}

function nullableTags(
    value: string,
): string[] | null {
    const tags = parseTagsInput(value)

    return tags.length === 0
        ? null
        : tags
}

function tagsEqual(
    left: readonly string[] | null | undefined,
    right: readonly string[] | null | undefined,
): boolean {
    const leftTags = left ?? []
    const rightTags = right ?? []

    return (
        leftTags.length === rightTags.length &&
        leftTags.every(
            (tag, index) =>
                tag === rightTags[index],
        )
    )
}

export function bookFormValuesToUpdate(
    original: BookRead,
    values: BookFormValues,
): BookUpdate {
    const update: BookUpdate = {}

    const title = values.title.trim()

    if (title !== original.title) {
        update.title = title
    }

    const authors = values.authors.trim()

    if (authors !== original.authors) {
        update.authors = authors
    }

    const isbn13 =
        nullableString(values.isbn13)

    if (isbn13 !== (original.isbn13 ?? null)) {
        update.isbn13 = isbn13
    }

    const publisher =
        nullableString(values.publisher)

    if (
        publisher !==
        (original.publisher ?? null)
    ) {
        update.publisher = publisher
    }

    const publicationDate =
        nullableString(values.publication_date)

    if (
        publicationDate !==
        (original.publication_date ?? null)
    ) {
        update.publication_date =
            publicationDate
    }

    const pages =
        nullableNumber(values.pages)

    if (pages !== (original.pages ?? null)) {
        update.pages = pages
    }

    if (values.category !== original.category) {
        update.category = values.category
    }

    if (values.shelf !== original.shelf) {
        update.shelf = values.shelf
    }

    const tags = nullableTags(values.tags)

    if (!tagsEqual(tags, original.tags)) {
        update.tags = tags
    }

    const acquisitionSource =
        nullableString(
            values.acquisition_source,
        )

    if (
        acquisitionSource !==
        (original.acquisition_source ?? null)
    ) {
        update.acquisition_source =
            acquisitionSource
    }

    const purchaseDate =
        nullableString(values.purchase_date)

    if (
        purchaseDate !==
        (original.purchase_date ?? null)
    ) {
        update.purchase_date =
            purchaseDate
    }

    const purchasePrice =
        nullableNumber(values.purchase_price)

    if (
        purchasePrice !==
        (original.purchase_price ?? null)
    ) {
        update.purchase_price =
            purchasePrice
    }

    const notes =
        nullableString(values.notes)

    if (notes !== (original.notes ?? null)) {
        update.notes = notes
    }

    return update
}
