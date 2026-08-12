/* dateTime.ts */

const DATE_ONLY_PATTERN =
    /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * Format a Date as a calendar date string `YYYY-MM-DD` in local time.
 * Use for user-entered purchase / completion dates (not publication_date).
 */
export function formatDateOnly(
    date: Date,
): string {
    const year = String(date.getFullYear())
        .padStart(4, '0')
    const month = String(date.getMonth() + 1)
        .padStart(2, '0')
    const day = String(date.getDate())
        .padStart(2, '0')

    return `${year}-${month}-${day}`
}

/**
 * Format a Date as a UTC ISO 8601 timestamp ending in `Z`.
 */
export function formatUtcIso8601(
    date: Date,
): string {
    return date.toISOString()
}

export function isDateOnlyString(
    value: string,
): boolean {
    const match = DATE_ONLY_PATTERN.exec(value)

    if (!match) {
        return false
    }

    const year = Number(match[1])
    const month = Number(match[2])
    const day = Number(match[3])
    const candidate = new Date(
        Date.UTC(year, month - 1, day),
    )

    return (
        candidate.getUTCFullYear() === year &&
        candidate.getUTCMonth() === month - 1 &&
        candidate.getUTCDate() === day
    )
}

/**
 * Normalize a parseable timestamp to UTC ISO 8601 (`...Z`).
 * Throws when the value cannot be parsed as a valid date.
 */
export function normalizeUtcIso8601(
    value: string | Date,
): string {
    const date =
        value instanceof Date
            ? value
            : new Date(value)

    if (Number.isNaN(date.getTime())) {
        throw new RangeError(
            'Unable to normalize timestamp to UTC ISO 8601.',
        )
    }

    return date.toISOString()
}
