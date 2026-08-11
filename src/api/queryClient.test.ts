import {
    describe,
    expect,
    it,
} from 'vitest'

import {
    QueryClient,
} from '@tanstack/react-query'

import {
    createQueryClient,
} from './queryClient'

describe('createQueryClient', () => {
    it('creates a QueryClient', () => {
        const queryClient =
            createQueryClient()

        expect(
            queryClient,
        ).toBeInstanceOf(QueryClient)

        queryClient.clear()
    })
})
