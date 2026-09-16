import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CompleteLibrarySetupRequest, LibrarySettingsUpdate, SiteReadOnlyUpdate } from './apiTypes'
import { createLibraryApi } from './libraryApi'
import { queryKeys } from './queryKeys'
import { useConnection } from '../features/connection/useConnection'
import { requireLibraryClientNamespace } from '../config/libraryNamespace'
import { useAuth } from '../features/auth/useAuth'

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

export function useSiteReadOnlyStatus(options: { enabled?: boolean } = {}) {
    const { apiClient } = useConnection()
    const { isAdmin } = useAuth()
    const api = createLibraryApi(apiClient)
    const host = currentLibraryHost()
    return useQuery({
        queryKey: queryKeys.library.siteReadOnly(host),
        queryFn: ({ signal }) => api.getSiteReadOnly({ signal }),
        enabled: options.enabled ?? isAdmin,
        retry: false,
    })
}

export function useUpdateSiteReadOnly() {
    const { apiClient } = useConnection()
    const queryClient = useQueryClient()
    const api = createLibraryApi(apiClient)
    const host = currentLibraryHost()
    return useMutation({
        mutationFn: (request: SiteReadOnlyUpdate) => api.updateSiteReadOnly(request),
        onSuccess: (status) => {
            queryClient.setQueryData(queryKeys.library.siteReadOnly(host), status)
        },
    })
}
