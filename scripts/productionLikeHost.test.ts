/** @vitest-environment node */

import {
    mkdtemp,
    mkdir,
    rm,
    writeFile,
} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {
    afterEach,
    describe,
    expect,
    it,
} from 'vitest'
import {
    IMMUTABLE_ASSETS,
    NO_CACHE,
    startMockApiServer,
    startStaticSpaServer,
} from './productionLikeHost'

const temporaryDirectories: string[] = []
const servers: Array<{
    close: () => Promise<void>
}> = []

async function createExtractedSite(): Promise<string> {
    const directory = await mkdtemp(
        path.join(
            os.tmpdir(),
            'shade-production-host-',
        ),
    )

    temporaryDirectories.push(directory)

    await mkdir(
        path.join(
            directory,
            'assets',
        ),
        {
            recursive: true,
        },
    )
    await writeFile(
        path.join(
            directory,
            'index.html',
        ),
        '<!doctype html><title>Shade</title><p>spa</p>\n',
        'utf8',
    )
    await writeFile(
        path.join(
            directory,
            'config.js',
        ),
        [
            'window.__SHADE_CONFIG__ = {',
            '    apiBaseUrl: "https://api.example.test",',
            '    diagnostics: { enabled: false, endpoint: null },',
            '};',
            '',
        ].join('\n'),
        'utf8',
    )
    await writeFile(
        path.join(
            directory,
            'assets',
            'index-hash.js',
        ),
        'console.log("hashed");\n',
        'utf8',
    )

    return directory
}

afterEach(async () => {
    await Promise.all(
        servers.splice(0).map((server) => server.close()),
    )
    await Promise.all(
        temporaryDirectories.splice(0).map((directory) =>
            rm(
                directory,
                {
                    recursive: true,
                    force: true,
                },
            )
        ),
    )
})

describe('production-like tarball host', () => {
    it('serves SPA fallback, revalidated HTML/config, and immutable assets', async () => {
        const site = await createExtractedSite()
        const frontend = await startStaticSpaServer(site)

        servers.push(frontend)

        const indexResponse = await fetch(
            `${frontend.url}/`,
        )
        const configResponse = await fetch(
            `${frontend.url}/config.js`,
        )
        const assetResponse = await fetch(
            `${frontend.url}/assets/index-hash.js`,
        )
        const booksResponse = await fetch(
            `${frontend.url}/books`,
        )
        const missingAssetResponse = await fetch(
            `${frontend.url}/assets/missing.js`,
        )

        expect(indexResponse.status).toBe(200)
        expect(
            indexResponse.headers.get('cache-control'),
        ).toBe(NO_CACHE)
        expect(await indexResponse.text()).toContain(
            'spa',
        )

        expect(configResponse.status).toBe(200)
        expect(
            configResponse.headers.get('cache-control'),
        ).toBe(NO_CACHE)
        expect(await configResponse.text()).toContain(
            'https://api.example.test',
        )

        expect(assetResponse.status).toBe(200)
        expect(
            assetResponse.headers.get('cache-control'),
        ).toBe(IMMUTABLE_ASSETS)

        expect(booksResponse.status).toBe(200)
        expect(
            booksResponse.headers.get('cache-control'),
        ).toBe(NO_CACHE)
        expect(await booksResponse.text()).toContain(
            'spa',
        )

        expect(missingAssetResponse.status).toBe(404)
    })

    it('verifies CORS preflight, Bearer access, and backup Content-Disposition', async () => {
        const site = await createExtractedSite()
        const frontend = await startStaticSpaServer(site)

        servers.push(frontend)

        const token = 'production-like-token'
        const api = await startMockApiServer({
            allowedOrigin: frontend.url,
            bearerToken: token,
            backupFilename: 'library-backup.sql',
        })

        servers.push(api)

        const preflight = await fetch(
            `${api.url}/books`,
            {
                method: 'OPTIONS',
                headers: {
                    Origin: frontend.url,
                    'Access-Control-Request-Method': 'GET',
                    'Access-Control-Request-Headers':
                        'authorization,content-type',
                },
            },
        )

        expect(preflight.status).toBe(204)
        expect(
            preflight.headers.get(
                'access-control-allow-origin',
            ),
        ).toBe(frontend.url)
        expect(
            preflight.headers.get(
                'access-control-allow-headers',
            )?.toLowerCase(),
        ).toContain('authorization')
        expect(
            preflight.headers.get(
                'access-control-allow-headers',
            )?.toLowerCase(),
        ).toContain('content-type')
        expect(
            preflight.headers.get(
                'access-control-allow-credentials',
            ),
        ).toBeNull()

        const rejected = await fetch(
            `${api.url}/books`,
            {
                headers: {
                    Origin: frontend.url,
                },
            },
        )

        expect(rejected.status).toBe(403)

        const authorized = await fetch(
            `${api.url}/books`,
            {
                headers: {
                    Origin: frontend.url,
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            },
        )

        expect(authorized.status).toBe(200)

        const backup = await fetch(
            `${api.url}/backup`,
            {
                headers: {
                    Origin: frontend.url,
                    Authorization: `Bearer ${token}`,
                },
            },
        )

        expect(backup.status).toBe(200)
        expect(
            backup.headers.get(
                'access-control-expose-headers',
            ),
        ).toMatch(
            /content-disposition/iu,
        )

        const contentDisposition = backup.headers.get(
            'content-disposition',
        )

        expect(contentDisposition).toContain(
            'library-backup.sql',
        )
        expect(contentDisposition).toContain(
            "filename*=UTF-8''library-backup.sql",
        )

        const backupBody = await backup.text()

        expect(backupBody.length).toBeGreaterThan(0)
        expect(backupBody).toContain(
            'SELECT 1',
        )
    })
})
