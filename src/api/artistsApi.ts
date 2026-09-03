import type { createApiClient } from './apiClient'
import type { ArtistCreate, ArtistList, ArtistRead } from './apiTypes'
export function createArtistsApi(client: ReturnType<typeof createApiClient>) { return {
    list: (inUse = false) => client.getJson<ArtistList>(`/artists${inUse ? '?in_use=true' : ''}`),
    create: (artist: ArtistCreate) => client.requestJson<ArtistRead>('/artists', { method: 'POST', body: artist }),
} }
