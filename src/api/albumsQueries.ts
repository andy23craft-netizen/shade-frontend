import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useConnection } from '../features/connection/useConnection'
import { createAlbumsApi, type ListAlbumsOptions } from './albumsApi'
import type { AlbumCreate, AlbumUpdate, BulkAlbumImportRequest, BulkAlbumLookupRequest, CheckinRequest, CheckoutRequest, MarkPlayedRequest } from './apiTypes'
import { queryKeys } from './queryKeys'

const cleanOptions = (options: ListAlbumsOptions) => ({
    ...(options.artist?.trim() ? { artist: options.artist.trim() } : {}),
    ...(options.title?.trim() ? { title: options.title.trim() } : {}),
    ...(options.barcode?.trim() ? { barcode: options.barcode.trim() } : {}),
    ...(options.mediaFormat ? { mediaFormat: options.mediaFormat } : {}),
    ...(options.includeDeleted ? { includeDeleted: true } : {}),
    ...(options.placementState ? { placementState: options.placementState } : {}),
    ...(options.skip !== undefined ? { skip: options.skip } : {}),
    ...(options.take !== undefined ? { take: options.take } : {}),
    ...(options.sortBy ? { sortBy: options.sortBy } : {}),
    ...(options.sortOrder ? { sortOrder: options.sortOrder } : {}),
})

export function useAlbums(options: ListAlbumsOptions = {}, queryOptions: { enabled?: boolean } = {}) {
    const { apiClient } = useConnection(); const api = createAlbumsApi(apiClient); const key = cleanOptions(options)
    return useQuery({ queryKey: queryKeys.albums.list(key), queryFn: ({ signal }) => api.list({ ...options, signal }), enabled: queryOptions.enabled ?? true })
}
const ALBUM_PAGE_SIZE = 24
export function useInfiniteAlbums(options: Omit<ListAlbumsOptions, 'skip' | 'take'> = {}) {
    const { apiClient } = useConnection()
    const api = createAlbumsApi(apiClient)
    const key = cleanOptions({ ...options, take: ALBUM_PAGE_SIZE })
    return useInfiniteQuery({
        queryKey: queryKeys.albums.list({ ...key, infinite: true }),
        initialPageParam: 0,
        queryFn: ({ pageParam, signal }) => api.list({ ...options, skip: pageParam, take: ALBUM_PAGE_SIZE, signal }),
        getNextPageParam: (lastPage, pages) => {
            const loaded = pages.reduce((count, page) => count + page.items.length, 0)
            return loaded < lastPage.total ? loaded : undefined
        },
    })
}
export function useAlbum(id: string) { const { apiClient } = useConnection(); const api = createAlbumsApi(apiClient); return useQuery({ queryKey: queryKeys.albums.detail(id), queryFn: ({ signal }) => api.get(id, { signal }), enabled: id !== '' }) }
export function useAlbumLookup(value: string, kind: 'barcode' | 'discogs', enabled = false) { const { apiClient } = useConnection(); const api = createAlbumsApi(apiClient); return useQuery({ queryKey: queryKeys.albums.lookup(value.trim(), kind), queryFn: ({ signal }) => api.lookup(value.trim(), kind, { signal }), enabled: enabled && value.trim() !== '', retry: false }) }
export function useBulkAlbumLookup() { const { apiClient } = useConnection(); const api = createAlbumsApi(apiClient); return useMutation({ mutationFn: (request: BulkAlbumLookupRequest) => api.bulkLookup(request) }) }
export function useBulkAlbumImport() {
    const { apiClient } = useConnection()
    const api = createAlbumsApi(apiClient)
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (request: BulkAlbumImportRequest) => api.bulkImport(request),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.albums.all }),
                queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
                queryClient.invalidateQueries({ queryKey: queryKeys.wishlists.all }),
            ])
        },
    })
}

function useAlbumMutation<T>(mutationFn: (value: T) => Promise<unknown>) { const queryClient = useQueryClient(); return useMutation({ mutationFn, onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: queryKeys.albums.all }), queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }), queryClient.invalidateQueries({ queryKey: queryKeys.loans.all }), queryClient.invalidateQueries({ queryKey: queryKeys.wishlists.all })]) } }) }
export function useCreateAlbum() { const { apiClient } = useConnection(); const api = createAlbumsApi(apiClient); return useAlbumMutation((album: AlbumCreate) => api.create(album)) }
export function useUpdateAlbum() { const { apiClient } = useConnection(); const api = createAlbumsApi(apiClient); return useAlbumMutation(({ id, album }: { id: string; album: AlbumUpdate }) => api.update(id, album)) }
export function useDeleteAlbum() { const { apiClient } = useConnection(); const api = createAlbumsApi(apiClient); return useAlbumMutation((id: string) => api.remove(id)) }
export function useRestoreAlbum() { const { apiClient } = useConnection(); const api = createAlbumsApi(apiClient); return useAlbumMutation((id: string) => api.restore(id)) }
export function useCheckoutAlbum() { const { apiClient } = useConnection(); const api = createAlbumsApi(apiClient); return useAlbumMutation(({ id, request }: { id: string; request: CheckoutRequest }) => api.checkout(id, request)) }
export function useCheckinAlbum() { const { apiClient } = useConnection(); const api = createAlbumsApi(apiClient); return useAlbumMutation(({ id, request }: { id: string; request: CheckinRequest }) => api.checkin(id, request)) }
export function useMarkAlbumPlayed() { const { apiClient } = useConnection(); const api = createAlbumsApi(apiClient); return useAlbumMutation(({ id, request }: { id: string; request?: MarkPlayedRequest }) => api.markPlayed(id, request)) }
export function useAlbumArtwork(id: string, enabled = true) { const { apiClient } = useConnection(); const api = createAlbumsApi(apiClient); return useQuery({ queryKey: queryKeys.albumArtwork.detail(id), queryFn: ({ signal }) => api.getArtwork(id, { signal }), enabled: enabled && id !== '', retry: false }) }
export function useUploadAlbumArtwork() { const { apiClient } = useConnection(); const api = createAlbumsApi(apiClient); const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, file }: { id: string; file: File }) => api.uploadArtwork(id, file), onSuccess: async (_, { id }) => { await Promise.all([qc.invalidateQueries({ queryKey: queryKeys.albumArtwork.detail(id) }), qc.invalidateQueries({ queryKey: queryKeys.albums.detail(id) })]) } }) }
export function useRemoveAlbumArtwork() { const { apiClient } = useConnection(); const api = createAlbumsApi(apiClient); const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => api.removeArtwork(id), onSuccess: async (_, id) => { await Promise.all([qc.invalidateQueries({ queryKey: queryKeys.albumArtwork.detail(id) }), qc.invalidateQueries({ queryKey: queryKeys.albums.detail(id) })]) } }) }
export function useRefetchAlbumArtwork() { const { apiClient } = useConnection(); const api = createAlbumsApi(apiClient); const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, replaceOwnerUpload = false }: { id: string; replaceOwnerUpload?: boolean }) => api.refetchArtwork(id, { replace_owner_upload: replaceOwnerUpload }), onSuccess: async (_, { id }) => { await Promise.all([qc.invalidateQueries({ queryKey: queryKeys.albumArtwork.detail(id) }), qc.invalidateQueries({ queryKey: queryKeys.albums.detail(id) })]) } }) }
