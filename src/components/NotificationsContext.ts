import { createContext } from 'react'
import type { ReactNode } from 'react'

export type NotificationVariant =
    | 'info'
    | 'success'
    | 'warning'
    | 'error'

export interface Notification {
    id: number
    variant: NotificationVariant
    message: ReactNode
}

export interface NotifyOptions {
    variant?: NotificationVariant
    message: ReactNode
}

export interface NotificationsContextValue {
    notify: (options: NotifyOptions) => void
    dismiss: (id: number) => void
}

export const NotificationsContext =
    createContext<NotificationsContextValue | null>(null)
