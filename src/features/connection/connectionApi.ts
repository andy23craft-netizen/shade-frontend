import {
    createApiClient,
} from '../../api/apiClient'
import {
    isApiError,
} from '../../api/apiErrors'
import {
    createHealthApi,
} from '../../api/healthApi'
import {
    createProtectedApi,
} from '../../api/protectedApi'
import type {
    ProtectedResponse,
} from '../../api/apiTypes'

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
                    'The API token was rejected.',
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

export async function checkHealth(
    apiBaseUrl: string,
): Promise<void> {
    const client = createApiClient({
        apiBaseUrl,
    })

    try {
        await createHealthApi(client).get()
    } catch (error) {
        throw mapToConnectionError(error)
    }
}

export async function verifyToken(
    apiBaseUrl: string,
    token: string,
): Promise<ProtectedResponse> {
    const client = createApiClient({
        apiBaseUrl,
        getToken: () => token,
    })

    try {
        return await createProtectedApi(client).get()
    } catch (error) {
        throw mapToConnectionError(error)
    }
}
