import type {
    BookCategoryRead,
    CategoryRead,
} from '../../api/apiTypes'

export function formatBookCategories(
    categories:
        | readonly BookCategoryRead[]
        | null
        | undefined,
): string {
    if (
        categories === null ||
        categories === undefined ||
        categories.length === 0
    ) {
        return 'None'
    }

    return categories
        .map((category) => category.name)
        .join(', ')
}

export function categoryIdsEqual(
    left: readonly string[],
    right: readonly string[],
): boolean {
    if (left.length !== right.length) {
        return false
    }

    const sortedLeft = [...left].sort()
    const sortedRight = [...right].sort()

    return sortedLeft.every(
        (id, index) => id === sortedRight[index],
    )
}

export function sortCategoriesByName(
    categories: readonly CategoryRead[],
): CategoryRead[] {
    return [...categories].sort((left, right) =>
        left.name.localeCompare(
            right.name,
            undefined,
            {
                sensitivity: 'base',
            },
        ),
    )
}
