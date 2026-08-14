export const queryKeys = {
    books: {
        all: ['books'] as const,

        list: (
            options: {
                includeDeleted?: boolean
                isbn?: string
                skip?: number
                take?: number
                sortBy?: string
                sortOrder?: string
            } = {},
        ) => {
            const includeDeleted =
                options.includeDeleted ?? false
            const isbn =
                options.isbn !== undefined &&
                options.isbn !== ''
                    ? options.isbn
                    : undefined

            const key: {
                includeDeleted: boolean
                isbn?: string
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

        detail: (id: string) =>
            ['loans', id] as const,
    },

    dashboard: {
        all: ['dashboard'] as const,
    },
} as const
