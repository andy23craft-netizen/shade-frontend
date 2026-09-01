import {
    keepPreviousData,
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query'

import { isBookIdentityError } from './bookIdentity'
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
    BulkBookImportRequest,
    BulkBookLookupRequest,
    BulkBookStashRequest,
    BulkShelfMoveRequest,
    BulkStashApplyRequest,
    CheckinRequest,
    CheckoutRequest,
    MarkReadRequest,
    PlacementState,
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

async function invalidateBulkShelfMoveCaches(
    queryClient: ReturnType<
        typeof useQueryClient
    >,
    bookIds: readonly string[],
): Promise<void> {
    await queryClient.invalidateQueries({
        queryKey: queryKeys.books.all,
    })

    for (const bookId of bookIds) {
        await queryClient.invalidateQueries({
            queryKey: queryKeys.books.detail(bookId),
        })
    }

    await queryClient.invalidateQueries({
        queryKey: queryKeys.shelves.all,
    })

    await queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.all,
    })

    await queryClient.invalidateQueries({
        queryKey: queryKeys.collections.all,
    })
}

async function invalidateBulkBookImportCaches(
    queryClient: ReturnType<
        typeof useQueryClient
    >,
    bookIds: readonly string[],
): Promise<void> {
    await queryClient.invalidateQueries({
        queryKey: queryKeys.books.all,
    })

    for (const bookId of bookIds) {
        await queryClient.invalidateQueries({
            queryKey: queryKeys.books.detail(bookId),
        })
    }

    await queryClient.invalidateQueries({
        queryKey: queryKeys.shelves.all,
    })

    await queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.all,
    })

    await queryClient.invalidateQueries({
        queryKey: queryKeys.wishlists.all,
    })

    await queryClient.invalidateQueries({
        queryKey: queryKeys.authors.all,
    })

    await queryClient.invalidateQueries({
        queryKey: queryKeys.categories.all,
    })

    await queryClient.invalidateQueries({
        queryKey: queryKeys.collections.all,
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

async function invalidateBookCover(
    queryClient: ReturnType<
        typeof useQueryClient
    >,
    id: string,
): Promise<void> {
    await queryClient.invalidateQueries({
        queryKey:
            queryKeys.bookCovers.detail(id),
    })
}

export function useBooks(
    options: {
        isbn?: string
        author?: string
        title?: string
        categoryIds?: readonly string[]
        shelfName?: string
        placementState?: PlacementState
        isRead?: boolean
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

    const isbn = options.isbn
    const author = options.author
    const title = options.title
    const categoryIds = options.categoryIds
    const shelfName = options.shelfName
    const placementState = options.placementState
    const isRead = options.isRead
    const skip = options.skip
    const take = options.take
    const sortBy = options.sortBy
    const sortOrder = options.sortOrder
    const enabled = options.enabled ?? true

    return useQuery({
        queryKey: queryKeys.books.list({
            isbn,
            author,
            title,
            categoryIds,
            shelfName,
            placementState,
            isRead,
            skip,
            take,
            sortBy,
            sortOrder,
        }),
        queryFn: ({
                      signal,
                  }) =>
            booksApi.list({
                isbn,
                author,
                title,
                categoryIds,
                shelfName,
                placementState,
                isRead,
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
        isbn?: string
        author?: string
        title?: string
        categoryIds?: readonly string[]
        shelfName?: string
        placementState?: PlacementState
        isRead?: boolean
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

    const isbn = options.isbn
    const author = options.author
    const title = options.title
    const categoryIds = options.categoryIds
    const shelfName = options.shelfName
    const placementState = options.placementState
    const isRead = options.isRead
    const sortBy = options.sortBy
    const sortOrder = options.sortOrder
    const enabled = options.enabled ?? true

    return useInfiniteQuery({
        queryKey: queryKeys.books.infiniteList({
            isbn,
            author,
            title,
            categoryIds,
            shelfName,
            placementState,
            isRead,
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
                isbn,
                author,
                title,
                categoryIds,
                shelfName,
                placementState,
                isRead,
                skip: pageParam,
                take: INFINITE_SCROLL_BATCH_SIZE,
                sortBy,
                sortOrder,
                signal,
            }),
        getNextPageParam: getNextListPageParam,
        placeholderData: keepPreviousData,
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
        retry: (
            failureCount,
            error,
        ) => {
            if (isBookIdentityError(error)) {
                return false
            }

            return failureCount < 3
        },
    })
}

export function useBookCover(
    id: string,
    options: {
        enabled?: boolean
    } = {},
) {
    const {
        apiClient,
    } = useConnection()

    const booksApi =
        createBooksApi(apiClient)

    return useQuery({
        queryKey:
            queryKeys.bookCovers.detail(id),
        queryFn: ({
                      signal,
                  }) =>
            booksApi.getCover(id, {
                signal,
            }),
        enabled:
            Boolean(id) &&
            (options.enabled ?? true),
        retry: false,
    })
}

export function useRecentBooks(
    options: {
        enabled?: boolean
    } = {},
) {
    return useBooks({
        skip: 0,
        take: 10,
        sortBy: 'creationDate',
        sortOrder: 'desc',
        enabled: options.enabled,
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

export function useUploadBookCover() {
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
                         file,
                     }: {
            id: string
            file: File
        }) =>
            booksApi.uploadCover(
                id,
                file,
            ),

        onSuccess: async (book) => {
            writeBookDetailCache(
                queryClient,
                book,
            )

            await queryClient.invalidateQueries({
                queryKey: queryKeys.books.all,
            })

            await invalidateBookCover(
                queryClient,
                book.id,
            )
        },
    })
}

export function useRemoveBookCover() {
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
            booksApi.removeCover(id),

        onSuccess: async (
            _result,
            id,
        ) => {
            await queryClient.invalidateQueries({
                queryKey: queryKeys.books.all,
            })

            await invalidateBookCover(
                queryClient,
                id,
            )
        },
    })
}

export function useBulkBookLookup() {
    const {
        apiClient,
    } = useConnection()

    const booksApi =
        createBooksApi(apiClient)

    return useMutation({
        mutationFn: (
            request: BulkBookLookupRequest,
        ) =>
            booksApi.bulkLookup(request),
    })
}

export function useBulkBookImport() {
    const {
        apiClient,
    } = useConnection()

    const queryClient =
        useQueryClient()

    const booksApi =
        createBooksApi(apiClient)

    return useMutation({
        mutationFn: (
            request: BulkBookImportRequest,
        ) =>
            booksApi.bulkImport(request),

        onSuccess: async (response) => {
            const bookIds = response.items
                .map((item) => item.book_id)
                .filter(
                    (bookId): bookId is string =>
                        typeof bookId === 'string',
                )

            await invalidateBulkBookImportCaches(
                queryClient,
                bookIds,
            )
        },
    })
}

export function useBulkMoveBooksToShelf() {
    const {
        apiClient,
    } = useConnection()

    const queryClient =
        useQueryClient()

    const booksApi =
        createBooksApi(apiClient)

    return useMutation({
        mutationFn: (
            request: BulkShelfMoveRequest,
        ) =>
            booksApi.moveToShelf(request),

        onSuccess: async (response) => {
            await invalidateBulkShelfMoveCaches(
                queryClient,
                response.book_ids,
            )
        },
    })
}

export function useBulkStashBooks() {
    const { apiClient } = useConnection()
    const queryClient = useQueryClient()
    const booksApi = createBooksApi(apiClient)

    return useMutation({
        mutationFn: (request: BulkBookStashRequest) =>
            booksApi.stash(request),
        onSuccess: async (response) => {
            await invalidateBulkShelfMoveCaches(
                queryClient,
                response.book_ids,
            )
        },
        onError: async (_error, request) => {
            await invalidateBulkShelfMoveCaches(
                queryClient,
                request.book_ids,
            )
        },
    })
}

export function useBulkApplyStash() {
    const { apiClient } = useConnection()
    const queryClient = useQueryClient()
    const booksApi = createBooksApi(apiClient)

    return useMutation({
        mutationFn: (request: BulkStashApplyRequest) =>
            booksApi.applyStash(request),
        onSuccess: async (response) => {
            await invalidateBulkShelfMoveCaches(
                queryClient,
                response.book_ids,
            )
        },
        onError: async (_error, request) => {
            await invalidateBulkShelfMoveCaches(
                queryClient,
                request.book_ids,
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

            await queryClient.invalidateQueries({
                queryKey:
                queryKeys.collections.all,
            })
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
