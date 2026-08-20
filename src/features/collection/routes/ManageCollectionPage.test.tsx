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

    it('offers the supported collection maintenance destinations', () => {
        renderAppTree(['/collection/manage'])

        const main = screen.getByRole('main')

        expect(
            within(main).getByRole('link', {
                name: 'Add Book',
            }),
        ).toHaveAttribute(
            'href',
            '/books/new',
        )

        expect(
            within(main).getByRole('link', {
                name: 'Shelves',
            }),
        ).toHaveAttribute(
            'href',
            '/shelves',
        )

        expect(
            within(main).getByRole('link', {
                name: 'Deleted Books',
            }),
        ).toHaveAttribute(
            'href',
            '/admin/deleted',
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
