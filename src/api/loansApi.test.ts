import {
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import type {
    LoanList,
} from './apiTypes'

import type {
    createApiClient,
} from './apiClient'

import {
    createLoansApi,
} from './loansApi'

describe('createLoansApi', () => {
    it('lists loans using the typed LoanList response', async () => {
        const loans: LoanList = {
            items: [],
            total: 0,
        }

        const client:
            ReturnType<typeof createApiClient> = {
            request: vi.fn(),
            requestJson: vi.fn(),
            get: vi.fn(),
            getJson: vi.fn()
                .mockResolvedValue(loans),
        }

        const api = createLoansApi(client)

        const result = await api.list()

        expect(
            client.getJson,
        ).toHaveBeenCalledWith('/loans')

        expect(result).toEqual(loans)
    })
})
