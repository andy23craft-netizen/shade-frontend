import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'


import {
    createApiClient,
} from './apiClient'

describe('createApiClient', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it(
        'adds the current bearer token to authenticated requests',
        async () => {
            const fetchMock =
                vi.spyOn(
                    globalThis,
                    'fetch',
                ).mockResolvedValue(
                    new Response(
                        '{"ok":true}',
                        {
                            status: 200,
                            headers: {
                                'Content-Type':
                                    'application/json',
                            },
                        },
                    ),
                )

            const client =
                createApiClient({
                    apiBaseUrl:
                        'https://api.example.test',
                    getToken: () =>
                        'secret-token',
                })

            await client.getJson(
                '/books',
            )

            expect(
                fetchMock,
            ).toHaveBeenCalledWith(
                'https://api.example.test/books',
                expect.objectContaining({
                    headers:
                        expect.any(
                            Headers,
                        ),
                }),
            )

            const request =
                fetchMock.mock.calls[0]?.[1]

            const headers =
                request?.headers as Headers

            expect(
                headers.get(
                    'Authorization',
                ),
            ).toBe(
                'Bearer secret-token',
            )
        },
    )

    it(
        'does not add a bearer token to public requests',
        async () => {
            const fetchMock =
                vi.spyOn(
                    globalThis,
                    'fetch',
                ).mockResolvedValue(
                    new Response(
                        '{"ok":true}',
                        {
                            status: 200,
                            headers: {
                                'Content-Type':
                                    'application/json',
                            },
                        },
                    ),
                )

            const client =
                createApiClient({
                    apiBaseUrl:
                        'https://api.example.test',
                    getToken: () =>
                        'secret-token',
                })

            await client.getJson(
                '/health',
                {
                    authenticated:
                        false,
                },
            )

            const request =
                fetchMock.mock.calls[0]?.[1]

            const headers =
                request?.headers as Headers

            expect(
                headers.get(
                    'Authorization',
                ),
            ).toBeNull()
        },
    )

    it(
        'maps 403 to unauthorized and notifies the caller',
        async () => {
            vi.spyOn(
                globalThis,
                'fetch',
            ).mockResolvedValue(
                new Response(
                    JSON.stringify({
                        detail:
                            'Access denied.',
                    }),
                    {
                        status: 403,
                        headers: {
                            'Content-Type':
                                'application/json',
                        },
                    },
                ),
            )

            const onUnauthorized =
                vi.fn()

            const client =
                createApiClient({
                    apiBaseUrl:
                        'https://api.example.test',
                    getToken: () =>
                        'secret-token',
                    onUnauthorized,
                })

            await expect(
                client.get('/books'),
            ).rejects.toMatchObject({
                kind: 'unauthorized',
                status: 403,
                message:
                    'API access was rejected.',
            })

            expect(
                onUnauthorized,
            ).toHaveBeenCalledOnce()
        },
    )

    it(
        'maps 404 to an HTTP error',
        async () => {
            vi.spyOn(
                globalThis,
                'fetch',
            ).mockResolvedValue(
                new Response(
                    JSON.stringify({
                        detail:
                            'Book not found.',
                    }),
                    {
                        status: 404,
                        headers: {
                            'Content-Type':
                                'application/json',
                        },
                    },
                ),
            )

            const client =
                createApiClient({
                    apiBaseUrl:
                        'https://api.example.test',
                })

            await expect(
                client.get('/books/1'),
            ).rejects.toMatchObject({
                kind: 'http',
                status: 404,
                detail:
                    'Book not found.',
            })
        },
    )

    it(
        'maps 409 to an HTTP error',
        async () => {
            vi.spyOn(
                globalThis,
                'fetch',
            ).mockResolvedValue(
                new Response(
                    JSON.stringify({
                        detail:
                            'Book is already checked out.',
                    }),
                    {
                        status: 409,
                        headers: {
                            'Content-Type':
                                'application/json',
                        },
                    },
                ),
            )

            const client =
                createApiClient({
                    apiBaseUrl:
                        'https://api.example.test',
                })

            await expect(
                client.get(
                    '/books/1',
                ),
            ).rejects.toMatchObject({
                kind: 'http',
                status: 409,
                detail:
                    'Book is already checked out.',
            })
        },
    )

    it(
        'maps 412 to an HTTP error with detail preserved',
        async () => {
            vi.spyOn(
                globalThis,
                'fetch',
            ).mockResolvedValue(
                new Response(
                    JSON.stringify({
                        detail:
                            'Book is display only',
                    }),
                    {
                        status: 412,
                        headers: {
                            'Content-Type':
                                'application/json',
                        },
                    },
                ),
            )

            const client =
                createApiClient({
                    apiBaseUrl:
                        'https://api.example.test',
                })

            await expect(
                client.requestJson(
                    '/books/1/checkout',
                    {
                        method: 'POST',
                        body: {
                            borrower: 'Pat',
                        },
                    },
                ),
            ).rejects.toMatchObject({
                kind: 'http',
                status: 412,
                detail:
                    'Book is display only',
            })
        },
    )

    it(
        'maps 422 string detail to a validation error',
        async () => {
            vi.spyOn(
                globalThis,
                'fetch',
            ).mockResolvedValue(
                new Response(
                    JSON.stringify({
                        detail:
                            'ISBN is invalid.',
                    }),
                    {
                        status: 422,
                        headers: {
                            'Content-Type':
                                'application/json',
                        },
                    },
                ),
            )

            const client =
                createApiClient({
                    apiBaseUrl:
                        'https://api.example.test',
                })

            await expect(
                client.get(
                    '/books/lookup',
                ),
            ).rejects.toMatchObject({
                kind: 'validation',
                status: 422,
                detail:
                    'ISBN is invalid.',
                fieldErrors: [],
            })
        },
    )

    it(
        'maps 422 validation details to field errors',
        async () => {
            vi.spyOn(
                globalThis,
                'fetch',
            ).mockResolvedValue(
                new Response(
                    JSON.stringify({
                        detail: [
                            {
                                loc: [
                                    'body',
                                    'isbn',
                                ],
                                msg:
                                    'Invalid ISBN.',
                            },
                            {
                                loc: [
                                    'body',
                                    'title',
                                ],
                                msg:
                                    'Field required.',
                            },
                        ],
                    }),
                    {
                        status: 422,
                        headers: {
                            'Content-Type':
                                'application/json',
                        },
                    },
                ),
            )

            const client =
                createApiClient({
                    apiBaseUrl:
                        'https://api.example.test',
                })

            await expect(
                client.get('/books'),
            ).rejects.toMatchObject({
                kind: 'validation',
                status: 422,
                fieldErrors: [
                    {
                        field: 'isbn',
                        message:
                            'Invalid ISBN.',
                    },
                    {
                        field: 'title',
                        message:
                            'Field required.',
                    },
                ],
            })
        },
    )

    it.each([
        500,
        502,
        504,
    ])(
        'maps %s to a server error',
        async (status) => {
            vi.spyOn(
                globalThis,
                'fetch',
            ).mockResolvedValue(
                new Response(
                    JSON.stringify({
                        detail:
                            'Server failure.',
                    }),
                    {
                        status,
                        headers: {
                            'Content-Type':
                                'application/json',
                        },
                    },
                ),
            )

            const client =
                createApiClient({
                    apiBaseUrl:
                        'https://api.example.test',
                })

            await expect(
                client.get('/backup'),
            ).rejects.toMatchObject({
                kind: 'server',
                status,
                detail:
                    'Server failure.',
            })
        },
    )

    it(
        'rejects invalid JSON responses',
        async () => {
            vi.spyOn(
                globalThis,
                'fetch',
            ).mockResolvedValue(
                new Response(
                    'not json',
                    {
                        status: 200,
                        headers: {
                            'Content-Type':
                                'application/json',
                        },
                    },
                ),
            )

            const client =
                createApiClient({
                    apiBaseUrl:
                        'https://api.example.test',
                })

            await expect(
                client.getJson(
                    '/books',
                ),
            ).rejects.toMatchObject({
                kind: 'invalid_response',
                status: 200,
            })
        },
    )

    it(
        'returns undefined for a 204 JSON request',
        async () => {
            vi.spyOn(
                globalThis,
                'fetch',
            ).mockResolvedValue(
                new Response(
                    null,
                    {
                        status: 204,
                    },
                ),
            )

            const client =
                createApiClient({
                    apiBaseUrl:
                        'https://api.example.test',
                })

            await expect(
                client.requestJson(
                    '/books/1',
                    {
                        method: 'DELETE',
                    },
                ),
            ).resolves.toBeUndefined()
        },
    )

    it(
        'returns raw responses for binary endpoints',
        async () => {
            const response =
                new Response(
                    'CREATE TABLE books (...);',
                    {
                        status: 200,
                        headers: {
                            'Content-Type':
                                'application/sql',
                        },
                    },
                )

            vi.spyOn(
                globalThis,
                'fetch',
            ).mockResolvedValue(
                response,
            )

            const client =
                createApiClient({
                    apiBaseUrl:
                        'https://api.example.test',
                })

            const result =
                await client.get(
                    '/backup',
                )

            expect(
                result,
            ).toBe(response)

            expect(
                await result.text(),
            ).toBe(
                'CREATE TABLE books (...);',
            )
        },
    )

    it(
        'maps a network failure to unreachable',
        async () => {
            vi.spyOn(
                globalThis,
                'fetch',
            ).mockRejectedValue(
                new TypeError(
                    'Failed to fetch',
                ),
            )

            const client =
                createApiClient({
                    apiBaseUrl:
                        'https://api.example.test',
                })

            await expect(
                client.get('/books'),
            ).rejects.toMatchObject({
                kind: 'unreachable',
                message:
                    'Unable to reach the Shade API.',
            })
        },
    )

    it(
        'maps a timeout to timeout',
        async () => {
            vi.useFakeTimers()

            try {
                vi.spyOn(
                    globalThis,
                    'fetch',
                ).mockImplementation(
                    (
                        _input,
                        init,
                    ) =>
                        new Promise<Response>(
                            (
                                _resolve,
                                reject,
                            ) => {
                                init?.signal?.addEventListener(
                                    'abort',
                                    () => {
                                        reject(
                                            new DOMException(
                                                'Aborted',
                                                'AbortError',
                                            ),
                                        )
                                    },
                                    {
                                        once: true,
                                    },
                                )
                            },
                        ),
                )

                const client =
                    createApiClient({
                        apiBaseUrl:
                            'https://api.example.test',
                        timeoutMs: 1000,
                    })

                const request =
                    client.get('/books')

                const expectation =
                    expect(
                        request,
                    ).rejects.toMatchObject({
                        kind: 'timeout',
                        message:
                            'Shade API request timed out.',
                    })

                await vi.advanceTimersByTimeAsync(
                    1000,
                )

                await expectation
            } finally {
                vi.useRealTimers()
            }
        },
    )

    it(
        'maps caller cancellation to cancelled',
        async () => {
            const controller =
                new AbortController()

            vi.spyOn(
                globalThis,
                'fetch',
            ).mockImplementation(
                (
                    _input,
                    init,
                ) =>
                    new Promise<Response>(
                        (
                            _resolve,
                            reject,
                        ) => {
                            init?.signal?.addEventListener(
                                'abort',
                                () => {
                                    reject(
                                        new DOMException(
                                            'Aborted',
                                            'AbortError',
                                        ),
                                    )
                                },
                                {
                                    once: true,
                                },
                            )
                        },
                    ),
            )

            const client =
                createApiClient({
                    apiBaseUrl:
                        'https://api.example.test',
                })

            const request =
                client.get('/books', {
                    signal:
                        controller.signal,
                })

            controller.abort()

            await expect(
                request,
            ).rejects.toMatchObject({
                kind: 'cancelled',
                message:
                    'Shade API request was cancelled.',
            })
        },
    )

    it(
        'notifies the request-failure reporter for API failures',
        async () => {
            vi.spyOn(
                globalThis,
                'fetch',
            ).mockResolvedValue(
                new Response(
                    JSON.stringify({
                        detail:
                            'Server failure.',
                    }),
                    {
                        status: 500,
                        headers: {
                            'Content-Type':
                                'application/json',
                        },
                    },
                ),
            )

            const onRequestFailure =
                vi.fn()

            const client =
                createApiClient({
                    apiBaseUrl:
                        'https://api.example.test',
                    onRequestFailure,
                })

            await expect(
                client.get('/books'),
            ).rejects.toMatchObject({
                kind: 'server',
                status: 500,
            })

            expect(
                onRequestFailure,
            ).toHaveBeenCalledOnce()

            expect(
                onRequestFailure,
            ).toHaveBeenCalledWith(
                expect.objectContaining({
                    kind: 'server',
                    status: 500,
                }),
            )
        },
    )

    it(
        'does not report caller cancellation as a request failure',
        async () => {
            const controller =
                new AbortController()

            vi.spyOn(
                globalThis,
                'fetch',
            ).mockImplementation(
                (_input, init) =>
                    new Promise<Response>(
                        (_resolve, reject) => {
                            init?.signal?.addEventListener(
                                'abort',
                                () => {
                                    reject(
                                        new DOMException(
                                            'Aborted',
                                            'AbortError',
                                        ),
                                    )
                                },
                            )
                        },
                    ),
            )

            const onRequestFailure =
                vi.fn()

            const client =
                createApiClient({
                    apiBaseUrl:
                        'https://api.example.test',
                    onRequestFailure,
                })

            const request = client.get(
                '/books',
                {
                    signal:
                    controller.signal,
                },
            )

            controller.abort()

            await expect(
                request,
            ).rejects.toMatchObject({
                kind: 'cancelled',
            })

            expect(
                onRequestFailure,
            ).not.toHaveBeenCalled()
        },
    )
})
