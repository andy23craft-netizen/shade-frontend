import {
    useMutation,
    useQueryClient,
    useQuery,
} from '@tanstack/react-query'

import {
    createBooksApi,
} from './booksApi'

import {
    useConnection,
} from '../features/connection/useConnection'

import type {
    BookCreate,
    BookList,
    BookRead,
    BookLookupResponse,
} from './apiTypes'

export function useBooks() {
    const {
        apiClient,
    } = useConnection()

    const booksApi =
        createBooksApi(apiClient)

    return useQuery({
        queryKey: ['books'],
        queryFn: () =>
            booksApi.list(),
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

        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ['books'],
            })
        },
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
        queryKey: ['books', 'lookup', isbn],
        queryFn: () =>
            booksApi.lookup(isbn),
        enabled: Boolean(isbn),
    })
}