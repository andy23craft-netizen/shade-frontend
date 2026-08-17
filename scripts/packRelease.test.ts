/** @vitest-environment node */

import {
    mkdtemp,
    mkdir,
    readFile,
    rm,
    writeFile,
} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {
    execFileSync,
} from 'node:child_process'
import {
    fileURLToPath,
} from 'node:url'
import {
    afterEach,
    describe,
    expect,
    it,
} from 'vitest'
import {
    artifactBasename,
    collectDistFiles,
    createDeterministicArchive,
    entryIsForbidden,
    formatSha256Sum,
    listGzipTarEntries,
    packRelease,
    readPackageVersion,
    sha256Hex,
} from './packRelease'

const temporaryDirectories: string[] = []

async function createTemporaryDirectory(): Promise<string> {
    const directory = await mkdtemp(
        path.join(
            os.tmpdir(),
            'shade-pack-release-',
        ),
    )

    temporaryDirectories.push(directory)

    return directory
}

async function writeSyntheticDist(
    distDirectory: string,
    extras: Record<string, string | Buffer> = {},
): Promise<void> {
    await mkdir(
        path.join(
            distDirectory,
            'assets',
        ),
        {
            recursive: true,
        },
    )

    await writeFile(
        path.join(
            distDirectory,
            'index.html',
        ),
        '<!doctype html><title>Shade</title>\n',
        'utf8',
    )
    await writeFile(
        path.join(
            distDirectory,
            'config.js',
        ),
        'window.__SHADE_CONFIG__ = { apiBaseUrl: "http://127.0.0.1:8000" };\n',
        'utf8',
    )
    await writeFile(
        path.join(
            distDirectory,
            'assets',
            'index-test.js',
        ),
        'console.log("shade");\n',
        'utf8',
    )

    for (const [relativePath, content] of Object.entries(extras)) {
        const fullPath = path.join(
            distDirectory,
            relativePath,
        )

        await mkdir(
            path.dirname(fullPath),
            {
                recursive: true,
            },
        )
        await writeFile(
            fullPath,
            content,
        )
    }
}

