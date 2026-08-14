import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query'

import {
    createBooksApi,
} from './booksApi'
import {
    queryKeys,
} from './queryKeys'

import {
    useConnection,
} from '../features/connection/useConnection'

import {
    INFINITE_SCROLL_BATCH_SIZE,
} from '../features/shared/infiniteScrollConfig'

import type {
    BookCreate,
    BookList,
    BookRead,
    BookUpdate,
    CheckinRequest,
    CheckoutRequest,
    MarkReadRequest,
} from './apiTypes'

function getNextListPageParam(
    lastPage: BookList,
    allPages: BookList[],
): number | undefined {
    const loaded = allPages.reduce(
        (count, page) =>
            count + page.items.length,
        0,
    )

    return loaded < lastPage.total
        ? loaded
        : undefined
}

async function invalidateBookCaches(
    queryClient: ReturnType<
        typeof useQueryClient
    >,
    id?: string,
    options: {
        loans?: boolean
    } = {},
): Promise<void> {
    await queryClient.invalidateQueries({
        queryKey: queryKeys.books.all,
    })

    if (id !== undefined) {
        await queryClient.invalidateQueries({
            queryKey: queryKeys.books.detail(id),
        })
    }

    if (options.loans) {
        await queryClient.invalidateQueries({
            queryKey: queryKeys.loans.all,
        })
    }

    await queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.all,
    })
}

function writeBookDetailCache(
    queryClient: ReturnType<
        typeof useQueryClient
    >,
    book: BookRead,
): void {
    queryClient.setQueryData(
        queryKeys.books.detail(book.id),
        book,
    )
}

export function useBooks(
    options: {
        includeDeleted?: boolean
        isbn?: string
        skip?: number
        take?: number
        sortBy?: string
        sortOrder?: string
        enabled?: boolean
    } = {},
) {
    const {
        apiClient,
    } = useConnection()

    const booksApi =
        createBooksApi(apiClient)

    const includeDeleted =
        options.includeDeleted ?? false
    const isbn = options.isbn
    const skip = options.skip
    const take = options.take
    const sortBy = options.sortBy
    const sortOrder = options.sortOrder
    const enabled = options.enabled ?? true

    return useQuery({
        queryKey: queryKeys.books.list({
            includeDeleted,
            isbn,
            skip,
            take,
            sortBy,
            sortOrder,
        }),
        queryFn: ({
                      signal,
                  }) =>
            booksApi.list({
                includeDeleted,
                isbn,
                skip,
                take,
                sortBy,
                sortOrder,
                signal,
            }),
        enabled,
    })
}

export function useInfiniteBooks(
    options: {
        includeDeleted?: boolean
        isbn?: string
        sortBy?: string
        sortOrder?: string
        enabled?: boolean
    } = {},
) {
    const {
        apiClient,
    } = useConnection()

    const booksApi =
        createBooksApi(apiClient)

    const includeDeleted =
        options.includeDeleted ?? false
    const isbn = options.isbn
    const sortBy = options.sortBy
    const sortOrder = options.sortOrder
    const enabled = options.enabled ?? true

    return useInfiniteQuery({
        queryKey: queryKeys.books.infiniteList({
            includeDeleted,
            isbn,
            sortBy,
            sortOrder,
            take: INFINITE_SCROLL_BATCH_SIZE,
        }),
        initialPageParam: 0,
        queryFn: ({
            pageParam,
            signal,
        }) =>
            booksApi.list({
                includeDeleted,
                isbn,
                skip: pageParam,
                take: INFINITE_SCROLL_BATCH_SIZE,
                sortBy,
                sortOrder,
                signal,
            }),
        getNextPageParam: getNextListPageParam,
        enabled,
    })
}

export function useBook(
    id: string,
) {
    const {
        apiClient,
    } = useConnection()

    const booksApi =
        createBooksApi(apiClient)

    return useQuery({
        queryKey: queryKeys.books.detail(id),
        queryFn: ({
                      signal,
                  }) =>
            booksApi.get(id, {
                signal,
            }),
        enabled: Boolean(id),
    })
}

