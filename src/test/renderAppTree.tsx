import { StrictMode, type ReactNode } from 'react'
import { render } from '@testing-library/react'
import { RouterProvider } from 'react-router-dom'
import { vi } from 'vitest'
import { AppProviders } from '../AppProviders'
import type { RuntimeConfig } from '../config/runtimeConfig'
import { createTestRouter } from '../routes/createMemoryRouter'
import type {
    DiagnosticReporter,
} from '../diagnostics/diagnosticReporter'

export const testDiagnosticReporter:
    DiagnosticReporter = {
    reportApiFailure: () => undefined,
    reportRenderFailure: () => undefined,
}
export const testRuntimeConfig: RuntimeConfig = {
    apiBaseUrl: 'https://library.example.com',
    diagnostics: {
        enabled: false,
        endpoint: null,
    },
}

export function mockReachableApi() {
    return vi
        .spyOn(globalThis, 'fetch')
        .mockImplementation(
            async (input) => {
                const url =
                    typeof input === 'string'
                        ? input
                        : input instanceof URL
                            ? input.toString()
                            : input.url

                const pathname = new URL(url).pathname

                if (
                    pathname === '/books'
                ) {
                    return new Response(
                        JSON.stringify({
                            items: [],
                            total: 0,
                        }),
                        {
                            status: 200,
                            headers: {
                                'Content-Type':
                                    'application/json',
                            },
                        },
                    )
                }

                if (pathname === '/loans') {
                    return new Response(
                        JSON.stringify({
                            items: [],
                            total: 0,
                        }),
                        {
                            status: 200,
                            headers: {
                                'Content-Type':
                                    'application/json',
                            },
                        },
                    )
                }

                if (
                    pathname === '/dashboard/breakdowns'
                ) {
                    return new Response(
                        JSON.stringify({
                            total_books: 0,
                            on_loan: 0,
                            by_category: [],
                            by_shelf: [],
                            by_creation_year: [],
                        }),
                        {
                            status: 200,
                            headers: {
                                'Content-Type':
                                    'application/json',
                            },
                        },
                    )
                }

                if (
                    pathname ===
                    '/dashboard/incomplete-metadata'
                ) {
                    return new Response(
                        JSON.stringify({
                            total_incomplete: 0,
                            missing_category: 0,
                            missing_shelf: 0,
                            missing_pages: 0,
                            missing_publisher: 0,
                            missing_year: 0,
                            missing_isbn: 0,
                        }),
                        {
                            status: 200,
                            headers: {
                                'Content-Type':
                                    'application/json',
                            },
                        },
                    )
                }

                if (
                    pathname ===
                    '/dashboard/incomplete-metadata/books'
                ) {
                    return new Response(
                        JSON.stringify({
                            items: [],
                            total: 0,
                        }),
                        {
                            status: 200,
                            headers: {
                                'Content-Type':
                                    'application/json',
                            },
                        },
                    )
                }

                if (pathname === '/dashboard') {
                    return new Response(
                        JSON.stringify({
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
                        }),
                        {
                            status: 200,
                            headers: {
                                'Content-Type':
                                    'application/json',
                            },
                        },
                    )
                }

                if (pathname === '/shelves') {
                    return new Response(
                        JSON.stringify([]),
                        {
                            status: 200,
                            headers: {
                                'Content-Type':
                                    'application/json',
                            },
                        },
                    )
                }

                if (pathname === '/wishlists') {
                    return new Response(
                        JSON.stringify({
                            items: [],
                            total: 0,
                        }),
                        {
                            status: 200,
                            headers: {
                                'Content-Type':
                                    'application/json',
                            },
                        },
                    )
                }

                if (pathname === '/collections') {
                    return new Response(
                        JSON.stringify({
                            items: [],
                            total: 0,
                        }),
                        {
                            status: 200,
                            headers: {
                                'Content-Type':
                                    'application/json',
                            },
                        },
                    )
                }

                if (pathname === '/version') {
                    return new Response(
                        JSON.stringify({
                            version: '0.2.1',
                        }),
                        {
                            status: 200,
                            headers: {
                                'Content-Type':
                                    'application/json',
                            },
                        },
                    )
                }

                return new Response(
                    JSON.stringify({
                        status: 'ok',
                    }),
                    {
                        status: 200,
                        headers: {
                            'Content-Type':
                                'application/json',
                        },
                    },
                )
            },
        )
}

export function renderAppTree(
    initialEntries: string[] = ['/'],
    runtimeConfig: RuntimeConfig = testRuntimeConfig,
) {
    const router = createTestRouter(initialEntries)

    render(
        <StrictMode>
            <AppProviders
                runtimeConfig={
                    runtimeConfig
                }
                diagnosticReporter={
                    testDiagnosticReporter
                }
            >
                <RouterProvider router={router} />
            </AppProviders>
        </StrictMode>,
    )

    return router
}

export function renderWithProviders(
    children: ReactNode,
    runtimeConfig: RuntimeConfig = testRuntimeConfig,
) {
    return render(
        <StrictMode>
            <AppProviders
                runtimeConfig={
                    runtimeConfig
                }
                diagnosticReporter={
                    testDiagnosticReporter
                }
            >
                {children}
            </AppProviders>
        </StrictMode>,
    )
}
