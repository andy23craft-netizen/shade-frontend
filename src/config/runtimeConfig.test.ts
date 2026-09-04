import { describe, expect, it } from 'vitest'
import {
    getRuntimeConfig,
    loadRuntimeConfig,
    RuntimeConfigError,
} from './runtimeConfig'

describe('loadRuntimeConfig', () => {
    it('loads a valid runtime configuration', () => {
        expect(
            loadRuntimeConfig({
                apiBaseUrl: 'http://127.0.0.1:8000/',
            }),
        ).toEqual({
            apiBaseUrl: 'http://127.0.0.1:8000',
            diagnostics: {
                enabled: false,
                endpoint: null,
            },
        })
    })

    it('does not add an /api prefix', () => {
        expect(
            loadRuntimeConfig({
                apiBaseUrl: 'https://library.example.com',
            }).apiBaseUrl,
        ).toBe('https://library.example.com')
    })

    it('accepts and normalizes a same-origin API path', () => {
        expect(
            loadRuntimeConfig({
                apiBaseUrl: ' /api/ ',
            }).apiBaseUrl,
        ).toBe('/api')
    })

    it('rejects a protocol-relative API URL', () => {
        expect(() =>
            loadRuntimeConfig({
                apiBaseUrl: '//example.test/api',
            }),
        ).toThrow(RuntimeConfigError)
    })

    it('loads enabled diagnostic reporting from runtime configuration', () => {
        expect(
            loadRuntimeConfig({
                apiBaseUrl: 'https://library.example.com',
                diagnostics: {
                    enabled: true,
                    endpoint:
                        'https://diagnostics.example.com/report/',
                },
            }).diagnostics,
        ).toEqual({
            enabled: true,
            endpoint:
                'https://diagnostics.example.com/report',
        })
    })

    it('normalizes disabled diagnostic reporting without requiring an endpoint', () => {
        expect(
            loadRuntimeConfig({
                apiBaseUrl: 'https://library.example.com',
                diagnostics: {
                    enabled: false,
                },
            }).diagnostics,
        ).toEqual({
            enabled: false,
            endpoint: null,
        })
    })

    it('rejects enabled diagnostic reporting without an endpoint', () => {
        expect(() =>
            loadRuntimeConfig({
                apiBaseUrl: 'https://library.example.com',
                diagnostics: {
                    enabled: true,
                },
            }),
        ).toThrow(RuntimeConfigError)
    })

    it('rejects an invalid diagnostic endpoint', () => {
        expect(() =>
            loadRuntimeConfig({
                apiBaseUrl: 'https://library.example.com',
                diagnostics: {
                    enabled: true,
                    endpoint: 'not-a-url',
                },
            }),
        ).toThrow(RuntimeConfigError)
    })

    it('rejects an unsupported diagnostic endpoint protocol', () => {
        expect(() =>
            loadRuntimeConfig({
                apiBaseUrl: 'https://library.example.com',
                diagnostics: {
                    enabled: true,
                    endpoint: 'ftp://example.com/report',
                },
            }),
        ).toThrow(RuntimeConfigError)
    })

    it('rejects malformed diagnostic configuration', () => {
        expect(() =>
            loadRuntimeConfig({
                apiBaseUrl: 'https://library.example.com',
                diagnostics: 'enabled',
            }),
        ).toThrow(RuntimeConfigError)
    })

    it('rejects missing configuration', () => {
        expect(() => loadRuntimeConfig(undefined)).toThrow(
            RuntimeConfigError,
        )
    })

    it('rejects a missing API URL', () => {
        expect(() =>
            loadRuntimeConfig({}),
        ).toThrow(RuntimeConfigError)
    })

    it('rejects an invalid API URL', () => {
        expect(() =>
            loadRuntimeConfig({
                apiBaseUrl: 'not-a-url',
            }),
        ).toThrow(RuntimeConfigError)
    })

    it('rejects unsupported API URL protocols', () => {
        expect(() =>
            loadRuntimeConfig({
                apiBaseUrl: 'ftp://example.com',
            }),
        ).toThrow(RuntimeConfigError)
    })

    it('accepts a runtime API URL with a configured path', () => {
        expect(
            loadRuntimeConfig({
                apiBaseUrl: 'https://example.com/library/',
            }).apiBaseUrl,
        ).toBe('https://example.com/library')
    })
})

describe('getRuntimeConfig', () => {
    it('loads configuration from the browser runtime object', () => {
        window.__SHADE_CONFIG__ = {
            apiBaseUrl: 'http://127.0.0.1:8000/',
        }

        expect(getRuntimeConfig()).toEqual({
            apiBaseUrl: 'http://127.0.0.1:8000',
            diagnostics: {
                enabled: false,
                endpoint: null,
            },
        })
    })

    it('loads diagnostic reporting from the browser runtime object', () => {
        window.__SHADE_CONFIG__ = {
            apiBaseUrl: 'http://127.0.0.1:8000',
            diagnostics: {
                enabled: true,
                endpoint:
                    'https://diagnostics.example.test/report',
            },
        }

        expect(getRuntimeConfig().diagnostics).toEqual({
            enabled: true,
            endpoint:
                'https://diagnostics.example.test/report',
        })
    })

    it('rejects missing browser runtime configuration', () => {
        window.__SHADE_CONFIG__ = undefined

        expect(() => getRuntimeConfig()).toThrow(
            RuntimeConfigError,
        )
    })
})
