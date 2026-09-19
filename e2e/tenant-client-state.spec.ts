import { expect, test } from '@playwright/test'

test('uses neutral metadata for arbitrary deployment hosts', async ({ page }) => {
    for (const hostname of ['tenant-a.localhost', 'tenant-b.localhost']) {
        await page.goto(`http://${hostname}:4173/`)
        await expect(page).toHaveTitle('Home — Library — Shade')
        await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'Library')
        await expect(page.locator('html')).toHaveAttribute('data-library', 'neutral')
    }
})

test('does not select branding or private state from the hostname', async ({ page }) => {
    await page.goto('http://tenant-a.localhost:4173/')
    await page.evaluate(() => localStorage.setItem('shade:tenant-a.localhost:album:bulk-add:v1', JSON.stringify({ title: 'Private draft' })))

    await page.goto('http://tenant-b.localhost:4173/')
    expect(await page.evaluate(() => localStorage.getItem('shade:tenant-a.localhost:album:bulk-add:v1'))).toBeNull()
    await expect(page.locator('.home-page__hero-image')).toHaveCount(0)
    await expect(page.getByText('Private draft')).toHaveCount(0)
})
