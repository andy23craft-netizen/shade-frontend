import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query'

import {
    createBooksApi,
} from './booksApi'

import {
    useConnection,
} from '../features/connection/useConnection'

import type {
    BookCreate,
    BookUpdate,
    CheckinRequest,
    CheckoutRequest,
    MarkReadRequest,
} from './apiTypes'

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
        queryKey: ['books'],
    })

    if (id !== undefined) {
        await queryClient.invalidateQueries({
            queryKey: ['books', id],
        })
    }

    if (options.loans) {
        await queryClient.invalidateQueries({
            queryKey: ['loans'],
        })
    }

    await queryClient.invalidateQueries({
        queryKey: ['dashboard'],
    })
}

export function useBooks(
    options: {
        includeDeleted?: boolean
    } = {},
) {
    const {
        apiClient,
    } = useConnection()

    const booksApi =
        createBooksApi(apiClient)

    return useQuery({
        queryKey: [
            'books',
            {
                includeDeleted:
                    options.includeDeleted ??
                    false,
            },
        ],
        queryFn: () =>
            booksApi.list(options),
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
        queryKey: ['books', id],
        queryFn: () =>
            booksApi.get(id),
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
        queryKey: [
            'books',
            'lookup',
            isbn,
        ],
        queryFn: () =>
            booksApi.lookup(isbn),
        enabled: Boolean(isbn),
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

        onSuccess: async () => {
            await invalidateBookCaches(
                queryClient,
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

        onSuccess: async (
            _book,
            variables,
        ) => {
            await invalidateBookCaches(
                queryClient,
                variables.id,
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

        onSuccess: async (
            _book,
            id,
        ) => {
            await invalidateBookCaches(
                queryClient,
                id,
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

        onSuccess: async (
            _book,
            variables,
        ) => {
            await invalidateBookCaches(
                queryClient,
                variables.id,
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

        onSuccess: async (
            _book,
            variables,
        ) => {
            await invalidateBookCaches(
                queryClient,
                variables.id,
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
            request,
        }: {
            id: string
            request: MarkReadRequest
        }) =>
            booksApi.markRead(
                id,
                request,
            ),

        onSuccess: async (
            _book,
            variables,
        ) => {
            await invalidateBookCaches(
                queryClient,
                variables.id,
            )
        },
    })
}
