import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CompleteLibrarySetupRequest, LibrarySettingsUpdate } from './apiTypes'
import { createLibraryApi } from './libraryApi'
import { queryKeys } from './queryKeys'
import { useConnection } from '../features/connection/useConnection'
import { requireLibraryClientNamespace } from '../config/libraryNamespace'

export function currentLibraryHost(): string {
    return requireLibraryClientNamespace(window.location.hostname).libraryId
}

export function useLibrarySetup() {
    const { apiClient } = useConnection()
    const api = createLibraryApi(apiClient)
    const host = currentLibraryHost()
    return useQuery({
        queryKey: queryKeys.library.setup(host),
        queryFn: ({ signal }) => api.getSetup({ signal }),
    })
}

export function useCompleteLibrarySetup() {
    const { apiClient } = useConnection()
    const queryClient = useQueryClient()
    const api = createLibraryApi(apiClient)
    const host = currentLibraryHost()
    return useMutation({
        mutationFn: (request: CompleteLibrarySetupRequest) => api.completeSetup(request),
        onSuccess: async (setup) => {
            queryClient.setQueryData(queryKeys.library.setup(host), setup)
            await queryClient.invalidateQueries({ queryKey: queryKeys.library.settings(host) })
            await queryClient.invalidateQueries({ queryKey: queryKeys.shelves.all })
        },
    })
}

export function useLibrarySettings() {
    const { apiClient } = useConnection()
    const api = createLibraryApi(apiClient)
    const host = currentLibraryHost()
    return useQuery({
        queryKey: queryKeys.library.settings(host),
        queryFn: ({ signal }) => api.getSettings({ signal }),
    })
}

export function useUpdateLibrarySettings() {
    const { apiClient } = useConnection()
    const queryClient = useQueryClient()
    const api = createLibraryApi(apiClient)
    const host = currentLibraryHost()
    return useMutation({
        mutationFn: (request: LibrarySettingsUpdate) => api.updateSettings(request),
        onSuccess: (settings) => {
            queryClient.setQueryData(queryKeys.library.settings(host), settings)
        },
    })
}
