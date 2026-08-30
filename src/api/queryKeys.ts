function nonEmptyFilter(
    value: string | undefined,
): string | undefined {
    if (value === undefined) {
        return undefined
    }

    const trimmed = value.trim()

    return trimmed === ''
        ? undefined
        : trimmed
}

function normalizeCategoryIds(
    categoryIds: readonly string[] | undefined,
): string[] | undefined {
    if (categoryIds === undefined) {
        return undefined
    }

    const normalized = [
        ...new Set(
            categoryIds
                .map((id) => id.trim())
                .filter((id) => id !== ''),
        ),
    ].sort()

    return normalized.length === 0
        ? undefined
        : normalized
}

export const queryKeys = {
    books: {
        all: ['books'] as const,

        infiniteList: (
            options: {
                isbn?: string
                author?: string
                title?: string
                categoryIds?: readonly string[]
                shelfName?: string
                placementState?: string
                isRead?: boolean
                sortBy?: string
                sortOrder?: string
                take: number
            },
        ) => {
            const isbn = nonEmptyFilter(
                options.isbn,
            )
            const author = nonEmptyFilter(
                options.author,
            )
            const title = nonEmptyFilter(
                options.title,
            )
            const categoryIds =
                normalizeCategoryIds(
                    options.categoryIds,
                )
            const shelfName = nonEmptyFilter(
                options.shelfName,
            )
            const key: {
                isbn?: string
                author?: string
                title?: string
                categoryIds?: string[]
                shelfName?: string
                placementState?: string
                isRead?: boolean
                sortBy?: string
                sortOrder?: string
                take: number
                infinite: true
            } = {
                take: options.take,
                infinite: true,
            }

            if (isbn !== undefined) {
                key.isbn = isbn
            }

            if (author !== undefined) {
                key.author = author
            }

            if (title !== undefined) {
                key.title = title
            }

            if (categoryIds !== undefined) {
                key.categoryIds = categoryIds
            }

            if (shelfName !== undefined) {
                key.shelfName = shelfName
            }

            if (options.placementState !== undefined) {
                key.placementState =
                    options.placementState
            }

            if (options.isRead !== undefined) {
                key.isRead = options.isRead
            }

            if (options.sortBy !== undefined) {
                key.sortBy = options.sortBy
            }

            if (options.sortOrder !== undefined) {
                key.sortOrder = options.sortOrder
            }

            return [
                'books',
                key,
            ] as const
        },

        list: (
            options: {
                isbn?: string
                author?: string
                title?: string
                categoryIds?: readonly string[]
                shelfName?: string
                placementState?: string
                isRead?: boolean
                skip?: number
                take?: number
                sortBy?: string
                sortOrder?: string
            } = {},
        ) => {
            const isbn = nonEmptyFilter(
                options.isbn,
            )
            const author = nonEmptyFilter(
                options.author,
            )
            const title = nonEmptyFilter(
                options.title,
            )
            const categoryIds =
                normalizeCategoryIds(
                    options.categoryIds,
                )
            const shelfName = nonEmptyFilter(
                options.shelfName,
            )

            const key: {
                isbn?: string
                author?: string
                title?: string
                categoryIds?: string[]
                shelfName?: string
                placementState?: string
                isRead?: boolean
                skip?: number
                take?: number
                sortBy?: string
                sortOrder?: string
            } = {
            }

            if (isbn !== undefined) {
                key.isbn = isbn
            }

            if (author !== undefined) {
                key.author = author
            }

            if (title !== undefined) {
                key.title = title
            }

            if (categoryIds !== undefined) {
                key.categoryIds = categoryIds
            }

            if (shelfName !== undefined) {
                key.shelfName = shelfName
            }

            if (options.placementState !== undefined) {
                key.placementState =
                    options.placementState
            }

            if (options.isRead !== undefined) {
                key.isRead = options.isRead
            }

            if (options.skip !== undefined) {
                key.skip = options.skip
            }

            if (options.take !== undefined) {
                key.take = options.take
            }

            if (options.sortBy !== undefined) {
                key.sortBy = options.sortBy
            }

            if (options.sortOrder !== undefined) {
                key.sortOrder = options.sortOrder
            }

            return [
                'books',
                key,
            ] as const
        },

        detail: (id: string) =>
            ['books', id] as const,

        lookup: (isbn: string) =>
            [
                'books',
                'lookup',
                isbn,
            ] as const,
    },

    bookCovers: {
        all: ['book-covers'] as const,

        detail: (id: string) =>
            [
                'book-covers',
                id,
            ] as const,
    },

    loans: {
        all: ['loans'] as const,

        list: (bookId?: string) =>
            bookId !== undefined
                ? ['loans', {
                    bookId,
                }] as const
                : ['loans'] as const,

        infiniteList: (
            options: {
                bookId?: string
                take: number
            },
        ) => {
            const key: {
                bookId?: string
                take: number
                infinite: true
            } = {
                take: options.take,
                infinite: true,
            }

            if (
                options.bookId !== undefined &&
                options.bookId !== ''
            ) {
                key.bookId = options.bookId
            }

            return [
                'loans',
                key,
            ] as const
        },

        detail: (id: string) =>
            ['loans', id] as const,
    },

    dashboard: {
        all: ['dashboard'] as const,

        breakdowns: () =>
            [
                'dashboard',
                'breakdowns',
            ] as const,

        incompleteMetadata: () =>
            [
                'dashboard',
                'incomplete-metadata',
            ] as const,

        incompleteMetadataBooks: (
            options: {
                field?: string
                skip?: number
                take?: number
            } = {},
        ) => {
            const field = nonEmptyFilter(
                options.field,
            )

            const key: {
                field?: string
                skip?: number
                take?: number
            } = {}

            if (field !== undefined) {
                key.field = field
            }

            if (
                options.skip !== undefined &&
                options.take !== undefined
            ) {
                key.skip = options.skip
                key.take = options.take
            }

            return [
                'dashboard',
                'incomplete-metadata',
                'books',
                key,
            ] as const
        },
    },

    version: {
        all: ['version'] as const,
    },

    shelves: {
        all: ['shelves'] as const,

        list: () =>
            [
                'shelves',
                {
                    list: true,
                },
            ] as const,
    },

    categories: {
        all: ['categories'] as const,

        list: (
            options: {
                inUse?: boolean
            } = {},
        ) =>
            [
                'categories',
                {
                    list: true,
                    ...(options.inUse === true
                        ? { inUse: true }
                        : {}),
                },
            ] as const,

        detail: (categoryId: string) =>
            [
                'categories',
                categoryId,
            ] as const,
    },

    authors: {
        all: ['authors'] as const,

        list: (
            options: {
                inUse?: boolean
            } = {},
        ) =>
            [
                'authors',
                {
                    list: true,
                    ...(options.inUse === true
                        ? { inUse: true }
                        : {}),
                },
            ] as const,

        detail: (authorId: string) =>
            [
                'authors',
                authorId,
            ] as const,
    },

    wishlists: {
        all: ['wishlists'] as const,

        list: () =>
            [
                'wishlists',
                {
                    list: true,
                },
            ] as const,

        books: (wishlistId: string) =>
            [
                'wishlists',
                wishlistId,
                'books',
            ] as const,
    },

    collections: {
        all: ['collections'] as const,

        list: () =>
            [
                'collections',
                {
                    list: true,
                },
            ] as const,

        books: (collectionId: string) =>
            [
                'collections',
                collectionId,
                'books',
            ] as const,
    },
} as const
