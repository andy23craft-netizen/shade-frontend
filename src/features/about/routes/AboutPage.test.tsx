import {
    screen,
    waitFor,
    within,
    fireEvent,
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
} from '../../../test/renderAppTree'

describe('AboutPage', () => {
    beforeEach(() => {
        mockReachableApi()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('renders at the About route', async () => {
        await renderAppTree(['/about'])

        const heading = screen.getByRole('heading', {
            level: 1,
            name: 'Shade Library',
        })

        expect(heading).toBeInTheDocument()
        expect(heading).toHaveAttribute(
            'tabindex',
            '-1',
        )

        await waitFor(() => {
            expect(document.title).toBe(
                'About — Shade',
            )
        })
    })

    it('does not load dashboard data from the About route', async () => {
        await renderAppTree(['/about'])

        await screen.findByRole('heading', {
            level: 1,
            name: 'Shade Library',
        })

        await waitFor(() => {
            expect(
                globalThis.fetch,
            ).toHaveBeenCalled()
        })

        const requestedPaths = vi
            .mocked(globalThis.fetch)
            .mock.calls
            .map(([input]) => {
                const url =
                    typeof input === 'string'
                        ? input
                        : input instanceof URL
                            ? input.toString()
                            : input.url

                return new URL(url).pathname
            })

        expect(requestedPaths).not.toContain(
            '/dashboard',
        )
    })

    it('keeps the dashboard available at its relocated route', async () => {
        await renderAppTree(['/dashboard'])

        await screen.findByText(
            'The library at a glance.',
        )

        expect(
            screen.getByRole('heading', {
                level: 1,
                name: 'Dashboard',
            }),
        ).toBeInTheDocument()

        await waitFor(() => {
            expect(document.title).toBe(
                'Dashboard — Shade',
            )
        })
    })

    it('explains the library, its dedication, lending policy, and how to use it', async () => {
        await renderAppTree(['/about'])

        expect(
            screen.getByRole('heading', {
                level: 1,
                name: 'Shade Library',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'My home library, made easier to explore.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('heading', {
                level: 2,
                name: 'For Charles Leewright',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('heading', {
                level: 2,
                name: 'Lending Policy',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('heading', {
                level: 2,
                name: 'How to Use the Library',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'How to Use This Library',
            }),
        ).toBeInTheDocument()
    })

    it('links to the primary library workflows', async () => {
        await renderAppTree(['/about'])

        fireEvent.click(
            screen.getByRole('button', {
                name: 'How to Use This Library',
            }),
        )

        const dialog =
            await screen.findByRole('dialog')

        const guide = within(dialog)

        expect(
            guide.getByRole('link', {
                name: 'Browse the collection',
            }),
        ).toHaveAttribute('href', '/books')

        expect(
            guide.getByRole('link', {
                name: 'Add a book',
            }),
        ).toHaveAttribute('href', '/books/new')

        expect(
            guide.getByRole('link', {
                name: 'Check Out',
            }),
        ).toHaveAttribute('href', '/books')


        expect(
            guide.getByRole('link', {
                name: 'Loans',
            }),
        ).toHaveAttribute('href', '/loans')

        expect(
            guide.queryByRole('link', {
                name: 'Check In',
            }),
        ).not.toBeInTheDocument()

        expect(
            guide.getByRole('link', {
                name: 'Manage shelves',
            }),
        ).toHaveAttribute('href', '/shelves')

        expect(
            guide.getByRole('link', {
                name: 'Dashboard',
            }),
        ).toHaveAttribute('href', '/dashboard')

        expect(
            guide.getByRole('link', {
                name: 'Manage Collection',
            }),
        ).toHaveAttribute(
            'href',
            '/collection/manage',
        )
    })
})
