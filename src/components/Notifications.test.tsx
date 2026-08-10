import {
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { NotificationsProvider } from './Notifications'
import { useNotifications } from './useNotifications'
import { Button } from './Button'

function NotificationsProbe() {
  const { notify } = useNotifications()

  return (
    <div>
      <Button
        type="button"
        onClick={() =>
          notify({
            variant: 'info',
            message: 'Library synced',
          })
        }
      >
        Notify info
      </Button>

      <Button
        type="button"
        onClick={() =>
          notify({
            variant: 'success',
            message: 'Book saved',
          })
        }
      >
        Notify success
      </Button>

      <Button
        type="button"
        onClick={() =>
          notify({
            variant: 'warning',
            message: 'Due soon',
          })
        }
      >
        Notify warning
      </Button>

      <Button
        type="button"
        onClick={() =>
          notify({
            variant: 'error',
            message: 'Request failed',
          })
        }
      >
        Notify error
      </Button>
    </div>
  )
}

function renderNotifications() {
  return render(
    <NotificationsProvider>
      <NotificationsProbe />
    </NotificationsProvider>,
  )
}

describe('NotificationsProvider', () => {
  it('renders notifications with live-region roles and visible status text', () => {
    renderNotifications()

    fireEvent.click(screen.getByRole('button', { name: 'Notify info' }))
    fireEvent.click(
      screen.getByRole('button', { name: 'Notify success' }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Notify warning' }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Notify error' }))

    const statuses = screen.getAllByRole('status')
    const alerts = screen.getAllByRole('alert')

    expect(statuses).toHaveLength(3)
    expect(alerts).toHaveLength(1)

    expect(statuses[0]).toHaveTextContent('Info: Library synced')
    expect(statuses[1]).toHaveTextContent('Success: Book saved')
    expect(statuses[2]).toHaveTextContent('Warning: Due soon')
    expect(alerts[0]).toHaveTextContent('Error: Request failed')

    const region = document.querySelector('.notifications')

    expect(region).not.toBeNull()
    expect(region).not.toHaveAttribute('aria-live')
  })

  it('dismisses notifications manually', () => {
    renderNotifications()

    fireEvent.click(screen.getByRole('button', { name: 'Notify error' }))

    const alert = screen.getByRole('alert')

    fireEvent.click(
      within(alert).getByRole('button', {
        name: 'Dismiss notification',
      }),
    )

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('requires the provider for the notifications hook', () => {
    expect(() => render(<NotificationsProbe />)).toThrow(
      /useNotifications must be used within NotificationsProvider/,
    )
  })
})
