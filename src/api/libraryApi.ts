import type { createApiClient } from './apiClient'
import type {
    CompleteLibrarySetupRequest,
    LibrarySettingsRead,
    LibrarySettingsUpdate,
    LibrarySetupRead,
    SiteReadOnlyRead,
    SiteReadOnlyUpdate,
} from './apiTypes'
import type { ApiCallOptions } from './apiCallOptions'

export function createLibraryApi(client: ReturnType<typeof createApiClient>) {
    return {
        getSetup: (options: ApiCallOptions = {}): Promise<LibrarySetupRead> =>
            client.getJson<LibrarySetupRead>('/library/setup', options),
        completeSetup: (request: CompleteLibrarySetupRequest, options: ApiCallOptions = {}): Promise<LibrarySetupRead> =>
            client.requestJson<LibrarySetupRead>('/library/setup/complete', {
                method: 'POST',
                body: request,
                ...options,
            }),
        getSettings: (options: ApiCallOptions = {}): Promise<LibrarySettingsRead> =>
            client.getJson<LibrarySettingsRead>('/library/settings', options),
        updateSettings: (request: LibrarySettingsUpdate, options: ApiCallOptions = {}): Promise<LibrarySettingsRead> =>
            client.requestJson<LibrarySettingsRead>('/library/settings', {
                method: 'PATCH',
                body: request,
                ...options,
            }),
        getSiteReadOnly: (options: ApiCallOptions = {}): Promise<SiteReadOnlyRead> =>
            client.getJson<SiteReadOnlyRead>('/library/site-read-only', {
                ...options,
                preserveAuthOnUnauthorized: true,
            }),
        updateSiteReadOnly: (request: SiteReadOnlyUpdate, options: ApiCallOptions = {}): Promise<SiteReadOnlyRead> =>
            client.requestJson<SiteReadOnlyRead>('/library/site-read-only', {
                method: 'PUT',
                body: request,
                ...options,
            }),
    }
}
