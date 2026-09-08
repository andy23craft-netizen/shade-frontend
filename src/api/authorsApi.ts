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

export type ListAuthorsOptions = ApiCallOptions & {
    inUse?: boolean
}

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

            const path = options.inUse === true
                ? '/people?in_use=true'
                : '/people'

            return signalOptions === undefined
                ? client.getJson<AuthorList>(
                    path,
                )
                : client.getJson<AuthorList>(
                    path,
                    signalOptions,
                )
        },

        async get(
            authorId: string,
            options: ApiCallOptions = {},
        ): Promise<AuthorRead> {
            return client.getJson<AuthorRead>(
                `/people/${encodeURIComponent(authorId)}`,
                withSignal(options.signal),
            )
        },

        async create(
            author: AuthorCreate,
            options: ApiCallOptions = {},
        ): Promise<AuthorRead> {
            return client.requestJson<AuthorRead>(
                '/people',
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
                `/people/${encodeURIComponent(authorId)}`,
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
                `/people/${encodeURIComponent(authorId)}`,
                {
                    method: 'DELETE',
                    ...withSignal(options.signal),
                },
            )
        },
    }
}
