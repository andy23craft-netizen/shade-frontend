import type {
    BookList,
    DashboardBreakdowns,
    DashboardIncompleteMetadata,
    DashboardSummary,
} from './apiTypes'
import type {
    createApiClient,
} from './apiClient'
import type {
    ApiCallOptions,
} from './apiCallOptions'

export interface ListIncompleteMetadataBooksOptions {
    field?: string
    skip?: number
    take?: number
}

function nonEmptyField(
    field: string | undefined,
): string | undefined {
    if (field === undefined) {
        return undefined
    }

    const trimmed = field.trim()

    return trimmed === ''
        ? undefined
        : trimmed
}

export function createDashboardApi(
    client: ReturnType<typeof createApiClient>,
) {
    return {
        async get(
            options: ApiCallOptions = {},
        ): Promise<DashboardSummary> {
            if (options.signal === undefined) {
                return client.getJson<DashboardSummary>(
                    '/dashboard',
                )
            }

            return client.getJson<DashboardSummary>(
                '/dashboard',
                {
                    signal: options.signal,
                },
            )
        },

        async getBreakdowns(
            options: ApiCallOptions = {},
        ): Promise<DashboardBreakdowns> {
            if (options.signal === undefined) {
                return client.getJson<DashboardBreakdowns>(
                    '/dashboard/breakdowns',
                )
            }

            return client.getJson<DashboardBreakdowns>(
                '/dashboard/breakdowns',
                {
                    signal: options.signal,
                },
            )
        },

        async getIncompleteMetadata(
            options: ApiCallOptions = {},
        ): Promise<DashboardIncompleteMetadata> {
            if (options.signal === undefined) {
                return client.getJson<DashboardIncompleteMetadata>(
                    '/dashboard/incomplete-metadata',
                )
            }

            return client.getJson<DashboardIncompleteMetadata>(
                '/dashboard/incomplete-metadata',
                {
                    signal: options.signal,
                },
            )
        },

        async listIncompleteMetadataBooks(
            listOptions: ListIncompleteMetadataBooksOptions = {},
            options: ApiCallOptions = {},
        ): Promise<BookList> {
            const params = new URLSearchParams()
            const field = nonEmptyField(
                listOptions.field,
            )

            if (field !== undefined) {
                params.set('field', field)
            }

            if (
                listOptions.skip !== undefined &&
                listOptions.take !== undefined
            ) {
                params.set(
                    'skip',
                    String(listOptions.skip),
                )
                params.set(
                    'take',
                    String(listOptions.take),
                )
            }

            const query = params.toString()
            const path = query === ''
                ? '/dashboard/incomplete-metadata/books'
                : `/dashboard/incomplete-metadata/books?${query}`

            if (options.signal === undefined) {
                return client.getJson<BookList>(
                    path,
                )
            }

            return client.getJson<BookList>(
                path,
                {
                    signal: options.signal,
                },
            )
        },
    }
}
