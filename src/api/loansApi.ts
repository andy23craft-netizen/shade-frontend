import type {
    LoanList,
    LoanRead,
} from './apiTypes'
import type {
    createApiClient,
} from './apiClient'
import type {
    ApiCallOptions,
} from './apiCallOptions'

export interface ListLoansOptions
    extends ApiCallOptions {
    bookId?: string
    albumId?: string
    mediaType?: 'book' | 'album'
    skip?: number
    take?: number
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

export function createLoansApi(
    client: ReturnType<typeof createApiClient>,
) {
    return {
        async list(
            options: ListLoansOptions = {},
        ): Promise<LoanList> {
            const params = new URLSearchParams()

            if (
                options.bookId !== undefined
            ) {
                params.set(
                    'book_id',
                    options.bookId,
                )
            }

            if (options.albumId !== undefined) {
                params.set('album_id', options.albumId)
            }

            if (options.mediaType !== undefined) {
                params.set('media_type', options.mediaType)
            }

            if (options.skip !== undefined) {
                params.set(
                    'skip',
                    String(options.skip),
                )
            }

            if (options.take !== undefined) {
                params.set(
                    'take',
                    String(options.take),
                )
            }

            const query = params.toString()
            const path = query
                ? `/loans?${query}`
                : '/loans'
            const signalOptions = withSignal(
                options.signal,
            )

            return signalOptions === undefined
                ? client.getJson<LoanList>(path)
                : client.getJson<LoanList>(
                    path,
                    signalOptions,
                )
        },

        async get(
            id: string,
            options: ApiCallOptions = {},
        ): Promise<LoanRead> {
            const path =
                `/loans/${encodeURIComponent(id)}`

            const signalOptions = withSignal(
                options.signal,
            )

            return signalOptions === undefined
                ? client.getJson<LoanRead>(path)
                : client.getJson<LoanRead>(
                    path,
                    signalOptions,
                )
        },
    }
}
