import type { Category } from '../../api/apiTypes'

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

export const DEFAULT_SORT_BY: BookSortBy = 'author'
export const DEFAULT_SORT_ORDER: BookSortOrder = 'asc'

export const CATEGORY_FILTER_VALUES: readonly Category[] = [
    'unknown',
    'religion',
    'philosophy',
    'fiction',
    'nonfiction',
]

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

export function parseCategoryParam(
    value: string | null,
): Category | undefined {
    if (
        value !== null &&
        CATEGORY_FILTER_VALUES.includes(
            value as Category,
        )
    ) {
        return value as Category
    }

    return undefined
}

export function parseTextFilterParam(
    value: string | null,
): string | undefined {
    const trimmed = value?.trim()

    return trimmed ? trimmed : undefined
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
