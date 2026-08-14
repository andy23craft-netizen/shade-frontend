import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

describe('connection token', () => {
    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it('returns the env-sourced token', async () => {
        vi.stubEnv(
            'VITE_API_SECRET_KEY',
            'env-token',
        )

        vi.resetModules()

        const module = await import('./connectionToken')

        expect(
            module.getCurrentToken(),
        ).toBe('env-token')
    })
})
