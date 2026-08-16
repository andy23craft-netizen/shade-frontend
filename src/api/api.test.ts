import {
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import {
    createApi,
} from './api'

describe('createApi', () => {
    it('creates the complete API surface', () => {
        const api = createApi({
            apiBaseUrl:
                'http://localhost:8000',
            getToken: vi.fn(),
        })

        expect(api.client).toBeDefined()
        expect(api.books).toBeDefined()
        expect(api.loans).toBeDefined()
        expect(api.shelves).toBeDefined()
        expect(api.shelves.list).toBeTypeOf(
            'function',
        )
        expect(api.dashboard).toBeDefined()
        expect(api.health).toBeDefined()
        expect(api.version).toBeDefined()
        expect(api.backup).toBeDefined()
    })
})
