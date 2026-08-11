export type ApiErrorKind =
    | 'unreachable'
    | 'unauthorized'
    | 'server'
    | 'http'

export interface ApiErrorOptions {
    status?: number
    message: string
    kind: ApiErrorKind
}

export class ApiError extends Error {
    readonly kind: ApiErrorKind
    readonly status: number | undefined

    constructor({
                    kind,
                    status,
                    message,
                }: ApiErrorOptions) {
        super(message)

        this.name = 'ApiError'
        this.kind = kind
        this.status = status
    }
}

export function isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError
}