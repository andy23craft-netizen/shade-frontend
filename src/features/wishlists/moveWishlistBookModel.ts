import type {
    ShelfRead,
} from '../../api/apiTypes'
import {
    isAssignableShelf,
    shelfCommonNameById,
} from '../shelves/shelfDisplay'

export interface MoveWishlistBookFormValues {
    shelfId: string
}

export interface ShelfNameUpdate {
    shelf_name: string
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
    shelfId: '',
}

export function validateMoveWishlistBookFormValues(
    values: MoveWishlistBookFormValues,
): MoveWishlistBookFieldErrors {
    const errors: MoveWishlistBookFieldErrors = {}

    if (values.shelfId.trim() === '') {
        errors.shelfId = 'Choose a shelf.'
    }

    return errors
}

export function shelfIdToShelfNameUpdate(
    shelfId: string,
    shelves: readonly ShelfRead[],
): ShelfNameUpdate {
    const normalizedShelfId = shelfId.trim()

    if (normalizedShelfId === '') {
        throw new Error(
            'Choose a shelf before adding the book to the collection.',
        )
    }

    const shelf = shelves.find(
        (candidate) =>
            candidate.shelf_id === normalizedShelfId,
    )

    if (shelf === undefined) {
        throw new Error(
            'Choose a valid shelf.',
        )
    }

    if (!isAssignableShelf(shelf)) {
        throw new Error(
            'Choose a shelf that can hold books.',
        )
    }

    const shelfName = shelfCommonNameById(
        shelves,
        normalizedShelfId,
    )

    if (shelfName === undefined) {
        throw new Error(
            'Choose a valid shelf.',
        )
    }

    return {
        shelf_name: shelfName,
    }
}
