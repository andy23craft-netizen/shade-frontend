import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import type { ReactNode } from 'react'
import type { RuntimeConfig } from '../../config/runtimeConfig'
import {
    checkHealth,
    verifyToken,
} from './connectionApi'
import {
    clearStoredToken,
    loadStoredToken,
    saveStoredToken,
} from './connectionStorage'
import type {
    ConnectionStatus,
} from './connectionTypes'
import {
    ConnectionContext,
    type ConnectionContextValue,
} from './ConnectionContext'

interface ConnectionProviderProps {
    children: ReactNode
    runtimeConfig: RuntimeConfig
}

export function ConnectionProvider({
                                       children,
                                       runtimeConfig,
                                   }: ConnectionProviderProps) {
    const [status, setStatus] =
        useState<ConnectionStatus>('checking')
    const [hasToken, setHasToken] = useState(false)
    const [errorMessage, setErrorMessage] =
        useState<string | null>(null)

    const verifyConnection = useCallback(
        async (token: string | null) => {
            setStatus('checking')
            setErrorMessage(null)

            try {
                await checkHealth(runtimeConfig.apiBaseUrl)

                if (!token) {
                    setHasToken(false)
                    setStatus('setup_required')
                    return
                }

                await verifyToken(
                    runtimeConfig.apiBaseUrl,
                    token,
                )

                setHasToken(true)
                setStatus('connected')
            } catch (error) {
                if (
                    typeof error === 'object' &&
                    error !== null &&
                    'kind' in error
                ) {
                    const apiError = error as {
                        kind:
                            | 'unreachable'
                            | 'unauthorized'
                            | 'server'
                        message: string
                    }

                    if (apiError.kind === 'unauthorized') {
                        clearStoredToken()
                        setHasToken(false)
                        setStatus('unauthorized')
                        setErrorMessage(apiError.message)
                        return
                    }

                    if (apiError.kind === 'unreachable') {
                        setStatus('unreachable')
                        setErrorMessage(apiError.message)
                        return
                    }
                }

                setStatus('unreachable')
                setErrorMessage(
                    'Unable to connect to the Shade API.',
                )
            }
        },
        [runtimeConfig.apiBaseUrl],
    )

    useEffect(() => {
        const initializeConnection = async () => {
            const token = loadStoredToken()
            await verifyConnection(token)
        }

        void initializeConnection()
    }, [verifyConnection])

    const connect = useCallback(
        async (token: string): Promise<boolean> => {
            const trimmedToken = token.trim()

            if (!trimmedToken) {
                setStatus('setup_required')
                setHasToken(false)
                setErrorMessage('An API token is required.')
                return false
            }

            setStatus('checking')
            setErrorMessage(null)

            try {
                await checkHealth(runtimeConfig.apiBaseUrl)
                await verifyToken(
                    runtimeConfig.apiBaseUrl,
                    trimmedToken,
                )

                saveStoredToken(trimmedToken)
                setHasToken(true)
                setStatus('connected')

                return true
            } catch (error) {
                if (
                    typeof error === 'object' &&
                    error !== null &&
                    'kind' in error
                ) {
                    const apiError = error as {
                        kind:
                            | 'unreachable'
                            | 'unauthorized'
                            | 'server'
                        message: string
                    }

                    if (apiError.kind === 'unauthorized') {
                        clearStoredToken()
                        setHasToken(false)
                        setStatus('unauthorized')
                        setErrorMessage(apiError.message)
                        return false
                    }

                    if (apiError.kind === 'unreachable') {
                        setStatus('unreachable')
                        setErrorMessage(apiError.message)
                        return false
                    }
                }

                setStatus('unreachable')
                setErrorMessage(
                    'Unable to connect to the Shade API.',
                )
                return false
            }
        },
        [runtimeConfig.apiBaseUrl],
    )

    const retry = useCallback(async () => {
        await verifyConnection(loadStoredToken())
    }, [verifyConnection])

    const forgetConnection = useCallback(() => {
        clearStoredToken()
        setHasToken(false)
        setStatus('setup_required')
        setErrorMessage(null)
    }, [])

    const value = useMemo<ConnectionContextValue>(
        () => ({
            status,
            apiBaseUrl: runtimeConfig.apiBaseUrl,
            release: runtimeConfig.release,
            hasToken,
            errorMessage,
            connect,
            retry,
            forgetConnection,
        }),
        [
            status,
            runtimeConfig.apiBaseUrl,
            runtimeConfig.release,
            hasToken,
            errorMessage,
            connect,
            retry,
            forgetConnection,
        ],
    )

    return (
        <ConnectionContext.Provider value={value}>
            {children}
        </ConnectionContext.Provider>
    )
}

