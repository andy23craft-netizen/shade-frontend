import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'
import {
    ApiTokenError,
    readApiToken,
} from './apiToken'

describe('readApiToken', () => {
    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it('throws when the env variable is missing', () => {
        vi.stubEnv('VITE_API_SECRET_KEY', undefined)

        expect(() => readApiToken()).toThrow(ApiTokenError)
        expect(() => readApiToken()).toThrow(
            /VITE_API_SECRET_KEY/,
        )
    })

    it('throws when the env variable is blank', () => {
        vi.stubEnv('VITE_API_SECRET_KEY', '   ')

        expect(() => readApiToken()).toThrow(ApiTokenError)
    })

    it('returns a trimmed token', () => {
        vi.stubEnv(
            'VITE_API_SECRET_KEY',
            '  secret-token  ',
        )

        expect(readApiToken()).toBe('secret-token')
    })

    it('returns a valid token unchanged', () => {
        vi.stubEnv(
            'VITE_API_SECRET_KEY',
            'valid-token',
        )

        expect(readApiToken()).toBe('valid-token')
    })
})
