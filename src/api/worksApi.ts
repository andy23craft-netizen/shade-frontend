import type { WorkRead } from './apiTypes'
import type { createApiClient } from './apiClient'

export function createWorksApi(client: ReturnType<typeof createApiClient>) {
    return {
        get: (id: string) => client.getJson<WorkRead>(`/works/${encodeURIComponent(id)}`),
        merge: (targetId: string, sourceWorkIds: string[]) => client.requestJson<WorkRead>(`/works/${encodeURIComponent(targetId)}/merge`, { method: 'POST', body: { source_work_ids: sourceWorkIds } }),
        split: (id: string, itemIds: string[]) => client.requestJson<WorkRead>(`/works/${encodeURIComponent(id)}/split`, { method: 'POST', body: { item_ids: itemIds } }),
    }
}
