export const queryKeys = {
    books: {
        all: ['books'] as const,

        list: (
            options: {
                includeDeleted?: boolean
                isbn?: string
            } = {},
        ) => {
            const includeDeleted =
                options.includeDeleted ?? false
            const isbn =
                options.isbn !== undefined &&
                options.isbn !== ''
                    ? options.isbn
                    : undefined

            return isbn !== undefined
                ? ([
                    'books',
                    {
                        includeDeleted,
                        isbn,
                    },
                ] as const)
                : ([
                    'books',
                    {
                        includeDeleted,
                    },
                ] as const)
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
