import { expect, test } from '@playwright/test'

test('uses the hosted library identity in home metadata', async ({ page }) => {
    for (const [hostname, libraryName] of [
        ['dalmo.localhost', "Dalmo's Library"],
        ['jamie.localhost', "Jamie's Library"],
    ] as const) {
        await page.goto(`http://${hostname}:4173/`)

        await expect(page).toHaveTitle(`Home — ${libraryName} — Shade`)
        await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
            'content',
            libraryName,
        )
        await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
            'content',
            libraryName,
        )
    }
})

test('serves Dalmo artwork only on Dalmo hosts', async ({ page }) => {
    await page.goto('http://dalmo.localhost:4173/')
    await expect(page.locator('.home-page__hero-image')).toHaveAttribute(
        'src',
        /Dalmo_hero/u,
    )
    await expect(page.getByRole('link', { name: "About Dalmo's Library" })).toBeVisible()

    await page.goto('http://jamie.localhost:4173/')
    await expect(page.locator('.home-page__hero-image')).not.toHaveAttribute(
        'src',
        /Dalmo_hero/u,
    )

    await page.goto('http://unknown.localhost:4173/')
    await expect(page.getByRole('heading', { name: 'Library not found' })).toBeVisible()
    await expect(page.locator('img[src*="Dalmo_"]')).toHaveCount(0)
})

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
