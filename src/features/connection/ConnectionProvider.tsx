/* ConnectionProvider.tsx */

import {
    useEffect,
    useMemo,
    useState,
} from 'react'
import type { ReactNode } from 'react'
import { createApiClient } from '../../api/apiClient'
import type { RuntimeConfig } from '../../config/runtimeConfig'
import {
    checkHealth,
} from './connectionApi'
import {
    getCurrentToken,
} from './connectionToken'
import type { ConnectionStatus } from './connectionTypes'
import {
    ConnectionContext,
    type ConnectionContextValue,
} from './ConnectionContext'

interface ConnectionProviderProps {
    children: ReactNode
    runtimeConfig: RuntimeConfig
}

function mapReachabilityFailure(
    error: unknown,
): {
    status: ConnectionStatus
    message: string
} {
    if (
        typeof error === 'object' &&
        error !== null &&
        'kind' in error
    ) {
        const connectionError = error as {
            kind:
                | 'unreachable'
                | 'unauthorized'
                | 'server'
            message: string
        }

        if (
            connectionError.kind === 'unauthorized'
        ) {
            return {
                status: 'unauthorized',
                message: connectionError.message,
            }
        }

        if (
            connectionError.kind === 'unreachable'
        ) {
            return {
                status: 'unreachable',
                message: connectionError.message,
            }
        }
    }

    return {
        status: 'unreachable',
        message:
            'Unable to connect to the Shade API.',
    }
}

export function ConnectionProvider({
    children,
    runtimeConfig,
}: ConnectionProviderProps) {
    const [status, setStatus] =
        useState<ConnectionStatus>('checking')
    const [errorMessage, setErrorMessage] =
        useState<string | null>(null)

    const apiClient = useMemo(
        () =>
            createApiClient({
                apiBaseUrl: runtimeConfig.apiBaseUrl,
                getToken: getCurrentToken,
                onUnauthorized: () => {
                    setStatus('unauthorized')
                    setErrorMessage(
                        'API access was rejected.',
                    )
                },
            }),
        [runtimeConfig.apiBaseUrl],
    )

    useEffect(() => {
        let cancelled = false

        checkHealth(runtimeConfig.apiBaseUrl)
            .then(() => {
                if (cancelled) {
                    return
                }

                setStatus('connected')
                setErrorMessage(null)
            })
            .catch((error: unknown) => {
                if (cancelled) {
                    return
                }

                const failure =
                    mapReachabilityFailure(error)

                setStatus(failure.status)
                setErrorMessage(failure.message)
            })

        return () => {
            cancelled = true
        }
    }, [runtimeConfig.apiBaseUrl])

    const value = useMemo<ConnectionContextValue>(
        () => ({
            status,
            apiBaseUrl: runtimeConfig.apiBaseUrl,
            release: runtimeConfig.release,
            errorMessage,
            apiClient,
        }),
        [
            status,
            runtimeConfig.apiBaseUrl,
            runtimeConfig.release,
            errorMessage,
            apiClient,
        ],
    )

    return (
        <ConnectionContext.Provider value={value}>
            {children}
        </ConnectionContext.Provider>
    )
}
