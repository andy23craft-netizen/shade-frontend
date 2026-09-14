/* ConnectionProvider.tsx */

import {
    useEffect,
    useMemo,
    useState,
} from 'react'
import type { ReactNode } from 'react'
import { APP_VERSION } from '../../config/appVersion'
import type { RuntimeConfig } from '../../config/runtimeConfig'
import {
    checkConnection,
} from './connectionApi'
import type { ConnectionStatus } from './connectionTypes'
import {
    ConnectionContext,
    type ConnectionContextValue,
} from './ConnectionContext'
import type {
    DiagnosticReporter,
} from '../../diagnostics/diagnosticReporter'
import { useAuth } from '../auth/useAuth'

interface ConnectionProviderProps {
    children: ReactNode
    runtimeConfig: RuntimeConfig
    diagnosticReporter?: DiagnosticReporter
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
    diagnosticReporter,
                                   }: ConnectionProviderProps) {
    void diagnosticReporter
    const [status, setStatus] =
        useState<ConnectionStatus>('checking')
    const [errorMessage, setErrorMessage] =
        useState<string | null>(null)

    const { apiClient } = useAuth()

    useEffect(() => {
        let cancelled = false

        checkConnection(runtimeConfig.apiBaseUrl)
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
            release: APP_VERSION,
            errorMessage,
            apiClient,
        }),
        [
            status,
            runtimeConfig.apiBaseUrl,
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
