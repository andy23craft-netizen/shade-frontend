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

export const queryKeys = {
    books: {
        all: ['books'] as const,

        infiniteList: (
            options: {
                includeDeleted?: boolean
                isbn?: string
                author?: string
                title?: string
                category?: string
                sortBy?: string
                sortOrder?: string
                take: number
            },
        ) => {
            const includeDeleted =
                options.includeDeleted ?? false
            const isbn = nonEmptyFilter(
                options.isbn,
            )
            const author = nonEmptyFilter(
                options.author,
            )
            const title = nonEmptyFilter(
                options.title,
            )
            const category = nonEmptyFilter(
                options.category,
            )

            const key: {
                includeDeleted: boolean
                isbn?: string
                author?: string
                title?: string
                category?: string
                sortBy?: string
                sortOrder?: string
                take: number
                infinite: true
            } = {
                includeDeleted,
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

            if (category !== undefined) {
                key.category = category
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
                includeDeleted?: boolean
                isbn?: string
                author?: string
                title?: string
                category?: string
                skip?: number
                take?: number
                sortBy?: string
                sortOrder?: string
            } = {},
        ) => {
            const includeDeleted =
                options.includeDeleted ?? false
            const isbn = nonEmptyFilter(
                options.isbn,
            )
            const author = nonEmptyFilter(
                options.author,
            )
            const title = nonEmptyFilter(
                options.title,
            )
            const category = nonEmptyFilter(
                options.category,
            )

            const key: {
                includeDeleted: boolean
                isbn?: string
                author?: string
                title?: string
                category?: string
                skip?: number
                take?: number
                sortBy?: string
                sortOrder?: string
            } = {
                includeDeleted,
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

            if (category !== undefined) {
                key.category = category
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
} as const
