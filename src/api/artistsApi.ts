import type { createApiClient } from './apiClient'
import type { ArtistCreate, ArtistList, ArtistRead } from './apiTypes'
export function createArtistsApi(client: ReturnType<typeof createApiClient>) { return {
    list: (inUse = false) => client.getJson<ArtistList>(`/people${inUse ? '?in_use=true' : ''}`),
    create: (artist: ArtistCreate) => client.requestJson<ArtistRead>('/people', { method: 'POST', body: artist }),
} }
