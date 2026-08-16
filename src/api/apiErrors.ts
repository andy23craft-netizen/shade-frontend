/* apiErrors.ts */

export type ApiErrorKind =
    | 'unreachable'
    | 'timeout'
    | 'cancelled'
    | 'unauthorized'
    | 'validation'
    | 'invalid_response'
    | 'server'
    | 'http'

export interface ApiFieldError {
    field: string
    message: string
}

export interface ApiErrorOptions {
    status?: number
    message: string
    kind: ApiErrorKind
    detail?: string
    correlationId?: string
    fieldErrors?: readonly ApiFieldError[]
}

export class ApiError extends Error {
    readonly kind: ApiErrorKind
    readonly status: number | undefined
    readonly detail: string | undefined
    readonly correlationId: string | undefined
    readonly fieldErrors: readonly ApiFieldError[]

    constructor({
                    kind,
                    status,
                    message,
                    detail,
                    correlationId,
                    fieldErrors = [],
                }: ApiErrorOptions) {
        super(message)

        this.name = 'ApiError'
        this.kind = kind
        this.status = status
        this.detail = detail
        this.correlationId = correlationId
        this.fieldErrors = fieldErrors
    }
}

export function isApiError(
    error: unknown,
): error is ApiError {
    return error instanceof ApiError
}

interface ValidationErrorLike {
    loc?: unknown
    msg?: unknown
}

export function mapValidationFieldErrors(
    detail: unknown,
): ApiFieldError[] {
    if (!Array.isArray(detail)) {
        return []
    }

    const errors: ApiFieldError[] = []

    for (const entry of detail) {
        if (
            typeof entry !== 'object' ||
            entry === null
        ) {
            continue
        }

        const validationError =
            entry as ValidationErrorLike

        if (
            !Array.isArray(validationError.loc) ||
            typeof validationError.msg !== 'string'
        ) {
            continue
        }

        const meaningfulLocation =
            validationError.loc.filter(
                (
                    part,
                ): part is string | number =>
                    typeof part === 'string' ||
                    typeof part === 'number',
            )

        const fieldParts =
            meaningfulLocation[0] === 'body' ||
            meaningfulLocation[0] === 'query' ||
            meaningfulLocation[0] === 'path'
                ? meaningfulLocation.slice(1)
                : meaningfulLocation

        const field = fieldParts
            .map(String)
            .join('.')

        if (!field) {
            continue
        }

        errors.push({
            field,
            message: validationError.msg,
        })
    }

    return errors
}

export function formatApiQueryError(
    error: unknown,
): string {
    if (isApiError(error)) {
        const message =
            error.kind === 'unauthorized'
                ? 'API access was rejected.'
                : error.message

        if (error.correlationId) {
            return (
                `${message} ` +
                `Request ID: ${error.correlationId}`
            )
        }

        return message
    }

    if (error instanceof Error) {
        return error.message
    }

    return 'An unexpected error occurred.'
}

export function isUnauthorizedQueryError(
    error: unknown,
): boolean {
    return (
        isApiError(error) &&
        error.kind === 'unauthorized'
    )
}
