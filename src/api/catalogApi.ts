import type { PhysicalItemSummary, ResolveCodeRequest, ResolveCodeResponse } from './apiTypes'
import type { createApiClient } from './apiClient'

export function createCatalogApi(client: ReturnType<typeof createApiClient>) {
    return {
        resolveCode(request: ResolveCodeRequest): Promise<ResolveCodeResponse> {
            return client.requestJson<ResolveCodeResponse>('/catalog/resolve-code', {
                method: 'POST', body: { value: request.value.trim(), ...(request.active_media_type ? { active_media_type: request.active_media_type } : {}) },
            })
        },
        recentAdditions(take = 10): Promise<PhysicalItemSummary[]> {
            return client.getJson(`/catalog/recent-additions?take=${encodeURIComponent(String(take))}`)
        },
    }
}
