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

    it(
        'exposes skip link, landmarks, and primary navigation',
        async () => {
            await renderAppTree(['/'])

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
                within(primaryNav).getByRole('link', {
                    name: 'Loans',
                }),
            ).toHaveAttribute('href', '/loans')

            expect(
                screen.getByRole('main'),
            ).toHaveAttribute('id', 'main-content')

            expect(
                screen.getByRole('contentinfo'),
            ).toBeInTheDocument()
        },
        20_000,
    )

    it('opens the Collection menu with browse and manage destinations', async () => {
        await renderAppTree(['/'])

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

        const primaryNav = within(
            screen.getByRole('navigation', {
                name: 'Primary navigation',
            }),
        )

        expect(
            primaryNav.getByRole('link', {
                name: 'Browse',
            }),
        ).toHaveAttribute('href', '/books')

        expect(
            primaryNav.getByRole('link', {
                name: 'Stash (0)',
            }),
        ).toHaveAttribute('href', '/stash')

        expect(
            primaryNav.getByRole('link', {
                name: 'Manage',
            }),
        ).toHaveAttribute(
            'href',
            '/collection/manage',
        )

        expect(
            primaryNav.getByRole('link', {
                name: 'Wishlists',
            }),
        ).toHaveAttribute(
            'href',
            '/wishlists',
        )

        expect(
            primaryNav.getByRole('link', {
                name: 'Collections',
            }),
        ).toHaveAttribute(
            'href',
            '/collections',
        )

        expect(
            primaryNav.queryByRole('link', {
                name: /backup/i,
            }),
        ).not.toBeInTheDocument()
    })


    it('marks the active navigation trunk for child routes', async () => {
        await renderAppTree(['/books'])

        expect(
            screen.getByRole('button', {
                name: 'Collection',
            }),
        ).toHaveAttribute('data-active', 'true')

        expect(
            screen.getByRole('link', {
                name: 'Loans',
            }),
        ).not.toHaveAttribute('aria-current')

        expect(
            screen.getByRole('link', {
                name: 'Dashboard',
            }),
        ).not.toHaveAttribute('aria-current')
    })

    it('marks the Collection trunk as active on /wishlists', async () => {
        await renderAppTree(['/wishlists'])

        expect(
            screen.getByRole('button', {
                name: 'Collection',
            }),
        ).toHaveAttribute('data-active', 'true')

        expect(
            screen.getByRole('link', {
                name: 'Loans',
            }),
        ).not.toHaveAttribute('aria-current')
    })

    it('marks Dashboard as current at /dashboard', async () => {
        await renderAppTree(['/dashboard'])

        expect(
            screen.getByRole('link', {
                name: 'Dashboard',
            }),
        ).toHaveAttribute('aria-current', 'page')

        expect(
            screen.getByRole('link', {
                name: 'Loans',
            }),
        ).not.toHaveAttribute('aria-current')
    })

    it('navigates through a primary link and focuses the destination heading', async () => {
        await renderAppTree(['/books'])

        const historyLengthBefore =
            window.history.length


        fireEvent.click(
            screen.getByRole('link', {
                name: 'Loans',
            }),
        )

        await screen.findByRole(
            'heading',
            {
                level: 1,
                name: 'Loans',
            },
            {
                timeout: 5000,
            },
        )
      expect(
          screen.getByRole('main'),
      ).toHaveFocus()

        expect(
            window.history.length,
        ).toBe(historyLengthBefore)
    })

    it('shows the package.json release and API version in the footer', async () => {
        await renderAppTree(['/'])

        const footer = screen.getByRole('contentinfo')

        expect(footer).toHaveTextContent(
            'Last updated September 01, 2026',
        )

        expect(
            await screen.findByText(
                `Release ${APP_VERSION} · API 0.2.1`,
            ),
        ).toBeInTheDocument()
    })

    it('marks the Collection trunk as active on /collections', async () => {
        await renderAppTree(['/collections'])

        expect(
            screen.getByRole('button', {
                name: 'Collection',
            }),
        ).toHaveAttribute(
            'data-active',
            'true',
        )

        expect(
            screen.getByRole('link', {
                name: 'Loans',
            }),
        ).not.toHaveAttribute('aria-current')
    })

    it('recovers from unknown routes with a home link', async () => {
        await renderAppTree(['/does-not-exist'])

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

    it('marks Loans as current at /loans', async () => {
        await renderAppTree(['/loans'])

        expect(
            screen.getByRole('link', {
                name: 'Loans',
            }),
        ).toHaveAttribute('aria-current', 'page')

        expect(
            screen.getByRole('button', {
                name: 'Collection',
            }),
        ).not.toHaveAttribute('data-active')

        expect(
            screen.getByRole('link', {
                name: 'Dashboard',
            }),
        ).not.toHaveAttribute('aria-current')
    })

    it('treats the removed backup route as not found', async () => {
        await renderAppTree(['/admin/backup'])

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
        const router = await renderAppTree([
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
            expect(document.title).toBe(
                'Loans — Shade Library',
            )
        })
    })

    it('redirects legacy checkout URLs to books', async () => {
        const router = await renderAppTree([
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
        const router = await renderAppTree([
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
