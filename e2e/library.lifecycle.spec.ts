import { expect, test } from '@playwright/test'
import {
    installMockApi,
    makeBook,
    makeLoan,
} from './support/mockApi'

test('checks out and checks in a book through the browser', async ({
                                                                       page,
                                                                   }) => {
    const book = makeBook({
        book_id: 'lifecycle-book',
        title: 'Pale Fire',
        authors: [
            {
                author_id: 'author-nabokov',
                first_name: 'Vladimir',
                surname: 'Nabokov',
            },
        ],
    })

    const api = await installMockApi(page, {
        books: [book],
    })

    await page.goto(`/books/${book.book_id}`)

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
        .getByRole('button', {
            name: 'Check Out',
        })
        .click()

    await expect(
        page.getByRole('dialog', {
            name: 'Check Out',
        }),
    ).toBeVisible()

    await page
        .getByLabel('Borrower')
        .fill('Jane Reader')

    await page.getByRole('button', {
        name: 'Check Out Book',
    }).click()

    await expect(
        page.getByRole('dialog', {
            name: 'Check Out',
        }),
    ).not.toBeVisible()

    await expect(
        page.getByRole('heading', {
            level: 1,
            name: book.title,
        }),
    ).toBeVisible()

    expect(
        api.state.books.find(
            (candidate) =>
                candidate.book_id === book.book_id,
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
                `/books/${book.book_id}/checkout`,
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
            `/loans\\?bookId=${book.book_id}`,
        ),
    )

    await expect(
        page.getByRole('dialog', {
            name: 'Check In',
        }),
    ).toBeVisible()

    await expect(
        page.getByRole('heading', {
            name: 'Return Card',
        }),
    ).toBeVisible()

    /*
     * Submit the return card first.
     * This opens the nested confirmation dialog.
     */

    await page.getByRole('button', {
        name: 'Check In Book',
    }).click()

    await expect(
        page.getByRole('dialog', {
            name: 'Confirm check-in',
        }),
    ).toBeVisible()

    await page.getByRole('button', {
        name: 'Confirm check-in',
    }).click()

    await expect(page).toHaveURL(
        new RegExp(
            `/loans\\?bookId=${book.book_id}`,
        ),
    )

    await expect(
        page.getByRole('heading', {
            level: 2,
            name: 'Returned Loans',
        }),
    ).toBeVisible()

    expect(
        api.state.books.find(
            (candidate) =>
                candidate.book_id === book.book_id,
        )?.status,
    ).toBe('available')

    expect(
        api.state.loans[0],
    ).toEqual(
        expect.objectContaining({
            book_id: book.book_id,
            borrower: 'Jane Reader',
            returned_at: expect.any(String),
        }),
    )

    expect(
        api.state.requests.some(
            (request) =>
                request.method === 'POST' &&
                request.pathname ===
                `/books/${book.book_id}/checkin`,
        ),
    ).toBe(true)

    /*
     * MARK READ
     */

    await page.getByRole('link', {
        name: book.title,
    }).click()

    await expect(
        page.getByRole('heading', {
            level: 1,
            name: book.title,
        }),
    ).toBeVisible()

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

    await page
        .getByLabel('Rating')
        .selectOption('5')

    await page
        .getByLabel('Review')
        .fill(
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
        .getByLabel(
            'Confirm reading completion',
        )
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
                candidate.book_id === book.book_id,
        )?.is_read,
    ).toBe(true)

    expect(
        api.state.books.find(
            (candidate) =>
                candidate.book_id === book.book_id,
        )?.rating,
    ).toBe(5)

    expect(
        api.state.requests.some(
            (request) =>
                request.method === 'POST' &&
                request.pathname ===
                `/books/${book.book_id}/mark-read`,
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
                candidate.book_id === book.book_id,
        ),
    ).toBeUndefined()

    expect(
        api.state.requests.some(
            (request) =>
                request.method === 'DELETE' &&
                request.pathname ===
                `/books/${book.book_id}`,
        ),
    ).toBe(true)

    await page.goto(`/books/${book.book_id}`)

    await expect(
        page.getByRole('heading', {
            level: 1,
            name: 'Book Not Found',
        }),
    ).toBeVisible({
        timeout: 10_000,
    })

    /*
     * Guard against implementing lifecycle
     * transitions through generic PATCH.
     */

    const lifecyclePatchRequests =
        api.state.requests.filter(
            (request) =>
                request.method === 'PATCH' &&
                request.pathname ===
                `/books/${book.book_id}`,
        )

    expect(
        lifecyclePatchRequests,
    ).toEqual([])
})


test('keeps album loans out of book circulation after a reload', async ({ page }) => {
    const book = makeBook({ book_id: 'shared-catalog-id', status: 'on_loan' })
    const api = await installMockApi(page, {
        books: [book],
        loans: [
            makeLoan({ book_id: book.book_id, borrower: 'Book borrower' }),
            makeLoan({ id: 'album-loan', book_id: null, album_id: book.book_id, borrower: 'Album borrower' }),
        ],
    })

    await page.goto('/loans')
    await expect(page.getByText('Book borrower', { exact: true })).toBeVisible()
    await expect(page.getByText('Album borrower', { exact: true })).toHaveCount(0)
    await expect(page.getByText('1 loan in the history.')).toBeVisible()
    await page.reload()
    await expect(page.getByText('Book borrower', { exact: true })).toBeVisible()
    await page.getByRole('link', { name: book.title, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`/books/${book.book_id}$`))
    expect(api.state.requests.filter((request) => request.pathname === '/loans')).toEqual(
        expect.arrayContaining([expect.objectContaining({ search: '?media_type=book&skip=0&take=30' })]),
    )
    expect(api.state.requests.some((request) => /undefined|null/.test(request.pathname))).toBe(false)
})
