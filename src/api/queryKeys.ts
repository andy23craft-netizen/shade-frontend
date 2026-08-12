export const queryKeys = {
    books: {
        all: ['books'] as const,

        list: (
            includeDeleted = false,
        ) =>
            [
                'books',
                {
                    includeDeleted,
                },
            ] as const,

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
    },

    dashboard: {
        all: ['dashboard'] as const,
    },
} as const