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
                release: '2026.08.10',
            }),
        ).toEqual({
            apiBaseUrl: 'http://127.0.0.1:8000',
            release: '2026.08.10',
        })
    })

    it('does not add an /api prefix', () => {
        expect(
            loadRuntimeConfig({
                apiBaseUrl: 'https://library.example.com',
                release: '1.0.0',
            }).apiBaseUrl,
        ).toBe('https://library.example.com')
    })

    it('rejects missing configuration', () => {
        expect(() => loadRuntimeConfig(undefined)).toThrow(
            RuntimeConfigError,
        )
    })

    it('rejects a missing API URL', () => {
        expect(() =>
            loadRuntimeConfig({
                release: '1.0.0',
            }),
        ).toThrow(RuntimeConfigError)
    })

    it('rejects an invalid API URL', () => {
        expect(() =>
            loadRuntimeConfig({
                apiBaseUrl: 'not-a-url',
                release: '1.0.0',
            }),
        ).toThrow(RuntimeConfigError)
    })

    it('rejects unsupported API URL protocols', () => {
        expect(() =>
            loadRuntimeConfig({
                apiBaseUrl: 'ftp://example.com',
                release: '1.0.0',
            }),
        ).toThrow(RuntimeConfigError)
    })

    it('rejects a missing release identifier', () => {
        expect(() =>
            loadRuntimeConfig({
                apiBaseUrl: 'http://127.0.0.1:8000',
            }),
        ).toThrow(RuntimeConfigError)
    })

    it('rejects an empty release identifier', () => {
        expect(() =>
            loadRuntimeConfig({
                apiBaseUrl: 'http://127.0.0.1:8000',
                release: '   ',
            }),
        ).toThrow(RuntimeConfigError)
    })

    it('accepts a runtime API URL with a configured path', () => {
        expect(
            loadRuntimeConfig({
                apiBaseUrl: 'https://example.com/library/',
                release: '1.0.0',
            }).apiBaseUrl,
        ).toBe('https://example.com/library')
    })
})

describe('getRuntimeConfig', () => {
    it('loads configuration from the browser runtime object', () => {
        window.__SHADE_CONFIG__ = {
            apiBaseUrl: 'http://127.0.0.1:8000/',
            release: '2026.08.10',
        }

        expect(getRuntimeConfig()).toEqual({
            apiBaseUrl: 'http://127.0.0.1:8000',
            release: '2026.08.10',
        })
    })

    it('rejects missing browser runtime configuration', () => {
        window.__SHADE_CONFIG__ = undefined

        expect(() => getRuntimeConfig()).toThrow(RuntimeConfigError)
    })
})