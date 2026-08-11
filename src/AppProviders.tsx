import type { ReactNode } from 'react'
import { NotificationsProvider } from './components/Notifications'
import { ConnectionProvider } from './features/connection/ConnectionProvider'
import type { RuntimeConfig } from './config/runtimeConfig'

interface AppProvidersProps {
    children: ReactNode
    runtimeConfig: RuntimeConfig
}

export function AppProviders({
                                 children,
                                 runtimeConfig,
                             }: AppProvidersProps) {
    return (
        <NotificationsProvider>
            <ConnectionProvider runtimeConfig={runtimeConfig}>
                {children}
            </ConnectionProvider>
        </NotificationsProvider>
    )
}