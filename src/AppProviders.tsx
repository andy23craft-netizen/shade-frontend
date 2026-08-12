import {
    useEffect,
    type ReactNode,
} from 'react'
import {
    QueryClientProvider,
} from '@tanstack/react-query'
import {
    NotificationsProvider,
} from './components/Notifications'
import {
    ConnectionProvider,
} from './features/connection/ConnectionProvider'
import type { RuntimeConfig } from './config/runtimeConfig'
import {
    createQueryClient,
} from './api/queryClient'
import {
    subscribeQueryClientToConnectionInvalidation,
} from './api/queryInvalidation'

const queryClient = createQueryClient()

subscribeQueryClientToConnectionInvalidation(
    queryClient,
)

interface AppProvidersProps {
    children: ReactNode
    runtimeConfig: RuntimeConfig
}

export function AppProviders({
    children,
    runtimeConfig,
}: AppProvidersProps) {
    useEffect(() => {
        return subscribeQueryClientToConnectionInvalidation(
            queryClient,
        )
    }, [])

    return (
        <NotificationsProvider>
            <QueryClientProvider client={queryClient}>
                <ConnectionProvider
                    runtimeConfig={runtimeConfig}
                >
                    {children}
                </ConnectionProvider>
            </QueryClientProvider>
        </NotificationsProvider>
    )
}