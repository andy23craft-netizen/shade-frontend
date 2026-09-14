import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { HouseholdProfileCreate, HouseholdProfileDelete, HouseholdProfileUpdate } from './apiTypes'
import { createHouseholdProfilesApi } from './householdProfilesApi'
import { currentLibraryHost } from './libraryQueries'
import { queryKeys } from './queryKeys'
import { useConnection } from '../features/connection/useConnection'

export function useHouseholdProfiles() {
    const { apiClient } = useConnection()
    const host = currentLibraryHost()
    return useQuery({ queryKey: queryKeys.householdProfiles.list(host), queryFn: ({ signal }) => createHouseholdProfilesApi(apiClient).list({ signal }) })
}

function useProfileMutation<T>(mutationFn: (api: ReturnType<typeof createHouseholdProfilesApi>, value: T) => Promise<unknown>) {
    const { apiClient } = useConnection()
    const queryClient = useQueryClient()
    const host = currentLibraryHost()
    return useMutation({ mutationFn: (value: T) => mutationFn(createHouseholdProfilesApi(apiClient), value), onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.householdProfiles.all(host) }) })
}

export function useCreateHouseholdProfile() { return useProfileMutation<HouseholdProfileCreate>((api, value) => api.create(value)) }
export function useUpdateHouseholdProfile() { return useProfileMutation<{ profileId: string, profile: HouseholdProfileUpdate }>((api, value) => api.update(value.profileId, value.profile)) }
export function useRemoveHouseholdProfile() { return useProfileMutation<{ profileId: string, outcome: HouseholdProfileDelete }>((api, value) => api.remove(value.profileId, value.outcome)) }
