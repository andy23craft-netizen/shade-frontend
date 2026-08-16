import { StrictMode, type ReactNode } from 'react'
import {
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import {
    QueryClient,
    QueryClientProvider,
    useQuery,
} from '@tanstack/react-query'
import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'
import { ConnectionProvider } from './ConnectionProvider'
import { useConnection } from './useConnection'

function ConnectionProbe() {
    const {
        status,
        errorMessage,
        apiClient,
    } = useConnection()

    return (
        <div>
            <span data-testid="status">{status}</span>

            <span data-testid="error-message">
                {errorMessage}
            </span>

            <button
                type="button"
                onClick={() => {
                    void apiClient
                        .get('/books')
                        .catch(() => undefined)
                }}
            >
                Request books
            </button>
        </div>
    )
}

function BooksQueryProbe() {
    const { apiClient } = useConnection()
    const booksQuery = useQuery({
        queryKey: ['books', 'probe'],
        queryFn: () =>
            apiClient.getJson<{
                items: unknown[]
                total: number
            }>('/books'),
    })

    return (
        <div>
            <span data-testid="query-pending">
                {String(booksQuery.isPending)}
            </span>

            <span data-testid="query-error">
                {String(booksQuery.isError)}
            </span>

            <span data-testid="query-message">
                {booksQuery.error instanceof Error
                    ? booksQuery.error.message
                    : ''}
            </span>
        </div>
    )
}

function renderProvider(
    children: ReactNode = (
        <ConnectionProbe />
    ),
) {
    return render(
        <StrictMode>
            <ConnectionProvider
                runtimeConfig={{
                    apiBaseUrl:
                        'https://library.example.com',
                    release: 'test',
                    diagnostics: {
                        enabled: false,
                        endpoint: null,
                    },
                }}
            >
                {children}
            </ConnectionProvider>
        </StrictMode>,
    )
}

function renderProviderWithQuery() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    })

    return render(
        <StrictMode>
            <QueryClientProvider client={queryClient}>
                <ConnectionProvider
                    runtimeConfig={{
                        apiBaseUrl:
                            'https://library.example.com',
                        release: 'test',
                        diagnostics: {
                            enabled: false,
                            endpoint: null,
                        },
                    }}
                >
                    <BooksQueryProbe />
                </ConnectionProvider>
            </QueryClientProvider>
        </StrictMode>,
    )
}

afterEach(() => {
    vi.restoreAllMocks()
})

describe('ConnectionProvider', () => {
    it(
        'uses the env token for protected requests after health check',
        async () => {
            const fetchMock = vi
                .spyOn(globalThis, 'fetch')
                .mockImplementation(
                    async (input, init) => {
                        const url = String(input)

                        if (url.endsWith('/health')) {
                            return new Response(
                                JSON.stringify({
                                    status: 'ok',
                                }),
                                { status: 200 },
                            )
                        }

                        if (url.endsWith('/books')) {
                            expect(
                                new Headers(
                                    init?.headers,
                                ).get(
                                    'Authorization',
                                ),
                            ).toBe(
                                'Bearer test-api-token',
                            )

                            return new Response('{}', {
                                status: 200,
                            })
                        }

                        throw new Error(
                            `Unexpected request: ${url}`,
                        )
                    },
                )

            renderProvider()

            await waitFor(() => {
                expect(
                    screen.getByTestId('status'),
                ).toHaveTextContent('connected')
            })

            expect(fetchMock).toHaveBeenCalledWith(
                'https://library.example.com/health',
                expect.objectContaining({
                    method: 'GET',
                }),
            )

            expect(
                fetchMock.mock.calls.some(
                    ([input]) =>
                        String(input).endsWith(
                            '/protected',
                        ),
                ),
            ).toBe(false)

            await screen.getByRole('button', {
                name: 'Request books',
            }).click()

            await waitFor(() => {
                expect(fetchMock).toHaveBeenCalledWith(
                    'https://library.example.com/books',
                    expect.objectContaining({
                        headers: expect.any(Headers),
                    }),
                )
            })
        },
    )

    it(
        'shows an actionable unreachable state when the health check fails',
        async () => {
            vi.spyOn(globalThis, 'fetch').mockRejectedValue(
                new TypeError('Network failure'),
            )

            renderProvider()

            await waitFor(() => {
                expect(
                    screen.getByTestId('status'),
                ).toHaveTextContent('unreachable')
            })

            expect(
                screen.getByText(
                    'Unable to reach the Shade API.',
                ),
            ).toBeInTheDocument()
        },
    )

    it(
        'sets unauthorized on 403 without leaving a child query stuck pending',
        async () => {
            vi.spyOn(globalThis, 'fetch').mockImplementation(
                async (input) => {
                    const url = String(input)

                    if (url.endsWith('/health')) {
                        return new Response('{}', {
                            status: 200,
                        })
                    }

                    if (url.endsWith('/books')) {
                        return new Response('{}', {
                            status: 403,
                        })
                    }

                    throw new Error(
                        `Unexpected request: ${url}`,
                    )
                },
            )

            renderProviderWithQuery()

            await waitFor(() => {
                expect(
                    screen.getByTestId('query-error'),
                ).toHaveTextContent('true')
            })

            expect(
                screen.getByTestId('query-pending'),
            ).toHaveTextContent('false')

            expect(
                screen.getByTestId('query-message'),
            ).toHaveTextContent(
                'API access was rejected.',
            )
        },
    )

    it(
        'sets unauthorized when a protected request receives 403',
        async () => {
            vi.spyOn(globalThis, 'fetch').mockImplementation(
                async (input) => {
                    const url = String(input)

                    if (url.endsWith('/health')) {
                        return new Response('{}', {
                            status: 200,
                        })
                    }

                    if (url.endsWith('/books')) {
                        return new Response('{}', {
                            status: 403,
                        })
                    }

                    throw new Error(
                        `Unexpected request: ${url}`,
                    )
                },
            )

            renderProvider()

            await waitFor(() => {
                expect(
                    screen.getByTestId('status'),
                ).toHaveTextContent('connected')
            })

            await screen.getByRole('button', {
                name: 'Request books',
            }).click()

            await waitFor(() => {
                expect(
                    screen.getByTestId('status'),
                ).toHaveTextContent('unauthorized')
            })

            expect(
                screen.getByTestId('error-message'),
            ).toHaveTextContent(
                'API access was rejected.',
            )
        },
    )
})
