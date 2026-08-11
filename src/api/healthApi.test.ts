import {
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import type {
    HealthResponse,
} from './apiTypes'

import type {
    createApiClient,
} from './apiClient'

import {
    createHealthApi,
} from './healthApi'

describe('createHealthApi', () => {
    it('gets health without authentication', async () => {
        const health =
            {} as HealthResponse

        const client:
            ReturnType<typeof createApiClient> = {
            request: vi.fn(),
            requestJson: vi.fn(),
            get: vi.fn(),
            getJson: vi.fn()
                .mockResolvedValue(health),
        }

        const api =
            createHealthApi(client)

        const result = await api.get()

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/health',
            {
                authenticated: false,
            },
        )

        expect(result).toBe(health)
    })
})
