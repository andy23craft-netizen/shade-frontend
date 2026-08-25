import {
    screen,
} from '@testing-library/react'
import {
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

describe('lazyRoutePages preloading', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
        mockReachableApi()
    })

    const routes = [
        ['/'],
        ['/about'],
        ['/dashboard'],
        ['/books'],
        ['/wishlists'],
        ['/collections'],
        ['/collection/manage'],
        ['/books/new'],
        ['/books/book-1'],
        ['/books/book-1/mark-read'],
        ['/books/book-1/reading'],
        ['/books/book-1/edit'],
        ['/books/book-1/delete'],
        ['/loans'],
        ['/shelves'],
        ['/missing-route'],
    ] as const

    it.each(routes)(
        'loads route %s',
        async (path) => {
            await renderAppTree([path])

            expect(
                screen.queryByText('Loading page…'),
            ).not.toBeInTheDocument()
        },
    )
})
