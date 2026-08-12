import {
    QueryClient,
} from '@tanstack/react-query'

import {
    ApiError,
} from './apiErrors'

function shouldRetryQuery(
    failureCount: number,
    error: unknown,
): boolean {
    if (failureCount >= 2) {
        return false
    }

    if (!(error instanceof ApiError)) {
        return false
    }

    switch (error.kind) {
        case 'unreachable':
        case 'timeout':
        case 'server':
            return true

        case 'http':
            return (
                error.status === 408 ||
                error.status === 429 ||
                error.status === 500 ||
                error.status === 502 ||
                error.status === 503 ||
                error.status === 504
            )

        case 'unauthorized':
        case 'validation':
        case 'cancelled':
        case 'invalid_response':
            return false
    }
}

export function createQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 30_000,
                refetchOnWindowFocus: true,
                refetchOnReconnect: true,
                retry: shouldRetryQuery,
            },
            mutations: {
                retry: false,
            },
        },
    })
}
