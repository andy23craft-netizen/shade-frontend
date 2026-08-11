import {
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import type {
    createApiClient,
} from './apiClient'

import {
    createBackupApi,
} from './backupApi'

describe('createBackupApi', () => {
    it('gets the SQL backup as text', async () => {
        const response = new Response(
            'CREATE TABLE books (...);',
            {
                status: 200,
                headers: {
                    'Content-Type':
                        'application/sql',
                },
            },
        )

        const client:
            ReturnType<typeof createApiClient> = {
            request: vi.fn(),
            requestJson: vi.fn(),
            get: vi.fn()
                .mockResolvedValue(response),
            getJson: vi.fn(),
        }

        const api =
            createBackupApi(client)

        const result = await api.get()

        expect(
            client.get,
        ).toHaveBeenCalledWith(
            '/backup',
        )

        expect(result).toBe(
            'CREATE TABLE books (...);',
        )
    })
})
