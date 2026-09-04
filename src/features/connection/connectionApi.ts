import {
    createApiClient,
} from '../../api/apiClient'
import {
    isApiError,
} from '../../api/apiErrors'
import {
    createHealthApi,
} from '../../api/healthApi'

export interface ConnectionApiError {
    kind: 'unreachable' | 'unauthorized' | 'server'
    message: string
}

function mapToConnectionError(
    error: unknown,
): ConnectionApiError {
    if (isApiError(error)) {
        if (error.kind === 'unauthorized') {
            return {
                kind: 'unauthorized',
                message:
                    'API access was rejected.',
            }
        }

        if (
            error.kind === 'unreachable' ||
            error.kind === 'timeout' ||
            error.kind === 'cancelled'
        ) {
            return {
                kind: 'unreachable',
                message:
                    'Unable to reach the Shade API.',
            }
        }

        return {
            kind: 'server',
            message: error.message,
        }
    }

    return {
        kind: 'unreachable',
        message: 'Unable to reach the Shade API.',
    }
}

export async function checkConnection(
    apiBaseUrl: string,
): Promise<void> {
    const client = createApiClient({
        apiBaseUrl,
    })

    try {
        const healthApi = createHealthApi(client)

        await healthApi.get()
        await healthApi.getReady()
    } catch (error) {
        throw mapToConnectionError(error)
    }
}