export function useBookLookup(
    isbn: string,
) {
    const {
        apiClient,
    } = useConnection()

    const booksApi =
        createBooksApi(apiClient)

    return useQuery({
        queryKey: queryKeys.books.lookup(isbn),
        queryFn: ({
                      signal,
                  }) =>
            booksApi.lookup(isbn, {
                signal,
            }),
        enabled: Boolean(isbn),
    })
}

export function useLookupBook() {
    const {
        apiClient,
    } = useConnection()

    const booksApi =
        createBooksApi(apiClient)

    return useMutation({
        mutationFn: (
            isbn: string,
        ) =>
            booksApi.lookup(isbn),
    })
}


export function useCreateBook() {
    const {
        apiClient,
    } = useConnection()

    const queryClient =
        useQueryClient()

    const booksApi =
        createBooksApi(apiClient)

    return useMutation({
        mutationFn: (
            book: BookCreate,
        ) =>
            booksApi.create(book),

        onSuccess: async (book) => {
            writeBookDetailCache(
                queryClient,
                book,
            )

            await invalidateBookCaches(
                queryClient,
                book.id,
            )
        },
    })
}

export function useUpdateBook() {
    const {
        apiClient,
    } = useConnection()

    const queryClient =
        useQueryClient()

    const booksApi =
        createBooksApi(apiClient)

    return useMutation({
        mutationFn: ({
            id,
            book,
        }: {
            id: string
            book: BookUpdate
        }) =>
            booksApi.update(
                id,
                book,
            ),

        onSuccess: async (book) => {
            writeBookDetailCache(
                queryClient,
                book,
            )
            await invalidateBookCaches(
                queryClient,
                book.id,
            )
        },
    })
}

export function useDeleteBook() {
    const {
        apiClient,
    } = useConnection()

    const queryClient =
        useQueryClient()

    const booksApi =
        createBooksApi(apiClient)

    return useMutation({
        mutationFn: (
            id: string,
        ) =>
            booksApi.remove(id),

        onSuccess: async (
            _result,
            id,
        ) => {
            await invalidateBookCaches(
                queryClient,
                id,
            )
        },
    })
}

export function useRestoreBook() {
    const {
        apiClient,
    } = useConnection()

    const queryClient =
        useQueryClient()

    const booksApi =
        createBooksApi(apiClient)

    return useMutation({
        mutationFn: (
            id: string,
        ) =>
            booksApi.restore(id),

        onSuccess: async (book) => {
            writeBookDetailCache(
                queryClient,
                book,
            )
            await invalidateBookCaches(
                queryClient,
                book.id,
            )
        },
    })
}

export function useCheckoutBook() {
    const {
        apiClient,
    } = useConnection()

    const queryClient =
        useQueryClient()

    const booksApi =
        createBooksApi(apiClient)

    return useMutation({
        mutationFn: ({
            id,
            request,
        }: {
            id: string
            request: CheckoutRequest
        }) =>
            booksApi.checkout(
                id,
                request,
            ),

        onSuccess: async (book) => {
            writeBookDetailCache(
                queryClient,
                book,
            )
            await invalidateBookCaches(
                queryClient,
                book.id,
                {
                    loans: true,
                },
            )
        },
    })
}

export function useCheckinBook() {
    const {
        apiClient,
    } = useConnection()

    const queryClient =
        useQueryClient()

    const booksApi =
        createBooksApi(apiClient)

    return useMutation({
        mutationFn: ({
            id,
            request,
        }: {
            id: string
            request?: CheckinRequest
        }) =>
            booksApi.checkin(
                id,
                request,
            ),

        onSuccess: async (book) => {
            writeBookDetailCache(
                queryClient,
                book,
            )
            await invalidateBookCaches(
                queryClient,
                book.id,
                {
                    loans: true,
                },
            )
        },
    })
}

export function useMarkBookRead() {
    const {
        apiClient,
    } = useConnection()

    const queryClient =
        useQueryClient()

    const booksApi =
        createBooksApi(apiClient)

    return useMutation({
        mutationFn: ({
            id,
            request = {},
        }: {
            id: string
            request?: MarkReadRequest
        }) =>
            booksApi.markRead(
                id,
                request,
            ),

        onSuccess: async (book) => {
            writeBookDetailCache(
                queryClient,
                book,
            )
            await invalidateBookCaches(
                queryClient,
                book.id,
            )
        },
    })
}
