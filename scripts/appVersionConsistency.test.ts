/** @vitest-environment node */

import {
    readFileSync,
} from 'node:fs'
import {
    dirname,
    join,
} from 'node:path'
import {
    fileURLToPath,
} from 'node:url'
import {
    describe,
    expect,
    it,
} from 'vitest'
import {
    APP_VERSION,
} from '../src/config/appVersion'

const repositoryRoot = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
)

describe('application version', () => {
    it('keeps VERSION, package.json, and APP_VERSION aligned', () => {
        const versionFromFile = readFileSync(
            join(repositoryRoot, 'VERSION'),
            'utf8',
        ).trim()

        const packageJson = JSON.parse(
            readFileSync(
                join(repositoryRoot, 'package.json'),
                'utf8',
            ),
        ) as {
            version?: string
        }

        expect(versionFromFile).not.toBe('')
        expect(packageJson.version).toBe(
            versionFromFile,
        )
        expect(APP_VERSION).toBe(versionFromFile)
    })
})
