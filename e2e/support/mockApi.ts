import type { Page, Route } from '@playwright/test'

interface JsonResponseOptions {
    status?: number
    body: unknown
}

async function fulfillJson(
    route: Route,
    {
        status = 200,
        body,
    }: JsonResponseOptions,
) {
    await route.fulfill({
        status,
        contentType: 'application/json',
        json: body,
    })
}

export interface DashboardFixture {
    total_books: number
    checked_out: number
    read: number
    unread: number
    recently_added: number
    recent_window_days: number
    borrowing: {
        active_loans: number
        lifetime_loans: number
        average_loan_days: number | null
    }
    reading: {
        books_read: number
        books_unread: number
        average_rating: number | null
    }
}

export const emptyDashboardFixture: DashboardFixture = {
    total_books: 0,
    checked_out: 0,
    read: 0,
    unread: 0,
    recently_added: 0,
    recent_window_days: 30,
    borrowing: {
        active_loans: 0,
        lifetime_loans: 0,
        average_loan_days: null,
    },
    reading: {
        books_read: 0,
        books_unread: 0,
        average_rating: null,
    },
}

interface InstallMockApiOptions {
    dashboard?: DashboardFixture
}

export async function installMockApi(
    page: Page,
    {
        dashboard = emptyDashboardFixture,
    }: InstallMockApiOptions = {},
) {
    await page.route(
        'http://127.0.0.1:8000/**',
        async (route) => {
            const request = route.request()
            const url = new URL(request.url())

            if (
                request.method() === 'GET' &&
                url.pathname === '/health'
            ) {
                await fulfillJson(route, {
                    body: {
                        status: 'ok',
                    },
                })
                return
            }

            if (
                request.method() === 'GET' &&
                url.pathname === '/dashboard'
            ) {
                await fulfillJson(route, {
                    body: dashboard,
                })
                return
            }

            await fulfillJson(route, {
                status: 404,
                body: {
                    detail: 'Not found',
                },
            })
        },
    )
}
