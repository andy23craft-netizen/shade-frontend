import {
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import type {
    QueryClient,
} from '@tanstack/react-query'

import {
    notifyConnectionInvalidated,
} from '../features/connection/connectionInvalidation'

import {
    subscribeQueryClientToConnectionInvalidation,
} from './queryInvalidation'

describe(
    'subscribeQueryClientToConnectionInvalidation',
    () => {
        it(
            'clears the query client when the connection is invalidated',
            () => {
                const queryClient = {
                    clear: vi.fn(),
                } as unknown as QueryClient

                const unsubscribe =
                    subscribeQueryClientToConnectionInvalidation(
                        queryClient,
                    )

                notifyConnectionInvalidated()

                expect(
                    queryClient.clear,
                ).toHaveBeenCalledOnce()

                unsubscribe()
            },
        )

        it(
            'stops clearing the query client after unsubscribe',
            () => {
                const queryClient = {
                    clear: vi.fn(),
                } as unknown as QueryClient

                const unsubscribe =
                    subscribeQueryClientToConnectionInvalidation(
                        queryClient,
                    )

                unsubscribe()

                notifyConnectionInvalidated()

                expect(
                    queryClient.clear,
                ).not.toHaveBeenCalled()
            },
        )
    },
)
