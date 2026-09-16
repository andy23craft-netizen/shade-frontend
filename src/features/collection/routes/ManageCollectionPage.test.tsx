import {
    render,
    screen,
    within,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import {
    beforeEach,
    describe,
    expect,
    it,
} from 'vitest'

import {
    mockReachableApi,
    renderAppTree,
} from '../../../test/renderAppTree'
import { SiteReadOnlyContext } from '../../siteReadOnly/SiteReadOnlyContext'
import { ManageCollectionPage } from './ManageCollectionPage'

describe('ManageCollectionPage', () => {
    beforeEach(() => {
        mockReachableApi()
    })

    it('offers the supported collection maintenance destinations', async () => {
        await renderAppTree(['/collection/manage'])

        const main = screen.getByRole('main')

        expect(
            within(main).getByText(
                /organize shelves, and maintain your library/i,
            ),
        ).toBeInTheDocument()

        expect(
            within(main).getByRole('link', {
                name: /^Build the Collection/i,
            }),
        ).toHaveAttribute(
            'href',
            '/library/setup',
        )

        expect(
            within(main).getByRole('link', {
                name: /^Add Book/i,
            }),
        ).toHaveAttribute(
            'href',
            '/books/new',
        )

        expect(
            within(main).getByRole('link', {
                name: /^Shelves/i,
            }),
        ).toHaveAttribute(
            'href',
            '/shelves',
        )

        expect(within(main).getByRole('link', { name: /^Library Settings/i })).toHaveAttribute('href', '/library/settings')

        expect(within(main).getByRole('link', { name: /^Add Album/i })).toHaveAttribute('href', '/albums/new')
        expect(within(main).getByRole('link', { name: /^Bulk Add Albums/i })).toHaveAttribute('href', '/albums/bulk-add')

        expect(
            within(main).queryByRole('link', {
                name: 'Backup Library',
            }),
        ).not.toBeInTheDocument()

        expect(
            within(main).queryByRole('link', {
                name: /backup/i,
            }),
        ).not.toBeInTheDocument()
    })

    it('keeps Library Settings reachable while the site is read-only', () => {
        render(
            <SiteReadOnlyContext.Provider value={{
                enabled: true,
                writesDisabled: true,
                canToggle: true,
            }}>
                <MemoryRouter>
                    <ManageCollectionPage />
                </MemoryRouter>
            </SiteReadOnlyContext.Provider>,
        )

        expect(screen.getByRole('link', { name: /^Library Settings/i })).toHaveAttribute(
            'href',
            '/library/settings',
        )
        expect(screen.getByRole('link', { name: /^Library Settings/i })).not.toHaveAttribute(
            'aria-disabled',
            'true',
        )
        expect(screen.getByRole('link', { name: /^Add Book/i })).toHaveAttribute(
            'aria-disabled',
            'true',
        )
    })
})
