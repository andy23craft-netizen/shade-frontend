import {
  useCallback,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { Button } from './Button'
import {
  NotificationsContext,
  type Notification,
  type NotificationVariant,
} from './NotificationsContext'

let nextNotificationId = 1

const statusLabels: Record<NotificationVariant, string> = {
  info: 'Info',
  success: 'Success',
  warning: 'Warning',
  error: 'Error',
}

export function NotificationsProvider({
  children,
}: {
  children: ReactNode
}) {
  const [notifications, setNotifications] = useState<
    Notification[]
  >([])

  const dismiss = useCallback((id: number) => {
    setNotifications((current) =>
      current.filter(
        (notification) => notification.id !== id,
      ),
    )
  }, [])

  const notify = useCallback(
    ({
      variant = 'info',
      message,
    }: {
      variant?: Notification['variant']
      message: ReactNode
    }) => {
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

      <div className="notifications">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`notification notification--${notification.variant}`}
            role={
              notification.variant === 'error'
                ? 'alert'
                : 'status'
            }
          >
            <div>
              <strong>{statusLabels[notification.variant]}: </strong>
              {notification.message}
            </div>

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
