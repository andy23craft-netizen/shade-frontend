import type { ApiError } from '../api/apiErrors'
import {
    assertSafeApiDiagnostic,
} from '../api/apiRedaction'
import type {
    RuntimeDiagnosticConfig,
} from '../config/runtimeConfig'

export interface DiagnosticReporter {
    reportApiFailure(
        error: ApiError,
        operation?: string,
    ): void

    reportRenderFailure(): void
}

interface ApiFailureDiagnostic {
    event: 'api_request_failure'
    release: string
    operation: string | undefined
    error: {
        kind: ApiError['kind']
        status: number | undefined
        correlationId: string | undefined
    }
}

interface RenderFailureDiagnostic {
    event: 'render_failure'
    release: string
}

type DiagnosticPayload =
    | ApiFailureDiagnostic
    | RenderFailureDiagnostic

export interface CreateDiagnosticReporterOptions {
    config: RuntimeDiagnosticConfig
    release: string
}

function createDisabledReporter(): DiagnosticReporter {
    return {
        reportApiFailure: () => undefined,
        reportRenderFailure: () => undefined,
    }
}

function sendDiagnostic(
    endpoint: string,
    payload: DiagnosticPayload,
): void {
    try {
        assertSafeApiDiagnostic(payload)

        void fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            credentials: 'omit',
        }).catch(() => {
            // Diagnostic reporting must never interfere with
            // application recovery or create a second failure path.
        })
    } catch {
        // Unsafe or malformed diagnostics are dropped rather than
        // becoming another application failure.
    }
}

export function createDiagnosticReporter({
                                             config,
                                             release,
                                         }: CreateDiagnosticReporterOptions): DiagnosticReporter {
    if (!config.enabled || config.endpoint === null) {
        return createDisabledReporter()
    }

    const endpoint = config.endpoint

    return {
        reportApiFailure(
            error,
            operation,
        ) {
            sendDiagnostic(
                endpoint,
                {
                    event: 'api_request_failure',
                    release,
                    operation,
                    error: {
                        kind: error.kind,
                        status: error.status,
                        correlationId:
                        error.correlationId,
                    },
                },
            )
        },

        reportRenderFailure() {
            sendDiagnostic(
                endpoint,
                {
                    event: 'render_failure',
                    release,
                },
            )
        },
    }
}
