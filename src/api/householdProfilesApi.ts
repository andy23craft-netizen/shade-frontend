import type { ApiCallOptions } from './apiCallOptions'
import type { createApiClient } from './apiClient'
import type { HouseholdProfileCreate, HouseholdProfileDelete, HouseholdProfileList, HouseholdProfileRead, HouseholdProfileUpdate } from './apiTypes'

export function createHouseholdProfilesApi(client: ReturnType<typeof createApiClient>) {
    return {
        list: (options: ApiCallOptions = {}): Promise<HouseholdProfileList> => client.getJson<HouseholdProfileList>('/household-profiles', options),
        create: (profile: HouseholdProfileCreate, options: ApiCallOptions = {}): Promise<HouseholdProfileRead> => client.requestJson<HouseholdProfileRead>('/household-profiles', { method: 'POST', body: profile, ...options }),
        update: (profileId: string, profile: HouseholdProfileUpdate, options: ApiCallOptions = {}): Promise<HouseholdProfileRead> => client.requestJson<HouseholdProfileRead>(`/household-profiles/${encodeURIComponent(profileId)}`, { method: 'PATCH', body: profile, ...options }),
        remove: async (profileId: string, outcome: HouseholdProfileDelete, options: ApiCallOptions = {}): Promise<void> => {
            await client.request(`/household-profiles/${encodeURIComponent(profileId)}`, { method: 'DELETE', body: JSON.stringify(outcome), headers: { 'Content-Type': 'application/json' }, ...options })
        },
    }
}
