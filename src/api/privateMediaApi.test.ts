import { afterEach, expect, it, vi } from 'vitest'
import { createApiClient } from './apiClient'
import { createEpubApi } from './epubApi'
import { createPdfLibraryApi } from './pdfLibraryApi'

afterEach(() => vi.unstubAllGlobals())

it('redeems a borrower invitation as a cookie request without an administrator bearer', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)
    const api = createEpubApi(createApiClient({ apiBaseUrl: '', getToken: () => 'admin-token' }))
    await api.redeem('fixture-invitation')
    await api.borrowerProgress()
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/epub-reader/redeem', expect.objectContaining({ credentials: 'include', body: '{"invitation":"fixture-invitation"}' }))
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/epub-reader/progress', expect.objectContaining({ credentials: 'include' }))
    expect(new Headers(fetchMock.mock.calls[0][1].headers).has('Authorization')).toBe(false)
})

it('uses a bearer for the scoped PDF handoff and accepts only the backend viewer URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"viewer_url":"/pdf-library/file"}', { status: 200, headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)
    const api = createPdfLibraryApi(createApiClient({ apiBaseUrl: '/api', getToken: () => 'admin-token' }))
    const viewerUrl = await api.handoff('folder/item.pdf', true)
    expect(viewerUrl).toBe(`${window.location.origin}/pdf-library/file`)
    expect(fetchMock).toHaveBeenCalledWith('/api/pdf-library/viewer-handoff?identifier=folder%2Fitem.pdf&download=true', expect.objectContaining({ credentials: 'include', method: 'POST' }))
    expect(new Headers(fetchMock.mock.calls[0][1].headers).get('Authorization')).toBe('Bearer admin-token')
    fetchMock.mockResolvedValueOnce(new Response('{"viewer_url":"/pdf-library/file?identifier=leak.pdf"}', { status: 200, headers: { 'Content-Type': 'application/json' } }))
    await expect(api.handoff('folder/item.pdf', false)).rejects.toThrow('PDF viewer URL was rejected')
})
