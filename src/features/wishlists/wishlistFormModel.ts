import type {
    BookCreate,
    WishlistBookStatus,
    WishlistCreate,
} from '../../api/apiTypes'
import {
    isValidIsbn,
} from '../books/utils/isbn'
import {
    WISHLIST_BOOK_STATUS_VALUES,
} from './wishlistDisplay'

export interface WishlistCreateFormValues {
    name: string
    description: string
}

export type WishlistCreateField =
    | 'name'
    | 'description'

export type WishlistCreateFieldErrors = Partial<
    Record<WishlistCreateField, string>
>

export interface AddWishlistBookFormValues {
    wishlistId: string
    title: string
    authors: string
    isbn13: string
    status: WishlistBookStatus
}

export type AddWishlistBookField =
    | 'wishlistId'
    | 'title'
    | 'authors'
    | 'isbn13'
    | 'status'

export type AddWishlistBookFieldErrors = Partial<
    Record<AddWishlistBookField, string>
>

export const emptyWishlistCreateFormValues:
    WishlistCreateFormValues = {
        name: '',
        description: '',
    }

export const emptyAddWishlistBookFormValues:
    AddWishlistBookFormValues = {
        wishlistId: '',
        title: '',
        authors: '',
        isbn13: '',
        status: 'wanted',
    }

export function isWishlistBookStatus(
    value: string,
): value is WishlistBookStatus {
    return (
        WISHLIST_BOOK_STATUS_VALUES as readonly string[]
    ).includes(value)
}

export function validateWishlistCreateFormValues(
    values: WishlistCreateFormValues,
): WishlistCreateFieldErrors {
    const errors: WishlistCreateFieldErrors = {}
    const name = values.name.trim()

    if (name === '') {
        errors.name =
            'Enter a name for the wishlist.'
    } else if (name.length > 255) {
        errors.name =
            'Name must be 255 characters or fewer.'
    }

    return errors
}

export function formValuesToWishlistCreate(
    values: WishlistCreateFormValues,
): WishlistCreate {
    const description = values.description.trim()

    return {
        name: values.name.trim(),
        description:
            description === ''
                ? null
                : description,
    }
}

export function validateAddWishlistBookFormValues(
    values: AddWishlistBookFormValues,
): AddWishlistBookFieldErrors {
    const errors: AddWishlistBookFieldErrors = {}

    if (values.wishlistId.trim() === '') {
        errors.wishlistId =
            'Choose a wishlist.'
    }

    if (values.title.trim() === '') {
        errors.title = 'Enter a title.'
    }

    if (values.authors.trim() === '') {
        errors.authors = 'Enter the authors.'
    }

    const isbn = values.isbn13.trim()

    if (isbn !== '' && !isValidIsbn(isbn)) {
        errors.isbn13 =
            'Enter a valid ISBN-10 or ISBN-13.'
    }

    if (!isWishlistBookStatus(values.status)) {
        errors.status =
            'Choose a valid membership status.'
    }

    return errors
}

export function formValuesToUnshelvedBookCreate(
    values: AddWishlistBookFormValues,
): BookCreate {
    const book: BookCreate = {
        title: values.title.trim(),
        authors: values.authors.trim(),
        category_ids: [],
        is_read: false,
        status: 'available',
    }

    const isbn = values.isbn13.trim()

    if (isbn !== '') {
        book.isbn13 = isbn
    }

    return book
}
