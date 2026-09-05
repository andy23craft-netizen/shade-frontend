import type { createApiClient } from './apiClient'
import type { WorkRead } from './apiTypes'

export function createWorksApi(client: ReturnType<typeof createApiClient>) {
    return {
        get: (workId: string): Promise<WorkRead> =>
            client.getJson<WorkRead>(`/works/${encodeURIComponent(workId)}`),
    }
}
