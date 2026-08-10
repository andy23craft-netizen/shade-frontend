import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { Button } from './Button'

type NotificationVariant = 'info' | 'success' | 'warning' | 'error'

interface Notification {
  id: number
  variant: NotificationVariant
  message: ReactNode
}

export interface NotifyOptions {
  variant?: NotificationVariant
  message: ReactNode
}

interface NotificationsContextValue {
  notify: (options: NotifyOptions) => void
  dismiss: (id: number) => void
}

const NotificationsContext =
  createContext<NotificationsContextValue | null>(null)

let nextNotificationId = 1

export function NotificationsProvider({
  children,
}: {
  children: ReactNode
}) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const dismiss = useCallback((id: number) => {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== id),
    )
  }, [])

  const notify = useCallback(
    ({ variant = 'info', message }: NotifyOptions) => {
      const id = nextNotificationId++

      setNotifications((current) => [
        ...current,
        {
          id,
          variant,
          message,
        },
      ])
    },
    [],
  )

  const value = useMemo(
    () => ({
      notify,
      dismiss,
    }),
    [notify, dismiss],
  )

  return (
    <NotificationsContext.Provider value={value}>
      {children}

      <div
        className="notifications"
        aria-live="polite"
        aria-atomic="false"
      >
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`notification notification--${notification.variant}`}
            role="status"
          >
            <div>{notification.message}</div>

            <Button
              className="notification__dismiss"
              variant="secondary"
              type="button"
              onClick={() => dismiss(notification.id)}
              aria-label="Dismiss notification"
            >
              ×
            </Button>
          </div>
        ))}
      </div>
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)

  if (!context) {
    throw new Error(
      'useNotifications must be used within NotificationsProvider.',
    )
  }

  return context
}