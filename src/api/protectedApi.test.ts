import {
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import type {
    ProtectedResponse,
} from './apiTypes'

import type {
    createApiClient,
} from './apiClient'

import {
    createProtectedApi,
} from './protectedApi'

describe('createProtectedApi', () => {
    it('gets the protected response', async () => {
        const protectedResponse =
            {} as ProtectedResponse

        const client:
            ReturnType<typeof createApiClient> = {
            request: vi.fn(),
            requestJson: vi.fn(),
            get: vi.fn(),
            getJson: vi.fn()
                .mockResolvedValue(
                    protectedResponse,
                ),
        }

        const api =
            createProtectedApi(client)

        const result = await api.get()

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/protected',
        )

        expect(result).toBe(
            protectedResponse,
        )
    })
})
