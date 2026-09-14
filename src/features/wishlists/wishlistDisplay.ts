import {
    enumDisplayValue,
} from '../../api/enumDisplay'

export const WISHLIST_BOOK_STATUS_VALUES = [
    'wanted',
    'ordered',
    'owned',
    'dropped',
] as const

function toTitleCase(value: string): string {
    return value.replace(/\b\w/g, (character) =>
        character.toUpperCase(),
    )
}

export function displayWishlistBookStatus(
    value: string,
): string {
    const status = enumDisplayValue(
        value,
        WISHLIST_BOOK_STATUS_VALUES,
    )

    if (!status.known) {
        return `${status.value} (unknown)`
    }

    return toTitleCase(
        status.value.replaceAll('_', ' '),
    )
}

export function displayWishlistPriority(
    priority: number | null | undefined,
): string {
    if (
        priority === null ||
        priority === undefined
    ) {
        return '—'
    }

    return String(priority)
}

export function safeHttpUrl(
    value: string | null | undefined,
): string | null {
    if (
        value === null ||
        value === undefined
    ) {
        return null
    }

    const trimmed = value.trim()

    if (trimmed === '') {
        return null
    }

    try {
        const url = new URL(trimmed)

        if (
            url.protocol !== 'http:' &&
            url.protocol !== 'https:'
        ) {
            return null
        }

        return url.href
    } catch {
        return null
    }
}

/**
 * Better World Books accepts a single search query. ISBN is preferred when
 * the wishlist response supplies it; otherwise title and author identify the
 * edition as closely as the available wishlist data allows.
 */
export function betterWorldBooksSearchUrl({
    title,
    author,
    isbn13,
}: {
    title: string
    author?: string | null
    isbn13?: string | null
}): string {
    const isbn = isbn13?.trim()
    const query = isbn && isbn !== ''
        ? isbn
        : [title, author]
            .filter((part): part is string =>
                typeof part === 'string' && part.trim() !== '',
            )
            .join(' ')

    return `https://www.betterworldbooks.com/search/results?q=${encodeURIComponent(query)}`
}
