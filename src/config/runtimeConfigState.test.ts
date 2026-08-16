import { describe, expect, it } from 'vitest'
import { readRuntimeConfig } from './runtimeConfigState'

describe('readRuntimeConfig', () => {
    it('returns valid runtime configuration', () => {
        window.__SHADE_CONFIG__ = {
            apiBaseUrl: 'http://127.0.0.1:8000',
        }

        expect(readRuntimeConfig()).toEqual({
            config: {
                apiBaseUrl: 'http://127.0.0.1:8000',
                diagnostics: {
                    enabled: false,
                    endpoint: null,
                },
            },
            error: null,
        })
    })

    it('returns a recoverable error for missing configuration', () => {
        window.__SHADE_CONFIG__ = undefined

        const result = readRuntimeConfig()

        expect(result.config).toBeNull()
        expect(result.error).not.toBeNull()
        expect(result.error?.name).toBe('RuntimeConfigError')
    })

    it('does not expose configuration details through the error', () => {
        window.__SHADE_CONFIG__ = {
            apiBaseUrl: 'https://example.com',
            diagnostics: {
                enabled: true,
                endpoint: 'not-a-url',
            },
        }

        const result = readRuntimeConfig()

        expect(result.error?.message).toContain(
            'diagnostic endpoint',
        )
        expect(result.error?.message).not.toContain(
            'https://example.com',
        )
    })
})
