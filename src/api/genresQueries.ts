import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useConnection } from '../features/connection/useConnection'
import { createGenresApi } from './genresApi'
import type { GenreCreate } from './apiTypes'
import { queryKeys } from './queryKeys'
export function useGenres(inUse = false) { const { apiClient } = useConnection(); const api = createGenresApi(apiClient); return useQuery({ queryKey: queryKeys.genres.list(inUse), queryFn: () => api.list(inUse) }) }
export function useCreateGenre() { const { apiClient } = useConnection(); const api = createGenresApi(apiClient); const qc = useQueryClient(); return useMutation({ mutationFn: (value: GenreCreate) => api.create(value), onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.genres.all }) }) }
