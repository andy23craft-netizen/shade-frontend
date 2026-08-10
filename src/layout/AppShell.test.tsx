import { StrictMode } from 'react'
import {
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { createTestRouter } from '../routes/createMemoryRouter'

function renderShell(initialEntries: string[] = ['/']) {
  const router = createTestRouter(initialEntries)

  render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )

  return router
}

describe('AppShell layout and navigation', () => {
  it('exposes skip link, landmarks, and primary navigation labels', () => {
    renderShell(['/'])

    expect(
      screen.getByRole('link', {
        name: 'Skip to main content',
      }),
    ).toHaveAttribute('href', '#main-content')

    expect(
      screen.getByRole('banner'),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('navigation', {
        name: 'Primary navigation',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('main'),
    ).toHaveAttribute('id', 'main-content')

    expect(
      screen.getByRole('contentinfo'),
    ).toBeInTheDocument()

    const primaryNav = screen.getByRole('navigation', {
      name: 'Primary navigation',
    })

    for (const label of [
      'Dashboard',
      'Books',
      'Add Book',
      'Check Out',
      'Check In',
      'Loans',
      'Deleted Books',
      'Backup Library',
      'Connection Settings',
    ]) {
      expect(
        within(primaryNav).getByRole('link', { name: label }),
      ).toBeInTheDocument()
    }
  })

  it('marks exactly one primary navigation link as the current page', () => {
    renderShell(['/loans'])

    const primaryNav = screen.getByRole('navigation', {
      name: 'Primary navigation',
    })
    const currentLinks = within(primaryNav)
      .getAllByRole('link')
      .filter(
        (link) => link.getAttribute('aria-current') === 'page',
      )

    expect(currentLinks).toHaveLength(1)
    expect(currentLinks[0]).toHaveAccessibleName('Loans')
  })

  it('recovers from unknown routes with a home link', () => {
    renderShell(['/does-not-exist'])

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Page Not Found',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('link', {
        name: 'Return to the dashboard',
      }),
    ).toHaveAttribute('href', '/')
  })

  it('navigates to a feature route without mutating window history', () => {
    const historyLengthBefore = window.history.length

    renderShell(['/books'])

    fireEvent.click(
      screen.getByRole('link', {
        name: 'Check Out',
      }),
    )

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Check Out',
      }),
    ).toBeInTheDocument()

    expect(window.history.length).toBe(historyLengthBefore)
  })
})
