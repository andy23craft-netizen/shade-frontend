import type { ReactNode } from 'react'
import { NotificationsProvider } from './components/Notifications'

interface AppProvidersProps {
    children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
    return (
        <NotificationsProvider>
            {children}
        </NotificationsProvider>
    )
}