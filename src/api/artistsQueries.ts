import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useConnection } from '../features/connection/useConnection'
import { createArtistsApi } from './artistsApi'
import type { ArtistCreate } from './apiTypes'
import { queryKeys } from './queryKeys'
export function useArtists(inUse = false) { const { apiClient } = useConnection(); const api = createArtistsApi(apiClient); return useQuery({ queryKey: queryKeys.artists.list(inUse), queryFn: () => api.list(inUse) }) }
export function useCreateArtist() { const { apiClient } = useConnection(); const api = createArtistsApi(apiClient); const qc = useQueryClient(); return useMutation({ mutationFn: (value: ArtistCreate) => api.create(value), onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.artists.all }) }) }
