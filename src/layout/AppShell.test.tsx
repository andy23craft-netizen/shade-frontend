import {
    fireEvent,
    screen,
    within,
    waitFor,
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

    it('exposes skip link, landmarks, and primary navigation', () => {
        renderAppTree(['/'])

        expect(
            screen.getByRole('link', {
                name: 'Skip to main content',
            }),
        ).toHaveAttribute('href', '#main-content')

        expect(
            screen.getByRole('banner'),
        ).toBeInTheDocument()

        const primaryNav = screen.getByRole('navigation', {
            name: 'Primary navigation',
        })

        expect(primaryNav).toBeInTheDocument()

        expect(
            within(primaryNav).getByRole('link', {
                name: 'Dashboard',
            }),
        ).toHaveAttribute('href', '/dashboard')

        expect(
            within(primaryNav).getByRole('button', {
                name: 'Collection',
            }),
        ).toHaveAttribute('aria-expanded', 'false')

        expect(
            within(primaryNav).getByRole('button', {
                name: 'Circulation',
            }),
        ).toHaveAttribute('aria-expanded', 'false')

        expect(
            screen.getByRole('main'),
        ).toHaveAttribute('id', 'main-content')

        expect(
            screen.getByRole('contentinfo'),
        ).toBeInTheDocument()
    })

    it('opens the Collection menu with browse and manage destinations', () => {
        renderAppTree(['/'])

        const collectionButton = screen.getByRole(
            'button',
            {
                name: 'Collection',
            },
        )

        fireEvent.click(collectionButton)

        expect(collectionButton).toHaveAttribute(
            'aria-expanded',
            'true',
        )

        expect(
            screen.getByRole('link', {
                name: 'Browse',
            }),
        ).toHaveAttribute('href', '/books')

        expect(
            screen.getByRole('link', {
                name: 'Manage',
            }),
        ).toHaveAttribute(
            'href',
            '/collection/manage',
        )

        expect(
            screen.getByRole('link', {
                name: 'Wishlists',
            }),
        ).toHaveAttribute('href', '/wishlists')

        expect(
            within(
                screen.getByRole('navigation', {
                    name: 'Primary navigation',
                }),
            ).queryByRole('link', {
                name: /backup/i,
            }),
        ).not.toBeInTheDocument()
    })

    it('opens the Circulation menu with lending destinations', () => {
        renderAppTree(['/'])

        const circulationButton = screen.getByRole(
            'button',
            {
                name: 'Circulation',
            },
        )

        fireEvent.click(circulationButton)

        expect(circulationButton).toHaveAttribute(
            'aria-expanded',
            'true',
        )

        expect(
            screen.queryByRole('link', {
                name: 'Check Out',
            }),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByRole('link', {
                name: 'Check In',
            }),
        ).not.toBeInTheDocument()

        expect(
            screen.getByRole('link', {
                name: 'Loans',
            }),
        ).toHaveAttribute('href', '/loans')
    })

    it('marks the active navigation trunk for child routes', () => {
        renderAppTree(['/books'])

        expect(
            screen.getByRole('button', {
                name: 'Collection',
            }),
        ).toHaveAttribute('data-active', 'true')

        expect(
            screen.getByRole('button', {
                name: 'Circulation',
            }),
        ).not.toHaveAttribute('data-active')

        expect(
            screen.getByRole('link', {
                name: 'Dashboard',
            }),
        ).not.toHaveAttribute('aria-current')
    })

    it('marks the Collection trunk as active on /wishlists', () => {
        renderAppTree(['/wishlists'])

        expect(
            screen.getByRole('button', {
                name: 'Collection',
            }),
        ).toHaveAttribute('data-active', 'true')

        expect(
            screen.getByRole('button', {
                name: 'Circulation',
            }),
        ).not.toHaveAttribute('data-active')
    })

    it('marks Dashboard as current at /dashboard', () => {
        renderAppTree(['/dashboard'])

        expect(
            screen.getByRole('link', {
                name: 'Dashboard',
            }),
        ).toHaveAttribute('aria-current', 'page')

        expect(
            screen.getByRole('button', {
                name: 'Collection',
            }),
        ).not.toHaveAttribute('data-active')

        expect(
            screen.getByRole('button', {
                name: 'Circulation',
            }),
        ).not.toHaveAttribute('data-active')
    })

    it('navigates through a drawer menu and focuses the destination heading', async () => {
        renderAppTree(['/books'])

        const historyLengthBefore =
            window.history.length

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Circulation',
            }),
        )

        fireEvent.click(
            screen.getByRole('link', {
                name: 'Loans',
            }),
        )

        await screen.findByRole('heading', {
            level: 1,
            name: 'Loans',
        })

      expect(
          screen.getByRole('main'),
      ).toHaveFocus()

        expect(
            window.history.length,
        ).toBe(historyLengthBefore)
    })

    it('shows the package.json release and API version in the footer', async () => {
        renderAppTree(['/'])

        const footer = screen.getByRole('contentinfo')

        expect(footer).toHaveTextContent('Shade Library')

        expect(
            await screen.findByText(
                `Release ${APP_VERSION} · API 0.2.1`,
            ),
        ).toBeInTheDocument()
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
                name: 'Return home',
            }),
        ).toHaveAttribute('href', '/')
    })

    it('treats the removed backup route as not found', () => {
        renderAppTree(['/admin/backup'])

        expect(
            screen.getByRole('heading', {
                level: 1,
                name: 'Page Not Found',
            }),
        ).toBeInTheDocument()

        expect(
            screen.queryByRole('heading', {
                level: 1,
                name: 'Backup Library',
            }),
        ).not.toBeInTheDocument()
    })

    it('redirects legacy check-in URLs to loans and preserves the book ID', async () => {
        const router = renderAppTree([
            '/checkin?bookId=test-book-id',
        ])

        await waitFor(() => {
            expect(
                router.state.location.pathname,
            ).toBe('/loans')

            expect(
                router.state.location.search,
            ).toBe('?bookId=test-book-id')
        })

        expect(
            screen.getByRole('heading', {
                level: 1,
                name: 'Loans',
            }),
        ).toBeInTheDocument()

        await waitFor(() => {
            expect(document.title).toBe('Loans — Shade')
        })
    })

    it('redirects legacy checkout URLs to books', async () => {
        const router = renderAppTree([
            '/checkout',
        ])

        await waitFor(() => {
            expect(
                router.state.location.pathname,
            ).toBe('/books')

            expect(
                router.state.location.search,
            ).toBe('')
        })
    })

    it('redirects legacy checkout book URLs to details with the checkout flag', async () => {
        const router = renderAppTree([
            '/checkout?bookId=test-book-id',
        ])

        await waitFor(() => {
            expect(
                router.state.location.pathname,
            ).toBe('/books/test-book-id')

            expect(
                router.state.location.search,
            ).toBe('?checkout=1')
        })
    })
})
