export interface RuntimeDiagnosticConfig {
    enabled: boolean
    endpoint: string | null
}

export interface RuntimeConfig {
    apiBaseUrl: string
    release: string
    diagnostics: RuntimeDiagnosticConfig
}

export interface RuntimeConfigSource {
    apiBaseUrl?: unknown
    release?: unknown
    diagnostics?: unknown
}

export class RuntimeConfigError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'RuntimeConfigError'
    }
}

function normalizeHttpUrl(
    value: unknown,
    label: string,
): string {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new RuntimeConfigError(
            `Runtime configuration is missing a valid ${label}.`,
        )
    }

    const trimmed = value.trim()

    let url: URL

    try {
        url = new URL(trimmed)
    } catch {
        throw new RuntimeConfigError(
            `Runtime configuration contains an invalid ${label}.`,
        )
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new RuntimeConfigError(
            `Runtime configuration ${label} must use HTTP or HTTPS.`,
        )
    }

    return trimmed.replace(/\/+$/, '')
}

function normalizeApiBaseUrl(value: unknown): string {
    return normalizeHttpUrl(
        value,
        'API base URL',
    )
}

function validateRelease(value: unknown): string {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new RuntimeConfigError(
            'Runtime configuration is missing a valid release identifier.',
        )
    }

    return value.trim()
}

function validateDiagnostics(
    value: unknown,
): RuntimeDiagnosticConfig {
    if (value === undefined) {
        return {
            enabled: false,
            endpoint: null,
        }
    }

    if (
        typeof value !== 'object' ||
        value === null ||
        Array.isArray(value)
    ) {
        throw new RuntimeConfigError(
            'Runtime diagnostic configuration is invalid.',
        )
    }

    const source = value as {
        enabled?: unknown
        endpoint?: unknown
    }

    if (typeof source.enabled !== 'boolean') {
        throw new RuntimeConfigError(
            'Runtime diagnostic configuration is missing a valid enabled flag.',
        )
    }

    if (!source.enabled) {
        return {
            enabled: false,
            endpoint: null,
        }
    }

    return {
        enabled: true,
        endpoint: normalizeHttpUrl(
            source.endpoint,
            'diagnostic endpoint',
        ),
    }
}

export function loadRuntimeConfig(
    source: RuntimeConfigSource | undefined,
): RuntimeConfig {
    if (!source) {
        throw new RuntimeConfigError(
            'Shade runtime configuration could not be found.',
        )
    }

    return {
        apiBaseUrl: normalizeApiBaseUrl(source.apiBaseUrl),
        release: validateRelease(source.release),
        diagnostics: validateDiagnostics(
            source.diagnostics,
        ),
    }
}

export function getRuntimeConfig(): RuntimeConfig {
    return loadRuntimeConfig(window.__SHADE_CONFIG__)
}
