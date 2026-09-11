import { expect, test } from '@playwright/test'

const baseUrl = process.env.SHADE_LIVE_API_BASE_URL?.replace(/\/$/u, '')
const token = process.env.SHADE_LIVE_API_TOKEN
const bookId = process.env.SHADE_LIVE_SUMMARY_BOOK_ID
const enabled = Boolean(baseUrl && token && bookId)
const placeholderConfiguration = baseUrl?.includes('your-library-host') || token === 'your-bearer-token'

test.describe('live book provider-summary contract', () => {
    test.skip(!enabled, 'Set SHADE_LIVE_API_BASE_URL, SHADE_LIVE_API_TOKEN, and a safe SHADE_LIVE_SUMMARY_BOOK_ID to run this state-changing check.')

    test.beforeAll(() => {
        if (placeholderConfiguration) throw new Error('Replace the example API URL and token with real values. SHADE_LIVE_API_TOKEN must be the raw token, without "Bearer".')
    })

    test('refreshes the nominated book summary through the dedicated endpoint', async ({ request }) => {
        const headers = { Authorization: `Bearer ${token}` }
        const before = await request.get(`${baseUrl}/books/${encodeURIComponent(bookId!)}`, { headers })
        expect(before.status()).toBe(200)
        const refreshed = await request.post(`${baseUrl}/books/${encodeURIComponent(bookId!)}/summary/refresh`, { headers })
        expect(refreshed.status()).toBe(200)
        const body = await refreshed.json()
        expect(body).toEqual(expect.objectContaining({ availability_state: expect.any(String) }))
        expect(body.summary === null || body.summary === undefined || typeof body.summary === 'string').toBe(true)
    })
})
