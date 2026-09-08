import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QuoteCreate, QuoteUpdate } from './apiTypes'
import { createQuotesApi } from './quotesApi'
import { queryKeys } from './queryKeys'
import { useConnection } from '../features/connection/useConnection'

export function useQuotes(options: { enabled?: boolean } = {}) {
    const { apiClient } = useConnection()
    const api = createQuotesApi(apiClient)
    return useQuery({
        queryKey: queryKeys.quotes.list(),
        queryFn: ({ signal }) => api.list({ signal }),
        enabled: options.enabled ?? true,
    })
}

function useQuoteMutation<T>(mutationFn: (api: ReturnType<typeof createQuotesApi>, value: T) => Promise<unknown>) {
    const { apiClient } = useConnection()
    const queryClient = useQueryClient()
    const api = createQuotesApi(apiClient)
    return useMutation({
        mutationFn: (value: T) => mutationFn(api, value),
        onSuccess: async () => queryClient.invalidateQueries({ queryKey: queryKeys.quotes.all }),
    })
}

export const useCreateQuote = () => useQuoteMutation<QuoteCreate>((api, value) => api.create(value))
export const useUpdateQuote = () => useQuoteMutation<{ quoteId: string; quote: QuoteUpdate }>((api, value) => api.update(value.quoteId, value.quote))
export const useDeleteQuote = () => useQuoteMutation<string>((api, value) => api.remove(value))
export const useReorderQuotes = () => useQuoteMutation<string[]>((api, quoteIds) => api.reorder({ quote_ids: quoteIds }))
export const useRestoreDefaultQuotes = () => useQuoteMutation<void>((api) => api.restoreDefaults())
