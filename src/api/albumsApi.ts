import type { createApiClient } from './apiClient'
import type { ApiCallOptions } from './apiCallOptions'
import type { AlbumArtworkRefetchRequest, AlbumCreate, AlbumList, AlbumLookupResponse, AlbumRead, AlbumUpdate, CheckinRequest, CheckoutRequest, MarkPlayedRequest } from './apiTypes'

export interface ListAlbumsOptions extends ApiCallOptions {
    artist?: string; title?: string; barcode?: string; mediaFormat?: string
    includeDeleted?: boolean; skip?: number; take?: number; sortBy?: string; sortOrder?: string
}

const signalOptions = (signal?: AbortSignal) => signal ? { signal } : undefined

export function createAlbumsApi(client: ReturnType<typeof createApiClient>) {
    return {
        async list(options: ListAlbumsOptions = {}): Promise<AlbumList> {
            const params = new URLSearchParams()
            const strings = { artist: options.artist, title: options.title, barcode: options.barcode, media_format: options.mediaFormat, sortBy: options.sortBy, sortOrder: options.sortOrder }
            for (const [name, value] of Object.entries(strings)) if (value?.trim()) params.set(name, value.trim())
            if (options.includeDeleted) params.set('include_deleted', 'true')
            if (options.skip !== undefined) params.set('skip', String(options.skip))
            if (options.take !== undefined) params.set('take', String(options.take))
            const query = params.toString()
            return client.getJson<AlbumList>(`/albums${query ? `?${query}` : ''}`, signalOptions(options.signal))
        },
        get: (id: string, options: ApiCallOptions = {}) => client.getJson<AlbumRead>(`/albums/${encodeURIComponent(id)}`, signalOptions(options.signal)),
        create: (album: AlbumCreate) => client.requestJson<AlbumRead>('/albums', { method: 'POST', body: album }),
        update: (id: string, album: AlbumUpdate) => client.requestJson<AlbumRead>(`/albums/${encodeURIComponent(id)}`, { method: 'PATCH', body: album }),
        remove: async (id: string) => { await client.request(`/albums/${encodeURIComponent(id)}`, { method: 'DELETE' }) },
        restore: (id: string) => client.requestJson<AlbumRead>(`/albums/${encodeURIComponent(id)}/restore`, { method: 'POST' }),
        lookup: (value: string, kind: 'barcode' | 'discogs', options: ApiCallOptions = {}) => {
            const params = new URLSearchParams(kind === 'barcode' ? { barcode: value } : { discogs_release_id: value })
            return client.getJson<AlbumLookupResponse>(`/albums/lookup?${params}`, signalOptions(options.signal))
        },
        checkout: (id: string, request: CheckoutRequest) => client.requestJson<AlbumRead>(`/albums/${encodeURIComponent(id)}/checkout`, { method: 'POST', body: request }),
        checkin: (id: string, request: CheckinRequest) => client.requestJson<AlbumRead>(`/albums/${encodeURIComponent(id)}/checkin`, { method: 'POST', body: request }),
        markPlayed: (id: string, request: MarkPlayedRequest = {}) => client.requestJson<AlbumRead>(`/albums/${encodeURIComponent(id)}/mark-played`, { method: 'POST', body: request }),
        getArtwork: async (id: string, options: ApiCallOptions = {}) => (await client.get(`/albums/${encodeURIComponent(id)}/artwork`, signalOptions(options.signal))).blob(),
        uploadArtwork: async (id: string, file: File) => { const body = new FormData(); body.set('file', file); const response = await client.request(`/albums/${encodeURIComponent(id)}/artwork`, { method: 'PUT', body }); return response.json() as Promise<AlbumRead> },
        removeArtwork: async (id: string) => { await client.request(`/albums/${encodeURIComponent(id)}/artwork`, { method: 'DELETE' }) },
        refetchArtwork: (id: string, request: AlbumArtworkRefetchRequest) => client.requestJson<AlbumRead>(`/albums/${encodeURIComponent(id)}/artwork/refetch`, { method: 'POST', body: request }),
    }
}
