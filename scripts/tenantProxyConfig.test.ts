/** @vitest-environment node */

import { readFile } from 'node:fs/promises'
import type { IncomingMessage } from 'node:http'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
    createDevServerProxy,
    resolveForwardedLibraryHost,
} from '../vite.config'

afterEach(() => {
    vi.unstubAllEnvs()
})

describe('tenant-aware proxy configuration', () => {
    it.each([
        ['andy.localhost:5173', 'andy.localhost'],
        ['jamie.localhost:5173', 'jamie.localhost'],
        ['localhost:5173', 'andy.localhost'],
        ['127.0.0.1:5173', 'andy.localhost'],
        ['SHADE.LIBRARY.SPIR.ES', 'shade.library.spir.es'],
        ['jamie.library.spir.es', 'jamie.library.spir.es'],
    ])('derives %s as forwarded host %s', (host, expected) => {
        expect(resolveForwardedLibraryHost(host)).toBe(expected)
    })

    it.each([
        ['shade.library.spir.es', 'shade.library.spir.es'],
        ['jamie.library.spir.es', 'jamie.library.spir.es'],
        ['localhost:5173', 'andy.localhost'],
    ])(
        'injects browser host %s as %s into proxied Vite requests',
        (host, expected) => {
            vi.stubEnv('SHADE_API_PROXY', '1')

            const proxy = createDevServerProxy()
            const proxyOptions = proxy?.[
                '^/(api/)?(health|ready|version|books|albums|artists|authors|genres|loans|dashboard|shelves|categories|docs|redoc|openapi\\.json|wishlists|collections)'
            ]
            let listener: ((
                proxyRequest: {
                    setHeader: (name: string, value: string) => void
                },
                request: IncomingMessage,
            ) => void) | undefined

            proxyOptions?.configure({
                on: (_event, registeredListener) => {
                    listener = registeredListener
                },
            })

            const setHeader = vi.fn()

            listener?.(
                { setHeader },
                {
                    headers: {
                        host,
                    },
                } as IncomingMessage,
            )

            expect(setHeader).toHaveBeenCalledWith(
                'X-Forwarded-Host',
                expected,
            )
        },
    )

    it('trusts localhost subdomains and excludes backup from Vite', async () => {
        const config = await readFile('vite.config.ts', 'utf8')

        expect(config).toContain("allowedHosts: ['.localhost']")
        expect(config).toContain("'X-Forwarded-Host'")
        expect(config).toContain("DEFAULT_LOCAL_LIBRARY_HOST = 'andy.localhost'")
        expect(config).not.toMatch(/\|backup\|/u)
    })

    it('injects the trusted public host in nginx', async () => {
        const config = await readFile('ci/nginx.conf', 'utf8')

        expect(config).toContain('proxy_set_header X-Forwarded-Host $host;')
    })
})
