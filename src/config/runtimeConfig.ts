export interface RuntimeConfig {
    apiBaseUrl: string
    release: string
}

export interface RuntimeConfigSource {
    apiBaseUrl?: unknown
    release?: unknown
}

export class RuntimeConfigError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'RuntimeConfigError'
    }
}

function normalizeApiBaseUrl(value: unknown): string {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new RuntimeConfigError(
            'Runtime configuration is missing a valid API base URL.',
        )
    }

    const trimmed = value.trim()

    let url: URL

    try {
        url = new URL(trimmed)
    } catch {
        throw new RuntimeConfigError(
            'Runtime configuration contains an invalid API base URL.',
        )
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new RuntimeConfigError(
            'Runtime configuration API base URL must use HTTP or HTTPS.',
        )
    }

    return trimmed.replace(/\/+$/, '')
}

function validateRelease(value: unknown): string {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new RuntimeConfigError(
            'Runtime configuration is missing a valid release identifier.',
        )
    }

    return value.trim()
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
    }
}

export function getRuntimeConfig(): RuntimeConfig {
    return loadRuntimeConfig(window.__SHADE_CONFIG__)
}