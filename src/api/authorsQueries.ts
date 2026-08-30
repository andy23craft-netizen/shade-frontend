import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query'

import type {
    AuthorCreate,
    AuthorUpdate,
} from './apiTypes'
import {
    createAuthorsApi,
} from './authorsApi'
import {
    queryKeys,
} from './queryKeys'

import {
    useConnection,
} from '../features/connection/useConnection'

async function invalidateAuthorCaches(
    queryClient: ReturnType<
        typeof useQueryClient
    >,
    options: {
        bookDisplayChanged?: boolean
    } = {},
): Promise<void> {
    await queryClient.invalidateQueries({
        queryKey: queryKeys.authors.all,
    })

    if (options.bookDisplayChanged) {
        await queryClient.invalidateQueries({
            queryKey: queryKeys.books.all,
        })

        await queryClient.invalidateQueries({
            queryKey: queryKeys.dashboard.all,
        })
    }
}

export function useAuthors(
    options: {
        enabled?: boolean
        inUse?: boolean
    } = {},
) {
    const {
        apiClient,
    } = useConnection()

    const authorsApi =
        createAuthorsApi(apiClient)

    const enabled = options.enabled ?? true

    return useQuery({
        queryKey: queryKeys.authors.list({
            inUse: options.inUse,
        }),
        queryFn: ({
                      signal,
                  }) =>
            authorsApi.list({
                signal,
                inUse: options.inUse,
            }),
        enabled,
    })
}

export function useAuthor(
    authorId: string,
    options: {
        enabled?: boolean
    } = {},
) {
    const {
        apiClient,
    } = useConnection()

    const authorsApi =
        createAuthorsApi(apiClient)

    const enabled =
        (options.enabled ?? true) &&
        authorId !== ''

    return useQuery({
        queryKey:
            queryKeys.authors.detail(authorId),
        queryFn: ({
                      signal,
                  }) =>
            authorsApi.get(
                authorId,
                {
                    signal,
                },
            ),
        enabled,
    })
}

export function useCreateAuthor() {
    const {
        apiClient,
    } = useConnection()

    const queryClient =
        useQueryClient()

    const authorsApi =
        createAuthorsApi(apiClient)

    return useMutation({
        mutationFn: (
            author: AuthorCreate,
        ) =>
            authorsApi.create(author),

        onSuccess: async () => {
            await invalidateAuthorCaches(
                queryClient,
            )
        },
    })
}

export function useUpdateAuthor() {
    const {
        apiClient,
    } = useConnection()

    const queryClient =
        useQueryClient()

    const authorsApi =
        createAuthorsApi(apiClient)

    return useMutation({
        mutationFn: ({
                         authorId,
                         author,
                     }: {
            authorId: string
            author: AuthorUpdate
        }) =>
            authorsApi.update(
                authorId,
                author,
            ),

        onSuccess: async () => {
            await invalidateAuthorCaches(
                queryClient,
                {
                    bookDisplayChanged: true,
                },
            )
        },
    })
}

export function useDeleteAuthor() {
    const {
        apiClient,
    } = useConnection()

    const queryClient =
        useQueryClient()

    const authorsApi =
        createAuthorsApi(apiClient)

    return useMutation({
        mutationFn: (
            authorId: string,
        ) =>
            authorsApi.remove(authorId),

        onSuccess: async () => {
            await invalidateAuthorCaches(
                queryClient,
            )
        },
    })
}
