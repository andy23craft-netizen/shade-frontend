import {
    expect,
    test,
} from '@playwright/test'

import {
    installMockApi,
    makeBook,
} from './support/mockApi'

const SCANNED_ISBN = '9780679723424'

async function scanIsbn(
    page: Parameters<
        typeof installMockApi
    >[0],
    isbn = SCANNED_ISBN,
) {
    await page.evaluate((value) => {
        for (const key of value) {
            window.dispatchEvent(
                new KeyboardEvent(
                    'keydown',
                    {
                        key,
                        bubbles: true,
                        cancelable: true,
                    },
                ),
            )
        }

        window.dispatchEvent(
            new KeyboardEvent(
                'keydown',
                {
                    key: 'Enter',
                    bubbles: true,
                    cancelable: true,
                },
            ),
        )
    }, isbn)
}

test('opens a unique scanned book directly from the dashboard and Back returns to the dashboard', async ({
                                                                                                             page,
                                                                                                         }) => {
    const book = makeBook({
        book_id: 'scan-target',
        title: 'Pale Fire',
        isbn13: SCANNED_ISBN,
    })

    await installMockApi(page, {
        books: [book],
    })

    await page.goto('/dashboard')

    await expect(
        page.getByRole('heading', {
            level: 1,
            name: 'Dashboard',
        }),
    ).toBeVisible()

    await scanIsbn(page)

    await expect(page).toHaveURL(
        /\/books\/scan-target$/,
    )

    await expect(
        page.getByRole('heading', {
            level: 1,
            name: 'Pale Fire',
        }),
    ).toBeVisible()

    await page.goBack()

    await expect(page).toHaveURL(
        /\/dashboard$/,
    )

    await expect(
        page.getByRole('heading', {
            level: 1,
            name: 'Dashboard',
        }),
    ).toBeVisible()
})

test('keeps multiple scanned ISBN matches on the books list', async ({
                                                                         page,
                                                                     }) => {
    const firstCopy = makeBook({
        book_id: 'copy-1',
        title: 'Pale Fire — First Copy',
        isbn13: SCANNED_ISBN,
    })

    const secondCopy = makeBook({
        book_id: 'copy-2',
        title: 'Pale Fire — Second Copy',
        isbn13: SCANNED_ISBN,
    })

    await installMockApi(page, {
        books: [
            firstCopy,
            secondCopy,
        ],
    })

    await page.goto('/dashboard')

    await expect(
        page.getByRole('heading', {
            level: 1,
            name: 'Dashboard',
        }),
    ).toBeVisible()

    await scanIsbn(page)

    await expect(page).toHaveURL(
        new RegExp(
            `/books\\?isbn=${SCANNED_ISBN}$`,
        ),
    )

    await expect(
        page.getByRole('link', {
            name: 'Pale Fire — First Copy',
        }),
    ).toBeVisible()

    await expect(
        page.getByRole('link', {
            name: 'Pale Fire — Second Copy',
        }),
    ).toBeVisible()

    await expect(
        page.getByRole('button', {
            name: 'Clear ISBN',
        }),
    ).toBeVisible()
})
