import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApiClient } from './apiClient'
import { createLibraryApi } from './libraryApi'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('createLibraryApi', () => {
    afterEach(() => vi.restoreAllMocks())

    it('uses the dedicated setup and partial settings endpoints', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch')
            .mockResolvedValueOnce(json({ state: 'required', has_catalog_items: false, system_shelves_ready: false, supported_media: ['book'], failure_code: null }))
            .mockResolvedValueOnce(json({ enable_loans: false, book_tbr_shelf_ids: ['shelf-1'], reserved_shelf_id: null }))
        const api = createLibraryApi(createApiClient({ apiBaseUrl: 'https://andy.example', getToken: () => 'secret' }))
        await api.getSetup()
        await api.updateSettings({ enable_loans: false })
        expect(fetchMock.mock.calls[0]?.[0]).toBe('https://andy.example/library/setup')
        const settingsRequest = fetchMock.mock.calls[1]?.[1]
        expect(settingsRequest?.method).toBe('PATCH')
        expect(settingsRequest?.body).toBe(JSON.stringify({ enable_loans: false }))
        expect(new Headers(settingsRequest?.headers).get('Authorization')).toBe('Bearer secret')
        expect(new Headers(settingsRequest?.headers).has('X-Forwarded-Host')).toBe(false)
        expect(new Headers(settingsRequest?.headers).has('Library-Username')).toBe(false)
    })

    it.each([
        [403, 'unauthorized'],
        [400, 'http'],
        [503, 'server'],
    ] as const)('preserves %s failures as %s', async (status, kind) => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ detail: status === 400 ? 'Invalid or unknown library host' : 'failure' }, status))
        const api = createLibraryApi(createApiClient({ apiBaseUrl: 'https://library.example', getToken: () => 'secret' }))
        await expect(api.getSettings()).rejects.toMatchObject({ status, kind })
    })

    it('preserves field-linked validation from setup completion', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ detail: [{ loc: ['body', 'shelf_ids'], msg: 'Shelf is not eligible' }] }, 422))
        const api = createLibraryApi(createApiClient({ apiBaseUrl: 'https://library.example' }))
        await expect(api.completeSetup({ initial_media: 'book', shelf_ids: [] })).rejects.toMatchObject({ fieldErrors: [{ field: 'shelf_ids', message: 'Shelf is not eligible' }] })
    })
})
