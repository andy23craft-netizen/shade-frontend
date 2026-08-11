import { StrictMode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConnectionProvider } from './ConnectionProvider'
import { useConnection } from './useConnection'
import {
    subscribeToConnectionInvalidation,
} from './connectionInvalidation'

function ConnectionProbe() {
    const {
        status,
        hasToken,
        errorMessage,
        apiClient,
        connect,
        forgetConnection,
    } = useConnection()

    return (
        <div>
            <span data-testid="status">{status}</span>

            <span data-testid="has-token">
                {String(hasToken)}
            </span>

            <span data-testid="error-message">
                {errorMessage}
            </span>

            <button
                type="button"
                onClick={() => {
                    void apiClient.get('/books').catch(() => undefined)
                }}
            >
                Request books
            </button>

            <button
                type="button"
                onClick={() => void connect('replacement-token')}
            >
                Replace token
            </button>

            <button
                type="button"
                onClick={forgetConnection}
            >
                Forget
            </button>
        </div>
    )
}
function renderProvider() {
    return render(
        <StrictMode>
            <ConnectionProvider
                runtimeConfig={{
                    apiBaseUrl: 'https://library.example.com',
                    release: 'test',
                }}
            >
                <ConnectionProbe />
            </ConnectionProvider>
        </StrictMode>,
    )
}

afterEach(() => {
    vi.restoreAllMocks()
    sessionStorage.clear()
})

