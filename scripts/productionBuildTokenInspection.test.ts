/** @vitest-environment node */

import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { afterAll, describe, expect, it } from 'vitest'
import {
    entryIsForbidden,
    listGzipTarEntries,
    packRelease,
} from './packRelease'

const repositoryRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
)

const inspectionOutDir = path.join(
    repositoryRoot,
    'node_modules/.tmp/token-inspection-dist',
)

const buildToken = 'dummy-build-token-for-inspection'

describe('production build env inspection', () => {
    afterAll(async () => {
        await rm(inspectionOutDir, {
            recursive: true,
            force: true,
        })
    })

    it(
        'does not copy the repository-root .env file into dist',
        async () => {
            await rm(inspectionOutDir, {
                recursive: true,
                force: true,
            })

            process.env.VITE_API_SECRET_KEY = buildToken

            await build({
                root: repositoryRoot,
                configFile: path.join(
                    repositoryRoot,
                    'vite.config.ts',
                ),
                build: {
                    outDir: inspectionOutDir,
                    emptyOutDir: true,
                    sourcemap: true,
                },
                logLevel: 'error',
            })

            const distEntries = await readdir(
                inspectionOutDir,
                {
                    recursive: true,
                },
            )

            expect(
                distEntries.some(
                    (entry) =>
                        entry === '.env' ||
                        String(entry).endsWith(
                            '/.env',
                        ),
                ),
            ).toBe(false)

            const jsFiles: string[] = []

            for await (const filePath of walkFiles(
                inspectionOutDir,
            )) {
                if (
                    filePath.endsWith('.js') ||
                    filePath.endsWith('.mjs')
                ) {
                    jsFiles.push(filePath)
                }
            }

            expect(jsFiles.length).toBeGreaterThan(0)

            const embeddedTokenHits: string[] = []

            for (const filePath of jsFiles) {
                const content = await readFile(
                    filePath,
                    'utf8',
                )

                if (content.includes(buildToken)) {
                    embeddedTokenHits.push(
                        path.relative(
                            inspectionOutDir,
                            filePath,
                        ),
                    )
                }
            }

            expect(embeddedTokenHits.length).toBeGreaterThan(
                0,
            )

            const artifactsDirectory = await mkdtemp(
                path.join(
                    os.tmpdir(),
                    'shade-token-inspection-artifacts-',
                ),
            )

            const packed = await packRelease({
                repositoryRoot,
                distDirectory: inspectionOutDir,
                outputDirectory: artifactsDirectory,
                version: '0.0.0-inspection',
                commit: 'inspection',
                buildTime: '2026-08-17T00:00:00.000Z',
            })

            const archiveMembers = listGzipTarEntries(
                packed.archive,
            )
            const archiveNames = archiveMembers.map(
                (member) => member.name,
            )

            expect(archiveNames).toContain('index.html')
            expect(archiveNames).toContain('config.js')
            expect(
                archiveNames.some(
                    (name) => entryIsForbidden(name),
                ),
            ).toBe(false)

            const packedJsHits = archiveMembers.filter(
                (member) =>
                    (member.name.endsWith('.js') ||
                        member.name.endsWith('.mjs')) &&
                    member.content
                        .toString('utf8')
                        .includes(buildToken),
            )

            expect(packedJsHits.length).toBeGreaterThan(0)

            await rm(artifactsDirectory, {
                recursive: true,
                force: true,
            })
        },
        120_000,
    )
})

async function* walkFiles(
    directory: string,
): AsyncGenerator<string> {
    const entries = await readdir(directory, {
        withFileTypes: true,
    })

    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name)

        if (entry.isDirectory()) {
            yield* walkFiles(fullPath)
            continue
        }

        yield fullPath
    }
}
