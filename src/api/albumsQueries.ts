import { useInfiniteQuery, useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { useConnection } from '../features/connection/useConnection'
import { createAlbumsApi, type ListAlbumsOptions } from './albumsApi'
import { createLoansApi } from './loansApi'
import type { AlbumCreate, AlbumUpdate, BulkAlbumImportRequest, BulkAlbumLookupRequest, CheckinRequest, CheckoutRequest, MarkPlayedRequest } from './apiTypes'
import { queryKeys } from './queryKeys'

const cleanOptions = (options: ListAlbumsOptions) => ({
    ...(options.search?.trim() ? { search: options.search.trim() } : {}),
    ...(options.barcode?.trim() ? { barcode: options.barcode.trim() } : {}),
    ...(options.genreIds?.length ? { genreIds: [...new Set(options.genreIds)].sort() } : {}),
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
export function useNewReleaseAlbums(
    options: { enabled?: boolean } = {},
) {
    return useAlbums({
        placementState: 'shelved',
        skip: 0,
        take: 100,
        sortBy: 'releaseDate',
        sortOrder: 'desc',
    }, options)
}
const ALBUM_PAGE_SIZE = 24
export function useInfiniteAlbums(
    options: Omit<ListAlbumsOptions, 'skip' | 'take'> = {},
    queryOptions: { enabled?: boolean } = {},
) {
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
        enabled: queryOptions.enabled ?? true,
    })
}
export function useAlbum(id: string) { const { apiClient } = useConnection(); const api = createAlbumsApi(apiClient); return useQuery({ queryKey: queryKeys.albums.detail(id), queryFn: ({ signal }) => api.get(id, { signal }), enabled: id !== '' }) }
/** Fetches an explicit set of albums without depending on catalog placement or pagination. */
export function useAlbumsByIds(ids: readonly string[]) {
    const { apiClient } = useConnection()
    const api = createAlbumsApi(apiClient)
    const uniqueIds = [...new Set(ids.filter((id) => id.trim() !== ''))]

    return useQueries({
        queries: uniqueIds.map((id) => ({
            queryKey: queryKeys.albums.detail(id),
            queryFn: ({ signal }: { signal: AbortSignal }) => api.get(id, { signal }),
        })),
    })
}
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
export function useCheckoutAlbum() { const { apiClient } = useConnection(); const api = createAlbumsApi(apiClient); return useAlbumMutation(({ id, request }: { id: string; request: CheckoutRequest }) => api.checkout(id, request)) }
export function useCheckinAlbum() {
    const { apiClient } = useConnection()
    const albumsApi = createAlbumsApi(apiClient)
    const loansApi = createLoansApi(apiClient)

    return useAlbumMutation(async ({
        id,
        request,
        feedback,
    }: {
        id: string
        request: CheckinRequest
        feedback?: { loanId: string; rating: number; review: string }
    }) => {
        const album = await albumsApi.checkin(id, request)

        if (feedback !== undefined) {
            await loansApi.putFeedback(feedback.loanId, {
                rating: feedback.rating,
                review: feedback.review,
            })
        }

        return album
    })
}
export function useMarkAlbumPlayed() { const { apiClient } = useConnection(); const api = createAlbumsApi(apiClient); return useAlbumMutation(({ id, request }: { id: string; request?: MarkPlayedRequest }) => api.markPlayed(id, request)) }
export function useAlbumArtwork(id: string, enabled = true) { const { apiClient } = useConnection(); const api = createAlbumsApi(apiClient); return useQuery({ queryKey: queryKeys.albumArtwork.detail(id), queryFn: ({ signal }) => api.getArtwork(id, { signal }), enabled: enabled && id !== '', retry: false }) }
export function useUploadAlbumArtwork() { const { apiClient } = useConnection(); const api = createAlbumsApi(apiClient); const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, file }: { id: string; file: File }) => api.uploadArtwork(id, file), onSuccess: async (_, { id }) => { await Promise.all([qc.invalidateQueries({ queryKey: queryKeys.albumArtwork.detail(id) }), qc.invalidateQueries({ queryKey: queryKeys.albums.detail(id) })]) } }) }
export function useRemoveAlbumArtwork() { const { apiClient } = useConnection(); const api = createAlbumsApi(apiClient); const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => api.removeArtwork(id), onSuccess: async (_, id) => { await Promise.all([qc.invalidateQueries({ queryKey: queryKeys.albumArtwork.detail(id) }), qc.invalidateQueries({ queryKey: queryKeys.albums.detail(id) })]) } }) }
export function useRefetchAlbumArtwork() { const { apiClient } = useConnection(); const api = createAlbumsApi(apiClient); const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, replaceOwnerUpload = false }: { id: string; replaceOwnerUpload?: boolean }) => api.refetchArtwork(id, { replace_owner_upload: replaceOwnerUpload }), onSuccess: async (_, { id }) => { await Promise.all([qc.invalidateQueries({ queryKey: queryKeys.albumArtwork.detail(id) }), qc.invalidateQueries({ queryKey: queryKeys.albums.detail(id) })]) } }) }