describe('ConnectionProvider', () => {
    it('uses the current verified token for protected requests', async () => {
        sessionStorage.setItem(
            'shade.apiToken',
            'initial-token',
        )

        const fetchMock = vi
            .spyOn(globalThis, 'fetch')
            .mockImplementation(async (input, init) => {
                const url = String(input)

                if (url.endsWith('/health')) {
                    return new Response(
                        JSON.stringify({ status: 'ok' }),
                        { status: 200 },
                    )
                }

                if (url.endsWith('/protected')) {
                    expect(
                        new Headers(init?.headers).get(
                            'Authorization',
                        ),
                    ).toBe('Bearer initial-token')

                    return new Response(
                        JSON.stringify({
                            message: 'You are authenticated',
                        }),
                        { status: 200 },
                    )
                }

                if (url.endsWith('/books')) {
                    return new Response('{}', {
                        status: 200,
                    })
                }

                throw new Error(
                    `Unexpected request: ${url}`,
                )
            })

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
            expect(fetchMock).toHaveBeenCalledWith(
                'https://library.example.com/books',
                expect.objectContaining({
                    headers: expect.any(Headers),
                }),
            )
        })

        const booksCall = fetchMock.mock.calls.find(
            ([input]) =>
                String(input).endsWith('/books'),
        )

        expect(
            new Headers(
                booksCall?.[1]?.headers,
            ).get('Authorization'),
        ).toBe('Bearer initial-token')
    })

    it('shows an actionable unreachable state when the health check fails', async () => {
        const fetchMock = vi
            .spyOn(globalThis, 'fetch')
            .mockRejectedValue(
                new TypeError('Network failure'),
            )

        renderProvider()

        await waitFor(() => {
            expect(
                screen.getByTestId('status'),
            ).toHaveTextContent('unreachable')
        })

        expect(
            screen.getByTestId('has-token'),
        ).toHaveTextContent('false')

        expect(
            screen.getByText(
                'Unable to reach the Shade API.',
            ),
        ).toBeInTheDocument()

        expect(fetchMock).toHaveBeenCalledWith(
            'https://library.example.com/health',
            expect.objectContaining({
                method: 'GET',
            }),
        )
    })

    it('uses the replacement token for subsequent protected requests', async () => {
        sessionStorage.setItem(
            'shade.apiToken',
            'initial-token',
        )

        const fetchMock = vi
            .spyOn(globalThis, 'fetch')
            .mockImplementation(async (input) => {
                const url = String(input)

                if (
                    url.endsWith('/health') ||
                    url.endsWith('/protected')
                ) {
                    return new Response('{}', {
                        status: 200,
                    })
                }

                if (url.endsWith('/books')) {
                    return new Response('{}', {
                        status: 200,
                    })
                }

                throw new Error(
                    `Unexpected request: ${url}`,
                )
            })

        renderProvider()

        await waitFor(() => {
            expect(
                screen.getByTestId('status'),
            ).toHaveTextContent('connected')
        })

        await screen.getByRole('button', {
            name: 'Replace token',
        }).click()

        await waitFor(() => {
            expect(
                sessionStorage.getItem(
                    'shade.apiToken',
                ),
            ).toBe('replacement-token')
        })

        await screen.getByRole('button', {
            name: 'Request books',
        }).click()

        await waitFor(() => {
            const booksCall = fetchMock.mock.calls.find(
                ([input]) =>
                    String(input).endsWith('/books'),
            )

            expect(
                new Headers(
                    booksCall?.[1]?.headers,
                ).get('Authorization'),
            ).toBe('Bearer replacement-token')
        })
    })

    it('clears the current token when the connection is forgotten', async () => {
        sessionStorage.setItem(
            'shade.apiToken',
            'initial-token',
        )

        vi.spyOn(globalThis, 'fetch').mockImplementation(
            async (input) => {
                const url = String(input)

                if (
                    url.endsWith('/health') ||
                    url.endsWith('/protected')
                ) {
                    return new Response('{}', {
                        status: 200,
                    })
                }

                return new Response('{}', {
                    status: 200,
                })
            },
        )

        renderProvider()

        await waitFor(() => {
            expect(
                screen.getByTestId('status'),
            ).toHaveTextContent('connected')
        })

        await screen.getByRole('button', {
            name: 'Forget',
        }).click()

        expect(
            screen.getByTestId('status'),
        ).toHaveTextContent('setup_required')

        expect(
            screen.getByTestId('has-token'),
        ).toHaveTextContent('false')

        expect(
            sessionStorage.getItem(
                'shade.apiToken',
            ),
        ).toBeNull()
    })

    it('notifies protected-data caches when the connection is forgotten', async () => {
        sessionStorage.setItem(
            'shade.apiToken',
            'initial-token',
        )

        vi.spyOn(globalThis, 'fetch').mockImplementation(
            async (input) => {
                const url = String(input)

                if (
                    url.endsWith('/health') ||
                    url.endsWith('/protected')
                ) {
                    return new Response('{}', {
                        status: 200,
                    })
                }

                return new Response('{}', {
                    status: 200,
                })
            },
        )

        const invalidated = vi.fn()

        const unsubscribe =
            subscribeToConnectionInvalidation(invalidated)

        renderProvider()

        await waitFor(() => {
            expect(
                screen.getByTestId('status'),
            ).toHaveTextContent('connected')
        })

        await screen.getByRole('button', {
            name: 'Forget',
        }).click()

        expect(invalidated).toHaveBeenCalledOnce()

        unsubscribe()
    })

    it('notifies protected-data caches when the API rejects the token', async () => {
        sessionStorage.setItem(
            'shade.apiToken',
            'initial-token',
        )

        vi.spyOn(globalThis, 'fetch').mockImplementation(
            async (input) => {
                const url = String(input)

                if (url.endsWith('/health')) {
                    return new Response('{}', {
                        status: 200,
                    })
                }

                if (url.endsWith('/protected')) {
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

        const invalidated = vi.fn()

        const unsubscribe =
            subscribeToConnectionInvalidation(invalidated)

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

        expect(invalidated).toHaveBeenCalledOnce()

        expect(
            screen.getByTestId('has-token'),
        ).toHaveTextContent('false')

        expect(
            sessionStorage.getItem('shade.apiToken'),
        ).toBeNull()

        unsubscribe()
    })
})

