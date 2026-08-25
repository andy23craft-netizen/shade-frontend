import {
    screen,
    within,
} from '@testing-library/react'
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
})
