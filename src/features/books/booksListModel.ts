export const BOOKS_PAGE_SIZE = 50

export type BookSortBy =
    | 'author'
    | 'title'
    | 'creationDate'

export type BookSortOrder =
    | 'asc'
    | 'desc'

export const DEFAULT_SORT_BY: BookSortBy = 'author'
export const DEFAULT_SORT_ORDER: BookSortOrder = 'asc'

const SORT_BY_VALUES: readonly BookSortBy[] = [
    'author',
    'title',
    'creationDate',
]

const SORT_ORDER_VALUES: readonly BookSortOrder[] = [
    'asc',
    'desc',
]

export function pageToSkip(page: number): number {
    return (page - 1) * BOOKS_PAGE_SIZE
}

export function skipToPage(skip: number): number {
    return Math.floor(skip / BOOKS_PAGE_SIZE) + 1
}

export function buildBooksListQuery(options: {
    page: number
    sortBy: BookSortBy
    sortOrder: BookSortOrder
}): {
    skip: number
    take: number
    sortBy: BookSortBy
    sortOrder: BookSortOrder
} {
    return {
        skip: pageToSkip(options.page),
        take: BOOKS_PAGE_SIZE,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
    }
}

export function parsePageParam(
    value: string | null,
): number {
    if (value === null || value === '') {
        return 1
    }

    const parsed = Number.parseInt(value, 10)

    if (
        !Number.isFinite(parsed) ||
        parsed < 1
    ) {
        return 1
    }

    return parsed
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

export function clampPage(
    page: number,
    total: number,
): number {
    if (total === 0) {
        return 1
    }

    const maxPage = Math.max(
        1,
        Math.ceil(total / BOOKS_PAGE_SIZE),
    )

    return Math.min(
        Math.max(1, page),
        maxPage,
    )
}

export function formatBooksRange(
    skip: number,
    itemsOnPage: number,
    total: number,
): string {
    if (total === 0) {
        return 'Showing 0 books'
    }

    const start = skip + 1
    const end = skip + itemsOnPage

    return `Showing ${start}-${end} of ${total} books`
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
    }
}

export function sortOrderLabel(
    sortOrder: BookSortOrder,
): string {
    return sortOrder === 'asc'
        ? 'Ascending'
        : 'Descending'
}
