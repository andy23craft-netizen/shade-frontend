import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const baseUrl = process.env.SHADE_LIVE_API_BASE_URL?.replace(/\/$/u, '')
const token = process.env.SHADE_LIVE_API_TOKEN
const enabled = Boolean(baseUrl && token)
const placeholderConfiguration = baseUrl?.includes('your-library-host') || token === 'your-bearer-token'

test.describe('live catalog image search contract', () => {
    test.skip(!enabled, 'Set SHADE_LIVE_API_BASE_URL and SHADE_LIVE_API_TOKEN to run non-mutating live API checks.')

    test.beforeAll(() => {
        if (placeholderConfiguration) {
            throw new Error('Replace the example values with the real Shade API URL and a real token. Do not include Markdown brackets or the word "Bearer" in SHADE_LIVE_API_TOKEN.')
        }
    })

    test('accepts a supported multipart image without retaining a search', async ({ request }) => {
        const image = await readFile(join(process.cwd(), 'src/assets/Shade_Library_Hero.webp'))
        const response = await request.post(`${baseUrl}/catalog/search-image`, {
            headers: { Authorization: `Bearer ${token}` },
            multipart: { image: { name: 'contract-sample.webp', mimeType: 'image/webp', buffer: image } },
        })
        expect(response.status()).toBe(200)
        const body = await response.json()
        expect(body).toEqual(expect.objectContaining({ recognized_text: expect.any(Array), candidates: expect.any(Array) }))
        if (body.external_book_candidates !== undefined) expect(body.external_book_candidates).toEqual(expect.any(Array))
        if (body.external_album_candidates !== undefined) expect(body.external_album_candidates).toEqual(expect.any(Array))
        for (const candidate of body.candidates) {
            expect(candidate).toEqual(expect.objectContaining({ media_type: expect.stringMatching(/^(book|album)$/u), item_id: expect.any(String), title: expect.any(String), matched_fields: expect.any(Array), score: expect.any(Number) }))
        }
    })

    test('rejects an unsupported multipart image', async ({ request }) => {
        const response = await request.post(`${baseUrl}/catalog/search-image`, {
            headers: { Authorization: `Bearer ${token}` },
            multipart: { image: { name: 'not-an-image.gif', mimeType: 'image/gif', buffer: Buffer.from('GIF89a') } },
        })
        expect(response.status()).toBe(422)
    })
})
