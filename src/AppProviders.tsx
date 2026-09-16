import { useState, type ReactNode } from 'react'
import {
    QueryClientProvider,
} from '@tanstack/react-query'
import {
    NotificationsProvider,
} from './components/Notifications'
import {
    ConnectionProvider,
} from './features/connection/ConnectionProvider'
import { AuthProvider } from './features/auth/AuthProvider'
import { SiteReadOnlyProvider } from './features/siteReadOnly/SiteReadOnlyProvider'
import type { RuntimeConfig } from './config/runtimeConfig'
import {
    createQueryClient,
} from './api/queryClient'
import type {
    DiagnosticReporter,
} from './diagnostics/diagnosticReporter'
import type { AccessMode } from './features/auth/AuthContext'

interface AppProvidersProps {
    children: ReactNode
    runtimeConfig: RuntimeConfig
    diagnosticReporter: DiagnosticReporter
    initialAccessMode?: AccessMode
    initialAccessToken?: string | null
}

export function AppProviders({
                                 children,
                                 runtimeConfig,
                                 diagnosticReporter,
                                 initialAccessMode,
                                 initialAccessToken,
                             }: AppProvidersProps) {
    // A provider instance belongs to exactly one document/hostname. Keeping
    // the client here prevents query data and Blob responses from crossing
    // application mounts (including test and host transitions).
    const [queryClient] = useState(createQueryClient)

    return (
        <NotificationsProvider>
            <QueryClientProvider client={queryClient}>
                <AuthProvider runtimeConfig={runtimeConfig} diagnosticReporter={diagnosticReporter} initialMode={initialAccessMode} initialAccessToken={initialAccessToken}>
                    <ConnectionProvider
                        runtimeConfig={runtimeConfig}
                        diagnosticReporter={diagnosticReporter}
                    >
                        <SiteReadOnlyProvider>
                            {children}
                        </SiteReadOnlyProvider>
                    </ConnectionProvider>
                </AuthProvider>
            </QueryClientProvider>
        </NotificationsProvider>
    )
}
