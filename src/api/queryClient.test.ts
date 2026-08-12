import {
    describe,
    expect,
    it,
} from 'vitest'

import {
    QueryClient,
} from '@tanstack/react-query'

import {
    ApiError,
} from './apiErrors'

import {
    createQueryClient,
} from './queryClient'

function createApiError(
    kind: ConstructorParameters<
        typeof ApiError
    >[0]['kind'],
    status?: number,
): ApiError {
    return new ApiError({
        kind,
        status,
        message: 'Test error.',
    })
}

describe('createQueryClient', () => {
    it('creates a QueryClient', () => {
        const queryClient =
            createQueryClient()

        expect(
            queryClient,
        ).toBeInstanceOf(QueryClient)

        queryClient.clear()
    })

    it(
        'uses a 30 second stale time',
        () => {
            const queryClient =
                createQueryClient()

            const defaults =
                queryClient.getDefaultOptions()

            expect(
                defaults.queries?.staleTime,
            ).toBe(30_000)

            queryClient.clear()
        },
    )

    it(
        'refetches stale queries on window focus',
        () => {
            const queryClient =
                createQueryClient()

            const defaults =
                queryClient.getDefaultOptions()

            expect(
                defaults.queries
                    ?.refetchOnWindowFocus,
            ).toBe(true)

            queryClient.clear()
        },
    )

    it(
        'refetches stale queries on reconnect',
        () => {
            const queryClient =
                createQueryClient()

            const defaults =
                queryClient.getDefaultOptions()

            expect(
                defaults.queries
                    ?.refetchOnReconnect,
            ).toBe(true)

            queryClient.clear()
        },
    )

    it(
        'does not retry mutations',
        () => {
            const queryClient =
                createQueryClient()

            const defaults =
                queryClient.getDefaultOptions()

            expect(
                defaults.mutations?.retry,
            ).toBe(false)

            queryClient.clear()
        },
    )

    it.each([
        [
            'unreachable',
            createApiError(
                'unreachable',
            ),
        ],
        [
            'timeout',
            createApiError(
                'timeout',
            ),
        ],
        [
            'server',
            createApiError(
                'server',
            ),
        ],
    ])(
        'retries %s query errors',
        (
            _name,
            error,
        ) => {
            const queryClient =
                createQueryClient()

            const retry =
                queryClient
                    .getDefaultOptions()
                    .queries
                    ?.retry

            expect(
                typeof retry,
            ).toBe('function')

            if (
                typeof retry !==
                'function'
            ) {
                return
            }

            expect(
                retry(0, error),
            ).toBe(true)

            expect(
                retry(1, error),
            ).toBe(true)

            expect(
                retry(2, error),
            ).toBe(false)

            queryClient.clear()
        },
    )

    it.each([
        [
            'unauthorized',
            createApiError(
                'unauthorized',
                403,
            ),
        ],
        [
            'validation',
            createApiError(
                'validation',
                422,
            ),
        ],
        [
            'cancelled',
            createApiError(
                'cancelled',
            ),
        ],
        [
            'invalid response',
            createApiError(
                'invalid_response',
            ),
        ],
        [
            'not found',
            createApiError(
                'http',
                404,
            ),
        ],
        [
            'conflict',
            createApiError(
                'http',
                409,
            ),
        ],
    ])(
        'does not retry %s query errors',
        (
            _name,
            error,
        ) => {
            const queryClient =
                createQueryClient()

            const retry =
                queryClient
                    .getDefaultOptions()
                    .queries
                    ?.retry

            expect(
                typeof retry,
            ).toBe('function')

            if (
                typeof retry !==
                'function'
            ) {
                return
            }

            expect(
                retry(0, error),
            ).toBe(false)

            queryClient.clear()
        },
    )

    it(
        'does not retry non-ApiError failures',
        () => {
            const queryClient =
                createQueryClient()

            const retry =
                queryClient
                    .getDefaultOptions()
                    .queries
                    ?.retry

            expect(
                typeof retry,
            ).toBe('function')

            if (
                typeof retry !==
                'function'
            ) {
                return
            }

            expect(
                retry(
                    0,
                    new Error(
                        'Unexpected failure',
                    ),
                ),
            ).toBe(false)

            queryClient.clear()
        },
    )

    it.each([
        408,
        429,
        500,
        502,
        503,
        504,
    ])(
        'retries retryable HTTP status %s',
        (status) => {
            const queryClient =
                createQueryClient()

            const retry =
                queryClient
                    .getDefaultOptions()
                    .queries
                    ?.retry

            expect(
                typeof retry,
            ).toBe('function')

            if (
                typeof retry !==
                'function'
            ) {
                return
            }

            const error =
                createApiError(
                    'http',
                    status,
                )

            expect(
                retry(0, error),
            ).toBe(true)

            queryClient.clear()
        },
    )
})
