import { expect, test } from '@playwright/test'
import {
    expectNoSeriousAccessibilityViolations,
} from './support/accessibility'
import {
    emptyDashboardFixture,
    installMockApi,
} from './support/mockApi'

test.beforeEach(async ({ page }) => {
    await installMockApi(page)
})

test('loads the dashboard through the real browser application', async ({
                                                                            page,
                                                                        }) => {
    await page.goto('/dashboard')

    await expect(
        page.getByRole('heading', {
            level: 1,
            name: 'Dashboard',
        }),
    ).toBeVisible()

    await expect(page).toHaveTitle('Dashboard — Shade')

    await expect(
        page.getByText('Not enough data').first(),
    ).toBeVisible()
})

test('renders an all-zero dashboard as valid data', async ({
                                                               page,
                                                           }) => {
    await page.goto('/dashboard')

    await expect(
        page.getByRole('heading', {
            level: 1,
            name: 'Dashboard',
        }),
    ).toBeVisible()

    await expect(
        page.getByText(
            String(emptyDashboardFixture.total_books),
        ).first(),
    ).toBeVisible()
})

test('has no serious or critical automated accessibility violations', async ({
                                                                                 page,
                                                                             }) => {
    await page.goto('/dashboard')

    await expect(
        page.getByRole('heading', {
            level: 1,
            name: 'Dashboard',
        }),
    ).toBeVisible()

    await expectNoSeriousAccessibilityViolations(page)
})
