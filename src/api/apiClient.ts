/* apiClient.ts */

import {
    ApiError,
    mapValidationFieldErrors,
} from './apiErrors'

export interface ApiClientOptions {
    apiBaseUrl: string
    getToken?: () => string | null
    onUnauthorized?: () => void
    timeoutMs?: number
}

export interface ApiJsonRequestOptions
    extends Omit<ApiRequestOptions, 'body'> {
    body?: unknown
}

export interface ApiRequestOptions
    extends RequestInit {
    authenticated?: boolean
}

async function parseErrorResponse(
    response: Response,
): Promise<{
    detail?: string
    fieldErrors?: readonly {
        field: string
        message: string
    }[]
}> {
    const contentType =
        response.headers.get('Content-Type') ?? ''

    if (!contentType.includes('application/json')) {
        return {}
    }

    try {
        const payload: unknown = await response.json()

        if (
            typeof payload !== 'object' ||
            payload === null
        ) {
            return {}
        }

        const detail = (
            payload as {
                detail?: unknown
            }
        ).detail

        if (typeof detail === 'string') {
            return {
                detail,
            }
        }

        return {
            fieldErrors: mapValidationFieldErrors(
                detail,
            ),
        }
    } catch {
        return {}
    }
}

export function createApiClient({
                                    apiBaseUrl,
                                    getToken,
                                    onUnauthorized,
                                    timeoutMs = 10000,
                                }: ApiClientOptions) {
    async function request(
        path: string,
        options: ApiRequestOptions = {},
    ): Promise<Response> {
        const {
            authenticated = true,
            headers: requestHeaders,
            signal: callerSignal,
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

        const timeoutController =
            new AbortController()

        const timeoutId = setTimeout(() => {
            timeoutController.abort()
        }, timeoutMs)

        const combinedSignal =
            AbortSignal.any([
                timeoutController.signal,
                callerSignal,
            ].filter(
                (
                    signal,
                ): signal is AbortSignal =>
                    signal !== undefined,
            ))

        try {
            response = await fetch(
                `${apiBaseUrl}${path}`,
                {
                    ...fetchOptions,
                    headers,
                    signal: combinedSignal,
                },
            )
        } catch (error) {
            if (
                error instanceof DOMException &&
                error.name === 'AbortError'
            ) {
                if (callerSignal?.aborted) {
                    throw new ApiError({
                        kind: 'cancelled',
                        message:
                            'Shade API request was cancelled.',
                    })
                }

                throw new ApiError({
                    kind: 'timeout',
                    message:
                        'Shade API request timed out.',
                })
            }

            throw new ApiError({
                kind: 'unreachable',
                message:
                    'Unable to reach the Shade API.',
            })
        } finally {
            clearTimeout(timeoutId)
        }

        if (
            response.status === 403 &&
            authenticated
        ) {
            onUnauthorized?.()

            throw new ApiError({
                kind: 'unauthorized',
                status: 403,
                message: 'API access was rejected.',
            })
        }

        if (!response.ok) {
            const errorResponse =
                await parseErrorResponse(response)

            const kind =
                response.status === 422
                    ? 'validation'
                    : response.status >= 500
                        ? 'server'
                        : 'http'

            throw new ApiError({
                kind,
                status: response.status,
                message:
                    errorResponse.detail ??
                    `Shade API request failed with status ${response.status}.`,
                detail: errorResponse.detail,
                fieldErrors:
                errorResponse.fieldErrors,
            })
        }

        return response
    }

    async function requestJson<T>(
        path: string,
        options: ApiJsonRequestOptions = {},
    ): Promise<T> {
        const {
            body,
            headers: requestHeaders,
            ...requestOptions
        } = options

        const headers = new Headers(requestHeaders)

        if (body !== undefined) {
            headers.set(
                'Content-Type',
                'application/json',
            )
        }

        const response = await request(path, {
            ...requestOptions,
            headers,
            body: body === undefined
                ? undefined
                : JSON.stringify(body),
        })

        if (response.status === 204) {
            return undefined as T
        }

        let data: unknown

        try {
            data = await response.json()
        } catch {
            throw new ApiError({
                kind: 'invalid_response',
                status: response.status,
                message:
                    'Shade API returned an invalid JSON response.',
            })
        }

        return data as T
    }

    async function get(
        path: string,
        options: Omit<
            ApiRequestOptions,
            'method'
        > = {},
    ): Promise<Response> {
        return request(path, {
            ...options,
            method: 'GET',
        })
    }

    async function getJson<T>(
        path: string,
        options: Omit<
            ApiRequestOptions,
            'method'
        > = {},
    ): Promise<T> {
        return requestJson<T>(path, {
            ...options,
            method: 'GET',
        })
    }

    return {
        request,
        requestJson,
        get,
        getJson,
    }
}