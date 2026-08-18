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
