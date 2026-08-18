import type { BookRead } from '../../api/apiTypes'
import {
    compactIsbnForListFilter,
} from '../books/utils/isbn'
import {
    isCheckoutEligible,
} from './checkoutEligibility'

export type AuthorTitleAlternateQuery = {
    author: string
    title: string
}

export function buildIsbnAlternateQuery(
    book: BookRead,
): string | null {
    const isbn = compactIsbnForListFilter(
        book.isbn13 ?? '',
    )

    return isbn === '' ? null : isbn
}

export function buildAuthorTitleAlternateQuery(
    book: BookRead,
): AuthorTitleAlternateQuery | null {
    const author = book.authors.trim()
    const title = book.title.trim()

    if (author === '' || title === '') {
        return null
    }

    return {
        author,
        title,
    }
}

export function filterCheckoutAlternatives(
    items: readonly BookRead[],
    blockedBookId: string,
): BookRead[] {
    return items.filter(
        (book) =>
            book.id !== blockedBookId &&
            isCheckoutEligible(book),
    )
}

export function mergeCheckoutAlternatives(
    isbnItems: readonly BookRead[],
    authorTitleItems: readonly BookRead[],
    blockedBookId: string,
): BookRead[] {
    const isbnAlternatives =
        filterCheckoutAlternatives(
            isbnItems,
            blockedBookId,
        )

    const authorTitleAlternatives =
        filterCheckoutAlternatives(
            authorTitleItems,
            blockedBookId,
        )

    const seen = new Set<string>()
    const merged: BookRead[] = []

    for (const book of [
        ...isbnAlternatives,
        ...authorTitleAlternatives,
    ]) {
        if (seen.has(book.id)) {
            continue
        }

        seen.add(book.id)
        merged.push(book)
    }

    return merged
}
