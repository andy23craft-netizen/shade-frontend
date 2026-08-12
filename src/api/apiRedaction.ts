/* apiRedaction.ts */

import {
    ApiError,
    isApiError,
} from './apiErrors'

export interface SafeApiErrorDiagnostic {
    name: 'ApiError'
    kind: ApiError['kind']
    status: number | undefined
    message: string
    detail: string | undefined
    correlationId: string | undefined
    fieldErrors: readonly {
        field: string
        message: string
    }[]
}

const SENSITIVE_KEYS = new Set([
    'authorization',
    'token',
    'apitoken',
    'api_token',
    'api-token',
    'headers',
    'header',
    'body',
    'borrower',
    'notes',
    'review',
    'isbn',
    'isbn13',
    'backup',
    'blob',
])

const SENSITIVE_VALUE_PATTERNS = [
    /\bbearer\s+\S+/i,
    /\bauthorization\s*[:=]/i,
    /\bapi[_-]?secret\b/i,
    /\bcreate\s+table\b/i,
    /\binsert\s+into\b/i,
] as const

/**
 * Build a diagnostics-safe projection of an ApiError.
 * Omits request headers, tokens, private form fields, and full bodies.
 *
 * correlationId is included only when already present on ApiError. Neither
 * OpenAPI nor API-for-FE.md currently documents a correlation source; do not
 * invent a header or body field to populate it.
 */
export function toSafeApiErrorDiagnostic(
    error: ApiError,
): SafeApiErrorDiagnostic {
    return {
        name: 'ApiError',
        kind: error.kind,
        status: error.status,
        message: error.message,
        detail: error.detail,
        correlationId: error.correlationId,
        fieldErrors: error.fieldErrors.map(
            (fieldError) => ({
                field: fieldError.field,
                message: fieldError.message,
            }),
        ),
    }
}

export function serializeSafeApiErrorDiagnostic(
    error: ApiError,
): string {
    return JSON.stringify(
        toSafeApiErrorDiagnostic(error),
    )
}

function hasSensitiveValue(
    value: string,
): boolean {
    return SENSITIVE_VALUE_PATTERNS.some(
        (pattern) => pattern.test(value),
    )
}

/**
 * Assert that a diagnostic payload does not retain sensitive client data.
 * Intended for unit tests and FEAT-12 reporting seam checks.
 */
export function assertSafeApiDiagnostic(
    value: unknown,
): void {
    if (isApiError(value)) {
        assertSafeApiDiagnostic(
            toSafeApiErrorDiagnostic(value),
        )
        return
    }

    if (typeof value === 'string') {
        if (hasSensitiveValue(value)) {
            throw new Error(
                'API diagnostic contains a sensitive value.',
            )
        }

        return
    }

    if (
        typeof value !== 'object' ||
        value === null
    ) {
        return
    }

    if (Array.isArray(value)) {
        for (const entry of value) {
            assertSafeApiDiagnostic(entry)
        }

        return
    }

    for (const [key, entry] of Object.entries(
        value,
    )) {
        if (
            SENSITIVE_KEYS.has(
                key.toLowerCase(),
            )
        ) {
            throw new Error(
                `API diagnostic key "${key}" is sensitive.`,
            )
        }

        assertSafeApiDiagnostic(entry)
    }
}
