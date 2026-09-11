import { describe, expect, it, vi } from 'vitest'
import { createCatalogApi } from './catalogApi'
import type { createApiClient } from './apiClient'

function client() {
    return { request: vi.fn(), requestJson: vi.fn(), get: vi.fn(), getJson: vi.fn() } as unknown as ReturnType<typeof createApiClient>
}

describe('catalog image search transport', () => {
    it('posts the selected image once as the image multipart field', async () => {
        const apiClient = client()
        vi.mocked(apiClient.request).mockResolvedValue(new Response(JSON.stringify({ recognized_text: [], candidates: [] })))
        const file = new File(['image'], 'cover.webp', { type: 'image/webp' })

        await createCatalogApi(apiClient).searchImage(file)

        expect(apiClient.request).toHaveBeenCalledTimes(1)
        const [path, options] = vi.mocked(apiClient.request).mock.calls[0]
        expect(path).toBe('/catalog/search-image')
        expect(options).toMatchObject({ method: 'POST' })
        expect(options?.body).toBeInstanceOf(FormData)
        expect((options?.body as FormData).get('image')).toBe(file)
    })
})
