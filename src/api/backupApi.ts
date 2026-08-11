import type {
    createApiClient,
} from './apiClient'

export function createBackupApi(
    client: ReturnType<typeof createApiClient>,
) {
    return {
        async get(): Promise<string> {
            const response =
                await client.get('/backup')

            return response.text()
        },
    }
}
