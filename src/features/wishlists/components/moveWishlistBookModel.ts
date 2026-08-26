import type {
    WishlistBookCreate,
    WishlistBookRead,
    WishlistRead,
} from '../../../api/apiTypes'

export interface MoveWishlistBookFormValues {
    destinationWishlistId: string
}

export type MoveWishlistBookField =
    keyof MoveWishlistBookFormValues

export type MoveWishlistBookFieldErrors =
    Partial<
        Record<
            MoveWishlistBookField,
            string
        >
    >

export const emptyMoveWishlistBookFormValues:
    MoveWishlistBookFormValues = {
    destinationWishlistId: '',
}

export function validateMoveWishlistBookFormValues(
    values: MoveWishlistBookFormValues,
    sourceWishlistId: string,
    wishlists: readonly WishlistRead[],
): MoveWishlistBookFieldErrors {
    const errors: MoveWishlistBookFieldErrors = {}

    const destinationWishlistId =
        values.destinationWishlistId.trim()

    if (destinationWishlistId === '') {
        errors.destinationWishlistId =
            'Choose a destination wishlist.'

        return errors
    }

    if (destinationWishlistId === sourceWishlistId) {
        errors.destinationWishlistId =
            'Choose a different wishlist.'

        return errors
    }

    const destinationExists = wishlists.some(
        (wishlist) =>
            wishlist.wishlist_id ===
            destinationWishlistId,
    )

    if (!destinationExists) {
        errors.destinationWishlistId =
            'Choose a valid wishlist.'
    }

    return errors
}

export function membershipToWishlistBookCreate(
    membership: WishlistBookRead,
): WishlistBookCreate {
    return {
        book_id: membership.book_id,
        status: membership.status,
        priority: membership.priority,
        notes: membership.notes,
        url: membership.url,
    }
}
