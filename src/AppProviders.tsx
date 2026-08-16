import type { ReactNode } from 'react'
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
import type {
    DiagnosticReporter,
} from './diagnostics/diagnosticReporter'

const queryClient = createQueryClient()

interface AppProvidersProps {
    children: ReactNode
    runtimeConfig: RuntimeConfig
    diagnosticReporter: DiagnosticReporter
}

export function AppProviders({
                                 children,
                                 runtimeConfig,
                                 diagnosticReporter,
                             }: AppProvidersProps) {
    return (
        <NotificationsProvider>
            <QueryClientProvider client={queryClient}>
                <ConnectionProvider
                    runtimeConfig={runtimeConfig}
                    diagnosticReporter={
                        diagnosticReporter
                    }
                >
                    {children}
                </ConnectionProvider>
            </QueryClientProvider>
        </NotificationsProvider>
    )
}
