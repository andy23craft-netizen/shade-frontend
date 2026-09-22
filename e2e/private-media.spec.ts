import { expect, test } from '@playwright/test'
import { installMockApi, signInAsAdmin } from './support/mockApi'
import { expectNoSeriousAccessibilityViolations } from './support/accessibility'

test('PDF Library preserves server order and uses a scoped inline handoff', async ({ page }) => {
    await installMockApi(page)
    const requests: string[] = []
    await page.route('**/api/pdf-library**', async (route) => {
        const url = new URL(route.request().url())
        requests.push(`${route.request().method()} ${url.pathname}${url.search}`)
        if (url.pathname.endsWith('/viewer-handoff')) {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ viewer_url: '/pdf-library/file' }) })
            return
        }
        const items = url.searchParams.has('path')
            ? [{ identifier: 'private/second.pdf', name: 'Second.pdf', kind: 'file' }]
            : [
                { identifier: 'private', name: 'Private', kind: 'directory' },
                { identifier: 'z.pdf', name: 'Z.pdf', kind: 'file' },
                { identifier: 'a.pdf', name: 'A.pdf', kind: 'file' },
            ]
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ path: url.searchParams.get('path'), items }) })
    })
    await page.route('**/pdf-library/file', (route) => route.fulfill({ status: 200, contentType: 'application/pdf', body: '%PDF-1.4\n%%EOF' }))
    await signInAsAdmin(page)
    await page.goto('/pdf-library')
    await expect(page.getByRole('heading', { name: 'PDF Library' })).toBeVisible()
    await expect(page.locator('.pdf-library-list li')).toHaveText([/Private/, /Z\.pdf/, /A\.pdf/])
    await expectNoSeriousAccessibilityViolations(page)
    await page.getByRole('button', { name: /Private/ }).click()
    await expect(page.getByText('Second.pdf')).toBeVisible()
    expect(requests).toContain('GET /api/pdf-library?path=private')
    await page.getByRole('button', { name: 'Open' }).click()
    await expect.poll(() => requests.some((request) => request.startsWith('POST /api/pdf-library/viewer-handoff?identifier=private%2Fsecond.pdf'))).toBe(true)
    expect(requests.some((request) => request.includes('/pdf-library/file?'))).toBe(false)
})

test('borrower redemption removes its invitation before showing a safe error', async ({ page }) => {
    await page.route('**/epub-reader/redeem', (route) => route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ detail: 'invalid invitation' }) }))
    await page.goto('/epub-reader?invitation=mock-secret-value')
    await expect(page.getByRole('heading', { name: 'Private EPUB Reader' })).toBeVisible()
    await expect(page.getByRole('alert')).toContainText('unavailable or has expired')
    await expect(page).toHaveURL(/\/epub-reader$/)
    await expect(page.locator('body')).not.toContainText('mock-secret-value')
    await expect(page.getByRole('navigation')).toHaveCount(0)
})

test('viewer mode cannot enter the PDF library or make its private requests', async ({ page }) => {
    await installMockApi(page)
    const privateRequests: string[] = []
    page.on('request', (request) => { if (request.url().includes('/pdf-library') && ['fetch', 'xhr'].includes(request.resourceType())) privateRequests.push(request.url()) })
    await page.goto('/pdf-library')
    await expect(page.getByRole('heading', { name: 'Administrator access required' })).toBeVisible()
    expect(privateRequests).toEqual([])
})
