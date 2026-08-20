import {
    formatShelfCommonNameForDisplay,
} from '../shelves/shelfDisplay'

export function displayCollectionBookPosition(
    orderNum: number,
): string {
    return String(orderNum)
}

export function displayCollectionBookLocation(
    shelfName: string | null | undefined,
    onWishlist: boolean,
): string {
    if (onWishlist) {
        return 'Wishlist'
    }

    if (
        shelfName === null ||
        shelfName === undefined ||
        shelfName.trim() === ''
    ) {
        return 'Unknown'
    }

    const displayName =
        formatShelfCommonNameForDisplay(
            shelfName,
        )

    return displayName === ''
        ? 'Unknown'
        : displayName
}

export function collectionBookWishlistClassName(
    onWishlist: boolean,
): string | undefined {
    return onWishlist
        ? 'collection-membership--wishlist'
        : undefined
}

export function displayCollectionBookNotes(
    notes: string | null | undefined,
): string | null {
    if (
        notes === null ||
        notes === undefined
    ) {
        return null
    }

    const trimmed = notes.trim()

    return trimmed === ''
        ? null
        : trimmed
}
