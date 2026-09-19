/** @vitest-environment node */

import { readFile } from 'node:fs/promises'
import type { IncomingMessage } from 'node:http'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
    bypassApiProxyForHtmlNavigation,
    createDevServerProxy,
    resolveForwardedLibraryHost,
} from '../vite.config'

afterEach(() => {
    vi.unstubAllEnvs()
})

describe('tenant-aware proxy configuration', () => {
    it('leaves direct SPA navigations with Vite instead of proxying them to the API', () => {
        expect(
            bypassApiProxyForHtmlNavigation({
                url: '/books/book-id',
                headers: { accept: 'text/html,application/xhtml+xml' },
            } as IncomingMessage),
        ).toBe('/books/book-id')

        expect(
            bypassApiProxyForHtmlNavigation({
                url: '/books/book-id',
                headers: { accept: 'application/json' },
            } as IncomingMessage),
        ).toBeUndefined()
    })

    it.each([
        ['tenant-a.localhost:5173', 'tenant-a.localhost'],
        ['tenant-b.localhost:5173', 'tenant-b.localhost'],
        ['localhost:5173', 'tenant-a.localhost'],
        ['127.0.0.1:5173', 'tenant-a.localhost'],
        ['TENANT-A.EXAMPLE.TEST', 'tenant-a.example.test'],
        ['tenant-b.example.test', 'tenant-b.example.test'],
    ])('derives %s as forwarded host %s', (host, expected) => {
        expect(resolveForwardedLibraryHost(host)).toBe(expected)
    })

    it.each([
        ['tenant-a.example.test', 'tenant-a.example.test'],
        ['tenant-b.example.test', 'tenant-b.example.test'],
        ['localhost:5173', 'tenant-a.localhost'],
    ])(
        'injects browser host %s as %s into proxied Vite requests',
        (host, expected) => {
            vi.stubEnv('SHADE_API_PROXY', '1')

            const proxy = createDevServerProxy()
            const proxyOptions = proxy?.[
            '^/(api/)?(health|ready|version|auth|books|albums|artists|authors|people|genres|loans|dashboard|shelves|categories|catalog|library|household-profiles|works|quotes|docs|redoc|openapi\\.json|wishlists|collections)'
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

    it('does not compile deployment hosts into Vite', async () => {
        const config = await readFile('vite.config.ts', 'utf8')

        expect(config).toContain('allowedHosts: true')
        expect(config).toContain("'X-Forwarded-Host'")
        expect(config).toContain("DEFAULT_LOCAL_LIBRARY_HOST = 'tenant-a.localhost'")
        expect(config).not.toMatch(/\|backup\|/u)
    })

    it('injects the trusted public host in nginx', async () => {
        const config = await readFile('ci/nginx.conf', 'utf8')

        expect(config).toContain('proxy_set_header X-Forwarded-Host $host;')
        expect(config).not.toContain('proxy_set_header Library-Username')
    })
})
