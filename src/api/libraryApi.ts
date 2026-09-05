import type { createApiClient } from './apiClient'
import type {
    CompleteLibrarySetupRequest,
    LibrarySettingsRead,
    LibrarySettingsUpdate,
    LibrarySetupRead,
} from './apiTypes'

export function createLibraryApi(client: ReturnType<typeof createApiClient>) {
    return {
        getSetup: (): Promise<LibrarySetupRead> =>
            client.getJson<LibrarySetupRead>('/library/setup'),
        completeSetup: (request: CompleteLibrarySetupRequest): Promise<LibrarySetupRead> =>
            client.requestJson<LibrarySetupRead>('/library/setup/complete', {
                method: 'POST',
                body: request,
            }),
        getSettings: (): Promise<LibrarySettingsRead> =>
            client.getJson<LibrarySettingsRead>('/library/settings'),
        updateSettings: (request: LibrarySettingsUpdate): Promise<LibrarySettingsRead> =>
            client.requestJson<LibrarySettingsRead>('/library/settings', {
                method: 'PATCH',
                body: request,
            }),
    }
}
