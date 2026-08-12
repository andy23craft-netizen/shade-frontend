import type {
    LoanList,
} from './apiTypes'
import type {
    createApiClient,
} from './apiClient'
import type {
    ApiCallOptions,
} from './apiCallOptions'

export function createLoansApi(
    client: ReturnType<typeof createApiClient>,
) {
    return {
        async list(
            options: ApiCallOptions = {},
        ): Promise<LoanList> {
            if (options.signal === undefined) {
                return client.getJson<LoanList>(
                    '/loans',
                )
            }

            return client.getJson<LoanList>(
                '/loans',
                {
                    signal: options.signal,
                },
            )
        },
    }
}
