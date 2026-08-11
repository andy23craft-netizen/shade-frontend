import type {
    BookList,
} from './apiTypes'
import type {
    createApiClient,
} from './apiClient'

export function createBooksApi(
    client: ReturnType<typeof createApiClient>,
) {
    return {
        async list(): Promise<BookList> {
            return client.getJson<BookList>(
                '/books',
            )
        },
    }
}
