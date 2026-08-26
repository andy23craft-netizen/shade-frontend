import { expect, test } from '@playwright/test'
import {
    expectNoSeriousAccessibilityViolations,
} from './support/accessibility'
import {
    installMockApi,
    makeBook,
} from './support/mockApi'

const criticalRoutes = [
    {
        name: 'books',
        path: '/books',
        heading: 'Books',
    },
    {
        name: 'new book',
        path: '/books/new',
        heading: 'Add Book',
    },
    {
        name: 'book detail',
        path: '/books/accessibility-book',
        heading: 'Pale Fire',
    },
    {
        name: 'loans',
        path: '/loans',
        heading: 'Loans',
    },
]

for (const route of criticalRoutes) {
    test(`${route.name} has no serious or critical automated accessibility violations`, async ({
                                                                                                   page,
                                                                                               }) => {
        const book = makeBook({
            id: 'accessibility-book',
            title: 'Pale Fire',
        })

        await installMockApi(page, {
            books: [book],
        })

        await page.goto(route.path)

        await expect(
            page.getByText('Loading page…'),
        ).toBeHidden({
            timeout: 15_000,
        })

        await expect(
            page.getByRole('heading', {
                level: 1,
                name: route.heading,
            }),
        ).toBeVisible({
            timeout: 15_000,
        })

        await expectNoSeriousAccessibilityViolations(
            page,
        )
    })
}

