import type {
    ShelfCreate,
    ShelfRead,
    ShelfUpdate,
} from '../../api/apiTypes'
import {
    isSystemShelfCommonName,
    normalizeShelfCommonName,
} from './shelfDisplay'

export type ShelfFormField =
    | 'common_name'
    | 'location'
    | 'description'

export type ShelfFormFieldErrors = Partial<
    Record<ShelfFormField, string>
>

export interface ShelfFormValues {
    common_name: string
    location: string
    description: string
}

export const emptyShelfFormValues: ShelfFormValues =
    {
        common_name: '',
        location: '',
        description: '',
    }

const COMMON_NAME_MAX_LENGTH = 32

export function shelfFormValuesFromShelf(
    shelf: ShelfRead,
): ShelfFormValues {
    return {
        common_name: shelf.common_name,
        location: shelf.location ?? '',
        description: shelf.description ?? '',
    }
}

export function validateShelfFormValues(
    values: ShelfFormValues,
    options: {
        allowRename?: boolean
    } = {},
): ShelfFormFieldErrors {
    const errors: ShelfFormFieldErrors = {}
    const allowRename = options.allowRename ?? true

    if (allowRename) {
        const trimmed = values.common_name.trim()

        if (trimmed === '') {
            errors.common_name =
                'Enter a shelf name.'
        } else if (
            trimmed.length > COMMON_NAME_MAX_LENGTH
        ) {
            errors.common_name =
                `Shelf names must be ${COMMON_NAME_MAX_LENGTH} characters or fewer.`
        } else if (
            isSystemShelfCommonName(trimmed)
        ) {
            errors.common_name =
                'Reserved system shelf names cannot be used.'
        }
    }

    return errors
}

export function formValuesToShelfCreate(
    values: ShelfFormValues,
): ShelfCreate {
    const commonName = normalizeShelfCommonName(
        values.common_name,
    )

    if (commonName === '') {
        throw new Error('Enter a shelf name.')
    }

    if (commonName.length > COMMON_NAME_MAX_LENGTH) {
        throw new Error(
            `Shelf names must be ${COMMON_NAME_MAX_LENGTH} characters or fewer.`,
        )
    }

    if (isSystemShelfCommonName(commonName)) {
        throw new Error(
            'Reserved system shelf names cannot be used.',
        )
    }

    const shelf: ShelfCreate = {
        common_name: commonName,
    }

    const location = values.location.trim()
    const description = values.description.trim()

    if (location !== '') {
        shelf.location = location
    }

    if (description !== '') {
        shelf.description = description
    }

    return shelf
}

export function formValuesToShelfUpdate(
    values: ShelfFormValues,
    original: ShelfRead,
    options: {
        allowRename?: boolean
    } = {},
): ShelfUpdate {
    const allowRename = options.allowRename ?? true
    const patch: ShelfUpdate = {}

    if (allowRename) {
        const nextName = normalizeShelfCommonName(
            values.common_name,
        )
        const originalName =
            normalizeShelfCommonName(
                original.common_name,
            )

        if (nextName === '') {
            throw new Error('Enter a shelf name.')
        }

        if (nextName.length > COMMON_NAME_MAX_LENGTH) {
            throw new Error(
                `Shelf names must be ${COMMON_NAME_MAX_LENGTH} characters or fewer.`,
            )
        }

        if (
            nextName !== originalName &&
            isSystemShelfCommonName(nextName)
        ) {
            throw new Error(
                'Reserved system shelf names cannot be used.',
            )
        }

        if (nextName !== originalName) {
            patch.common_name = nextName
        }
    }

    const nextLocation = values.location.trim()
    const originalLocation =
        (original.location ?? '').trim()

    if (nextLocation !== originalLocation) {
        patch.location =
            nextLocation === ''
                ? null
                : nextLocation
    }

    const nextDescription =
        values.description.trim()
    const originalDescription =
        (original.description ?? '').trim()

    if (nextDescription !== originalDescription) {
        patch.description =
            nextDescription === ''
                ? null
                : nextDescription
    }

    return patch
}

export function shelfUpdateHasChanges(
    patch: ShelfUpdate,
): boolean {
    return Object.keys(patch).length > 0
}
