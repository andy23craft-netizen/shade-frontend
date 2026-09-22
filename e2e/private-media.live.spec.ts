import { expect, test } from '@playwright/test'

async function signIn(page: import('@playwright/test').Page) {
    await page.goto('/')
    await page.getByRole('button', { name: 'Log in' }).click()
    const dialog = page.getByRole('dialog', { name: 'Administrator sign in' })
    await dialog.getByLabel('Administrator password').fill(process.env.FEAT16_TEST_ADMIN_PASSWORD!)
    await dialog.getByRole('button', { name: 'Log in' }).click()
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible()
}

test('live fixture PDF handoff streams through the browser cookie', async ({ page }) => {
    test.skip(!process.env.FEAT16_TEST_ADMIN_PASSWORD, 'Disposable fixture admin password not provided')
    await signIn(page)
    await page.goto('/pdf-library')
    await expect(page.getByRole('heading', { name: 'PDF Library' })).toBeVisible()
    await expect(page.getByText('shade-development-fixture.pdf')).toBeVisible()

    const fileResponse = page.context().waitForEvent('response', { predicate: (response) => new URL(response.url()).pathname === '/pdf-library/file' })
    await page.getByRole('button', { name: 'Open' }).click()
    const response = await fileResponse
    expect([200, 206]).toContain(response.status())
    expect(new URL(response.url()).search).toBe('')
    expect(response.headers()['content-type']).toContain('application/pdf')
})

test('live fixture admin opens the protected EPUB reader for a selected profile', async ({ page }) => {
    test.skip(!process.env.FEAT16_TEST_ADMIN_PASSWORD || !process.env.FEAT16_TEST_BOOK_ID, 'Disposable fixture credentials and EPUB book are required')
    await signIn(page)
    await page.goto(`/books/${process.env.FEAT16_TEST_BOOK_ID}`)
    await expect(page.getByRole('heading', { name: 'Feat 16 EPUB fixture (visual review)' })).toBeVisible()
    await expect(page.getByText('EPUB available to read and lend.')).toBeVisible()
    await page.getByLabel('Read as').selectOption({ index: 1 })
    await page.getByRole('button', { name: 'Read EPUB' }).click()
    const popupPromise = page.waitForEvent('popup')
    await page.getByRole('dialog', { name: 'Open EPUB reader?' }).getByRole('button', { name: 'Open reader' }).click()
    const reader = await popupPromise
    await expect(reader.getByRole('heading', { name: 'Read EPUB' })).toBeVisible()
    await expect(reader.getByLabel('EPUB book content')).toBeVisible()
    await expect(reader.getByRole('alert')).toHaveCount(0)
})
