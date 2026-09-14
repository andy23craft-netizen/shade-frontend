import { useState } from 'react'
import { currentLibraryHost } from '../../api/libraryQueries'
import { useHouseholdProfiles } from '../../api/householdProfilesQueries'
const key = (host: string) => `shade:${host}:household:active-profile:v1`
export function useActiveHouseholdProfile() { const query = useHouseholdProfiles(); const host = currentLibraryHost(); const [id, setId] = useState(() => window.localStorage.getItem(key(host))); const profiles = query.data?.items ?? []; const owner = profiles.find((profile) => profile.is_owner) ?? null; const activeProfile = profiles.find((profile) => profile.profile_id === id) ?? owner; return { ...query, profiles, activeProfile, householdEnabled: query.data?.household_mode_enabled === true, select: (profileId: string) => { setId(profileId); window.localStorage.setItem(key(host), profileId) } } }
