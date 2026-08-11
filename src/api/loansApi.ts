import type {
    LoanList,
} from './apiTypes'
import type {
    createApiClient,
} from './apiClient'

export function createLoansApi(
    client: ReturnType<typeof createApiClient>,
) {
    return {
        async list(): Promise<LoanList> {
            return client.getJson<LoanList>(
                '/loans',
            )
        },
    }
}
