import type {
    ShelfRead,
} from '../../api/apiTypes'

export const SYSTEM_SHELF_COMMON_NAMES = [
    'unknown',
    'removed',
] as const

export type SystemShelfCommonName =
    (typeof SYSTEM_SHELF_COMMON_NAMES)[number]

/**
 * Title Case an API shelf `common_name` for display (underscores become spaces).
 */
export function formatShelfCommonNameForDisplay(
    commonName: string,
): string {
    const normalized = commonName
        .replaceAll('_', ' ')
        .trim()
        .replace(/\s+/g, ' ')

    if (normalized === '') {
        return ''
    }

    return normalized
        .split(' ')
        .map((word) => {
            if (word.length === 0) {
                return word
            }

            return (
                word.charAt(0).toUpperCase() +
                word.slice(1).toLowerCase()
            )
        })
        .join(' ')
}

export function normalizeShelfCommonName(
    commonName: string,
): string {
    return commonName.trim().toLowerCase()
}

export function isSystemShelfCommonName(
    commonName: string,
): commonName is SystemShelfCommonName {
    const normalized =
        normalizeShelfCommonName(commonName)

    return (
        SYSTEM_SHELF_COMMON_NAMES as readonly string[]
    ).includes(normalized)
}

export function isAssignableShelf(
    shelf: Pick<ShelfRead, 'common_name'>,
): boolean {
    return (
        normalizeShelfCommonName(
            shelf.common_name,
        ) !== 'removed'
    )
}

export function filterAssignableShelves(
    shelves: readonly ShelfRead[],
): ShelfRead[] {
    return shelves.filter(isAssignableShelf)
}

export function shelfCommonNameById(
    shelves: readonly ShelfRead[],
    shelfId: string,
): string | undefined {
    if (shelfId === '') {
        return undefined
    }

    const match = shelves.find(
        (shelf) => shelf.shelf_id === shelfId,
    )

    return match?.common_name
}

export function shelfIdByCommonName(
    shelves: readonly ShelfRead[],
    commonName: string,
): string | undefined {
    const normalized =
        normalizeShelfCommonName(commonName)

    const match = shelves.find(
        (shelf) =>
            normalizeShelfCommonName(
                shelf.common_name,
            ) === normalized,
    )

    return match?.shelf_id
}