afterEach(async () => {
    await Promise.all(
        temporaryDirectories.splice(
            0,
        ).map((directory) =>
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

describe('packRelease', () => {
    it('identifies non-deployable archive members', () => {
        expect(
            entryIsForbidden('.env'),
        ).toBe(true)
        expect(
            entryIsForbidden('secrets/.env.local'),
        ).toBe(true)
        expect(
            entryIsForbidden('node_modules/vite/index.js'),
        ).toBe(true)
        expect(
            entryIsForbidden('coverage/index.html'),
        ).toBe(true)
        expect(
            entryIsForbidden('dump.sql'),
        ).toBe(true)
        expect(
            entryIsForbidden('data/app.db'),
        ).toBe(true)
        expect(
            entryIsForbidden('src/main.tsx'),
        ).toBe(true)
        expect(
            entryIsForbidden('Containerfile'),
        ).toBe(true)
        expect(
            entryIsForbidden('index.html'),
        ).toBe(false)
        expect(
            entryIsForbidden('config.js'),
        ).toBe(false)
        expect(
            entryIsForbidden('assets/index-hash.js'),
        ).toBe(false)
    })

    it('reads the package.json version used as APP_VERSION', async () => {
        const repositoryRoot = path.resolve(
            path.dirname(
                fileURLToPath(import.meta.url),
            ),
            '..',
        )
        const version = await readPackageVersion(
            repositoryRoot,
        )

        expect(version).toMatch(
            /^\d+\.\d+\.\d+/u,
        )
        expect(
            artifactBasename(version),
        ).toBe(
            `shade-frontend-${version}.tar.gz`,
        )
    })

    it('produces equivalent archives from identical inputs', async () => {
        const distDirectory = await createTemporaryDirectory()

        await writeSyntheticDist(distDirectory)

        const files = await collectDistFiles(
            distDirectory,
        )
        const first = createDeterministicArchive(
            files,
        )
        const second = createDeterministicArchive(
            files,
        )

        expect(first.equals(second)).toBe(true)
        expect(sha256Hex(first)).toBe(
            sha256Hex(second),
        )
    })

    it('packs a versioned tarball, checksum, and manifest', async () => {
        const repositoryRoot = await createTemporaryDirectory()
        const distDirectory = path.join(
            repositoryRoot,
            'dist',
        )
        const outputDirectory = path.join(
            repositoryRoot,
            'ci',
            'artifacts',
        )

        await writeSyntheticDist(distDirectory)

        const result = await packRelease({
            repositoryRoot,
            distDirectory,
            outputDirectory,
            version: '9.9.9',
            commit: 'deadbeefcafebabe',
            buildTime: '2026-08-17T16:00:00.000Z',
        })

        expect(
            path.basename(result.artifactPath),
        ).toBe(
            'shade-frontend-9.9.9.tar.gz',
        )
        expect(result.version).toBe('9.9.9')
        expect(result.manifest.version).toBe('9.9.9')
        expect(result.manifest.appVersion).toBe('9.9.9')
        expect(result.manifest.commit).toBe(
            'deadbeefcafebabe',
        )
        expect(result.manifest.artifact).toBe(
            'shade-frontend-9.9.9.tar.gz',
        )
        expect(result.manifest.checksumSha256).toBe(
            result.checksumSha256,
        )
        expect(
            result.manifest.runtimeConfig.templateFile,
        ).toBe(
            'config.js',
        )
        expect(
            result.manifest.runtimeConfig.shape.apiBaseUrl,
        ).toContain(
            'API',
        )
        expect(
            result.manifest.hosting.spaFallback,
        ).toContain(
            'index.html',
        )

        const archiveOnDisk = await readFile(
            result.artifactPath,
        )
        const checksumOnDisk = await readFile(
            result.checksumPath,
            'utf8',
        )
        const manifestOnDisk = JSON.parse(
            await readFile(
                result.manifestPath,
                'utf8',
            ),
        ) as {
            version: string
            commit: string
            checksumSha256: string
        }

        expect(sha256Hex(archiveOnDisk)).toBe(
            result.checksumSha256,
        )
        expect(checksumOnDisk).toBe(
            formatSha256Sum(
                result.checksumSha256,
                'shade-frontend-9.9.9.tar.gz',
            ),
        )
        expect(manifestOnDisk.version).toBe('9.9.9')
        expect(manifestOnDisk.commit).toBe(
            'deadbeefcafebabe',
        )
        expect(manifestOnDisk.checksumSha256).toBe(
            result.checksumSha256,
        )

        const members = listGzipTarEntries(
            archiveOnDisk,
        )
        const names = members.map(
            (member) => member.name,
        ).sort()

        expect(names).toEqual([
            'assets/index-test.js',
            'config.js',
            'index.html',
        ])
        expect(
            names.some(
                (name) => entryIsForbidden(name),
            ),
        ).toBe(false)

        const listedByTar = execFileSync(
            'tar',
            [
                '-tzf',
                result.artifactPath,
            ],
            {
                encoding: 'utf8',
            },
        ).trim().split(
            '\n',
        ).sort()

        expect(listedByTar).toEqual(names)

        const checksumAfterExtraction = sha256Hex(
            await readFile(result.artifactPath),
        )

        expect(checksumAfterExtraction).toBe(
            result.checksumSha256,
        )
    })

    it('refuses to pack secrets, source, or database files', async () => {
        const distDirectory = await createTemporaryDirectory()

        await writeSyntheticDist(
            distDirectory,
            {
                '.env': 'VITE_API_SECRET_KEY=should-not-pack\n',
            },
        )

        await expect(
            collectDistFiles(distDirectory),
        ).rejects.toThrow(
            /non-deployable file/u,
        )
    })

    it('refuses SQL dumps inside dist', async () => {
        const distDirectory = await createTemporaryDirectory()

        await writeSyntheticDist(
            distDirectory,
            {
                'backup.sql': 'SELECT 1;\n',
            },
        )

        await expect(
            collectDistFiles(distDirectory),
        ).rejects.toThrow(
            /non-deployable file/u,
        )
    })
})
