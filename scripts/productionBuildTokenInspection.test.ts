/** @vitest-environment node */

import { readdir, readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { afterAll, describe, expect, it } from 'vitest'

const repositoryRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
)

const inspectionOutDir = path.join(
    repositoryRoot,
    'node_modules/.tmp/token-inspection-dist',
)

/**
 * Known test tokens and placeholder secrets used in the suite. Production
 * artifacts must never embed these (or any real API token).
 */
const forbiddenTokenSubstrings = [
    'initial-token',
    'replacement-token',
    'token-one',
    'token-two',
    'secret-token',
    'super-secret-token',
] as const

const textArtifactExtensions = new Set([
    '.css',
    '.html',
    '.js',
    '.json',
    '.map',
    '.mjs',
    '.svg',
    '.txt',
])

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

describe('production build token inspection', () => {
    afterAll(async () => {
        await rm(inspectionOutDir, {
            recursive: true,
            force: true,
        })
    })

    it(
        'keeps test and real tokens out of assets and source maps',
        async () => {
            await rm(inspectionOutDir, {
                recursive: true,
                force: true,
            })

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

            const hits: string[] = []

            for await (const filePath of walkFiles(
                inspectionOutDir,
            )) {
                const extension = path.extname(filePath)

                if (!textArtifactExtensions.has(extension)) {
                    continue
                }

                const content = await readFile(filePath, 'utf8')
                const relativePath = path.relative(
                    inspectionOutDir,
                    filePath,
                )

                for (const token of forbiddenTokenSubstrings) {
                    if (content.includes(token)) {
                        hits.push(`${relativePath}: ${token}`)
                    }
                }
            }

            expect(hits).toEqual([])
        },
        120_000,
    )
})
