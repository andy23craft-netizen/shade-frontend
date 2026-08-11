import {
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import type {
    DashboardSummary,
} from './apiTypes'

import type {
    createApiClient,
} from './apiClient'

import {
    createDashboardApi,
} from './dashboardApi'

describe('createDashboardApi', () => {
    it('gets the dashboard using the typed response', async () => {
        const dashboard =
            {} as DashboardSummary

        const client:
            ReturnType<typeof createApiClient> = {
            request: vi.fn(),
            requestJson: vi.fn(),
            get: vi.fn(),
            getJson: vi.fn()
                .mockResolvedValue(dashboard),
        }

        const api =
            createDashboardApi(client)

        const result = await api.get()

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/dashboard',
        )

        expect(result).toBe(dashboard)
    })
})
