import { expect, test } from '@playwright/test'
import {
    installMockApi,
    lifecycleShelf,
} from './support/mockApi'

test('adds a book manually and opens the created book', async ({
                                                                   page,
                                                               }) => {
    const api = await installMockApi(page)

    await page.goto('/books/new')

    await page.getByLabel('Title').fill(
        'The Left Hand of Darkness',
    )

    await page.getByRole('button', {
        name: /Select authors/,
    }).click()

    await page.getByRole('searchbox', {
        name: 'Search authors',
    }).fill('Ursula K. Le Guin')

    await page.getByRole('checkbox', {
        name: 'Ursula K. Le Guin',
        exact: true,
    }).check()

    await page.getByRole('button', {
        name: /Select categories/,
    }).click()

    await page.getByRole('checkbox', {
        name: 'Fiction',
        exact: true,
    }).check()

    await page
        .getByRole('button', {
            name: 'Shelf',
            exact: true,
        })
        .click()

    await page
        .getByRole('button', {
            name: lifecycleShelf.common_name,
        })
        .click()

    await page.getByRole('button', {
        name: 'Save Book',
    }).click()

    await expect(
        page.getByRole('heading', {
            level: 1,
            name: 'The Left Hand of Darkness',
        }),
    ).toBeVisible()

    expect(api.state.books).toHaveLength(1)

    expect(api.state.books[0]).toMatchObject({
        title: 'The Left Hand of Darkness',
        authors: [
            {
                author_id: 'author-le-guin',
                first_name: 'Ursula K.',
                surname: 'Le Guin',
            },
        ],
        categories: [
            {
                category_id: 'cat-fiction',
                name: 'Fiction',
                slug: 'fiction',
            },
        ],
        shelf_name: 'a1',
        status: 'available',
        is_read: false,
    })

    const createRequest =
        api.state.requests.find(
            (request) =>
                request.method === 'POST' &&
                request.pathname === '/books',
        )

    expect(createRequest).toBeDefined()

    expect(createRequest?.body).toMatchObject({
        title: 'The Left Hand of Darkness',
        author_ids: ['author-le-guin'],
        category_ids: ['cat-fiction'],
        shelf_name: 'a1',
    })
})
