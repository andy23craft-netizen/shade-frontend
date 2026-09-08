import type { QuoteCreate, QuoteList, QuoteOrderRequest, QuoteRead, QuoteUpdate } from './apiTypes'
import type { createApiClient } from './apiClient'
import type { ApiCallOptions } from './apiCallOptions'

export function createQuotesApi(client: ReturnType<typeof createApiClient>) {
    return {
        list: (options: ApiCallOptions = {}) => client.getJson<QuoteList>('/quotes', { signal: options.signal }),
        create: (quote: QuoteCreate) => client.requestJson<QuoteRead>('/quotes', { method: 'POST', body: quote }),
        update: (quoteId: string, quote: QuoteUpdate) => client.requestJson<QuoteRead>(`/quotes/${encodeURIComponent(quoteId)}`, { method: 'PATCH', body: quote }),
        remove: (quoteId: string) => client.request(`/quotes/${encodeURIComponent(quoteId)}`, { method: 'DELETE' }).then(() => undefined),
        reorder: (order: QuoteOrderRequest) => client.requestJson<QuoteList>('/quotes/order', { method: 'PUT', body: order }),
        restoreDefaults: () => client.requestJson<QuoteList>('/quotes/restore-defaults', { method: 'POST' }),
    }
}
