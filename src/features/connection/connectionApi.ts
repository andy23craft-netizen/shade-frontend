export interface ConnectionApiError {
    kind: 'unreachable' | 'unauthorized' | 'server'
    message: string
}

interface ProtectedResponse {
    message: string
}

async function request(
    apiBaseUrl: string,
    path: string,
    token?: string,
): Promise<Response> {
    const headers: HeadersInit = {}

    if (token) {
        headers.Authorization = `Bearer ${token}`
    }

    try {
        return await fetch(`${apiBaseUrl}${path}`, {
            method: 'GET',
            headers,
        })
    } catch {
        throw {
            kind: 'unreachable',
            message: 'Unable to reach the Shade API.',
        } satisfies ConnectionApiError
    }
}

export async function checkHealth(
    apiBaseUrl: string,
): Promise<void> {
    const response = await request(apiBaseUrl, '/health')

    if (!response.ok) {
        throw {
            kind: 'server',
            message: `Shade API health check failed with status ${response.status}.`,
        } satisfies ConnectionApiError
    }
}

export async function verifyToken(
    apiBaseUrl: string,
    token: string,
): Promise<ProtectedResponse> {
    const response = await request(apiBaseUrl, '/protected', token)

    if (response.status === 403) {
        throw {
            kind: 'unauthorized',
            message: 'The API token was rejected.',
        } satisfies ConnectionApiError
    }

    if (!response.ok) {
        throw {
            kind: 'server',
            message: `Shade API authentication check failed with status ${response.status}.`,
        } satisfies ConnectionApiError
    }

    return response.json() as Promise<ProtectedResponse>
}