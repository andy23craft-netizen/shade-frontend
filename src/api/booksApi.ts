import type {
    BookCreate,
    BookList,
    BookLookupResponse,
    BookRead,
    BookUpdate,
    CheckinRequest,
    CheckoutRequest,
    MarkReadRequest,
} from './apiTypes'
import type {
    createApiClient,
} from './apiClient'

export interface ListBooksOptions {
    includeDeleted?: boolean
}

export function createBooksApi(
    client: ReturnType<typeof createApiClient>,
) {
    return {
        async list(
            options: ListBooksOptions = {},
        ): Promise<BookList> {
            const params = new URLSearchParams()

        if (
            options.includeDeleted !==
            undefined
        ) {
            params.set(
                'include_deleted',
                String(
                    options.includeDeleted,
                ),
            )
        }

        const query = params.toString()

        if (query) {
            return client.getJson<BookList>(
                `/books?${query}`,
            )
        }

        return client.getJson<BookList>(
            '/books',
        )
    },

    async create(
        book: BookCreate,
    ): Promise<BookRead> {
        return client.requestJson<BookRead>(
            '/books',
            {
                method: 'POST',
                body: book,
            },
        )
    },

    async lookup(
        isbn: string,
    ): Promise<BookLookupResponse> {
        const params = new URLSearchParams({
            isbn,
        })

        return client.getJson<BookLookupResponse>(
            `/books/lookup?${params.toString()}`,
        )
    },

    async get(
        id: string,
    ): Promise<BookRead> {
        return client.getJson<BookRead>(
            `/books/${encodeURIComponent(id)}`,
        )
    },

    async update(
        id: string,
        book: BookUpdate,
    ): Promise<BookRead> {
        return client.requestJson<BookRead>(
            `/books/${encodeURIComponent(id)}`,
            {
                method: 'PATCH',
                body: book,
            },
        )
    },

    async remove(
        id: string,
    ): Promise<void> {
        await client.request(
            `/books/${encodeURIComponent(id)}`,
            {
                method: 'DELETE',
            },
        )
    },

    async restore(
        id: string,
    ): Promise<BookRead> {
        return client.requestJson<BookRead>(
            `/books/${encodeURIComponent(id)}/restore`,
            {
                method: 'POST',
            },
        )
        },

        async checkout(
            id: string,
            request: CheckoutRequest,
        ): Promise<BookRead> {
            return client.requestJson<BookRead>(
                `/books/${encodeURIComponent(id)}/checkout`,
                {
                    method: 'POST',
                    body: request,
                },
            )
        },

        async checkin(
            id: string,
            request?: CheckinRequest,
        ): Promise<BookRead> {
            if (request === undefined) {
                return client.requestJson<BookRead>(
                    `/books/${encodeURIComponent(id)}/checkin`,
                    {
                        method: 'POST',
                    },
                )
            }

            return client.requestJson<BookRead>(
                `/books/${encodeURIComponent(id)}/checkin`,
                {
                    method: 'POST',
                    body: request,
                },
            )
        },

        async markRead(
            id: string,
            request: MarkReadRequest,
        ): Promise<BookRead> {
            return client.requestJson<BookRead>(
                `/books/${encodeURIComponent(id)}/mark-read`,
                {
                    method: 'POST',
                    body: request,
                },
            )
        },
    }


}
