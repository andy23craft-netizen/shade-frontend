import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { queryKeys } from './queryKeys'
import { useCompleteLibrarySetup, useLibrarySettings, useLibrarySetup, useUpdateLibrarySettings } from './libraryQueries'

const getSetup = vi.fn(), completeSetup = vi.fn(), getSettings = vi.fn(), updateSettings = vi.fn()
vi.mock('./libraryApi', () => ({ createLibraryApi: () => ({ getSetup, completeSetup, getSettings, updateSettings }) }))
vi.mock('../features/connection/useConnection', () => ({ useConnection: () => ({ apiClient: {} }) }))

function wrapper() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    return { client, Wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider> }
}

describe('library queries', () => {
    beforeEach(() => vi.clearAllMocks())

    it('keeps every setup state intact in host-scoped cache', async () => {
        for (const state of ['required', 'in_progress', 'complete', 'failed'] as const) {
            const setup = { state, has_catalog_items: state === 'complete', system_shelves_ready: state === 'complete', supported_media: ['book' as const], failure_code: state === 'failed' ? 'bootstrap_failed' : null }
            getSetup.mockResolvedValueOnce(setup)
            const { client, Wrapper } = wrapper()
            const result = renderHook(() => useLibrarySetup(), { wrapper: Wrapper })
            await waitFor(() => expect(result.result.current.isSuccess).toBe(true))
            expect(client.getQueryData(queryKeys.library.setup('andy'))).toEqual(setup)
        }
    })

    it('writes confirmed mutation responses without optimistic replacement', async () => {
        const setup = { state: 'complete', has_catalog_items: false, system_shelves_ready: true, supported_media: ['book' as const], failure_code: null }
        const saved = { enable_loans: false, book_tbr_shelf_ids: ['shelf-2'], reserved_shelf_id: null }
        completeSetup.mockResolvedValue(setup)
        updateSettings.mockResolvedValue(saved)
        const { client, Wrapper } = wrapper()
        const result = renderHook(() => ({ complete: useCompleteLibrarySetup(), settings: useUpdateLibrarySettings() }), { wrapper: Wrapper })
        await act(() => result.result.current.complete.mutateAsync({ initial_media: 'book', shelf_ids: ['shelf-2'] }))
        await act(() => result.result.current.settings.mutateAsync({ book_tbr_shelf_ids: ['shelf-2'] }))
        expect(client.getQueryData(queryKeys.library.setup('andy'))).toEqual(setup)
        expect(client.getQueryData(queryKeys.library.settings('andy'))).toEqual(saved)
    })

    it('loads settings and leaves cached confirmation intact on failure', async () => {
        const confirmed = { enable_loans: true, book_tbr_shelf_ids: [], reserved_shelf_id: null }
        getSettings.mockResolvedValue(confirmed)
        updateSettings.mockRejectedValue(new Error('offline'))
        const { client, Wrapper } = wrapper()
        const result = renderHook(() => ({ query: useLibrarySettings(), mutation: useUpdateLibrarySettings() }), { wrapper: Wrapper })
        await waitFor(() => expect(result.result.current.query.isSuccess).toBe(true))
        await expect(result.result.current.mutation.mutateAsync({ enable_loans: false })).rejects.toThrow('offline')
        expect(client.getQueryData(queryKeys.library.settings('andy'))).toEqual(confirmed)
    })
})
