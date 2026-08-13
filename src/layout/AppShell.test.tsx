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
import {
  mockReachableApi,
  renderAppTree,
} from '../test/renderAppTree'

describe('AppShell layout and navigation', () => {
  beforeEach(() => {
    mockReachableApi()
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    sessionStorage.clear()
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
      'Deleted Books',
      'Backup Library',
      'Connection Settings',
    ]) {
      expect(
        within(primaryNav).getByRole('link', { name: label }),
      ).toBeInTheDocument()
    }
  })

  it('shows the runtime release identifier in the footer', () => {
    renderAppTree(['/'])

    const footer = screen.getByRole('contentinfo')

    expect(footer).toHaveTextContent('Shade Library')
    expect(footer).toHaveTextContent('Release test-release')
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
    const router = renderAppTree(['/books'])

    const historyLengthBefore =
        window.history.length

    const checkoutLink =
        screen.getByRole('link', {
          name: 'Check Out',
        })

    console.log(
        'CHECKOUT LINK:',
        checkoutLink.getAttribute('href'),
    )

    fireEvent.click(checkoutLink)

    await screen.findByRole('heading', {
      level: 1,
      name: 'Check Out Book',
    })

    console.log(
        'ROUTER LOCATION:',
        router.state.location.pathname,
    )

    console.log(
        'ROUTER SEARCH:',
        router.state.location.search,
    )

    console.log(
        'ROUTER ERRORS:',
        router.state.errors,
    )

    expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'Check Out Book',
        }),
    ).toBeInTheDocument()

    expect(
        window.history.length,
    ).toBe(historyLengthBefore)
  })
})
