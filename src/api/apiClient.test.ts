import { describe, expect, it, vi } from 'vitest'
import { ApiError } from './apiErrors'
import { createApiClient } from './apiClient'

describe('createApiClient', () => {
    it('uses the current token for each protected request', async () => {
        let token = 'token-one'

        const fetchMock = vi
            .spyOn(globalThis, 'fetch')
            .mockResolvedValue(
                new Response('{}', {
                    status: 200,
                }),
            )

        const client = createApiClient({
            apiBaseUrl: 'https://library.example.com',
            getToken: () => token,
        })

        await client.get('/books')

        token = 'token-two'

        await client.get('/books')

        expect(fetchMock).toHaveBeenNthCalledWith(
            1,
            'https://library.example.com/books',
            expect.objectContaining({
                headers: expect.any(Headers),
            }),
        )

        const firstOptions =
            fetchMock.mock.calls[0]?.[1]

        const secondOptions =
            fetchMock.mock.calls[1]?.[1]

        expect(
            firstOptions?.headers,
        ).toBeInstanceOf(Headers)

        expect(
            secondOptions?.headers,
        ).toBeInstanceOf(Headers)

        expect(
            (firstOptions?.headers as Headers).get(
                'Authorization',
            ),
        ).toBe('Bearer token-one')

        expect(
            (secondOptions?.headers as Headers).get(
                'Authorization',
            ),
        ).toBe('Bearer token-two')

        fetchMock.mockRestore()
    })

    it('does not send an Authorization header for public requests', async () => {
        const fetchMock = vi
            .spyOn(globalThis, 'fetch')
            .mockResolvedValue(
                new Response('{}', {
                    status: 200,
                }),
            )

        const client = createApiClient({
            apiBaseUrl: 'https://library.example.com',
            getToken: () => 'secret-token',
        })

        await client.get('/health', {
            authenticated: false,
        })

        const options = fetchMock.mock.calls[0]?.[1]

        expect(
            (options?.headers as Headers).get(
                'Authorization',
            ),
        ).toBeNull()

        fetchMock.mockRestore()
    })

    it('turns a 403 into a safe unauthorized ApiError', async () => {
        const onUnauthorized = vi.fn()

        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(
                JSON.stringify({
                    detail: 'Invalid authentication credentials',
                }),
                {
                    status: 403,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            ),
        )

        const client = createApiClient({
            apiBaseUrl: 'https://library.example.com',
            getToken: () => 'super-secret-token',
            onUnauthorized,
        })

        await expect(
            client.get('/books'),
        ).rejects.toMatchObject({
            kind: 'unauthorized',
            status: 403,
            message: 'API access was rejected.',
        })

        expect(onUnauthorized).toHaveBeenCalledOnce()

        try {
            await client.get('/books')
        } catch (error) {
            expect(error).toBeInstanceOf(ApiError)

            expect(
                String(error),
            ).not.toContain('super-secret-token')

            expect(
                JSON.stringify(error),
            ).not.toContain('super-secret-token')
        }

        vi.restoreAllMocks()
    })

    it('converts fetch failures into unreachable errors', async () => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValue(
            new TypeError('Network failure'),
        )

        const client = createApiClient({
            apiBaseUrl: 'https://library.example.com',
            getToken: () => 'secret-token',
        })

        await expect(
            client.get('/books'),
        ).rejects.toMatchObject({
            kind: 'unreachable',
            message: 'Unable to reach the Shade API.',
        })

        vi.restoreAllMocks()
    })
})
