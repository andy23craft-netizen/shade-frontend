import type {
    AuthorCreate,
    AuthorList,
    AuthorRead,
    AuthorUpdate,
} from './apiTypes'
import type {
    createApiClient,
} from './apiClient'
import type {
    ApiCallOptions,
} from './apiCallOptions'
import {
    pickAuthorCreate,
    pickAuthorUpdate,
} from './requestFields'

export type ListAuthorsOptions = ApiCallOptions

function withSignal(
    signal: AbortSignal | undefined,
): ApiCallOptions | undefined {
    return signal === undefined
        ? undefined
        : {
            signal,
        }
}

export function createAuthorsApi(
    client: ReturnType<typeof createApiClient>,
) {
    return {
        async list(
            options: ListAuthorsOptions = {},
        ): Promise<AuthorList> {
            const signalOptions = withSignal(
                options.signal,
            )

            return signalOptions === undefined
                ? client.getJson<AuthorList>(
                    '/authors',
                )
                : client.getJson<AuthorList>(
                    '/authors',
                    signalOptions,
                )
        },

        async get(
            authorId: string,
            options: ApiCallOptions = {},
        ): Promise<AuthorRead> {
            return client.getJson<AuthorRead>(
                `/authors/${encodeURIComponent(authorId)}`,
                withSignal(options.signal),
            )
        },

        async create(
            author: AuthorCreate,
            options: ApiCallOptions = {},
        ): Promise<AuthorRead> {
            return client.requestJson<AuthorRead>(
                '/authors',
                {
                    method: 'POST',
                    body: pickAuthorCreate(author),
                    ...withSignal(options.signal),
                },
            )
        },

        async update(
            authorId: string,
            author: AuthorUpdate,
            options: ApiCallOptions = {},
        ): Promise<AuthorRead> {
            return client.requestJson<AuthorRead>(
                `/authors/${encodeURIComponent(authorId)}`,
                {
                    method: 'PATCH',
                    body: pickAuthorUpdate(author),
                    ...withSignal(options.signal),
                },
            )
        },

        async remove(
            authorId: string,
            options: ApiCallOptions = {},
        ): Promise<void> {
            await client.request(
                `/authors/${encodeURIComponent(authorId)}`,
                {
                    method: 'DELETE',
                    ...withSignal(options.signal),
                },
            )
        },
    }
}
