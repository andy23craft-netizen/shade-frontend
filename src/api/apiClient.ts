import {
    ApiError,
} from './apiErrors'

export interface ApiClientOptions {
    apiBaseUrl: string
    getToken?: () => string | null
    onUnauthorized?: () => void
}

export interface ApiRequestOptions
    extends RequestInit {
    authenticated?: boolean
}

export function createApiClient({
                                    apiBaseUrl,
                                    getToken,
                                    onUnauthorized,
                                }: ApiClientOptions) {
    async function request(
        path: string,
        options: ApiRequestOptions = {},
    ): Promise<Response> {
        const {
            authenticated = true,
            headers: requestHeaders,
            ...fetchOptions
        } = options

        const headers = new Headers(requestHeaders)

        if (authenticated) {
            const token = getToken?.() ?? null

            if (token) {
                headers.set(
                    'Authorization',
                    `Bearer ${token}`,
                )
            }
        }

        let response: Response

        try {
            response = await fetch(
                `${apiBaseUrl}${path}`,
                {
                    ...fetchOptions,
                    headers,
                },
            )
        } catch {
            throw new ApiError({
                kind: 'unreachable',
                message: 'Unable to reach the Shade API.',
            })
        }

        if (response.status === 403 && authenticated) {
            onUnauthorized?.()

            throw new ApiError({
                kind: 'unauthorized',
                status: 403,
                message: 'API access was rejected.',
            })
        }

        if (!response.ok) {
            throw new ApiError({
                kind: response.status >= 500
                    ? 'server'
                    : 'http',
                status: response.status,
                message: `Shade API request failed with status ${response.status}.`,
            })
        }

        return response
    }

    async function get(
        path: string,
        options: Omit<ApiRequestOptions, 'method'> = {},
    ): Promise<Response> {
        return request(path, {
            ...options,
            method: 'GET',
        })
    }

    return {
        request,
        get,
    }
}