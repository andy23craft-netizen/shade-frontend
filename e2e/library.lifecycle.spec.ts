import { expect, test } from '@playwright/test'
import {
    installMockApi,
    makeBook,
} from './support/mockApi'

test('checks out and checks in a book through the browser', async ({
                                                                       page,
                                                                   }) => {
    const book = makeBook({
        id: 'lifecycle-book',
        title: 'Pale Fire',
        authors: 'Vladimir Nabokov',
    })

    const api = await installMockApi(page, {
        books: [book],
    })

    await page.goto(`/books/${book.id}`)

    await expect(
        page.getByRole('heading', {
            level: 1,
            name: book.title,
        }),
    ).toBeVisible()

    /*
     * CHECKOUT
     */

    await page
        .getByLabel('Book actions')
        .getByRole('link', {
            name: 'Check Out',
        })
        .click()

    await expect(
        page.getByRole('heading', {
            level: 1,
            name: 'Check Out Book',
        }),
    ).toBeVisible()

    await page.getByLabel('Borrower').fill(
        'Jane Reader',
    )

    await page.getByRole('button', {
        name: 'Check Out Book',
    }).click()

    await expect(
        page.getByRole('dialog'),
    ).toBeVisible()

    await page.getByRole('button', {
        name: 'Confirm checkout',
    }).click()

    await expect(
        page.getByRole('heading', {
            level: 1,
            name: book.title,
        }),
    ).toBeVisible()

    expect(
        api.state.books.find(
            (candidate) =>
                candidate.id === book.id,
        )?.status,
    ).toBe('on_loan')

    expect(
        api.state.loans,
    ).toHaveLength(1)

    expect(
        api.state.loans[0]?.borrower,
    ).toBe('Jane Reader')

    expect(
        api.state.requests.some(
            (request) =>
                request.method === 'POST' &&
                request.pathname ===
                `/books/${book.id}/checkout`,
        ),
    ).toBe(true)

    /*
 * CHECK-IN
 */

    await page
        .getByLabel('Book actions')
        .getByRole('link', {
            name: 'Check In',
        })
        .click()

    await expect(
        page.getByRole('heading', {
            level: 1,
            name: 'Loans',
        }),
    ).toBeVisible()

    await expect(page).toHaveURL(
        new RegExp(
            `/loans\\?bookId=${book.id}`,
        ),
    )

    await expect(
        page.getByRole('heading', {
            name: 'Return Card',
        }),
    ).toBeVisible()

    await page.getByRole('button', {
        name: 'Check In Book',
    }).click()

    await expect(
        page.getByRole('dialog'),
    ).toBeVisible()

    await page.getByRole('button', {
        name: 'Confirm check-in',
    }).click()

    await expect(page).toHaveURL(
        /\/loans$/,
    )

    await expect(
        page.getByRole('heading', {
            level: 2,
            name: 'Returned Loans',
        }),
    ).toBeVisible()

    await page.getByRole('link', {
        name: book.title,
    }).click()

    await expect(
        page.getByRole('heading', {
            level: 1,
            name: book.title,
        }),
    ).toBeVisible()

    /*
     * MARK READ
     */

    await page
        .getByLabel('Book actions')
        .getByRole('link', {
            name: 'Mark Read',
        })
        .click()
    await expect(
        page.getByRole('heading', {
            level: 1,
            name: 'Mark Book Read',
        }),
    ).toBeVisible()

    await page.getByLabel('Rating').selectOption('5')

    await page.getByLabel('Review').fill(
        'A brilliant, strange novel.',
    )

    await page
        .locator('form')
        .getByRole('button', {
            name: 'Mark Read',
        })
        .click()

    await expect(
        page.getByRole('dialog'),
    ).toBeVisible()

    await page
        .getByLabel('Confirm reading completion')
        .getByRole('button', {
            name: 'Mark Read',
        })
        .click()

    await expect(
        page.getByRole('heading', {
            level: 1,
            name: book.title,
        }),
    ).toBeVisible()

    expect(
        api.state.books.find(
            (candidate) =>
                candidate.id === book.id,
        )?.is_read,
    ).toBe(true)

    expect(
        api.state.books.find(
            (candidate) =>
                candidate.id === book.id,
        )?.rating,
    ).toBe(5)

    expect(
        api.state.requests.some(
            (request) =>
                request.method === 'POST' &&
                request.pathname ===
                `/books/${book.id}/mark-read`,
        ),
    ).toBe(true)

    /*
     * DELETE
     */

    await page
        .getByLabel('Book actions')
        .getByRole('link', {
            name: 'Delete Book',
        })
        .click()

    await expect(
        page.getByRole('heading', {
            level: 1,
            name: 'Delete Book',
        }),
    ).toBeVisible()

    await page.getByRole('button', {
        name: 'Delete Book',
    }).click()

    await expect(
        page.getByRole('dialog'),
    ).toBeVisible()

    await page.getByRole('button', {
        name: 'Delete Book',
    }).last().click()

    expect(
        api.state.books.find(
            (candidate) =>
                candidate.id === book.id,
        )?.deletion_date,
    ).not.toBeNull()

    expect(
        api.state.requests.some(
            (request) =>
                request.method === 'DELETE' &&
                request.pathname ===
                `/books/${book.id}`,
        ),
    ).toBe(true)

    /*
     * RESTORE
     */

    await page.goto('/admin/deleted')

    await expect(
        page.getByRole('heading', {
            level: 1,
            name: 'Deleted Books',
        }),
    ).toBeVisible()

    await page.getByRole('button', {
        name: 'Restore Book',
    }).click()

    await expect(
        page.getByRole('dialog'),
    ).toBeVisible()

    await page.getByRole('button', {
        name: 'Restore Book',
    }).last().click()

    expect(
        api.state.books.find(
            (candidate) =>
                candidate.id === book.id,
        )?.deletion_date,
    ).toBeNull()

    expect(
        api.state.requests.some(
            (request) =>
                request.method === 'POST' &&
                request.pathname ===
                `/books/${book.id}/restore`,
        ),
    ).toBe(true)

    /*
     * No lifecycle transition should use generic PATCH.
     */

    await expect(
        page.getByRole('heading', {
            level: 1,
            name: 'Deleted Books',
        }),
    ).toBeVisible()

    await expect(
        page.getByRole('link', {
            name: book.title,
        }),
    ).not.toBeVisible()

    expect(
        api.state.books.find(
            (candidate) =>
                candidate.id === book.id,
        )?.status,
    ).toBe('available')

    expect(
        api.state.loans,
    ).toHaveLength(1)

    expect(
        api.state.loans[0]?.returned_at,
    ).not.toBeNull()

    expect(
        api.state.requests.some(
            (request) =>
                request.method === 'POST' &&
                request.pathname ===
                `/books/${book.id}/checkin`,
        ),
    ).toBe(true)

    /*
     * Guard against implementing lifecycle transitions
     * through the generic edit endpoint.
     */

    const lifecyclePatchRequests =
        api.state.requests.filter(
            (request) =>
                request.method === 'PATCH' &&
                request.pathname ===
                `/books/${book.id}`,
        )

    expect(lifecyclePatchRequests).toEqual([])
})
