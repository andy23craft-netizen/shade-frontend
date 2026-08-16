import { expect, test } from '@playwright/test'
import {
    expectNoSeriousAccessibilityViolations,
} from './support/accessibility'
import {
    installMockApi,
    makeBook,
    makeLoan,
} from './support/mockApi'

test('critical application routes have no serious or critical automated accessibility violations', async ({
                                                                                                              page,
                                                                                                          }) => {
    const book = makeBook({
        id: 'accessibility-book',
        title: 'Pale Fire',
    })

    await installMockApi(page, {
        books: [book],
    })

    const routes = [
        {
            path: '/books',
            heading: 'Books',
        },
        {
            path: '/books/new',
            heading: 'Add Book',
        },
        {
            path: `/books/${book.id}`,
            heading: book.title,
        },
        {
            path: `/checkout?bookId=${book.id}`,
            heading: 'Check Out Book',
        },
        {
            path: '/loans',
            heading: 'Loans',
        },
    ]

    for (const route of routes) {
        await page.goto(route.path)

        await expect(
            page.getByRole('heading', {
                level: 1,
                name: route.heading,
            }),
        ).toBeVisible()

        await expectNoSeriousAccessibilityViolations(
            page,
        )
    }
})

test('check-in and deleted-book administration pass automated accessibility checks', async ({
                                                                                                page,
                                                                                            }) => {
    const checkedOutBook = makeBook({
        id: 'checked-out-book',
        title: 'Ada',
        status: 'on_loan',
    })

    const deletedBook = makeBook({
        id: 'deleted-book',
        title: 'Invisible Cities',
        deletion_date:
            '2026-08-16T12:00:00.000Z',
    })

    await installMockApi(page, {
        books: [
            checkedOutBook,
            deletedBook,
        ],
        loans: [
            makeLoan({
                id: 'active-loan',
                book_id: checkedOutBook.id,
                returned_at: null,
            }),
        ],
    })

    await page.goto(
        `/checkin?bookId=${checkedOutBook.id}`,
    )

    await expect(
        page.getByRole('heading', {
            level: 1,
            name: 'Check In Book',
        }),
    ).toBeVisible()

    await expectNoSeriousAccessibilityViolations(
        page,
    )

    await page.goto('/admin/deleted')

    await expect(
        page.getByRole('heading', {
            level: 1,
            name: 'Deleted Books',
        }),
    ).toBeVisible()

    await expectNoSeriousAccessibilityViolations(
        page,
    )
})
