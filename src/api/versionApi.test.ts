import {
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import type {
    VersionResponse,
} from './apiTypes'

import type {
    createApiClient,
} from './apiClient'

import {
    createVersionApi,
} from './versionApi'

describe('createVersionApi', () => {
    it('gets version without authentication', async () => {
        const version = {
            version: '0.2.1',
        } satisfies VersionResponse

        const client:
            ReturnType<typeof createApiClient> = {
            request: vi.fn(),
            requestJson: vi.fn(),
            get: vi.fn(),
            getJson: vi.fn()
                .mockResolvedValue(version),
        }

        const api =
            createVersionApi(client)

        const result = await api.get()

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/version',
            {
                authenticated: false,
            },
        )

        expect(result).toBe(version)
    })
})
