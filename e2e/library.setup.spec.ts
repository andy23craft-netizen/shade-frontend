import { expect, test } from '@playwright/test'
import { installMockApi } from './support/mockApi'

test('creates a first shelf, resumes intake, and completes setup with zero items', async ({ page }) => {
    const api = await installMockApi(page, { shelves: [] })

    await page.goto('/library/setup')
    await expect(page.getByRole('heading', { level: 1, name: 'Set up your library' })).toBeVisible()

    await page.getByRole('button', { name: /Books — build a shelf/ }).click()
    await page.getByLabel('New shelf name').fill('west_wall')
    await page.getByRole('button', { name: 'Continue to Book Build Mode' }).click()

    await expect(page).toHaveURL(/\/books\/bulk-add\?setup=1&shelf_name=west_wall$/)
    await expect(page.getByLabel('ISBN')).toBeVisible()
    await expect(page.getByText('A saved intake', { exact: false })).toHaveCount(0)

    const persisted = await page.evaluate(() => localStorage.getItem('shade:andy:shared:guided-setup:v1'))
    expect(persisted).toContain('west_wall')

    await page.reload()
    await expect(page.getByLabel('ISBN')).toBeVisible()
    await page.getByRole('button', { name: 'Complete library setup' }).click()

    await expect(page).toHaveURL(/\/reading-room\/dashboard$/)
    expect(api.state.setup.state).toBe('complete')
    expect(api.state.requests).toEqual(expect.arrayContaining([
        expect.objectContaining({ method: 'POST', pathname: '/shelves' }),
        expect.objectContaining({ method: 'POST', pathname: '/library/setup/complete' }),
    ]))
})
