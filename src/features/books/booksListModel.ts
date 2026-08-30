import { compactIsbnForListFilter } from './utils/isbn'
import type { PlacementState } from '../../api/apiTypes'

export {
    INFINITE_SCROLL_BATCH_SIZE as BOOKS_BATCH_SIZE,
} from '../shared/infiniteScrollConfig'

export type BookSortBy =
    | 'author'
    | 'title'
    | 'creationDate'
    | 'shelf'

export type BookSortOrder =
    | 'asc'
    | 'desc'

export type BookCleanupField =
    | 'category'
    | 'shelf'
    | 'pages'
    | 'publisher'
    | 'year'
    | 'isbn'

export const DEFAULT_SORT_BY: BookSortBy = 'author'
export const DEFAULT_SORT_ORDER: BookSortOrder = 'asc'

const SORT_BY_VALUES: readonly BookSortBy[] = [
    'author',
    'title',
    'creationDate',
    'shelf',
]

const SORT_ORDER_VALUES: readonly BookSortOrder[] = [
    'asc',
    'desc',
]

const CLEANUP_FIELD_VALUES:
    readonly BookCleanupField[] = [
    'category',
    'shelf',
    'pages',
    'publisher',
    'year',
    'isbn',
]

const PLACEMENT_STATE_VALUES: readonly PlacementState[] = [
    'shelved',
    'stashed',
    'unshelved',
]

export function parsePlacementStateParam(
    value: string | null,
): PlacementState | undefined {
    return value !== null &&
        PLACEMENT_STATE_VALUES.includes(
            value as PlacementState,
        )
        ? value as PlacementState
        : undefined
}

export function parseSortByParam(
    value: string | null,
): BookSortBy {
    if (
        value !== null &&
        SORT_BY_VALUES.includes(
            value as BookSortBy,
        )
    ) {
        return value as BookSortBy
    }

    return DEFAULT_SORT_BY
}

export function parseIsbnParam(
    value: string | null,
): string | undefined {
    if (value === null) {
        return undefined
    }

    const compacted =
        compactIsbnForListFilter(value.trim())

    return compacted === ''
        ? undefined
        : compacted
}

export function parseSortOrderParam(
    value: string | null,
): BookSortOrder {
    if (
        value !== null &&
        SORT_ORDER_VALUES.includes(
            value as BookSortOrder,
        )
    ) {
        return value as BookSortOrder
    }

    return DEFAULT_SORT_ORDER
}

/**
 * Trim, de-dupe, and sort category_id URL values for stable list filters.
 */
export function parseCategoryIdParams(
    values: string[],
): string[] {
    const seen = new Set<string>()
    const result: string[] = []

    for (const value of values) {
        const trimmed = value.trim()

        if (
            trimmed === '' ||
            seen.has(trimmed)
        ) {
            continue
        }

        seen.add(trimmed)
        result.push(trimmed)
    }

    return result.sort()
}

export function parseTextFilterParam(
    value: string | null,
): string | undefined {
    const trimmed = value?.trim()

    return trimmed ? trimmed : undefined
}

export function parseReadStatusParam(
    value: string | null,
): boolean | undefined {
    if (value === 'true') {
        return true
    }

    if (value === 'false') {
        return false
    }

    return undefined
}

export function parseCleanupFieldParam(
    value: string | null,
): BookCleanupField | undefined {
    if (
        value !== null &&
        CLEANUP_FIELD_VALUES.includes(
            value as BookCleanupField,
        )
    ) {
        return value as BookCleanupField
    }

    return undefined
}

export function sortByLabel(
    sortBy: BookSortBy,
): string {
    switch (sortBy) {
        case 'author':
            return 'Author'
        case 'title':
            return 'Title'
        case 'creationDate':
            return 'Date added'
        case 'shelf':
            return 'Shelf'
    }
}

export function sortOrderLabel(
    sortOrder: BookSortOrder,
): string {
    return sortOrder === 'asc'
        ? 'Ascending'
        : 'Descending'
}

export function flattenInfiniteBookPages<
    TItem,
>(
    pages:
        | Array<{
        items: TItem[]
        total: number
    }>
        | undefined,
): TItem[] {
    return pages?.flatMap(
        (page) => page.items,
    ) ?? []
}
