import {
  fireEvent,
  screen,
  within,
} from '@testing-library/react'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { APP_VERSION } from '../config/appVersion'
import {
  mockReachableApi,
  renderAppTree,
} from '../test/renderAppTree'

describe('AppShell layout and navigation', () => {
  beforeEach(() => {
    mockReachableApi()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('exposes skip link, landmarks, and primary navigation labels', () => {
    renderAppTree(['/'])

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
      'Shelves',
      'Deleted Books',
      'Backup Library',
    ]) {
      expect(
        within(primaryNav).getByRole('link', { name: label }),
      ).toBeInTheDocument()
    }
  })

  it('shows the VERSION release and API version in the footer', async () => {
    renderAppTree(['/'])

    const footer = screen.getByRole('contentinfo')

    expect(footer).toHaveTextContent('Shade Library')
    expect(
      await screen.findByText(
        `Release ${APP_VERSION} · API 0.2.1`,
      ),
    ).toBeInTheDocument()
  })

  it('marks exactly one primary navigation link as the current page', () => {
    renderAppTree(['/loans'])

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
    renderAppTree(['/does-not-exist'])

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

  it('navigates to a feature route without mutating window history', async () => {
    renderAppTree(['/books'])

    const historyLengthBefore =
        window.history.length

    const checkoutLink =
        screen.getByRole('link', {
          name: 'Check Out',
        })

    fireEvent.click(checkoutLink)

    const checkoutHeading =
        await screen.findByRole('heading', {
          level: 1,
          name: 'Check Out Book',
        })

    expect(checkoutHeading).toBeInTheDocument()
    expect(checkoutHeading).toHaveFocus()

    expect(
        window.history.length,
    ).toBe(historyLengthBefore)
  })
})
