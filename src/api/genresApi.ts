import type { createApiClient } from './apiClient'
import type { GenreCreate, GenreRead } from './apiTypes'
export function createGenresApi(client: ReturnType<typeof createApiClient>) { return {
    list: (inUse = false) => client.getJson<GenreRead[]>(`/genres${inUse ? '?in_use=true' : ''}`),
    create: (genre: GenreCreate) => client.requestJson<GenreRead>('/genres', { method: 'POST', body: genre }),
} }
