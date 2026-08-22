import type {
    CollectionBookCreate,
    CollectionCreate,
    CollectionRead,
    CollectionUpdate,
} from '../../api/apiTypes'
import {
    isValidIsbn,
} from '../books/utils/isbn'

export interface CollectionCreateFormValues {
    name: string
    description: string
}

export type CollectionCreateField =
    | 'name'
    | 'description'

export type CollectionCreateFieldErrors = Partial<
    Record<CollectionCreateField, string>
>

export interface CollectionEditFormValues {
    name: string
    description: string
}

export type CollectionEditField =
    | 'name'
    | 'description'

export type CollectionEditFieldErrors = Partial<
    Record<CollectionEditField, string>
>

export interface AddCollectionBookFormValues {
    collectionId: string
    isbn13: string
    title: string
    author: string
    bookId: string
    notes: string
}

export type AddCollectionBookField =
    | 'collectionId'
    | 'isbn13'
    | 'title'
    | 'author'
    | 'bookId'
    | 'notes'

export type AddCollectionBookFieldErrors = Partial<
    Record<AddCollectionBookField, string>
>

export const emptyCollectionCreateFormValues:
    CollectionCreateFormValues = {
    name: '',
    description: '',
}

export const emptyAddCollectionBookFormValues:
    AddCollectionBookFormValues = {
    collectionId: '',
    isbn13: '',
    title: '',
    author: '',
    bookId: '',
    notes: '',
}

export function validateCollectionCreateFormValues(
    values: CollectionCreateFormValues,
): CollectionCreateFieldErrors {
    const errors: CollectionCreateFieldErrors = {}
    const name = values.name.trim()

    if (name === '') {
        errors.name =
            'Enter a name for the collection.'
    } else if (name.length > 255) {
        errors.name =
            'Name must be 255 characters or fewer.'
    }

    return errors
}

export function formValuesToCollectionCreate(
    values: CollectionCreateFormValues,
): CollectionCreate {
    const description =
        values.description.trim()

    return {
        name: values.name.trim(),
        description:
            description === ''
                ? null
                : description,
    }
}

export function collectionEditFormValuesFromCollection(
    collection: CollectionRead,
): CollectionEditFormValues {
    return {
        name: collection.name,
        description: collection.description ?? '',
    }
}

export function validateCollectionEditFormValues(
    values: CollectionEditFormValues,
): CollectionEditFieldErrors {
    const errors: CollectionEditFieldErrors = {}
    const name = values.name.trim()

    if (name === '') {
        errors.name =
            'Enter a name for the collection.'
    } else if (name.length > 255) {
        errors.name =
            'Name must be 255 characters or fewer.'
    }

    return errors
}

export function formValuesToCollectionUpdate(
    values: CollectionEditFormValues,
    original: CollectionRead,
): CollectionUpdate {
    const update: CollectionUpdate = {}

    const name = values.name.trim()

    if (name !== original.name) {
        update.name = name
    }

    const trimmedDescription =
        values.description.trim()

    const description =
        trimmedDescription === ''
            ? null
            : trimmedDescription

    if (description !== original.description) {
        update.description = description
    }

    return update
}

export function validateAddCollectionBookFormValues(
    values: AddCollectionBookFormValues,
): AddCollectionBookFieldErrors {
    const errors:
        AddCollectionBookFieldErrors = {}

    if (values.collectionId.trim() === '') {
        errors.collectionId =
            'Choose a collection.'
    }

    const isbn = values.isbn13.trim()

    if (isbn !== '' && !isValidIsbn(isbn)) {
        errors.isbn13 =
            'Enter a valid ISBN-10 or ISBN-13.'
    }

    const hasIsbn = isbn !== ''
    const hasTitle =
        values.title.trim() !== ''
    const hasAuthor =
        values.author.trim() !== ''

    if (
        !hasIsbn &&
        !hasTitle &&
        !hasAuthor &&
        values.bookId.trim() === ''
    ) {
        errors.title =
            'Enter an ISBN, title, or author to find a book.'
    }

    if (values.bookId.trim() === '') {
        errors.bookId =
            'Choose a book to add.'
    }

    return errors
}

export function formValuesToCollectionBookCreate(
    values: AddCollectionBookFormValues,
): CollectionBookCreate {
    const notes = values.notes.trim()

    return {
        book_id: values.bookId.trim(),
        ...(notes === ''
            ? {}
            : {
                notes,
            }),
    }
}
