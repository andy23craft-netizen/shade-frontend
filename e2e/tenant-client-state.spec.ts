import { expect, test } from '@playwright/test'

test('known hosts and unknown hosts cannot reuse private browser persistence', async ({ page }) => {
    await page.goto('http://andy.localhost:4173/')
    await page.evaluate(() => localStorage.setItem('shade:andy:album:bulk-add:v1', JSON.stringify({ title: 'Andy private draft' })))

    await page.goto('http://jamie.localhost:4173/')
    expect(await page.evaluate(() => localStorage.getItem('shade:andy:album:bulk-add:v1'))).toBeNull()
    await page.evaluate(() => localStorage.setItem('shade:jamie:album:bulk-add:v1', JSON.stringify({ title: 'Jamie private draft' })))

    await page.goto('http://unknown.localhost:4173/')
    await expect(page.getByRole('heading', { name: 'Library not found' })).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('shade:jamie:album:bulk-add:v1'))).toBeNull()
    await expect(page.getByText(/Andy private draft|Jamie private draft/)).toHaveCount(0)
})
