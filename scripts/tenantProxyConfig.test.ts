/** @vitest-environment node */

import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('tenant-aware proxy configuration', () => {
    it('trusts localhost subdomains and injects the forwarding host in Vite', async () => {
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
